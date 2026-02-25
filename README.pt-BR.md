# Among Reality: QR Ops

Projeto de jogo local estilo Among Us para brincadeira entre amigos, com lobby em tempo real, QR Code para liberar tasks fisicas/minigames e regras de impostor/meeting no servidor local.

## Nome oficial do projeto

- Nome: `Among Reality: QR Ops`
- Tipo: `Mobile Local Multiplayer Social Deduction Game`
- Versao de apresentacao: `MVP jogavel`

## Autoria

- Desenvolvido por: `André Azevedo Ferreira Carvalho`
- LinkedIn: `https://www.linkedin.com/in/andreazevedoferreira/`

## 1) Objetivo do projeto

- Rodar sem Firebase e sem autenticacao.
- Manter estado em memoria no servidor local.
- Permitir jogo em LAN (Wi-Fi) e tambem fora da rede local via tunnel HTTPS.
- Priorizar experiencia mobile (camera para QR e minigames touch).

## 2) Stack e requisitos

### Stack

- Frontend: React 19 + Vite (`client/`)
- Backend: Node.js HTTP server sem framework (`server/index.js`)
- Minigames: HTML/CSS/JS puros em `client/public/tasks`
- QR codes: gerados via pacote `qrcode` no backend

### Requisitos minimos

- Node.js `>= 20.19.0` (recomendado por causa do Vite 7)
- npm `>= 10`
- Windows PowerShell (para script de tunnel pronto)
- Opcional: `cloudflared` para acesso externo HTTPS

Instalacao do Cloudflare Tunnel (Windows):

```powershell
winget install --id Cloudflare.cloudflared -e
```

## 3) Arquitetura (visao geral)

```text
Celular/Browser
   |
   |  GET /state (polling a cada 1s)
   |  POST /events (acoes do jogador, com eventId)
   v
server/index.js  <-- fonte unica de verdade do estado
   |
   +-- match.state: LOBBY -> STARTING -> IN_GAME
   +-- players, roles, tasks por instancia, meeting, sabotage, corpos
   +-- regras de negocio e validacoes

client/src/App.jsx
   |
   +-- hooks:
   |   - useMatchSync (sincronizacao)
   |   - useGameActions (envio de eventos)
   |   - useQrScanner (camera + leitura)
   |
   +-- screens/modals/componentes reutilizaveis
   +-- minigames via iframe + postMessage TASK_COMPLETE
```

## 4) Metodologia e principios de implementacao

- Server-authoritative: toda regra importante e validada no backend.
- Estado efemero: reiniciar `server` reinicia a partida.
- Idempotencia por evento: `eventId` evita duplicacao de acao.
- Sessao local: `playerId` e nickname ficam no `localStorage` (`pId`, `pNickname`).
- Componente modular no client: telas, modais e hooks separados para manutencao.

## 5) Regras de jogo atuais (resumo)

- Limite de sala: `20` jogadores.
- Host: primeiro jogador que entra.
- Start no lobby:
  - so host inicia;
  - exige jogadores minimos por qtd de impostores;
  - exige ready check de todos (exceto host).
- Tasks:
  - atribuicao por instancia (`instanceId`);
  - duplicatas permitidas;
  - task concluida nao pode repetir a mesma instancia;
  - progresso global conta somente tasks reais de crewmate.
- Impostor:
  - `Kill` com cooldown individual por impostor.
  - `Sabotagem` com cooldown global compartilhado entre impostores.
- Report/Meeting:
  - report errado aplica cooldown de 10s para novo report do jogador;
  - report valido inicia reuniao e mostra mortos da rodada;
  - check-in por QR (timeout 45s), depois votacao (timeout 3min), com `SKIP` e empate sem expulsao.

## 6) API principal

### `GET /state`

Retorna o estado completo da partida (`match`).

### `POST /events`

Envelope de entrada:

```json
{
  "eventId": "uuid-ou-id-unico",
  "playerId": "id-persistido-no-client",
  "type": "JOIN",
  "payload": {}
}
```

Envelope de resposta:

```json
{
  "ok": true,
  "code": "OK",
  "message": "",
  "data": {},
  "match": {}
}
```

Eventos suportados (backend):

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

## 7) Tasks e minigames

Mapeamento atual (`taskType -> arquivo`):

- `lixo` -> `/tasks/lixo.html`
- `o2` -> `/tasks/o2.html`
- `fios` -> `/tasks/fios.html`
- `download` -> `/tasks/download.html`
- `comunicacao` -> `/tasks/comunicacao.html`
- `armas` -> `/tasks/armas.html`
- `navegacao` -> `/tasks/navegacao.html`
- `escudo` -> `/tasks/escudo.html`
- `combustivel_a` -> `/tasks/combustivel_a.html`
- `combustivel_b` -> `/tasks/combustivel_b.html`
- `eletrica_ritmo` -> `/tasks/eletrica_ritmo.html`

Contrato de conclusao do minigame (dentro do iframe):

```js
window.parent.postMessage(
  { type: 'TASK_COMPLETE', taskId: 'LEGACY_TASK_ID' },
  window.location.origin
);
```

## 8) Estrutura de pastas

