# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo, baseado no [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.1.0] - 11/11/2026

### Added

- Nova aba de envio por SMS usando celular Android conectado no USB, com painel de progresso próprio.
- Salvamento automático de um relatório em CSV na pasta `logs/` ao final ou durante cada disparo, registrando quem recebeu e o motivo de eventuais erros.
- Suporte para importar listas simples em `.txt` (um número por linha) e planilhas sem a coluna de nome preenchida.
- Opção para rodar o navegador oculto em segundo plano ou visível na tela, além da escolha automática de outra porta caso a padrão já esteja ocupada.
- Arquivos de exemplo genéricos em `docs/` para cadastro de contatos e modelo de texto com variações.

### Fixed

- Corrigida a exibição e o envio de mensagens que usam `{name}` quando o contato não possui nome, evitando espaços, vírgulas ou marcadores de negrito sobrando.
- Corrigida a compatibilidade do envio pelo WhatsApp Web sem depender de bibliotecas externas que pararam de funcionar após atualizações do WhatsApp.
- Proteção extra na pré-visualização da mensagem e nos registros de envio para evitar quebra de layout ou falhas com números mal formatados.

### Changed

- Substituído o motor antigo do WhatsApp por automação direta no navegador, mantendo a leitura de QR Code no painel e o reaproveitamento automático da sessão salva.
- Remoção de scripts antigos de campanha específica e atualização dos guias e documentos do projeto para uso genérico.

### Note

- Configurar as novas chaves no `.env` quando necessário: `PORT` e `WA_HEADLESS`.
- Para usar a aba de SMS via celular Android, criar o arquivo `.env.sms` baseado no `.env.sms.example` com as variáveis `SMS_DELAY_MIN`, `SMS_DELAY_MAX`, `SMS_BLOCK_SIZE`, `SMS_BLOCK_PAUSE`, `SMS_WARMUP_MODE`, `SMS_WARMUP_DELAY_MIN`, `SMS_WARMUP_DELAY_MAX`, `SMS_WARMUP_DAILY_LIMIT`, `SMS_TAP_X` e `SMS_TAP_Y`.

## [1.0.0] - 02/03/2026

### Added

- Motor base de disparo via WhatsApp Web com dashboard web em `HTML`, `CSS` e `Vanilla JS`.
- Importação de contatos via `.csv` (`name,number`).
- Sistema de variações com **Spintax** (`{opção1|opção2}`), formatação WhatsApp e pré-visualização ao vivo.
- Mecanismos anti-bloqueio por delays randômicos, pausas por blocos e modo warmup configuráveis via `.env`.
- Painel de progresso ao vivo com ETA e tabela de logs.
