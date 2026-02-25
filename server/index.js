const http = require('http');
const { TASK_CATALOG, findTaskByQrPayload } = require('./config/taskCatalog');

const STATES = {
  LOBBY: 'LOBBY',
  STARTING: 'STARTING',
  IN_GAME: 'IN_GAME',
};

const DEFAULT_SETTINGS = {
  tasksPerPlayer: 2,
  numImpostors: 1,
  killCooldown: 30,
  sabotageCooldown: 45,
  revealDurationMs: 6000,
};

const LIMITS = {
  tasksPerPlayer: { min: 1, max: 10 },
  numImpostors: { min: 1, max: 3 },
  killCooldown: { min: 10, max: 60 },
  sabotageCooldown: { min: 10, max: 120 },
};

const COLORS = [
  'red',
  'blue',
  'green',
  'yellow',
  'pink',
  'orange',
  'purple',
  'cyan',
  'black',
  'white',
  'brown',
  'lime',
  'maroon',
  'navy',
  'teal',
  'olive',
  'coral',
  'magenta',
  'gray',
  'mint',
];

const MEETING_QR_PAYLOADS = {
  emergency: 'AMONGREALITY:MEETING:EMERGENCY:KEY:AR-MEETING-001',
  checkin: 'AMONGREALITY:MEETING:CHECKIN:KEY:AR-MEETING-CHECKIN-001',
};

const MAX_PROCESSED_EVENT_IDS = 2000;
const MAX_PLAYERS = 20;

const REPORT_COOLDOWN_MS = 10 * 1000;
const SABOTAGE_ACTIVE_MS = 20 * 1000;
const MEETING_CHECKIN_TIMEOUT_MS = 45 * 1000;
const MEETING_VOTING_TIMEOUT_MS = 3 * 60 * 1000;
const MEETING_RESULT_SHOW_MS = 8 * 1000;
const EMERGENCY_SCAN_CONFIRM_WINDOW_MS = 30 * 1000;

let taskInstanceSequence = 0;
let roundSequence = 0;
let corpseSequence = 0;
let revealTimeout = null;
let sabotageTimeout = null;
let meetingCheckinTimeout = null;
let meetingVoteTimeout = null;
let meetingResultTimeout = null;
let match = createInitialMatch();

const processedEvents = new Set();
const processedEventQueue = [];

function createIdleMeeting() {
  return {
    active: false,
    phase: null,
    triggerType: null,
    triggerBy: null,
    triggerAt: null,
    reportedPlayerId: null,
    aliveSnapshot: [],
    presenceConfirmed: [],
    checkinDeadline: null,
    voteDeadline: null,
    eligibleVoters: [],
    votes: [],
    roundDeaths: [],
    result: null,
    closedAt: null,
  };
}

function createInitialMatch() {
  return {
    id: '1',
    entryCode: createEntryCode(),
    state: STATES.LOBBY,
    players: [],
    hostId: null,
    globalProgress: 0,
    settings: { ...DEFAULT_SETTINGS },
    reveal: null,
    round: 0,
    sabotage: {
      active: false,
      startedAt: null,
      activeUntil: null,
      cooldownUntil: null,
      lastTriggeredBy: null,
    },
    corpses: [],
    meeting: createIdleMeeting(),
  };
}

function createEntryCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function nowMs() {
  return Date.now();
}

function json(res, payload, statusCode = 200) {
  res.statusCode = statusCode;
  res.end(JSON.stringify(payload));
}

function eventResponse({
  ok = true,
  code = 'OK',
  message = '',
  data = {},
  statusCode = 200,
  res,
}) {
  return json(
    res,
    {
      ok,
      code,
      message,
      data,
      match,
    },
    statusCode,
  );
}

