import { useCallback, useEffect, useMemo, useState } from 'react';
import { COLORS } from './constants';
import JoinScreen from './screens/JoinScreen';
import LobbyScreen from './screens/LobbyScreen';
import StartingScreen from './screens/StartingScreen';
import InGameScreen from './screens/InGameScreen';
import ScannerModal from './components/modals/ScannerModal';
import KillModal from './components/modals/KillModal';
import ReportModal from './components/modals/ReportModal';
import TaskModal from './components/modals/TaskModal';
import MeetingOverlay from './components/modals/MeetingOverlay';
import SettingsModal from './components/modals/SettingsModal';
import ColorModal from './components/modals/ColorModal';
import ImpostorSecretSheet from './components/game/ImpostorSecretSheet';
import { useMatchSync } from './hooks/useMatchSync';
import { useGameActions } from './hooks/useGameActions';
import { useQrScanner } from './hooks/useQrScanner';
import {
  buildInGameView,
  clamp,
  DEFAULT_SETTINGS,
  EMPTY_ARRAY,
  EMPTY_OBJECT,
  formatClock,
  getTaskTypeCounts,
  LIMITS,
  minPlayersForImpostors,
  remainingSeconds,
  resolveColor,
  SCANNER_MODES,
  STATES,
} from './lib/gameSelectors';
import { getMinigameByTaskType } from './lib/taskMappings';

const AVAILABLE_COLORS = COLORS.map((color) => ({
  ...color,
  name: color.id.toUpperCase(),
}));

function createPlayerId() {
  const persisted = localStorage.getItem('pId');
  if (persisted) return persisted;
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `p_${Date.now()}`;
}