```text
among-reality/
  client/
    public/tasks/           # minigames HTML/CSS/JS
    src/
      screens/
      components/
      hooks/
      lib/
  server/
    index.js                # regras de jogo + API
    config/taskCatalog.js   # catalogo de tasks e payloads QR
    tools/generate-qrcodes.mjs
    qrcodes/                # gerado por script
  start-with-tunnel.ps1
  start-with-tunnel.cmd
```

## 9) Como rodar (passo a passo)

### Opcao A: manual (2 terminais)

1. Backend

```powershell
cd server
npm install
npm run qrcode:generate
npm start
```

2. Frontend

```powershell
cd client
npm install
npm run dev
```

3. Abrir no navegador do PC:

```text
http://localhost:5173
```

### Opcao B: script com tunnel (recomendado para celular)

Na raiz do projeto:

```powershell
./start-with-tunnel.cmd
```

O script:

- abre backend em uma janela;
- abre frontend em outra janela;
- sobe um tunnel HTTPS do `cloudflared` para `http://localhost:5173`.

Use a URL `https://...trycloudflare.com` em todos os celulares.

## 10) Rede, camera e troca de Wi-Fi/4G/5G

- Camera no celular normalmente exige contexto seguro (`https`) ou `localhost`.
- Por isso, para QR em celular, prefira URL do tunnel HTTPS.
- Para suportar troca de rede sem perder sessao:
  - abra sempre a URL do tunnel;
  - nao limpe `localStorage` do navegador.

## 11) Comandos uteis

Backend:

```powershell
cd server
npm start
npm run qrcode:generate
node --check index.js
```

Frontend:

```powershell
cd client
npm run dev
npm run lint
npm run build
npm run preview
```

## 12) Como adicionar uma nova task

1. Criar minigame em `client/public/tasks/<nome>.html`.
2. Garantir `postMessage` com `TASK_COMPLETE` e `taskId` correto.
3. Adicionar task em `server/config/taskCatalog.js`.
4. Adicionar mapeamento em `client/src/lib/taskMappings.js`.
5. Regenerar QRs:

```powershell
cd server
npm run qrcode:generate
```

6. Testar fluxo completo: scan -> unlock -> abrir minigame -> completar -> estado `COMPLETED`.

## 13) Troubleshooting rapido

- Celular nao abre app:
  - confirme que o frontend esta de pe em `5173`;
  - se for IP LAN, confira firewall do Windows e mesma rede Wi-Fi;
  - para evitar problema de rede/camera, use tunnel HTTPS.
- QR lido mas nao abre task:
  - valide se task foi atribuida ao jogador;
  - valide se instancia nao estava concluida;
  - confira `taskType` em `taskCatalog.js` e `taskMappings.js`.
- Jogador caiu e voltou:
  - usar mesmo navegador/dispositivo para manter `pId` em `localStorage`.

## 14) Limitacoes conhecidas

- Sem persistencia em banco.
- Sem multi-sala completa (single match local).
- Sem autenticacao.
- Sem anti-cheat avancado.

## 15) Tags para recrutadores e descoberta

Use estas tags no GitHub (topics), LinkedIn, portfolio e descricao do projeto.

### GitHub Topics (sugestao pronta)

`react`, `vite`, `javascript`, `nodejs`, `html5`, `css3`, `websocket-alternative`, `polling`, `realtime`, `multiplayer`, `mobile-first`, `pwa-ready`, `qrcode`, `social-deduction`, `party-game`, `game-dev`, `frontend-architecture`, `backend-architecture`, `server-authoritative`, `event-driven`

### Keywords tecnicas (SEO/portfolio/recrutadores)

`react-hooks`, `component-driven-ui`, `modular-frontend`, `clean-architecture`, `state-synchronization`, `http-api`, `rest-like-api`, `idempotency`, `event-id-deduplication`, `in-memory-state`, `single-source-of-truth`, `local-first`, `offline-tolerant-session`, `localstorage-session`, `qr-task-unlock`, `iframe-minigames`, `postmessage-integration`, `cooldown-system`, `role-based-gameplay`, `meeting-flow`, `voting-system`, `game-state-machine`, `lobby-system`, `host-controls`, `ready-check`, `impostor-mechanics`, `kill-cooldown`, `shared-sabotage-cooldown`, `report-validation`, `checkin-qr`, `mobile-camera-access`, `cloudflare-tunnel`, `network-switch-resilience`, `android-friendly-ui`, `ios-friendly-ui`, `touch-optimized-ui`, `responsive-minigames`, `javascript-gameplay`, `node-http-server`, `no-firebase`, `no-auth`, `casual-gaming-platform`, `rapid-prototyping`, `product-engineering`, `fullstack-javascript`

### Decisoes tecnicas destacaveis para entrevistas

- `Server-authoritative game logic` para evitar inconsistencias de cliente.
- `Idempotencia por eventId` para tolerar duplicacao de requests.
- `Estado em memoria` para simplicidade e baixa latencia em ambiente casual.
- `playerId persistido em localStorage` para reconexao sem login.
- `Task instances` para suportar duplicatas da mesma task sem conflito.
- `Cooldown global e individual` para balanceamento de mecanicas de impostor.
- `Integracao de minigames via iframe + postMessage` para desacoplamento.
- `Proxy Vite + API unica` para simplificar dev local.
- `Tunnel HTTPS` para camera mobile e jogo fora da LAN.

