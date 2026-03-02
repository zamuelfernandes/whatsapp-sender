# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado no [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/), e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.0.0] - Versão Inicial

### Adicionado

- **Motor Base de Disparo (WhatsApp Web JS)**:
  - Integração com a biblioteca `whatsapp-web.js` para controle e automação via WhatsApp Web através de um navegador headless.
  - Geração e exibição de QR Code no frontend para autenticação fácil da sessão.
  - Monitoramento e controle de estado em tempo real da sessão do WhatsApp (Conectando, Aguardando QR Code, Conectado, Desconectado).

- **Interface de Usuário (Frontend Responsivo)**:
  - Dashboard em `HTML`, `CSS` (inspirado nas cores verde e minimalismo do WhatsApp) e `Vanilla JS`.
  - Exibição do status das conexões auxiliados com feedback visual baseado em cores (Vermelho, Amarelo, Verde).
  - Design baseado em _cards_ separados lógicamente por: Conexão, Dados (CSV), Mensagens (Template) e Envio (Ações).

- **Recurso de Importação de Contatos**:
  - Leitura de arquivo `.csv` diretamente no navegador, suportando envio em massa utilizando as colunas `name` e `number`.
  - Feedback rápido informando o número total de contatos importados corretamente.

- **Sistema de Variações de Mensagem (Anti-Ban / Spintax)**:
  - Módulo para criação de até 3 variações de mensagens, que são escolhidas de forma randômica por cada envio, com o propósito de contornar ou atrasar os sistemas anti-spam da Meta.
  - Atalhos rápidos para adicionar formatações de texto suportadas pelo padrão do WhatsApp: Negrito (`*`), Itálico (`_`) e Riscado (`~`).
  - Variável de substituição mágica `{name}` para inserir automaticamente o nome do respectivo contato dentro do texto.
  - Caixa de **pré-visualização ao vivo** que simula como a mensagem será renderizada no lado do cliente.

- **Mecanismos Avançados Contra Banimento (Anti-Ban Policies)**:
  - **Pausas Randômicas (Delay)** entre envios.
  - **Pausas de Blocos**, aguardando mais tempo a cada _X_ contatos passados.
  - Leitura de configurações por um `.env` dinâmico contendo: `BLOCK_SIZE`, `BLOCK_PAUSE` e configurações para **Modo Warmup** (aquecimento de número, limitando tamanho de envios diários de forma reduzida).

- **Painel de Progresso ao Vivo**:
  - Barra de preenchimento (Progress Bar).
  - Indicadores em tempo real para: Mensagens Enviadas (Sucesso), Erros e Tempo Decorrido (Elapsed).
  - Cálculo preditivo de finalização (Tempo estimado restante / ETA).
  - **Tabela de Logs Scrollável** listando individualmente o status (Sucesso, Erro ou Pausa de Bloco), o relatório para o número/contato referente e o porquê do erro ou ação em andamento.

- **Serviços Web API Central (Express backend)**:
  - Endpoints robustos para coordenar os painéis com os scripts do robô, possuindo controle de limites (`limit: '10mb'`), verificação de estado prévio (`/api/status`, `/api/connect`) e inicialização de background tasks (`/api/send` / `/api/stop`).
