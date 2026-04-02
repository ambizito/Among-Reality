# Among Reality: QR Ops

Idioma:

- Portugues (Brasil) [padrao]
- English: [README.en.md](README.en.md)

Projeto de jogo local estilo Among Us para brincar com amigos, com lobby em tempo real, QR Code para liberar minigames fisicos e regras de impostor/reuniao controladas pelo servidor local.

## Autoria

- Desenvolvido por: Andre Azevedo Ferreira Carvalho
- LinkedIn: [andreazevedoferreira](https://www.linkedin.com/in/andreazevedoferreira/)
- Este projeto faz parte do meu portfolio tecnico e representa meu trabalho em gameplay web, integracao mobile e arquitetura full stack.

## Visao Rapida

| Item | Valor |
| --- | --- |
| Status | MVP jogavel |
| Modo | Multiplayer local casual |
| Stack | React + Vite + Node.js |
| Fonte de verdade | Backend local (`server/index.js`) |
| Persistencia | Em memoria (sem banco) |
| Limite de jogadores | 20 |
| Acesso mobile | LAN e HTTPS tunnel (cloudflared) |

## Inicio Rapido

### Opcao A: manual (2 terminais)

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

3. Abrir:

```text
http://localhost:5173
```

### Opcao B: script pronto com tunnel (recomendado para celular)

```powershell
./start-with-tunnel.cmd
```

Esse script:

- sobe backend;
- sobe frontend;
- abre tunnel HTTPS para `http://localhost:5173`.
- detecta automaticamente a URL `https://...trycloudflare.com`;
- gera um QR Code dessa URL em `%TEMP%\\among-reality-tunnel-qr.png`;
- abre o QR automaticamente no visualizador padrao do Windows.

### Erro de host bloqueado no tunnel

Se aparecer:

```text
Blocked request. This host ("...trycloudflare.com") is not allowed.
```

A causa e o `server.allowedHosts` do Vite bloqueando o dominio externo.
Este projeto ja permite `.trycloudflare.com` por padrao em `client/vite.config.js`.

Notas importantes para acesso externo:

- a URL `https://...trycloudflare.com` e temporaria e muda a cada execucao do tunnel;
- o QR do tunnel tambem e regenerado a cada execucao (porque a URL muda);
- para jogar em outra internet, todos os usuarios devem abrir exatamente essa URL HTTPS;
- `localhost` e `127.0.0.1` funcionam apenas na maquina host;
- se o QR nao abrir automaticamente, use a URL impressa no terminal;
- se precisar liberar outros dominios, use `VITE_EXTRA_ALLOWED_HOSTS` (CSV), por exemplo:

```powershell
cd client
$env:VITE_EXTRA_ALLOWED_HOSTS="meu-dominio.ngrok-free.app,meuapp.exemplo.com"
npm run dev
```

## Novidades do lobby

- Lista de tripulantes com scroll interno para manter o botao `FICAR PRONTO` / `INICIAR PARTIDA` visivel em telas menores.
- Botao `Minigames` no lobby para abrir e testar tasks sem iniciar partida.
- Pedido automatico de permissao da camera ao entrar no lobby, com status visivel e opcao de tentar novamente.
- Em celular, prefira iniciar por `./start-with-tunnel.cmd` para garantir HTTPS e liberar camera no navegador.

## Demonstracao Visual (imagens e video)

Esta secao reune as imagens dos minigames e a demo em video da versao PT-BR do projeto.

Arquivos esperados:

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
- `docs/media/video/Demoptbr.mp4`

### Video da aplicacao

[Assistir demo em video (PT-BR)](docs/media/video/Demoptbr.mp4)

### Galeria de minigames (placeholders prontos)

| Minigame | Como funciona | Imagem |
| --- | --- | --- |
| Armas | Toque para destruir asteroides ate concluir objetivo. | ![Armas](docs/media/minigames/armas.png) |
| Download | Inicia transferencia e aguarda progresso ate 100%. | ![Download](docs/media/minigames/download.png) |
| O2 | Arrasta detritos para limpar o filtro. | ![O2](docs/media/minigames/o2.png) |
| Comunicacao | Ajusta sintonia/frequencia ate obter lock estavel. | ![Comunicacao](docs/media/minigames/comunicacao.png) |
| Combustivel A | Segura para encher tanque ate 100%. | ![Combustivel A](docs/media/minigames/combustivel_a.png) |
| Combustivel B | Segura para descarregar tanque ate 0%. | ![Combustivel B](docs/media/minigames/combustivel_b.png) |
| Fios | Conecta pares corretos de fios. | ![Fios](docs/media/minigames/fios.png) |
| Lixo | Executa descarte da cafeteria. | ![Lixo](docs/media/minigames/lixo.png) |
| Navegacao | Ajusta rota/alinhamento ate validar. | ![Navegacao](docs/media/minigames/navegacao.png) |
| Escudo | Ativa sequencia de escudo no painel. | ![Escudo](docs/media/minigames/escudo.png) |
| Eletrica Ritmo | Completa o ritmo eletrico no tempo correto. | ![Eletrica Ritmo](docs/media/minigames/eletrica_ritmo.png) |

## Como o jogo funciona (fluxo)

1. Jogador entra no lobby (`JOIN`) com `playerId` salvo no `localStorage`.
2. Host configura regras e inicia (`START`).
3. Tela `STARTING` revela papel.
4. Em `IN_GAME`, jogador escaneia QR da task para desbloquear instancia.
5. Minigame abre via iframe.
6. Minigame envia `TASK_COMPLETE` via `postMessage`.
7. Cliente chama `COMPLETE_TASK_INSTANCE`.
8. Reunioes e votacao seguem regras do backend.

## Arquitetura

```text
Browser / Celular
   |
   | GET /state (polling)
   | POST /events (com eventId)
   v
server/index.js
   +-- estado da partida em memoria
   +-- regras de negocio (host, task, kill, sabotage, meeting, voto)

client/src/App.jsx
   +-- orquestracao de telas
   +-- hooks de sync, scanner e acoes
   +-- componentes modulares
   +-- minigames HTML em iframe
```

Principios:

- Server-authoritative.
- Idempotencia por `eventId`.
- Sessao local sem login (`localStorage`).
- Estado efemero para simplificar jogatina casual.

## Stack e Requisitos

### Stack

- Frontend: React 19 + Vite (`client/`)
- Backend: Node.js HTTP server (`server/index.js`)
- Minigames: HTML/CSS/JS puros (`client/public/tasks`)
- QR Codes: `qrcode` em `server/tools/generate-qrcodes.mjs`

### Requisitos minimos

- Node.js `>= 20.19.0`
- npm `>= 10`
- PowerShell (Windows)
- Opcional: `cloudflared` (HTTPS tunnel)

Instalacao do cloudflared:

```powershell
winget install --id Cloudflare.cloudflared -e
```

## API principal

### `GET /state`

Retorna estado completo da partida.

### `POST /events`

Entrada:

```json
{
  "eventId": "id-unico",
  "playerId": "id-do-jogador",
  "type": "JOIN",
  "payload": {}
}
```

Saida:

```json
{
  "ok": true,
  "code": "OK",
  "message": "",
  "data": {},
  "match": {}
}
```

Eventos suportados:

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

## Regras atuais do jogo (resumo)

- Sala com ate 20 jogadores.
- Primeiro jogador vira host.
- Start so com regras de pronto e minimo de jogadores.
- Task funciona por instancia (`instanceId`) e aceita duplicatas.
- Kill: cooldown individual por impostor.
- Sabotagem: cooldown global compartilhado por impostores.
- Report invalido: cooldown de 10s para novo report.
- Reuniao: check-in por QR, depois votacao com timeout e `SKIP`.

## Estrutura de pastas

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

## Como adicionar uma nova task

1. Criar minigame em `client/public/tasks/<nome>.html`.
2. Implementar envio de `TASK_COMPLETE` com `taskId` correto.
3. Registrar task em `server/config/taskCatalog.js`.
4. Registrar mapeamento em `client/src/lib/taskMappings.js`.
5. Rodar:

```powershell
cd server
npm run qrcode:generate
```

6. Validar fluxo: scan -> unlock -> minigame -> complete.

## Troubleshooting rapido

- Celular nao acessa:
  - confirmar frontend em `5173`;
  - verificar firewall e rede local;
  - para camera, preferir tunnel HTTPS.
- QR lido e task nao abre:
  - verificar se task foi atribuida;
  - verificar se instancia ja nao foi concluida;
  - validar `taskType` no catalogo e no mapping.
- Reconexao:
  - usar mesmo navegador para manter `pId`.

## Tags para recrutadores e descoberta

### GitHub Topics

`react`, `vite`, `javascript`, `nodejs`, `html5`, `css3`, `polling`, `realtime`, `multiplayer`, `mobile-first`, `qrcode`, `social-deduction`, `party-game`, `game-dev`, `frontend-architecture`, `backend-architecture`, `server-authoritative`, `event-driven`

### Keywords tecnicas

`react-hooks`, `modular-frontend`, `state-synchronization`, `http-api`, `idempotency`, `event-id-deduplication`, `in-memory-state`, `single-source-of-truth`, `localstorage-session`, `qr-task-unlock`, `iframe-minigames`, `postmessage-integration`, `cooldown-system`, `role-based-gameplay`, `meeting-flow`, `voting-system`, `game-state-machine`, `host-controls`, `ready-check`, `impostor-mechanics`, `cloudflare-tunnel`, `network-switch-resilience`, `touch-optimized-ui`, `responsive-minigames`, `fullstack-javascript`

### Decisoes tecnicas para entrevista

- Logica server-authoritative.
- Idempotencia por `eventId`.
- Sessao sem login via `localStorage`.
- Instancias de task para suportar duplicatas.
- Cooldown individual (kill) + global (sabotagem).
- Integracao desacoplada de minigames via iframe.
