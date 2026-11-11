# 📋 Playbook Operacional de Envio em Lotes

Modelo prático para organizar disparos cadenciados preservando a saúde da conta.

---

## 1. Presets Recomendados (`.env`)

| Perfil da Conta | `DELAY_MIN` / `MAX` | `BLOCK_SIZE` | `BLOCK_PAUSE` | Observação |
| :--- | :--- | :--- | :--- | :--- |
| **Conta antiga / pessoal** | `25` / `55` | `10`–`20` | `180`–`300` | Dividir em blocos ao longo do dia |
| **Conta nova (Warmup)** | `40` / `80` | `10` | `420` | Ativar `WARMUP_MODE=true` e `WARMUP_DAILY_LIMIT=25` |

---

## 2. Distribuição Sugerida em Sessões

Para listas de contatos sem vínculo prévio na agenda, divida em sessões espaçadas em horário comercial/social (ex.: entre 09h e 20h):

| Sessão | Janela | Ação entre sessões |
| :--- | :--- | :--- |
| **Bloco 1** | Manhã | Aguardar ~1h30–2h e responder mensagens recebidas |
| **Bloco 2** | Início da tarde | Conferir erros em `logs/` e responder interações |
| **Bloco 3** | Fim da tarde / noite | Revisar relatório final em `logs/` |

---

## 3. Checklist Operacional

### Antes de Iniciar
- [ ] Desativar suspensão automática do computador (bloquear a tela é permitido, suspender não)
- [ ] Garantir conexão de internet estável
- [ ] Validar o formato do arquivo de contatos (ver [modelo-contatos.csv](../modelo-contatos.csv))
- [ ] Fazer **1 envio de teste** para um número próprio antes do lote real

### Durante o Envio
- [ ] Não fechar o terminal onde `npm start` está rodando
- [ ] Responder manualmente quem interagir no celular para fortalecer o histórico bidirecional

### Após Cada Bloco
- [ ] Conferir o CSV gerado automaticamente na pasta `logs/` (`OK` vs `ERRO`)
- [ ] A sessão permanece salva em `.wwebjs_auth` para o próximo bloco sem novo QR Code
