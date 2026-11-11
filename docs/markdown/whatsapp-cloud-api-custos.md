# WhatsApp Cloud API (Oficial) vs Automação via Navegador

Resumo técnico para ajudar na escolha entre a **API oficial da Meta** e o envio automatizado pelo **WhatsApp Web**.

---

## Pontos Principais da API Oficial (Cloud API)

1. **Modelo de cobrança:** a Meta cobra por conversas iniciadas pela empresa (*Outbound*), classificadas principalmente em **Marketing** (avisos gerais, promoções, convites) ou **Utilidade** (confirmações, cobranças, pós-venda).
2. **Conversas gratuitas:** conversas iniciadas pelo próprio usuário (*Serviço*) possuem franquia gratuita mensal conforme a tabela vigente da Meta.
3. **Templates obrigatórios:** para iniciar contato ativo na API oficial não é permitido usar Spintax livre — é obrigatório cadastrar e aguardar aprovação de **Templates** com variáveis posicionais (ex.: `{{1}}`). Texto livre só é liberado na janela de 24h após o usuário responder.

---

## Quando Usar Cada Abordagem

| Critério | Automação Web (este projeto) | WhatsApp Cloud API (Meta) |
| :--- | :--- | :--- |
| **Custo de disparo** | Sem taxa por mensagem | Cobrança por conversa iniciada |
| **Flexibilidade de texto** | Spintax livre e imediato | Templates pré-aprovados |
| **Risco de bloqueio** | Exige cadência, lotes e interação | Baixo (seguindo políticas da Meta) |
| **Escala indicada** | Lotes pequenos e médios | Operações contínuas e alto volume |