function clampNumber(value, { min, max }, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function normalizeSettings(partialSettings = {}) {
  return {
    tasksPerPlayer: clampNumber(
      partialSettings.tasksPerPlayer,
      LIMITS.tasksPerPlayer,
      match.settings.tasksPerPlayer,
    ),
    numImpostors: clampNumber(
      partialSettings.numImpostors,
      LIMITS.numImpostors,
      match.settings.numImpostors,
    ),
    killCooldown: clampNumber(
      partialSettings.killCooldown,
      LIMITS.killCooldown,
      match.settings.killCooldown,
    ),
    sabotageCooldown: clampNumber(
      partialSettings.sabotageCooldown,
      LIMITS.sabotageCooldown,
      match.settings.sabotageCooldown,
    ),
    revealDurationMs: DEFAULT_SETTINGS.revealDurationMs,
  };
}

function minPlayersForImpostors(numImpostors) {
  return Math.max(4, numImpostors * 2 + 2);
}

function clearRevealTimeout() {
  if (revealTimeout) {
    clearTimeout(revealTimeout);
    revealTimeout = null;
  }
}

function clearSabotageTimeout() {
  if (sabotageTimeout) {
    clearTimeout(sabotageTimeout);
    sabotageTimeout = null;
  }
}

function clearMeetingTimers() {
  if (meetingCheckinTimeout) {
    clearTimeout(meetingCheckinTimeout);
    meetingCheckinTimeout = null;
  }
  if (meetingVoteTimeout) {
    clearTimeout(meetingVoteTimeout);
    meetingVoteTimeout = null;
  }
  if (meetingResultTimeout) {
    clearTimeout(meetingResultTimeout);
    meetingResultTimeout = null;
  }
}

function addProcessedEventId(eventId) {
  if (!eventId || processedEvents.has(eventId)) return;
  processedEvents.add(eventId);
  processedEventQueue.push(eventId);
  if (processedEventQueue.length > MAX_PROCESSED_EVENT_IDS) {
    const removed = processedEventQueue.shift();
    if (removed) processedEvents.delete(removed);
  }
}

function sampleTaskDefinition() {
  const randomIndex = Math.floor(Math.random() * TASK_CATALOG.length);
  return TASK_CATALOG[randomIndex];
}

function shuffle(array) {
  for (let index = array.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const tmp = array[index];
    array[index] = array[swapIndex];
    array[swapIndex] = tmp;
  }
  return array;
}

function createTaskInstance(taskDefinition, isFake, repeatIndex) {
  taskInstanceSequence += 1;
  return {
    instanceId: `ti_${taskInstanceSequence}`,
    taskType: taskDefinition.taskType,
    legacyTaskId: taskDefinition.legacyTaskId,
    label: taskDefinition.label,
    station: taskDefinition.station,
    repeatIndex,
    isFake,
    status: 'PENDING',
  };
}

function assignTaskInstances({ tasksPerPlayer, isFake }) {
  const taskInstances = [];
  const repeatCounters = {};

  for (let index = 0; index < tasksPerPlayer; index += 1) {
    const taskDefinition = sampleTaskDefinition();
    repeatCounters[taskDefinition.taskType] =
      (repeatCounters[taskDefinition.taskType] || 0) + 1;
    taskInstances.push(
      createTaskInstance(
        taskDefinition,
        isFake,
        repeatCounters[taskDefinition.taskType],
      ),
    );
  }

  return taskInstances;
}

function recalculateGlobalProgress() {
  const realTasks = match.players.flatMap((player) =>
    (player.tasks || []).filter((task) => !task.isFake),
  );

  if (realTasks.length === 0) {
    match.globalProgress = 0;
    return;
  }

  const completedTasks = realTasks.filter(
    (task) => task.status === 'COMPLETED',
  ).length;
  match.globalProgress = Math.floor((completedTasks / realTasks.length) * 100);
}

function parseEvent(rawBody) {
  if (!rawBody || rawBody.trim().length === 0) return null;
  const parsed = JSON.parse(rawBody);
  if (!parsed || typeof parsed !== 'object') return null;
  return parsed;
}

function getPlayer(playerId) {
  return match.players.find((player) => player.id === playerId) || null;
}

function isValidColor(color) {
  return typeof color === 'string' && COLORS.includes(color);
}

function pickRandomColor(excludedColors = new Set()) {
  const available = COLORS.filter((color) => !excludedColors.has(color));
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function getDefaultColorForNewPlayer() {
  const taken = new Set(match.players.map((player) => player.color));
  return pickRandomColor(taken);
}

function reconcileLobbyColors() {
  if (match.state !== STATES.LOBBY) return;

  const taken = new Set();
  match.players.forEach((player) => {
    if (!isValidColor(player.color) || taken.has(player.color)) {
      player.color = pickRandomColor(taken);
    }
    taken.add(player.color);
  });
}

function findPendingCorpseByVictim(victimId) {
  return (
    match.corpses.find(
      (corpse) => corpse.victimId === victimId && corpse.status === 'PENDING',
    ) || null
  );
}

function createCorpse({ victimId, killerId }) {
  corpseSequence += 1;
  const corpse = {
    corpseId: `c_${corpseSequence}`,
    victimId,
    killerId,
    killedAt: nowMs(),
    status: 'PENDING',
  };
  match.corpses.push(corpse);
  return corpse;
}

function serializeCorpseSummary(corpse) {
  return {
    corpseId: corpse.corpseId,
    victimId: corpse.victimId,
    killedAt: corpse.killedAt,
  };
}

function collectRoundDeaths() {
  return match.corpses
    .filter((corpse) => corpse.status === 'PENDING')
    .map(serializeCorpseSummary);
}

function markRoundDeathsRevealed(roundDeaths) {
  const revealedIds = new Set(roundDeaths.map((death) => death.corpseId));
  match.corpses.forEach((corpse) => {
    if (revealedIds.has(corpse.corpseId)) {
      corpse.status = 'REVEALED';
      corpse.revealedAt = nowMs();
    }
  });
}

function clearSabotageActiveState() {
  match.sabotage.active = false;
  match.sabotage.startedAt = null;
  match.sabotage.activeUntil = null;
}

function createMeetingState({ triggerType, triggerBy, reportedPlayerId = null, roundDeaths }) {
  const aliveSnapshot = match.players
    .filter((player) => player.status === 'ALIVE')
    .map((player) => player.id);

  return {
    active: true,
    phase: 'CHECKIN',
    triggerType,
    triggerBy,
    triggerAt: nowMs(),
    reportedPlayerId,
    aliveSnapshot,
    presenceConfirmed: [],
    checkinDeadline: nowMs() + MEETING_CHECKIN_TIMEOUT_MS,
    voteDeadline: null,
    eligibleVoters: [],
    votes: [],
    roundDeaths,
    result: null,
    closedAt: null,
  };
}

function finalizeMeeting() {
  clearMeetingTimers();
  match.meeting = createIdleMeeting();
  match.corpses = match.corpses.filter((corpse) => corpse.status === 'PENDING');
}

function resolveMeeting(reason = 'TIMEOUT') {
  if (!match.meeting.active || match.meeting.phase !== 'VOTING') return;

  clearMeetingTimers();

  const counts = new Map();
  for (const vote of match.meeting.votes) {
    counts.set(vote.targetPlayerId, (counts.get(vote.targetPlayerId) || 0) + 1);
  }

  let ejectedPlayerId = null;
  let resultReason = reason;

  if (counts.size === 0) {
    resultReason = reason === 'ALL_VOTED' ? 'NO_VOTES' : 'TIMEOUT';
  } else {
    const maxVotes = Math.max(...counts.values());
    const leaders = [...counts.entries()]
      .filter(([, count]) => count === maxVotes)
      .map(([target]) => target);

    if (leaders.length > 1) {
      resultReason = 'TIE';
    } else if (leaders[0] === 'SKIP') {
      resultReason = 'SKIP';
    } else {
      ejectedPlayerId = leaders[0];
      resultReason = 'MAJORITY';
    }
  }

  if (ejectedPlayerId) {
    const ejectedPlayer = getPlayer(ejectedPlayerId);
    if (ejectedPlayer && ejectedPlayer.status === 'ALIVE') {
      ejectedPlayer.status = 'DEAD';
      ejectedPlayer.deathReason = 'EJECTED';
      ejectedPlayer.deadAt = nowMs();
    }
  }

  match.meeting.phase = 'RESULT';
  match.meeting.result = {
    reason: resultReason,
    ejectedPlayerId,
    totalVotes: match.meeting.votes.length,
    counts: Object.fromEntries(counts.entries()),
    resolvedAt: nowMs(),
  };

  meetingResultTimeout = setTimeout(() => {
    if (match.meeting.active && match.meeting.phase === 'RESULT') {
      finalizeMeeting();
    }
  }, MEETING_RESULT_SHOW_MS);
}

function advanceMeetingToVoting() {
  if (!match.meeting.active || match.meeting.phase !== 'CHECKIN') return;

  clearMeetingTimers();

  const eligibleVoters = match.meeting.presenceConfirmed.filter((playerId) =>
    match.meeting.aliveSnapshot.includes(playerId),
  );

  match.meeting.phase = 'VOTING';
  match.meeting.eligibleVoters = eligibleVoters;
  match.meeting.voteDeadline = nowMs() + MEETING_VOTING_TIMEOUT_MS;
  match.meeting.votes = [];

  if (eligibleVoters.length === 0) {
    match.meeting.phase = 'RESULT';
    match.meeting.result = {
      reason: 'NO_VOTERS',
      ejectedPlayerId: null,
      totalVotes: 0,
      counts: {},
      resolvedAt: nowMs(),
    };
    meetingResultTimeout = setTimeout(() => {
      if (match.meeting.active && match.meeting.phase === 'RESULT') {
        finalizeMeeting();
      }
    }, MEETING_RESULT_SHOW_MS);
    return;
  }

  meetingVoteTimeout = setTimeout(() => {
    if (match.meeting.active && match.meeting.phase === 'VOTING') {
      resolveMeeting('TIMEOUT');
    }
  }, MEETING_VOTING_TIMEOUT_MS);
}

function startMeeting({ triggerType, triggerBy, reportedPlayerId = null }) {
  const roundDeaths = collectRoundDeaths();
  markRoundDeathsRevealed(roundDeaths);

  clearSabotageActiveState();
  clearSabotageTimeout();

  match.meeting = createMeetingState({
    triggerType,
    triggerBy,
    reportedPlayerId,
    roundDeaths,
  });

  clearMeetingTimers();
  meetingCheckinTimeout = setTimeout(() => {
    if (match.meeting.active && match.meeting.phase === 'CHECKIN') {
      advanceMeetingToVoting();
    }
  }, MEETING_CHECKIN_TIMEOUT_MS);

  return roundDeaths;
}

function ensurePlayerInGame(playerId, res, options = {}) {
  const { requireAlive = false, allowDuringMeeting = false } = options;

  if (match.state !== STATES.IN_GAME) {
    eventResponse({
      res,
      ok: false,
      code: 'MATCH_NOT_IN_GAME',
      message: 'Partida ainda nao esta em jogo.',
    });
    return null;
  }

  const player = getPlayer(playerId);
  if (!player) {
    eventResponse({
      res,
      ok: false,
      code: 'PLAYER_NOT_FOUND',
      message: 'Jogador nao encontrado.',
    });
    return null;
  }

  if (requireAlive && player.status !== 'ALIVE') {
    eventResponse({
      res,
      ok: false,
      code: 'PLAYER_NOT_ALIVE',
      message: 'Jogador esta morto e nao pode executar esta acao.',
    });
    return null;
  }

  if (!allowDuringMeeting && match.meeting.active) {
    eventResponse({
      res,
      ok: false,
      code: 'MEETING_IN_PROGRESS',
      message: 'Aguardando fim da reuniao para esta acao.',
    });
    return null;
  }

  return player;
}

function handleJoin({ payload, playerId, res }) {
  const nickname = typeof payload?.nickname === 'string' ? payload.nickname : '';
  const normalizedNickname = nickname.trim().toUpperCase();
  if (normalizedNickname.length < 2) {
    return eventResponse({
      res,
      ok: false,
      code: 'INVALID_NICKNAME',
      message: 'Nickname deve ter pelo menos 2 caracteres.',
    });
  }

  let player = getPlayer(playerId);
  if (match.state !== STATES.LOBBY) {
    if (!player) {
      return eventResponse({
        res,
        ok: false,
        code: 'MATCH_ALREADY_STARTED',
        message: 'Nao e possivel entrar apos o inicio da partida.',
      });
    }

    player.nickname = normalizedNickname;
    return eventResponse({
      res,
      code: 'PLAYER_REJOINED',
      message: 'Jogador reconectado na partida em andamento.',
      data: { playerId },
    });
  }

  if (!player) {
    if (match.players.length >= MAX_PLAYERS) {
      return eventResponse({
        res,
        ok: false,
        code: 'ROOM_FULL',
        message: `A sala atingiu o limite de ${MAX_PLAYERS} jogadores.`,
      });
    }

    player = {
      id: playerId,
      nickname: normalizedNickname,
      color: getDefaultColorForNewPlayer(),
      ready: false,
      status: 'ALIVE',
      deathReason: null,
      deadAt: null,
      role: null,
      tasks: [],
      completedTaskInstanceIds: [],
      killCooldownUntil: 0,
      reportCooldownUntil: 0,
      lastEmergencyScanAt: 0,
    };
    match.players.push(player);
    if (match.players.length === 1) match.hostId = playerId;

    reconcileLobbyColors();

    return eventResponse({
      res,
      code: 'PLAYER_JOINED',
      message: 'Jogador entrou na sala.',
      data: { playerId },
    });
  }

  player.nickname = normalizedNickname;
  reconcileLobbyColors();

  return eventResponse({
    res,
    code: 'PLAYER_ALREADY_JOINED',
    message: 'Jogador ja estava na sala. Nickname atualizado.',
    data: { playerId },
  });
}

function handleChangeColor({ payload, playerId, res }) {
  if (match.state !== STATES.LOBBY) {
    return eventResponse({
      res,
      ok: false,
      code: 'MATCH_ALREADY_STARTED',
      message: 'Nao e possivel alterar cor com a partida iniciada.',
    });
  }

  const player = getPlayer(playerId);
  if (!player) {
    return eventResponse({
      res,
      ok: false,
      code: 'PLAYER_NOT_FOUND',
      message: 'Jogador nao encontrado.',
    });
  }

  const requestedColor = payload?.color;
  if (!isValidColor(requestedColor)) {
    return eventResponse({
      res,
      ok: false,
      code: 'INVALID_COLOR',
      message: 'Cor invalida.',
    });
  }

  const colorTaken = match.players.some(
    (candidate) => candidate.id !== player.id && candidate.color === requestedColor,
  );
  if (colorTaken) {
    return eventResponse({
      res,
      ok: false,
      code: 'COLOR_ALREADY_TAKEN',
      message: 'Esta cor ja esta em uso.',
    });
  }

  player.color = requestedColor;
  return eventResponse({
    res,
    code: 'COLOR_CHANGED',
    message: 'Cor alterada com sucesso.',
    data: { color: requestedColor },
  });
}

function handleSetReady({ payload, playerId, res }) {
  if (match.state !== STATES.LOBBY) {
    return eventResponse({
      res,
      ok: false,
      code: 'MATCH_ALREADY_STARTED',
      message: 'Nao e possivel alterar status de pronto com partida iniciada.',
    });
  }

  const player = getPlayer(playerId);
  if (!player) {
    return eventResponse({
      res,
      ok: false,
      code: 'PLAYER_NOT_FOUND',
      message: 'Jogador nao encontrado.',
    });
  }

  const requestedReady =
    typeof payload?.ready === 'boolean' ? payload.ready : !player.ready;
  player.ready = requestedReady;

  return eventResponse({
    res,
    code: 'READY_STATUS_UPDATED',
    message: requestedReady
      ? 'Jogador marcado como pronto.'
      : 'Jogador marcado como nao pronto.',
    data: { ready: requestedReady },
  });
}

function handleUpdateSettings({ payload, playerId, res }) {
  if (match.hostId !== playerId) {
    return eventResponse({
      res,
      ok: false,
      code: 'ONLY_HOST_CAN_UPDATE_SETTINGS',
      message: 'Apenas o host pode alterar configuracoes.',
    });
  }

  if (match.state !== STATES.LOBBY) {
    return eventResponse({
      res,
      ok: false,
      code: 'MATCH_ALREADY_STARTED',
      message: 'Nao e possivel alterar configuracoes com partida iniciada.',
    });
  }

  if (!payload || typeof payload !== 'object') {
    return eventResponse({
      res,
      ok: false,
      code: 'INVALID_SETTINGS_PAYLOAD',
      message: 'Payload de configuracoes invalido.',
    });
  }

  const normalized = normalizeSettings(payload);
  match.settings = {
    ...match.settings,
    ...normalized,
  };

  return eventResponse({
    res,
    code: 'SETTINGS_UPDATED',
    message: 'Configuracoes atualizadas.',
    data: { settings: match.settings },
  });
}

function handleStart({ payload, playerId, res }) {
  if (match.hostId !== playerId) {
    return eventResponse({
      res,
      ok: false,
      code: 'ONLY_HOST_CAN_START',
      message: 'Apenas o host pode iniciar a partida.',
    });
  }

  if (match.state !== STATES.LOBBY) {
    return eventResponse({
      res,
      ok: false,
      code: 'MATCH_ALREADY_IN_PROGRESS',
      message: 'Partida ja iniciada.',
    });
  }

  reconcileLobbyColors();

  const incomingSettings = normalizeSettings(payload || {});
  match.settings = {
    ...match.settings,
    ...incomingSettings,
  };

  const requiredPlayers = minPlayersForImpostors(match.settings.numImpostors);
  if (match.players.length < requiredPlayers) {
    return eventResponse({
      res,
      ok: false,
      code: 'NOT_ENOUGH_PLAYERS',
      message: `Jogadores insuficientes. Necessario minimo de ${requiredPlayers}.`,
      data: {
        requiredPlayers,
        currentPlayers: match.players.length,
      },
    });
  }

  const nonHostPlayers = match.players.filter(
    (player) => player.id !== match.hostId,
  );
  const allNonHostReady = nonHostPlayers.every((player) => player.ready);
  if (!allNonHostReady) {
    return eventResponse({
      res,
      ok: false,
      code: 'PLAYERS_NOT_READY',
      message: 'Aguardando todos os jogadores ficarem prontos.',
    });
  }

  clearRevealTimeout();
  clearSabotageTimeout();
  clearMeetingTimers();

  const shuffledPlayers = shuffle([...match.players]);
  const impostorIds = new Set(
    shuffledPlayers
      .slice(0, match.settings.numImpostors)
      .map((player) => player.id),
  );

  roundSequence += 1;
  match.round = roundSequence;
  match.state = STATES.STARTING;
  match.reveal = {
    startedAt: nowMs(),
    durationMs: match.settings.revealDurationMs,
    numImpostors: match.settings.numImpostors,
  };
  match.globalProgress = 0;
  match.corpses = [];
  match.meeting = createIdleMeeting();
  match.sabotage = {
    active: false,
    startedAt: null,
    activeUntil: null,
    cooldownUntil: null,
    lastTriggeredBy: null,
  };

  match.players.forEach((player) => {
    const isImpostor = impostorIds.has(player.id);
    player.role = isImpostor ? 'IMPOSTOR' : 'CREWMATE';
    player.ready = false;
    player.status = 'ALIVE';
    player.deathReason = null;
    player.deadAt = null;
    player.completedTaskInstanceIds = [];
    player.tasks = assignTaskInstances({
      tasksPerPlayer: match.settings.tasksPerPlayer,
      isFake: isImpostor,
    });
    player.killCooldownUntil = 0;
    player.reportCooldownUntil = 0;
    player.lastEmergencyScanAt = 0;
  });

  recalculateGlobalProgress();

  revealTimeout = setTimeout(() => {
    if (match.state === STATES.STARTING) {
      match.state = STATES.IN_GAME;
      match.reveal = null;
    }
  }, match.settings.revealDurationMs);

  return eventResponse({
    res,
    code: 'GAME_STARTING',
    message: 'Partida iniciando.',
    data: {
      numImpostors: match.settings.numImpostors,
      tasksPerPlayer: match.settings.tasksPerPlayer,
      revealDurationMs: match.settings.revealDurationMs,
      requiredPlayers,
    },
  });
}

function findPlayerTaskByInstance(player, instanceId) {
  return player.tasks.find((task) => task.instanceId === instanceId) || null;
}

function handleScanTaskQr({ payload, playerId, res }) {
  const player = ensurePlayerInGame(playerId, res, { requireAlive: true });
  if (!player) return;

  const qrPayload =
    typeof payload?.qrPayload === 'string' ? payload.qrPayload.trim() : '';
  if (!qrPayload) {
    return eventResponse({
      res,
      ok: false,
      code: 'INVALID_QR_PAYLOAD',
      message: 'Payload do QR invalido.',
    });
  }

  const catalogTask = findTaskByQrPayload(qrPayload);
  if (!catalogTask) {
    return eventResponse({
      res,
      ok: false,
      code: 'QR_NOT_RECOGNIZED',
      message: 'QR code nao reconhecido.',
    });
  }

  const alreadyUnlocked = player.tasks.find(
    (task) => task.taskType === catalogTask.taskType && task.status === 'UNLOCKED',
  );
  if (alreadyUnlocked) {
    return eventResponse({
      res,
      code: 'TASK_ALREADY_UNLOCKED',
      message: 'Task ja estava desbloqueada.',
      data: { instanceId: alreadyUnlocked.instanceId, task: alreadyUnlocked },
    });
  }

  const pendingTask = player.tasks.find(
    (task) => task.taskType === catalogTask.taskType && task.status === 'PENDING',
  );
  if (!pendingTask) {
    return eventResponse({
      res,
      ok: false,
      code: 'TASK_NOT_ASSIGNED_OR_ALREADY_DONE',
      message: 'Task nao atribuida ou ja concluida.',
    });
  }

  pendingTask.status = 'UNLOCKED';
  pendingTask.unlockedAt = nowMs();
  return eventResponse({
    res,
    code: 'TASK_UNLOCKED',
    message: 'Task desbloqueada. Pode abrir o minigame.',
    data: { instanceId: pendingTask.instanceId, task: pendingTask },
  });
}

function handleCloseTaskInstance({ payload, playerId, res }) {
  const player = ensurePlayerInGame(playerId, res, { requireAlive: true });
  if (!player) return;

  const instanceId =
    typeof payload?.instanceId === 'string' ? payload.instanceId.trim() : '';
  if (!instanceId) {
    return eventResponse({
      res,
      ok: false,
      code: 'INVALID_TASK_INSTANCE',
      message: 'InstanceId invalido.',
    });
  }

  const task = findPlayerTaskByInstance(player, instanceId);
  if (!task) {
    return eventResponse({
      res,
      ok: false,
      code: 'TASK_INSTANCE_NOT_FOUND',
      message: 'Task nao encontrada para este jogador.',
    });
  }

  if (task.status !== 'UNLOCKED') {
    return eventResponse({
      res,
      ok: false,
      code: 'TASK_INSTANCE_NOT_UNLOCKED',
      message: 'Task precisa estar desbloqueada para fechar.',
    });
  }

  task.status = 'PENDING';
  delete task.unlockedAt;
  return eventResponse({
    res,
    code: 'TASK_LOCKED',
    message: 'Task fechada. Escaneie novamente para reabrir.',
    data: { instanceId: task.instanceId, task },
  });
}

function handleCompleteTaskInstance({ payload, playerId, res }) {
  const player = ensurePlayerInGame(playerId, res, { requireAlive: true });
  if (!player) return;

  const instanceId =
    typeof payload?.instanceId === 'string' ? payload.instanceId.trim() : '';
  if (!instanceId) {
    return eventResponse({
      res,
      ok: false,
      code: 'INVALID_TASK_INSTANCE',
      message: 'InstanceId invalido.',
    });
  }

  const task = findPlayerTaskByInstance(player, instanceId);
  if (!task) {
    return eventResponse({
      res,
      ok: false,
      code: 'TASK_INSTANCE_NOT_FOUND',
      message: 'Task nao encontrada para este jogador.',
    });
  }

  if (task.status !== 'UNLOCKED') {
    return eventResponse({
      res,
      ok: false,
      code: 'TASK_INSTANCE_NOT_UNLOCKED',
      message: 'Escaneie o QR para desbloquear antes de concluir.',
    });
  }

  task.status = 'COMPLETED';
  delete task.unlockedAt;
  if (!player.completedTaskInstanceIds.includes(task.instanceId)) {
    player.completedTaskInstanceIds.push(task.instanceId);
  }

  recalculateGlobalProgress();
  return eventResponse({
    res,
    code: 'TASK_COMPLETED',
    message: task.isFake
      ? 'Task fake concluida. Nao altera progresso global.'
      : 'Task concluida com sucesso.',
    data: {
      instanceId: task.instanceId,
      task,
      isFake: task.isFake,
      globalProgress: match.globalProgress,
    },
  });
}

function handleKillPlayer({ payload, playerId, res }) {
  const player = ensurePlayerInGame(playerId, res, { requireAlive: true });
  if (!player) return;

  if (player.role !== 'IMPOSTOR') {
    return eventResponse({
      res,
      ok: false,
      code: 'ONLY_IMPOSTOR_CAN_KILL',
      message: 'Somente impostor pode usar kill.',
    });
  }

  const now = nowMs();
  if (player.killCooldownUntil && now < player.killCooldownUntil) {
    return eventResponse({
      res,
      ok: false,
      code: 'KILL_COOLDOWN_ACTIVE',
      message: 'Kill em cooldown para este impostor.',
      data: {
        nextAvailableAt: player.killCooldownUntil,
      },
    });
  }

  const targetPlayerId =
    typeof payload?.targetPlayerId === 'string' ? payload.targetPlayerId.trim() : '';
  if (!targetPlayerId) {
    return eventResponse({
      res,
      ok: false,
      code: 'INVALID_KILL_TARGET',
      message: 'targetPlayerId invalido.',
    });
  }

  const targetPlayer = getPlayer(targetPlayerId);
  if (
    !targetPlayer ||
    targetPlayer.id === player.id ||
    targetPlayer.status !== 'ALIVE' ||
    targetPlayer.role !== 'CREWMATE'
  ) {
    return eventResponse({
      res,
      ok: false,
      code: 'INVALID_KILL_TARGET',
      message: 'Alvo de kill invalido.',
    });
  }

  targetPlayer.status = 'DEAD';
  targetPlayer.deathReason = 'KILLED';
  targetPlayer.deadAt = now;

  const corpse = createCorpse({ victimId: targetPlayer.id, killerId: player.id });
  player.killCooldownUntil = now + match.settings.killCooldown * 1000;

  return eventResponse({
    res,
    code: 'KILL_SUCCESS',
    message: 'Kill executada com sucesso.',
    data: {
      victimId: targetPlayer.id,
      corpse: serializeCorpseSummary(corpse),
      nextAvailableAt: player.killCooldownUntil,
    },
  });
}

function handleTriggerSabotage({ playerId, res }) {
  const player = ensurePlayerInGame(playerId, res, { requireAlive: true });
  if (!player) return;

  if (player.role !== 'IMPOSTOR') {
    return eventResponse({
      res,
      ok: false,
      code: 'ONLY_IMPOSTOR_CAN_SABOTAGE',
      message: 'Somente impostor pode ativar sabotagem.',
    });
  }

  const now = nowMs();
  if (match.sabotage.cooldownUntil && now < match.sabotage.cooldownUntil) {
    return eventResponse({
      res,
      ok: false,
      code: 'SABOTAGE_COOLDOWN_ACTIVE',
      message: 'Sabotagem em cooldown global para todos os impostores.',
      data: {
        nextAvailableAt: match.sabotage.cooldownUntil,
      },
    });
  }

  clearSabotageTimeout();

  match.sabotage.active = true;
  match.sabotage.startedAt = now;
  match.sabotage.activeUntil = now + SABOTAGE_ACTIVE_MS;
  match.sabotage.cooldownUntil = now + match.settings.sabotageCooldown * 1000;
  match.sabotage.lastTriggeredBy = player.id;

  sabotageTimeout = setTimeout(() => {
    clearSabotageActiveState();
  }, SABOTAGE_ACTIVE_MS);

  return eventResponse({
    res,
    code: 'SABOTAGE_TRIGGERED',
    message: 'Sabotagem ativada.',
    data: {
      activeUntil: match.sabotage.activeUntil,
      nextAvailableAt: match.sabotage.cooldownUntil,
      triggeredBy: player.id,
    },
  });
}

function handleReportCrewmate({ payload, playerId, res }) {
  const player = ensurePlayerInGame(playerId, res, { requireAlive: true });
  if (!player) return;

  const now = nowMs();
  if (player.reportCooldownUntil && now < player.reportCooldownUntil) {
    return eventResponse({
      res,
      ok: false,
      code: 'REPORT_COOLDOWN_ACTIVE',
      message: 'Aguardando cooldown para tentar reportar novamente.',
      data: {
        nextAvailableAt: player.reportCooldownUntil,
      },
    });
  }

  const reportedPlayerId =
    typeof payload?.reportedPlayerId === 'string' ? payload.reportedPlayerId.trim() : '';
  if (!reportedPlayerId) {
    player.reportCooldownUntil = now + REPORT_COOLDOWN_MS;
    return eventResponse({
      res,
      ok: false,
      code: 'REPORT_WRONG_TARGET_COOLDOWN',
      message: 'Selecione um crewmate valido para reportar.',
      data: {
        nextAvailableAt: player.reportCooldownUntil,
      },
    });
  }

  const reportedPlayer = getPlayer(reportedPlayerId);
  const pendingCorpse = findPendingCorpseByVictim(reportedPlayerId);

  if (!reportedPlayer || reportedPlayer.role !== 'CREWMATE' || !pendingCorpse) {
    player.reportCooldownUntil = now + REPORT_COOLDOWN_MS;
    return eventResponse({
      res,
      ok: false,
      code: 'REPORT_WRONG_TARGET_COOLDOWN',
      message: 'Report incorreto. Tente novamente em 10 segundos.',
      data: {
        nextAvailableAt: player.reportCooldownUntil,
      },
    });
  }

  const roundDeaths = startMeeting({
    triggerType: 'REPORT',
    triggerBy: player.id,
    reportedPlayerId,
  });

  return eventResponse({
    res,
    code: 'REPORT_SUCCESS_MEETING_STARTED',
    message: 'Report valido. Reuniao iniciada.',
    data: {
      reportedPlayerId,
      roundDeaths,
      checkinDeadline: match.meeting.checkinDeadline,
    },
  });
}

function handleScanEmergencyQr({ payload, playerId, res }) {
  const player = ensurePlayerInGame(playerId, res, { requireAlive: true });
  if (!player) return;

  const qrPayload =
    typeof payload?.qrPayload === 'string' ? payload.qrPayload.trim() : '';
  if (qrPayload !== MEETING_QR_PAYLOADS.emergency) {
    return eventResponse({
      res,
      ok: false,
      code: 'INVALID_EMERGENCY_QR',
      message: 'QR de emergencia invalido.',
    });
  }

  player.lastEmergencyScanAt = nowMs();
  return eventResponse({
    res,
    code: 'EMERGENCY_QR_SCANNED',
    message: 'QR de emergencia escaneado. Confirme para ativar reuniao.',
    data: {
      confirmBefore: player.lastEmergencyScanAt + EMERGENCY_SCAN_CONFIRM_WINDOW_MS,
    },
  });
}

function handleConfirmEmergency({ playerId, res }) {
  const player = ensurePlayerInGame(playerId, res, { requireAlive: true });
  if (!player) return;

  if (!player.lastEmergencyScanAt) {
    return eventResponse({
      res,
      ok: false,
      code: 'EMERGENCY_SCAN_REQUIRED',
      message: 'Escaneie o QR de emergencia antes de confirmar.',
    });
  }

  const now = nowMs();
  if (now - player.lastEmergencyScanAt > EMERGENCY_SCAN_CONFIRM_WINDOW_MS) {
    player.lastEmergencyScanAt = 0;
    return eventResponse({
      res,
      ok: false,
      code: 'EMERGENCY_SCAN_EXPIRED',
      message: 'Escaneamento expirado. Escaneie novamente para confirmar.',
    });
  }

  player.lastEmergencyScanAt = 0;

  const roundDeaths = startMeeting({
    triggerType: 'EMERGENCY',
    triggerBy: player.id,
  });

  return eventResponse({
    res,
    code: 'EMERGENCY_TRIGGERED',
    message: 'Reuniao de emergencia iniciada.',
    data: {
      roundDeaths,
      checkinDeadline: match.meeting.checkinDeadline,
    },
  });
}

function handleScanMeetingCheckinQr({ payload, playerId, res }) {
  const player = ensurePlayerInGame(playerId, res, {
    requireAlive: true,
    allowDuringMeeting: true,
  });
  if (!player) return;

  if (!match.meeting.active || match.meeting.phase !== 'CHECKIN') {
    return eventResponse({
      res,
      ok: false,
      code: 'MEETING_NOT_IN_CHECKIN',
      message: 'Reuniao nao esta em fase de check-in.',
    });
  }

  const qrPayload =
    typeof payload?.qrPayload === 'string' ? payload.qrPayload.trim() : '';
  if (qrPayload !== MEETING_QR_PAYLOADS.checkin) {
    return eventResponse({
      res,
      ok: false,
      code: 'INVALID_MEETING_CHECKIN_QR',
      message: 'QR de presenca invalido.',
    });
  }

  if (!match.meeting.aliveSnapshot.includes(player.id)) {
    return eventResponse({
      res,
      ok: false,
      code: 'PLAYER_NOT_REQUIRED_FOR_CHECKIN',
      message: 'Jogador nao faz parte do snapshot de vivos desta reuniao.',
    });
  }

  if (match.meeting.presenceConfirmed.includes(player.id)) {
    return eventResponse({
      res,
      code: 'MEETING_CHECKIN_ALREADY_CONFIRMED',
      message: 'Presenca ja confirmada para esta reuniao.',
      data: {
        confirmed: match.meeting.presenceConfirmed.length,
        required: match.meeting.aliveSnapshot.length,
      },
    });
  }

  match.meeting.presenceConfirmed.push(player.id);

  if (
    match.meeting.presenceConfirmed.length >=
    match.meeting.aliveSnapshot.length
  ) {
    advanceMeetingToVoting();
  }

  return eventResponse({
    res,
    code: 'MEETING_CHECKIN_CONFIRMED',
    message: 'Presenca confirmada para a reuniao.',
    data: {
      phase: match.meeting.phase,
      confirmed: match.meeting.presenceConfirmed.length,
      required: match.meeting.aliveSnapshot.length,
      voteDeadline: match.meeting.voteDeadline,
    },
  });
}

function handleCastVote({ payload, playerId, res }) {
  const player = ensurePlayerInGame(playerId, res, {
    requireAlive: true,
    allowDuringMeeting: true,
  });
  if (!player) return;

  if (!match.meeting.active || match.meeting.phase !== 'VOTING') {
    return eventResponse({
      res,
      ok: false,
      code: 'VOTING_NOT_OPEN',
      message: 'Votacao nao esta aberta.',
    });
  }

  if (!match.meeting.eligibleVoters.includes(player.id)) {
    return eventResponse({
      res,
      ok: false,
      code: 'VOTER_NOT_ELIGIBLE',
      message: 'Jogador nao elegivel para votar nesta reuniao.',
    });
  }

  const alreadyVoted = match.meeting.votes.some(
    (vote) => vote.voterId === player.id,
  );
  if (alreadyVoted) {
    return eventResponse({
      res,
      ok: false,
      code: 'VOTE_ALREADY_CAST',
      message: 'Este jogador ja votou nesta reuniao.',
    });
  }

  const targetPlayerIdRaw =
    typeof payload?.targetPlayerId === 'string' ? payload.targetPlayerId.trim() : '';
  const targetPlayerId = targetPlayerIdRaw.toUpperCase() === 'SKIP'
    ? 'SKIP'
    : targetPlayerIdRaw;

  if (!targetPlayerId) {
    return eventResponse({
      res,
      ok: false,
      code: 'INVALID_VOTE_TARGET',
      message: 'Alvo de voto invalido.',
    });
  }

  if (targetPlayerId !== 'SKIP') {
    const validTarget =
      match.meeting.aliveSnapshot.includes(targetPlayerId) &&
      getPlayer(targetPlayerId)?.status === 'ALIVE';
    if (!validTarget) {
      return eventResponse({
        res,
        ok: false,
        code: 'INVALID_VOTE_TARGET',
        message: 'Jogador alvo nao e valido para voto.',
      });
    }
  }

  match.meeting.votes.push({
    voterId: player.id,
    targetPlayerId,
    at: nowMs(),
  });

  if (match.meeting.votes.length >= match.meeting.eligibleVoters.length) {
    resolveMeeting('ALL_VOTED');
  }

  return eventResponse({
    res,
    code: 'VOTE_ACCEPTED',
    message: 'Voto registrado.',
    data: {
      phase: match.meeting.phase,
      votesCast: match.meeting.votes.length,
      votesRequired: match.meeting.eligibleVoters.length,
      result: match.meeting.result,
    },
  });
}

function handleResetMatch({ playerId, res }) {
  if (match.hostId !== playerId) {
    return eventResponse({
      res,
      ok: false,
      code: 'ONLY_HOST_CAN_RESET',
      message: 'Apenas o host pode encerrar a partida.',
    });
  }

  clearRevealTimeout();
  clearSabotageTimeout();
  clearMeetingTimers();

  match.state = STATES.LOBBY;
  match.entryCode = createEntryCode();
  match.globalProgress = 0;
  match.reveal = null;
  match.corpses = [];
  match.meeting = createIdleMeeting();
  match.sabotage = {
    active: false,
    startedAt: null,
    activeUntil: null,
    cooldownUntil: null,
    lastTriggeredBy: null,
  };

  match.players.forEach((player) => {
    player.ready = false;
    player.status = 'ALIVE';
    player.deathReason = null;
    player.deadAt = null;
    player.role = null;
    player.tasks = [];
    player.completedTaskInstanceIds = [];
    player.killCooldownUntil = 0;
    player.reportCooldownUntil = 0;
    player.lastEmergencyScanAt = 0;
  });

  reconcileLobbyColors();

  return eventResponse({
    res,
    code: 'MATCH_RESET',
    message: 'Partida encerrada e sala retornou ao lobby.',
  });
}

function handleEvent(event, res) {
  const { type, payload, playerId } = event;

  if (!playerId || typeof playerId !== 'string') {
    return eventResponse({
      res,
      ok: false,
      code: 'INVALID_PLAYER_ID',
      message: 'playerId invalido.',
      statusCode: 400,
    });
  }

  switch (type) {
    case 'JOIN':
      return handleJoin({ payload, playerId, res });
    case 'CHANGE_COLOR':
      return handleChangeColor({ payload, playerId, res });
    case 'SET_READY':
      return handleSetReady({ payload, playerId, res });
    case 'UPDATE_SETTINGS':
      return handleUpdateSettings({ payload, playerId, res });
    case 'START':
      return handleStart({ payload, playerId, res });

    case 'SCAN_TASK_QR':
      return handleScanTaskQr({ payload, playerId, res });
    case 'CLOSE_TASK_INSTANCE':
      return handleCloseTaskInstance({ payload, playerId, res });
    case 'COMPLETE_TASK_INSTANCE':
      return handleCompleteTaskInstance({ payload, playerId, res });

    case 'KILL_PLAYER':
      return handleKillPlayer({ payload, playerId, res });
    case 'TRIGGER_SABOTAGE':
      return handleTriggerSabotage({ playerId, res });
    case 'REPORT_CREWMATE':
      return handleReportCrewmate({ payload, playerId, res });

    case 'SCAN_EMERGENCY_QR':
      return handleScanEmergencyQr({ payload, playerId, res });
    case 'CONFIRM_EMERGENCY':
      return handleConfirmEmergency({ playerId, res });
    case 'SCAN_MEETING_CHECKIN_QR':
      return handleScanMeetingCheckinQr({ payload, playerId, res });
    case 'CAST_VOTE':
      return handleCastVote({ payload, playerId, res });

    case 'RESET_MATCH':
      return handleResetMatch({ playerId, res });

    default:
      return eventResponse({
        res,
        ok: false,
        code: 'UNKNOWN_EVENT_TYPE',
        message: `Evento nao suportado: ${type}`,
        statusCode: 400,
      });
  }
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.url === '/state' && req.method === 'GET') {
    return json(res, match);
  }

  if (req.url === '/events' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const event = parseEvent(body);
        if (!event) {
          return eventResponse({
            res,
            ok: false,
            code: 'INVALID_EVENT_PAYLOAD',
            message: 'Corpo da requisicao invalido.',
            statusCode: 400,
          });
        }

        if (!event.eventId || typeof event.eventId !== 'string') {
          return eventResponse({
            res,
            ok: false,
            code: 'INVALID_EVENT_ID',
            message: 'eventId invalido.',
            statusCode: 400,
          });
        }

        if (processedEvents.has(event.eventId)) {
          return eventResponse({
            res,
            code: 'DUPLICATE_EVENT_IGNORED',
            message: 'Evento duplicado ignorado.',
          });
        }

        const response = handleEvent(event, res);
        addProcessedEventId(event.eventId);
        return response;
      } catch (error) {
        return eventResponse({
          res,
          ok: false,
          code: 'SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Erro inesperado.',
          statusCode: 500,
        });
      }
    });
    return;
  }

  return eventResponse({
    res,
    ok: false,
    code: 'NOT_FOUND',
    message: 'Rota nao encontrada.',
    statusCode: 404,
  });
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Servidor rodando na porta 3000');
});
