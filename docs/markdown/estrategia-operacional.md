# 📋 Estratégia Operacional de Envio — Eleições Clube Itajubense

## Visão Geral

Envio de **~2500 mensagens** (Spintax) divididas em **2 dias**, com **2 chips pré-pagos** operando em paralelo. Cada chip processa aproximadamente **625 contatos/dia**, fragmentados em **3 sessões** ao longo do dia.

---

## Estrutura dos Arquivos CSV

O CSV mestre de cada dia (~1250 contatos) é dividido em 3 partes iguais:

| Dia             | Sessão Manhã        | Sessão Tarde        | Sessão Noite        |
| --------------- | ------------------- | ------------------- | ------------------- |
| **Dia 1** (Qua) | `day1_1.csv` (~417) | `day1_2.csv` (~417) | `day1_3.csv` (~416) |
| **Dia 2** (Qui) | `day2_1.csv` (~419) | `day2_2.csv` (~419) | `day2_3.csv` (~419) |

> **Nota:** Como cada dia usa 2 chips em paralelo, cada chip processa apenas **~208 contatos por sessão**.

---

## Cronograma de Execução (Por Chip)

Configuração `.env` utilizada:

```
DELAY_MIN=20 | DELAY_MAX=45 | BLOCK_SIZE=40 | BLOCK_PAUSE=180
```

**Tempo estimado por sessão (~208 contatos/chip):** ~2 horas e 8 minutos.

| Sessão       | Horário        | Ação entre sessões                        |
| ------------ | -------------- | ----------------------------------------- |
| 🌅 **Manhã** | 09:00 → ~11:08 | Usar o celular normalmente por ~50 min    |
| ☀️ **Tarde** | 14:00 → ~16:08 | Responder mensagens recebidas por ~50 min |
| 🌙 **Noite** | 19:00 → ~21:08 | Encerrar o dia                            |

---

## Checklist Operacional

### Antes de Iniciar

- [ ] Desativar suspensão/modo dormir do computador
- [ ] Verificar conexão estável com a internet
- [ ] Conectar ambos os chips via QR Code (portas 3000 e 3001)
- [ ] Confirmar que o `.env` está com os parâmetros seguros

### Durante o Envio

- [ ] Manter o WhatsApp Web/App aberto no celular
- [ ] Responder manualmente quem interagir (aumenta Trust Score)
- [ ] Entre as sessões, usar o chip normalmente (mandar msgs, abrir grupos)

### Após Cada Sessão

- [ ] Verificar o log de erros na Dashboard
- [ ] Confirmar contagem de enviados vs total
- [ ] Aguardar o intervalo antes da próxima sessão

---

## Riscos e Mitigações

| Risco             | Mitigação                                                       |
| ----------------- | --------------------------------------------------------------- |
| Banimento de chip | 2 chips dividem a carga; número oficial preservado              |
| Denúncias de spam | Spintax gera mensagens únicas; texto institucional legítimo     |
| Queda de conexão  | Sessão do WhatsApp persiste em `.wwebjs_auth`; basta reconectar |
| PC suspender      | Desativar modo dormir antes de iniciar                          |
