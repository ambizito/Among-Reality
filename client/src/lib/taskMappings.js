export const TASK_MINIGAME_BY_TYPE = {
  lixo: { path: '/tasks/lixo.html', legacyTaskId: 'LIXO' },
  o2: { path: '/tasks/o2.html', legacyTaskId: 'O2' },
  fios: { path: '/tasks/fios.html', legacyTaskId: 'FIOS' },
  download: { path: '/tasks/download.html', legacyTaskId: 'DOWNLOAD' },
  comunicacao: { path: '/tasks/comunicacao.html', legacyTaskId: 'COMUNICACAO' },
  armas: { path: '/tasks/armas.html', legacyTaskId: 'ARMAS' },
  navegacao: { path: '/tasks/navegacao.html', legacyTaskId: 'NAVEGACAO' },
  escudo: { path: '/tasks/escudo.html', legacyTaskId: 'ESCUDO' },
  combustivel_a: { path: '/tasks/combustivel_a.html', legacyTaskId: 'COMBUSTIVEL_A' },
  combustivel_b: { path: '/tasks/combustivel_b.html', legacyTaskId: 'COMBUSTIVEL_B' },
  eletrica_ritmo: { path: '/tasks/eletrica_ritmo.html', legacyTaskId: 'ELETRICA_RITMO' },
};

export function getMinigameByTaskType(taskType) {
  return TASK_MINIGAME_BY_TYPE[taskType] || null;
}
