# Estratégias para Envio em Massa (WhatsApp)

Este guia resume as boas práticas para realizar disparos em lotes utilizando automação via navegador (`Puppeteer` no WhatsApp Web) e quando considerar a API oficial da Meta.

---

## Comparativo de Abordagens

### 1. Escalonamento Horizontal (Múltiplas Contas Secundárias)
A abordagem mais segura ao utilizar automação via WhatsApp Web para volumes médios ou altos:

- **Conceito:** não concentrar todos os envios no número principal/oficial de atendimento.
- **Execução:** dividir a lista em arquivos menores e rodar instâncias separadas (em pastas/portas diferentes, configurando `PORT` no `.env`), cada uma conectada a uma conta distinta.
- **Vantagem:** reduz o volume diário por conta e preserva o número principal contra restrições.

### 2. Uso de API Oficial (WhatsApp Business Cloud API)
Indicada para operações recorrentes, alto volume e atendimento corporativo:

- **Como funciona:** utiliza *Templates* pré-aprovados no Meta Business Manager, com cobrança por conversa iniciada pela empresa (categorias *Marketing* ou *Utilidade*).
- **Vantagem:** zero risco de banimento por automação de interface, desde que respeitadas as políticas de *opt-in* e qualidade da Meta.

### 3. Conta Única (Lotes Pequenos e Cadência Conservadora)
Para listas menores ou envios pontuais usando uma única conta já aquecida:

- **Parâmetros recomendados no `.env`:**
  ```env
  DELAY_MIN=25
  DELAY_MAX=55
  BLOCK_SIZE=10
  BLOCK_PAUSE=180
  ```
- **Intervalos entre lotes:** divida o arquivo principal em blocos menores (ex.: 15 a 30 contatos) espaçados por 1 a 2 horas ao longo do dia.

---

## Regras de Ouro Anti-Bloqueio

1. **Particionamento de dados:** evite subir listas extensas em um único disparo contínuo.
2. **Variação real de texto (Spintax):** enviar exatamente a mesma mensagem em sequência ativa filtros anti-spam. Varie saudações, conectores e encerramento com `{opção1|opção2}`.
3. **Links para não-contatos:** destinatários sem o seu número salvo podem visualizar links como não clicáveis até interagirem. Incentivar uma resposta simples (ex.: *"responda um 'oi' para liberar o link"*) melhora a taxa de conversão e eleva o *Trust Score* da conta.
4. **Equilíbrio receptivo (Inbound):** responda manualmente quem interagir entre um bloco e outro para manter histórico bidirecional legítimo.
