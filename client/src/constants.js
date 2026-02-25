export const COLORS = [
  { id: 'red', hex: '#FF1919' },
  { id: 'blue', hex: '#132ED1' },
  { id: 'green', hex: '#117F2D' },
  { id: 'yellow', hex: '#F5F557' },
  { id: 'pink', hex: '#ED54BA' },
  { id: 'orange', hex: '#EF7D0D' },
  { id: 'purple', hex: '#6B2FBB' },
  { id: 'cyan', hex: '#38FEDC' },
  { id: 'black', hex: '#1a1a1a' },
  { id: 'white', hex: '#f6f7f9' },
  { id: 'brown', hex: '#6b3f2a' },
  { id: 'lime', hex: '#7FFF00' },
  { id: 'maroon', hex: '#800000' },
  { id: 'navy', hex: '#001f5b' },
  { id: 'teal', hex: '#008080' },
  { id: 'olive', hex: '#808000' },
  { id: 'coral', hex: '#ff7f50' },
  { id: 'magenta', hex: '#ff00ff' },
  { id: 'gray', hex: '#808a93' },
  { id: 'mint', hex: '#98ffcc' },
];

const configuredServerUrl = import.meta.env.VITE_SERVER_URL?.trim();
export const SERVER_URL = configuredServerUrl
  ? configuredServerUrl.replace(/\/$/, '')
  : '';

export const MEETING_QR_PAYLOADS = {
  emergency: 'AMONGREALITY:MEETING:EMERGENCY:KEY:AR-MEETING-001',
  checkin: 'AMONGREALITY:MEETING:CHECKIN:KEY:AR-MEETING-CHECKIN-001',
};
