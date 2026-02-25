import { COLORS } from '../constants';

export const STATES = {
  LOBBY: 'LOBBY',
  STARTING: 'STARTING',
  IN_GAME: 'IN_GAME',
};

export const SCANNER_MODES = {
  TASK: 'TASK',
  EMERGENCY: 'EMERGENCY',
  MEETING_CHECKIN: 'MEETING_CHECKIN',
};

export const LIMITS = {
  tasksPerPlayer: { min: 1, max: 10 },
  numImpostors: { min: 1, max: 3 },
  killCooldown: { min: 10, max: 60 },
  sabotageCooldown: { min: 10, max: 120 },
};

export const DEFAULT_SETTINGS = {
  tasksPerPlayer: 2,
  numImpostors: 1,
  killCooldown: 30,
  sabotageCooldown: 45,
};

export const EMPTY_ARRAY = [];
export const EMPTY_OBJECT = {};

const COLOR_BY_ID = Object.fromEntries(COLORS.map((color) => [color.id, color.hex]));

export function resolveColor(colorId) {
  return COLOR_BY_ID[colorId] || '#8b8d94';
}

export function clamp(value, limits) {
  return Math.max(limits.min, Math.min(limits.max, value));
}

export function minPlayersForImpostors(numImpostors) {
  return Math.max(4, numImpostors * 2 + 2);
}

export function statusBadgeClass(status) {
  if (status === 'COMPLETED') return 'text-green-400 bg-green-500/10 border border-green-500/30';
  if (status === 'UNLOCKED') return 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/30';
  return 'text-gray-300 bg-white/5 border border-white/10';
}

export function remainingSeconds(until, now) {
  if (!until) return 0;
  return Math.max(0, Math.ceil((until - now) / 1000));
}

export function formatClock(seconds) {
  const safe = Math.max(0, seconds);
  const min = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const sec = (safe % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

export function getTaskTypeCounts(tasks) {
  const counts = {};
  (tasks || []).forEach((task) => {
    counts[task.taskType] = (counts[task.taskType] || 0) + 1;
  });
  return counts;
}

/**
 * @typedef {Object} InGameView
 * @property {boolean} isImpostor
 * @property {boolean} isAlive
 * @property {boolean} isMeetingActive
 * @property {string} fakeRoleLabel
 * @property {number} killCooldownSec
 * @property {number} sabotageCooldownSec
 * @property {number} reportCooldownSec
 * @property {boolean} canUseKill
 * @property {boolean} canUseSabotage
 * @property {boolean} canUseReport
 * @property {boolean} canUseEmergency
 * @property {Array<Object>} visibleTasks
 */

/**
 * @returns {InGameView}
 */
export function buildInGameView({ currentPlayer, meeting, sabotage, nowTick }) {
  const role = currentPlayer?.role || 'CREWMATE';
  const isImpostor = role === 'IMPOSTOR';
  const isAlive = currentPlayer?.status === 'ALIVE';
  const isMeetingActive = Boolean(meeting?.active);

  const killCooldownSec = remainingSeconds(currentPlayer?.killCooldownUntil, nowTick);
  const sabotageCooldownSec = remainingSeconds(sabotage?.cooldownUntil, nowTick);
  const reportCooldownSec = remainingSeconds(currentPlayer?.reportCooldownUntil, nowTick);

  const canUseKill = isAlive && isImpostor && !isMeetingActive && killCooldownSec === 0;
  const canUseSabotage = isAlive && isImpostor && !isMeetingActive && sabotageCooldownSec === 0;
  const canUseReport = isAlive && !isMeetingActive && reportCooldownSec === 0;
  const canUseEmergency = isAlive && !isMeetingActive;

  return {
    isImpostor,
    isAlive,
    isMeetingActive,
    fakeRoleLabel: isImpostor ? 'CREWMATE' : role,
    killCooldownSec,
    sabotageCooldownSec,
    reportCooldownSec,
    canUseKill,
    canUseSabotage,
    canUseReport,
    canUseEmergency,
    visibleTasks: (currentPlayer?.tasks || []).map((task) => ({
      ...task,
      hideFakeLabel: isImpostor,
    })),
  };
}