export default function App() {
  const [playerId] = useState(createPlayerId);
  const [nickname, setNickname] = useState(() => localStorage.getItem('pNickname') || '');
  const [notice, setNotice] = useState('');

  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isKillModalOpen, setIsKillModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isImpostorSheetOpen, setIsImpostorSheetOpen] = useState(false);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState(SCANNER_MODES.TASK);

  const [pendingEmergencyConfirm, setPendingEmergencyConfirm] = useState(false);
  const [pendingEmergencyConfirmUntil, setPendingEmergencyConfirmUntil] = useState(0);

  const [activeTask, setActiveTask] = useState(null);
  const [taskModalNotice, setTaskModalNotice] = useState('');
  const [isCompletingTask, setIsCompletingTask] = useState(false);

  const [nowTick, setNowTick] = useState(() => Date.now());

  const { match, setMatch, hasJoined, setHasJoined, syncError } = useMatchSync(playerId);
  const { sendAction } = useGameActions(playerId, setMatch);

  useEffect(() => {
    localStorage.setItem('pId', playerId);
  }, [playerId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const players = match?.players || EMPTY_ARRAY;
  const meeting = match?.meeting || EMPTY_OBJECT;
  const sabotage = match?.sabotage || EMPTY_OBJECT;
  const gameState = match?.state || STATES.LOBBY;
  const hostId = match?.hostId || null;
  const gameSettings = match?.settings || DEFAULT_SETTINGS;
  const currentPlayer = players.find((player) => player.id === playerId) || null;
  const currentPlayerTasks = currentPlayer?.tasks || EMPTY_ARRAY;

  const inGameView = useMemo(
    () =>
      buildInGameView({
        currentPlayer,
        meeting,
        sabotage,
        nowTick,
      }),
    [currentPlayer, meeting, nowTick, sabotage],
  );

  const {
    isImpostor,
    isAlive,
    isMeetingActive,
    fakeRoleLabel,
    killCooldownSec,
    sabotageCooldownSec,
    reportCooldownSec,
    canUseKill,
    canUseSabotage,
    canUseReport,
    canUseEmergency,
    visibleTasks,
  } = inGameView;

  const meetingCheckinSec = remainingSeconds(meeting?.checkinDeadline, nowTick);
  const meetingVoteSec = remainingSeconds(meeting?.voteDeadline, nowTick);
  const emergencyConfirmSec = remainingSeconds(pendingEmergencyConfirmUntil, nowTick);
  const isEmergencyConfirmVisible =
    pendingEmergencyConfirm && emergencyConfirmSec > 0;
  const effectiveNotice = syncError || notice;

  const usedColors = players.map((player) => player.color);
  const minPlayersRequired = minPlayersForImpostors(gameSettings.numImpostors || 1);
  const everyoneReady =
    players.length >= minPlayersRequired &&
    players.every((player) => player.id === hostId || player.ready);

  const isAdmin = playerId === hostId;
  const crewmates = useMemo(
    () => players.filter((player) => player.role === 'CREWMATE'),
    [players],
  );
  const aliveCrewmatesForKill = useMemo(
    () =>
      players.filter(
        (player) => player.role === 'CREWMATE' && player.status === 'ALIVE',
      ),
    [players],
  );
  const taskTypeCounts = useMemo(
    () => getTaskTypeCounts(visibleTasks),
    [visibleTasks],
  );

  const playerById = useMemo(
    () => Object.fromEntries(players.map((player) => [player.id, player])),
    [players],
  );
  const getPlayerLabel = useCallback(
    (id) => playerById[id]?.nickname || id,
    [playerById],
  );

  const hasMeetingPresence = meeting?.presenceConfirmed?.includes(playerId);
  const isInMeetingSnapshot = meeting?.aliveSnapshot?.includes(playerId);
  const isEligibleVoter = meeting?.eligibleVoters?.includes(playerId);
  const hasVoted = Boolean(meeting?.votes?.some((vote) => vote.voterId === playerId));

  const resolvedActiveTask = useMemo(() => {
    if (gameState !== STATES.IN_GAME || isMeetingActive || !activeTask) return null;

    const updatedTask = currentPlayerTasks.find(
      (task) => task.instanceId === activeTask.instanceId,
    );
    if (!updatedTask || updatedTask.status !== 'UNLOCKED') return null;
    return activeTask;
  }, [activeTask, currentPlayerTasks, gameState, isMeetingActive]);

  const openScanner = useCallback((mode) => {
    setScannerMode(mode);
    setIsScannerOpen(true);
  }, []);

  const closeScanner = useCallback(() => {
    setIsScannerOpen(false);
  }, []);

  const handleEnterLobby = async () => {
    const normalized = nickname.trim().toUpperCase();
    if (normalized.length < 2) {
      setNotice('Digite um nickname com pelo menos 2 caracteres.');
      return;
    }

    const result = await sendAction('JOIN', { nickname: normalized });
    if (
      result?.ok ||
      result?.code === 'PLAYER_ALREADY_JOINED' ||
      result?.code === 'PLAYER_REJOINED'
    ) {
      setHasJoined(true);
      setNotice('');
      localStorage.setItem('pNickname', normalized);
      setNickname(normalized);
      return;
    }

    setNotice(result?.message || 'Nao foi possivel entrar na sala.');
  };

  const toggleReady = async () => {
    if (!currentPlayer) return;
    const result = await sendAction('SET_READY', { ready: !currentPlayer.ready });
    if (!result?.ok) {
      setNotice(result?.message || 'Falha ao alterar status de pronto.');
    }
  };

  const handleColorSelect = async (colorId) => {
    if (usedColors.includes(colorId) && currentPlayer?.color !== colorId) {
      setNotice('Cor em uso!');
      return;
    }

    const result = await sendAction('CHANGE_COLOR', { color: colorId });
    if (!result?.ok) {
      setNotice(result?.message || 'Falha ao alterar cor.');
      return;
    }

    setNotice('');
    setIsColorModalOpen(false);
  };

  const handleCloseColorModal = useCallback(() => {
    setIsColorModalOpen(false);
    setNotice('');
  }, []);

  const updateSetting = async (key, value) => {
    if (!isAdmin) return;
    const result = await sendAction('UPDATE_SETTINGS', { [key]: value });
    if (!result?.ok) {
      setNotice(result?.message || 'Falha ao atualizar configuracoes.');
    }
  };

  const handleStartGame = async () => {
    const result = await sendAction('START', {
      tasksPerPlayer: gameSettings.tasksPerPlayer,
      numImpostors: gameSettings.numImpostors,
      killCooldown: gameSettings.killCooldown,
      sabotageCooldown: gameSettings.sabotageCooldown,
    });
    if (!result?.ok) {
      setNotice(result?.message || 'Nao foi possivel iniciar a partida.');
    }
  };

  const handleReset = async () => {
    const result = await sendAction('RESET_MATCH');
    if (!result?.ok) {
      setNotice(result?.message || 'Nao foi possivel encerrar a partida.');
    }
  };

  const closeActiveTask = useCallback(async () => {
    if (!activeTask || isCompletingTask) return;

    const stillUnlocked = currentPlayerTasks.some(
      (task) => task.instanceId === activeTask.instanceId && task.status === 'UNLOCKED',
    );

    if (stillUnlocked) {
      const result = await sendAction('CLOSE_TASK_INSTANCE', {
        instanceId: activeTask.instanceId,
      });
      if (!result?.ok) {
        setTaskModalNotice(result?.message || 'Falha ao fechar task.');
        return;
      }
      setNotice(result?.message || 'Task fechada. Escaneie novamente.');
    }

    setActiveTask(null);
    setTaskModalNotice('');
  }, [activeTask, currentPlayerTasks, isCompletingTask, sendAction]);

  const handleSabotage = async () => {
    const result = await sendAction('TRIGGER_SABOTAGE');
    if (!result?.ok) {
      setNotice(result?.message || 'Nao foi possivel ativar sabotagem.');
      return;
    }

    setNotice(result?.message || 'Sabotagem ativada.');
    setIsImpostorSheetOpen(false);
  };

  const handleKillTarget = async (targetPlayerId) => {
    const result = await sendAction('KILL_PLAYER', { targetPlayerId });
    if (!result?.ok) {
      setNotice(result?.message || 'Kill falhou.');
      return;
    }

    setIsKillModalOpen(false);
    setIsImpostorSheetOpen(false);
    setNotice(result?.message || 'Kill executada.');
  };

  const handleReportTarget = async (reportedPlayerId) => {
    const result = await sendAction('REPORT_CREWMATE', { reportedPlayerId });
    if (!result?.ok) {
      setNotice(result?.message || 'Report falhou.');
      return;
    }

    setIsReportModalOpen(false);
    setNotice(result?.message || 'Report enviado.');
  };

  const handleConfirmEmergency = async () => {
    const result = await sendAction('CONFIRM_EMERGENCY');
    if (!result?.ok) {
      setNotice(result?.message || 'Nao foi possivel confirmar emergencia.');
      return;
    }

    setPendingEmergencyConfirm(false);
    setPendingEmergencyConfirmUntil(0);
    setNotice(result?.message || 'Reuniao de emergencia iniciada.');
  };

  const handleCastVote = async (targetPlayerId) => {
    const result = await sendAction('CAST_VOTE', { targetPlayerId });
    if (!result?.ok) {
      setNotice(result?.message || 'Falha ao votar.');
      return;
    }

    setNotice(result?.message || 'Voto registrado.');
  };

  const handleDecodedQr = useCallback(
    async (decodedText) => {
      if (scannerMode === SCANNER_MODES.TASK) {
        const result = await sendAction('SCAN_TASK_QR', { qrPayload: decodedText });
        if (!result?.ok) {
          setNotice(result?.message || 'Nao foi possivel validar QR da task.');
          return false;
        }

        const instanceId = result?.data?.instanceId;
        const task = result?.data?.task;
        if (!instanceId || !task) {
          setNotice('Servidor nao retornou task desbloqueada.');
          return false;
        }

        const minigame = getMinigameByTaskType(task.taskType);
        if (!minigame) {
          await sendAction('CLOSE_TASK_INSTANCE', { instanceId });
          setNotice(`Minigame nao mapeado para ${task.taskType}.`);
          return false;
        }

        setActiveTask({
          ...task,
          instanceId,
          minigamePath: minigame.path,
          expectedLegacyTaskId: task.legacyTaskId || minigame.legacyTaskId,
        });
        setTaskModalNotice('');
        setNotice(result.message || 'Task desbloqueada.');
        closeScanner();
        return true;
      }

      if (scannerMode === SCANNER_MODES.EMERGENCY) {
        const result = await sendAction('SCAN_EMERGENCY_QR', { qrPayload: decodedText });
        if (!result?.ok) {
          setNotice(result?.message || 'QR de emergencia invalido.');
          return false;
        }

        setPendingEmergencyConfirm(true);
        setPendingEmergencyConfirmUntil(result?.data?.confirmBefore || 0);
        setNotice(result?.message || 'QR lido. Confirme emergencia.');
        closeScanner();
        return true;
      }

      if (scannerMode === SCANNER_MODES.MEETING_CHECKIN) {
        const result = await sendAction('SCAN_MEETING_CHECKIN_QR', {
          qrPayload: decodedText,
        });
        if (!result?.ok) {
          setNotice(result?.message || 'Falha no check-in da reuniao.');
          return false;
        }

        setNotice(result?.message || 'Presenca confirmada.');
        closeScanner();
        return true;
      }

      return false;
    },
    [closeScanner, scannerMode, sendAction],
  );

  const { scannerError, scanInFlight, resetScannerState } = useQrScanner({
    isOpen: isScannerOpen && gameState === STATES.IN_GAME,
    onDecode: handleDecodedQr,
  });

  useEffect(() => {
    if (gameState === STATES.IN_GAME) return undefined;

    const timeoutId = setTimeout(() => {
      setIsScannerOpen(false);
      setIsKillModalOpen(false);
      setIsReportModalOpen(false);
      setIsImpostorSheetOpen(false);
      setPendingEmergencyConfirm(false);
      setPendingEmergencyConfirmUntil(0);
      setActiveTask(null);
      setTaskModalNotice('');
      setIsCompletingTask(false);
      resetScannerState();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [gameState, resetScannerState]);

  useEffect(() => {
    if (!isMeetingActive || !activeTask) return undefined;

    const timeoutId = setTimeout(() => {
      void closeActiveTask();
      setNotice('Task pausada por reuniao.');
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [activeTask, closeActiveTask, isMeetingActive]);

  useEffect(() => {
    if (!activeTask) return undefined;

    let completeLock = false;

    const onMessage = async (event) => {
      if (event.origin !== window.location.origin) return;
      const payload = event.data;
      if (!payload || payload.type !== 'TASK_COMPLETE') return;

      const completedTaskId =
        typeof payload.taskId === 'string'
          ? payload.taskId.trim().toUpperCase()
          : '';
      const expectedTaskId =
        (activeTask.expectedLegacyTaskId || '').trim().toUpperCase();

      if (!completedTaskId || completedTaskId !== expectedTaskId) {
        setTaskModalNotice('Task recebida nao bate com a task desbloqueada.');
        return;
      }

      if (completeLock) return;
      completeLock = true;
      setIsCompletingTask(true);

      const result = await sendAction('COMPLETE_TASK_INSTANCE', {
        instanceId: activeTask.instanceId,
      });

      setIsCompletingTask(false);
      completeLock = false;

      if (!result?.ok) {
        setTaskModalNotice(result?.message || 'Falha ao concluir task.');
        return;
      }

      setNotice(result?.message || 'Task concluida.');
      setActiveTask(null);
      setTaskModalNotice('');
    };

    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
    };
  }, [activeTask, sendAction]);

  if (!match) {
    return (
      <div className="h-screen bg-[#0b0e14] flex items-center justify-center text-white">
        Conectando ao servidor...
      </div>
    );
  }

  if (!hasJoined && gameState === STATES.LOBBY) {
    return (
        <JoinScreen
          nickname={nickname}
          onNicknameChange={setNickname}
          onEnterLobby={handleEnterLobby}
          notice={effectiveNotice}
        />
      );
  }

  if (gameState === STATES.STARTING) {
    return (
      <StartingScreen
        currentPlayerId={playerId}
        currentPlayerRole={currentPlayer?.role || null}
        players={players}
        reveal={match?.reveal || null}
        resolveColor={resolveColor}
      />
    );
  }

  if (gameState === STATES.IN_GAME) {
    return (
      <>
        <InGameScreen
          entryCode={match.entryCode}
          notice={effectiveNotice}
          isAlive={isAlive}
          isImpostor={isImpostor}
          meetingActive={isMeetingActive}
          fakeRoleLabel={fakeRoleLabel}
          avatarColor={resolveColor(currentPlayer?.color)}
          globalProgress={match.globalProgress}
          canUseEmergency={canUseEmergency}
          canUseReport={canUseReport}
          reportCooldownSec={reportCooldownSec}
          pendingEmergencyConfirm={isEmergencyConfirmVisible}
          emergencyConfirmSec={emergencyConfirmSec}
          tasks={visibleTasks}
          taskTypeCounts={taskTypeCounts}
          isAdmin={isAdmin}
          onAvatarClick={() => {
            if (isImpostor) setIsImpostorSheetOpen(true);
          }}
          onOpenTaskScanner={() => openScanner(SCANNER_MODES.TASK)}
          onOpenEmergencyScanner={() => openScanner(SCANNER_MODES.EMERGENCY)}
          onOpenReport={() => setIsReportModalOpen(true)}
          onConfirmEmergency={handleConfirmEmergency}
          onCancelEmergencyConfirm={() => {
            setPendingEmergencyConfirm(false);
            setPendingEmergencyConfirmUntil(0);
          }}
          onReset={handleReset}
        />

        <ScannerModal
          isOpen={gameState === STATES.IN_GAME && isScannerOpen}
          scannerMode={scannerMode}
          onClose={() => {
            closeScanner();
            resetScannerState();
          }}
          scanInFlight={scanInFlight}
          scannerError={scannerError}
        />

        <KillModal
          isOpen={gameState === STATES.IN_GAME && isImpostor && isKillModalOpen}
          targets={aliveCrewmatesForKill}
          onClose={() => setIsKillModalOpen(false)}
          onKill={handleKillTarget}
        />

        <ReportModal
          isOpen={gameState === STATES.IN_GAME && isReportModalOpen}
          crewmates={crewmates}
          onClose={() => setIsReportModalOpen(false)}
          onReport={handleReportTarget}
        />

        <TaskModal
          activeTask={resolvedActiveTask}
          isCompletingTask={isCompletingTask}
          taskModalNotice={taskModalNotice}
          onClose={() => {
            void closeActiveTask();
          }}
        />

        <MeetingOverlay
          isOpen={gameState === STATES.IN_GAME && isMeetingActive}
          meeting={meeting}
          meetingCheckinSec={meetingCheckinSec}
          meetingVoteSec={meetingVoteSec}
          formatClock={formatClock}
          isAlive={isAlive}
          isInMeetingSnapshot={isInMeetingSnapshot}
          hasMeetingPresence={hasMeetingPresence}
          isEligibleVoter={isEligibleVoter}
          hasVoted={hasVoted}
          getPlayerLabel={getPlayerLabel}
          onOpenCheckinScanner={() => openScanner(SCANNER_MODES.MEETING_CHECKIN)}
          onCastVote={handleCastVote}
        />

        <ImpostorSecretSheet
          isOpen={gameState === STATES.IN_GAME && isImpostor && isImpostorSheetOpen}
          onClose={() => setIsImpostorSheetOpen(false)}
          isAlive={isAlive}
          isMeetingActive={isMeetingActive}
          canUseKill={canUseKill}
          canUseSabotage={canUseSabotage}
          killCooldownSec={killCooldownSec}
          sabotageCooldownSec={sabotageCooldownSec}
          onOpenKill={() => setIsKillModalOpen(true)}
          onUseSabotage={handleSabotage}
        />
      </>
    );
  }

  return (
    <>
      <LobbyScreen
        entryCode={match.entryCode}
        gameSettings={gameSettings}
        minPlayersRequired={minPlayersRequired}
        players={players}
        hostId={hostId}
        playerId={playerId}
        notice={effectiveNotice}
        isAdmin={isAdmin}
        currentPlayer={currentPlayer}
        everyoneReady={everyoneReady}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenColor={() => setIsColorModalOpen(true)}
        onToggleReady={toggleReady}
        onStartGame={handleStartGame}
        resolveColor={resolveColor}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        gameSettings={gameSettings}
        limits={LIMITS}
        defaultSettings={DEFAULT_SETTINGS}
        clamp={clamp}
        onUpdateSetting={(key, value) => {
          void updateSetting(key, value);
        }}
      />

      <ColorModal
        isOpen={isColorModalOpen}
        availableColors={AVAILABLE_COLORS}
        usedColors={usedColors}
        currentColor={currentPlayer?.color}
        onSelectColor={(colorId) => {
          void handleColorSelect(colorId);
        }}
        onClose={handleCloseColorModal}
      />
    </>
  );
}
