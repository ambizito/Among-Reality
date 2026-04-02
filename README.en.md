# Among Reality: QR Ops

Language:

- Portuguese (Brazil): [README.md](README.md) [default]
- English

Local multiplayer social deduction game inspired by Among Us, built for casual play with friends, using QR codes to unlock physical station minigames and a server-authoritative rules engine.

## Author

- Developed by: Andre Azevedo Ferreira Carvalho
- LinkedIn: [andreazevedoferreira](https://www.linkedin.com/in/andreazevedoferreira/)
- This project is part of my technical portfolio and showcases my work in web gameplay, mobile integration, and full-stack architecture.

## Quick Overview

| Item | Value |
| --- | --- |
| Status | Playable MVP |
| Mode | Casual local multiplayer |
| Stack | React + Vite + Node.js |
| Source of truth | Local backend (`server/index.js`) |
| Persistence | In-memory only (no database) |
| Max players | 20 |
| Mobile access | LAN and HTTPS tunnel (cloudflared) |

## Quick Start

### Option A: manual (2 terminals)

1. Backend:

```powershell
cd server
npm install
npm run qrcode:generate
npm start
```

2. Frontend:

```powershell
cd client
npm install
npm run dev
```

3. Open:

```text
http://localhost:5173
```

### Option B: one command + tunnel (recommended for mobile)

```powershell
./start-with-tunnel.cmd
```

This script:

- starts backend;
- starts frontend;
- starts HTTPS tunnel to `http://localhost:5173`.

## Visual Showcase (image and video slots)

This section is pre-structured so you can add minigame screenshots and a demo video later.

Expected files:

- `docs/media/minigames/armas.png`
- `docs/media/minigames/download.png`
- `docs/media/minigames/o2.png`
- `docs/media/minigames/comunicacao.png`
- `docs/media/minigames/combustivel_a.png`
- `docs/media/minigames/combustivel_b.png`
- `docs/media/minigames/fios.png`
- `docs/media/minigames/lixo.png`
- `docs/media/minigames/navegacao.png`
- `docs/media/minigames/escudo.png`
- `docs/media/minigames/eletrica_ritmo.png`
- `docs/media/video/demo-thumb.png`

### Application video (placeholder)

[![Watch demo](docs/media/video/demo-thumb.png)](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)

When publishing your demo:

1. Replace `YOUR_VIDEO_ID` with the real ID.
2. Add the thumbnail to `docs/media/video/demo-thumb.png`.

### Minigame gallery (ready placeholders)

| Minigame | How it works | Image |
| --- | --- | --- |
| Armas | Tap asteroids until objective is complete. | ![Armas](docs/media/minigames/armas.png) |
| Download | Start transfer and wait until 100%. | ![Download](docs/media/minigames/download.png) |
| O2 | Drag debris to clear the filter. | ![O2](docs/media/minigames/o2.png) |
| Comunicacao | Tune frequency/amplitude until stable lock. | ![Comunicacao](docs/media/minigames/comunicacao.png) |
| Combustivel A | Hold to fill tank to 100%. | ![Combustivel A](docs/media/minigames/combustivel_a.png) |
| Combustivel B | Hold to drain tank to 0%. | ![Combustivel B](docs/media/minigames/combustivel_b.png) |
| Fios | Connect matching wire pairs. | ![Fios](docs/media/minigames/fios.png) |
| Lixo | Execute cafeteria trash disposal. | ![Lixo](docs/media/minigames/lixo.png) |
| Navegacao | Align route/navigation correctly. | ![Navegacao](docs/media/minigames/navegacao.png) |
| Escudo | Activate shield sequence in panel. | ![Escudo](docs/media/minigames/escudo.png) |
| Eletrica Ritmo | Complete rhythm timing correctly. | ![Eletrica Ritmo](docs/media/minigames/eletrica_ritmo.png) |

## How gameplay works (flow)

1. Player joins lobby (`JOIN`) with `playerId` persisted in `localStorage`.
2. Host configures match and starts (`START`).
3. `STARTING` role reveal screen appears.
4. In `IN_GAME`, player scans task QR to unlock instance.
5. Minigame opens in iframe.
6. Minigame sends `TASK_COMPLETE` via `postMessage`.
7. Client sends `COMPLETE_TASK_INSTANCE`.
8. Meetings and voting follow backend rules.

## Architecture

```text
Browser / Mobile
   |
   | GET /state (polling)
   | POST /events (with eventId)
   v
server/index.js
   +-- in-memory match state
   +-- business rules (host, tasks, kill, sabotage, meetings, votes)

client/src/App.jsx
   +-- screen orchestration
   +-- sync/scanner/actions hooks
   +-- modular UI components
   +-- HTML minigames in iframe
```

Principles:

- Server-authoritative logic.
- Event idempotency via `eventId`.
- Login-free local session (`localStorage`).
- Ephemeral state for fast casual gameplay.

## Stack and Requirements

### Stack

- Frontend: React 19 + Vite (`client/`)
- Backend: Node.js HTTP server (`server/index.js`)
- Minigames: plain HTML/CSS/JS (`client/public/tasks`)
- QR codes: `qrcode` via `server/tools/generate-qrcodes.mjs`

### Minimum requirements

- Node.js `>= 20.19.0`
- npm `>= 10`
- PowerShell (Windows)
- Optional: `cloudflared` (HTTPS tunnel)

Install cloudflared:

```powershell
winget install --id Cloudflare.cloudflared -e
```

## Main API

### `GET /state`

Returns full match state.

### `POST /events`

Input:

```json
{
  "eventId": "unique-id",
  "playerId": "player-id",
  "type": "JOIN",
  "payload": {}
}
```

Output:

```json
{
  "ok": true,
  "code": "OK",
  "message": "",
  "data": {},
  "match": {}
}
```

Supported events:

- `JOIN`
- `CHANGE_COLOR`
- `SET_READY`
- `UPDATE_SETTINGS`
- `START`
- `SCAN_TASK_QR`
- `CLOSE_TASK_INSTANCE`
- `COMPLETE_TASK_INSTANCE`
- `KILL_PLAYER`
- `TRIGGER_SABOTAGE`
- `REPORT_CREWMATE`
- `SCAN_EMERGENCY_QR`
- `CONFIRM_EMERGENCY`
- `SCAN_MEETING_CHECKIN_QR`
- `CAST_VOTE`
- `RESET_MATCH`

## Current game rules (summary)

- Up to 20 players.
- First player becomes host.
- Start requires readiness and minimum players.
- Tasks use `instanceId` and allow duplicates.
- Kill uses individual cooldown per impostor.
- Sabotage uses shared global impostor cooldown.
- Wrong report gives 10s report cooldown.
- Meeting includes QR check-in, timed voting, and `SKIP`.

## Folder structure

```text
among-reality/
  client/
    public/tasks/
    src/
      screens/
      components/
      hooks/
      lib/
  server/
    index.js
    config/taskCatalog.js
    tools/generate-qrcodes.mjs
    qrcodes/
  docs/
    media/
      minigames/
      video/
  start-with-tunnel.ps1
  start-with-tunnel.cmd
```

## How to add a new task

1. Create minigame in `client/public/tasks/<name>.html`.
2. Implement `TASK_COMPLETE` postMessage with proper `taskId`.
3. Register task in `server/config/taskCatalog.js`.
4. Register mapping in `client/src/lib/taskMappings.js`.
5. Run:

```powershell
cd server
npm run qrcode:generate
```

6. Validate full flow: scan -> unlock -> minigame -> complete.

## Quick troubleshooting

- Mobile cannot access:
  - ensure frontend runs on `5173`;
  - check firewall and same LAN if using IP;
  - for camera support, prefer HTTPS tunnel.
- QR scans but task does not open:
  - verify task assignment;
  - verify instance is not already completed;
  - verify `taskType` in catalog and mapping.
- Reconnect:
  - use same browser/device to keep `pId`.

## Recruiter and discovery tags

### GitHub Topics

`react`, `vite`, `javascript`, `nodejs`, `html5`, `css3`, `polling`, `realtime`, `multiplayer`, `mobile-first`, `qrcode`, `social-deduction`, `party-game`, `game-dev`, `frontend-architecture`, `backend-architecture`, `server-authoritative`, `event-driven`

### Technical keywords

`react-hooks`, `modular-frontend`, `state-synchronization`, `http-api`, `idempotency`, `event-id-deduplication`, `in-memory-state`, `single-source-of-truth`, `localstorage-session`, `qr-task-unlock`, `iframe-minigames`, `postmessage-integration`, `cooldown-system`, `role-based-gameplay`, `meeting-flow`, `voting-system`, `game-state-machine`, `host-controls`, `ready-check`, `impostor-mechanics`, `cloudflare-tunnel`, `network-switch-resilience`, `touch-optimized-ui`, `responsive-minigames`, `fullstack-javascript`

### Technical decisions for interviews

- Server-authoritative game logic.
- Idempotency via `eventId`.
- Login-free session using `localStorage`.
- Task instances for duplicates.
- Individual kill cooldown + global sabotage cooldown.
- Decoupled minigame integration using iframe.
