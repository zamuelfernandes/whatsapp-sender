# 📣 WhatsApp Sender (Mass Messaging Edition)

WhatsApp Sender é uma aplicação Node.js desenvolvida para automação técnica e humanizada de envio de mensagens em massa via WhatsApp. O sistema opera simulando os movimentos e pausas de um humano, com atrasos configuráveis e uso de **Spintax** para variar totalmente o conteúdo da mensagem por destinatário, minimizando os banimentos de número impostos pelo rigoroso filtro Anti-Spam da Meta.

---

## 🚀 Principais Features

- **Interface Baseada na Web (Dashboard)** para conexão via QRCode gerado no navegador (dispensa o uso do WhatsApp Desktop)
- **Engine Antibloqueio**: Controle avançado de pacotes de envio (`Delays dinâmicos` + `Pausas estendidas por blocos` + `Limitador diário e aquecimento de número`).
- **Log Tempo Real**: Visualização limpa da lista de transações com ETAs e andamento.
- **Suporte a Arquivos CSV**
- **Suporte Avançado Spintax**: Transforme 1 mesma mensagem em dezenas de variações `{Opa|Oi|Saudações}`.
- **Marcações Válidas**: Suporta negrito, itálico, taxado, emojis e injeção do nome do destinatário (ex: `Olá {name}!`).

---

## 🛠 Pré-requisitos

Para o rodar e editar o código deste projeto na sua máquina, você precisa de:

- [Git](https://git-scm.com/) (Para clonar o projeto).
- [Node.js](https://nodejs.org/en) na versão LTS (`v18.x` ou superior recomendado). O Node já inclui o gerenciador de pacotes `npm`.
- Recomendamos o uso de um editor de código com suporte completo a javascript (ex: VSCode).

---

## 💻 Como Clonar e Rodar

Abra o Terminal (ou Prompt de Comando, PowerShell) da sua máquina e siga os passos abaixo:

### 1. Clonar o Repositório

```bash
git clone https://github.com/SEU_USUARIO/whatsapp-sender.git
cd whatsapp-sender
```

### 2. Instalar as Dependências

O sistema usa o pacote _Puppeteer_ pelo `whatsapp-web.js`, portanto esse comando pode demorar alguns minutos para baixar a versão oculta do Chromium.

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

Você **precisa** criar um arquivo secreto na raiz do seu projeto chamado de `.env`. O comando abaixo copia a versão de exemplo segura para você editar.

```bash
cp .env.example .env
```

_(Edite o `.env` se julgar necessário alterar a agressividade/segurança dos envios)_

### 4. Executar o Servidor

```bash
npm start
```

### 5. Acessar o Dashboard

O seu servidor abrirá a porta local para controle da aplicação. Acesse pelo navegador:

```
http://localhost:3000
```

---

## 💡 Como Usar na Interface

1. **Conexão**: Clique em "Conectar" na Dashboard. Um QRCode surgirá em alguns segundos. Leia-o usando o celular (Aparelhos Conectados > Conectar Dispositivo).
2. **Base de Contatos**: Importe o seu `.csv`.
   - **Importante**: A primeira linha do arquivo **DEVE OBRIGATORIAMENTE** ser o cabeçalho: `name,number`
   - Números brasileiros devem possuir código do país e DDD limpos (ex: `553599999999`).
3. **Escrita**: Redija o corpo no formato Spintax aproveitando ao máximo as variações, por exemplo `{Estou passando|Passei aqui} para avisar o evento sexta, tudo bem {name}?`.
4. **Envio**: Revise a Pré-Visualização e inicie o Envio. Recomenda-se desabilitar o descanso de tela da máquina (Standby) até que o medidor bata **100%**.

_Obs: Qualquer alteração no número requer um novo login QR. Uma vez logado, a sessão continuará viva nos próximos boots do comando npm start._
