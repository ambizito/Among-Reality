# Among Reality - Client

Este diretorio contem o frontend React/Vite do jogo.

Documentacao principal do projeto:

- `../README.md` (portugues, padrao)
- `../README.pt-BR.md` (portugues, copia dedicada)
- `../README.en.md` (english)

Comandos rapidos:

```powershell
cd client
npm install
npm run dev
npm run lint
npm run build
```

Observacoes:

- Em desenvolvimento, o client usa proxy do Vite para `/state` e `/events` apontando para `http://localhost:3000`.
- O scanner de QR em celular funciona melhor via URL HTTPS (ex.: tunnel do cloudflared).
