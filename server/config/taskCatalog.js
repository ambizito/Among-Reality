const TASK_CATALOG = [
  {
    taskType: 'lixo',
    legacyTaskId: 'LIXO',
    label: 'Cafeteria',
    station: 'CAFETERIA',
    qrPayload: 'AMONGREALITY:STATION:LIXO:KEY:AR-LIXO-001',
  },
  {
    taskType: 'o2',
    legacyTaskId: 'O2',
    label: 'O2',
    station: 'O2',
    qrPayload: 'AMONGREALITY:STATION:O2:KEY:AR-O2-001',
  },
  {
    taskType: 'fios',
    legacyTaskId: 'FIOS',
    label: 'Eletrica',
    station: 'ELECTRICAL',
    qrPayload: 'AMONGREALITY:STATION:FIOS:KEY:AR-FIOS-001',
  },
  {
    taskType: 'download',
    legacyTaskId: 'DOWNLOAD',
    label: 'Comms',
    station: 'COMMS',
    qrPayload: 'AMONGREALITY:STATION:DOWNLOAD:KEY:AR-DOWNLOAD-001',
  },
  {
    taskType: 'comunicacao',
    legacyTaskId: 'COMUNICACAO',
    label: 'Comunicacao',
    station: 'COMMS_FREQUENCY',
    qrPayload: 'AMONGREALITY:STATION:COMUNICACAO:KEY:AR-COMUNICACAO-001',
  },
  {
    taskType: 'armas',
    legacyTaskId: 'ARMAS',
    label: 'Armas',
    station: 'ARMAS',
    qrPayload: 'AMONGREALITY:STATION:ARMAS:KEY:AR-ARMAS-001',
  },
  {
    taskType: 'navegacao',
    legacyTaskId: 'NAVEGACAO',
    label: 'Nav',
    station: 'NAVEGACAO',
    qrPayload: 'AMONGREALITY:STATION:NAVEGACAO:KEY:AR-NAVEGACAO-001',
  },
  {
    taskType: 'escudo',
    legacyTaskId: 'ESCUDO',
    label: 'Escudo',
    station: 'ESCUDO',
    qrPayload: 'AMONGREALITY:STATION:ESCUDO:KEY:AR-ESCUDO-001',
  },
  {
    taskType: 'combustivel_a',
    legacyTaskId: 'COMBUSTIVEL_A',
    label: 'Comb A',
    station: 'COMBUSTIVEL_A',
    qrPayload: 'AMONGREALITY:STATION:COMBUSTIVEL_A:KEY:AR-COMBUSTIVEL-A-001',
  },
  {
    taskType: 'combustivel_b',
    legacyTaskId: 'COMBUSTIVEL_B',
    label: 'Comb B',
    station: 'COMBUSTIVEL_B',
    qrPayload: 'AMONGREALITY:STATION:COMBUSTIVEL_B:KEY:AR-COMBUSTIVEL-B-001',
  },
  {
    taskType: 'eletrica_ritmo',
    legacyTaskId: 'ELETRICA_RITMO',
    label: 'Eletrica',
    station: 'ELETRICA',
    qrPayload: 'AMONGREALITY:STATION:ELETRICA_RITMO:KEY:AR-ELETRICA-RITMO-001',
  },
];

function findTaskByQrPayload(qrPayload) {
  return TASK_CATALOG.find((task) => task.qrPayload === qrPayload) || null;
}

function findTaskByType(taskType) {
  return TASK_CATALOG.find((task) => task.taskType === taskType) || null;
}

module.exports = {
  TASK_CATALOG,
  findTaskByQrPayload,
  findTaskByType,
};
