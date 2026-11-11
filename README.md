# 📣 WhatsApp Sender

Aplicação Node.js para envio cadenciado de mensagens pelo **WhatsApp Web** (via `Puppeteer`) e por **SMS** nativo (via `ADB`), com painel web em tempo real, suporte a **Spintax**, controle de blocos anti-bloqueio e registro de logs em CSV.

---

## 🚀 Principais Recursos

- **Automação direta no navegador (`Puppeteer`):** controla o `web.whatsapp.com` sem depender de APIs não oficiais baseadas em módulos internos do webpack, exibindo o QR Code diretamente no painel e mantendo a sessão salva em `.wwebjs_auth`.
- **Engine Anti-Bloqueio:** delays aleatórios (`DELAY_MIN`/`DELAY_MAX`), pausas longas por bloco (`BLOCK_SIZE`/`BLOCK_PAUSE`) e modo aquecimento (`WARMUP_MODE`).
- **Importação flexível (`.csv` ou `.txt`):** aceita CSV com `name` e `number`, CSV apenas com `number` (ou `telefone`/`celular`/`numero`) ou `.txt` simples com um número por linha, com limpeza e deduplicação automática.
- **Spintax e Formatação:** variações `{Opção 1|Opção 2}`, variável opcional `{name}` (removida automaticamente quando o contato não tiver nome), negrito `*`, itálico `_`, riscado `~` e pré-visualização ao vivo.
- **Canal Duplo (WhatsApp + SMS ADB):** abas separadas no dashboard com configurações independentes em `.env` e `.env.sms`.
- **Logs persistentes:** cada execução grava automaticamente um CSV detalhado (`OK`/`ERRO` e motivo) na pasta `logs/`.

---

## 🛠 Pré-requisitos

- [Node.js](https://nodejs.org/) (`v18+` recomendado)
- `adb` instalado no sistema *(apenas se for usar a aba de SMS via Android)*

---

## 💻 Instalação e Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie os arquivos de exemplo e ajuste conforme sua necessidade:

```bash
cp .env.example .env
cp .env.sms.example .env.sms   # Opcional: apenas se for enviar SMS via ADB
```

Principais opções do `.env`:
- `DELAY_MIN` / `DELAY_MAX`: intervalo aleatório em segundos entre envios;
- `BLOCK_SIZE` / `BLOCK_PAUSE`: quantidade de mensagens por bloco e pausa em segundos entre blocos;
- `WARMUP_MODE` / `WARMUP_DAILY_LIMIT`: limita e desacelera envios para contas novas;
- `PORT`: porta inicial do servidor (padrão `3000`; se estiver em uso, avança automaticamente para a próxima livre);
- `WA_HEADLESS`: `true` roda o Chrome em segundo plano; `false` exibe a janela do navegador.

### 3. Iniciar o servidor

```bash
npm start
```

Acesse a URL exibida no terminal (por padrão `http://localhost:3000`).

---

## 💡 Como Usar

1. **Conexão:** aguarde o QR Code no painel e escaneie pelo celular em *WhatsApp → Aparelhos conectados → Conectar aparelho*. Após o primeiro login, a sessão permanece salva em `.wwebjs_auth`.
2. **Contatos:** importe um `.csv` ou `.txt` seguindo o padrão de [docs/modelo-contatos.csv](docs/modelo-contatos.csv) (`number` obrigatório, `name` opcional, DDI + DDD sem símbolos).
3. **Mensagem:** redija o texto usando Spintax (veja exemplo em [docs/modelo-mensagem.txt](docs/modelo-mensagem.txt)) e confira a **Pré-visualização Aleatória**.
4. **Envio:** clique em **▶ Iniciar Envio**, acompanhe progresso/ETA e consulte o histórico gerado em `logs/`.

---

## 📚 Documentação Complementar

- [Estratégias de Envio em Massa](docs/markdown/estrategias-envio-em-massa.md)
- [Playbook Operacional](docs/markdown/estrategia-operacional.md)
- [Gerador de Spintax com IA](docs/markdown/prompt-gerador-spintax.md)
- [WhatsApp Cloud API vs Automação Web](docs/markdown/whatsapp-cloud-api-custos.md)
