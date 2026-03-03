# Estratégias para Envio em Massa (WhatsApp)

Esta documentação descreve as abordagens recomendadas para realizar disparos em massa (ex: 2500 mensagens divididas em múltiplos dias) utilizando o sistema atual baseado em `whatsapp-web.js`, minimizando os riscos de banimento da conta.

## O Cenário Atual

O objetivo é enviar aproximadamente **1250 mensagens por dia** durante janelas de disparo (ex: 2500 mensagens entre Quarta/Quinta e mais 2500 entre Sexta/Sábado).
Este é um volume considerado alto e de grande risco para linhas não oficiais.

Abaixo estão as abordagens recomendadas, da mais segura para a mais arriscada:

### 1. A Abordagem Perfeita: Múltiplas Contas (Escalonamento Horizontal)

A forma mais segura de operar com automação não oficial (`whatsapp-web.js`).

- **Conceito:** Não concentrar todos os envios em um único número. Se um número sofrer bloqueio, a comunicação principal não é perdida.
- **Recomendação:** Utilizar 2 ou 3 chips (números) secundários exclusivamente para o disparo ativo (outbound). O número oficial deve ser mantido para atendimento receptivo (inbound).
- **Como executar:**
  - Clonar a pasta do projeto para rodar múltiplas instâncias (ex: portas 3000, 3001, 3002).
  - Conectar cada instância a um QR Code (número) diferente.
  - Dividir o CSV mestre em partes menores (ex: 2500 contatos ÷ 3 chips = ~833 contatos por chip).
  - **Vantagem:** A carga diária por número cai drasticamente (ex: ~415 envios/dia por chip em uma janela de 2 dias), um volume considerado muito mais natural pelo algoritmo Anti-Spam do WhatsApp.

### 2. A Abordagem Profissional e Definitiva: WhatsApp API Oficial (Cloud API)

A única solução 100% livre de riscos de banimento para grandes volumes.

- **Conceito:** Utilizar a API oficial da Meta (através de provedores como Zenvia, Twilio, ou integração direta com a Cloud API).
- **Como funciona:** Exige a aprovação de _Templates_ de mensagens pré-cadastrados. A Meta cobra um valor (frações de centavos) por cada conversa iniciada pela empresa.
- **Vantagem:** Sem risco de banimento de número, desde que as políticas da Meta sejam respeitadas (comunicação legítima com usuários que optaram por receber mensagens - _opt-in_). Relatórios precisos de entrega e leitura.

### 3. A Abordagem Kamikaze: Usando 1 Único Número

Caso seja estritamente necessário utilizar apenas um número não-oficial para o disparo dos 1250 envios diários. Requer operação contínua e extremo cuidado.

- **Conceito:** Espremer o máximo de envios distribuídos ao longo do máximo de horas possíveis no dia (ex: 10 a 14 horas de operação contínua).
- **Parâmetros recomendados (`.env`):**
  ```env
  DELAY_MIN=20
  DELAY_MAX=45
  BLOCK_SIZE=40
  BLOCK_PAUSE=180
  ```
- **Matemática de Risco (1250 Envios/Dia):**
  - Média de delay: ~32.5s -> Totalizando ~11,3 horas intermitentes de envios.
  - Pausas de bloco: 3 minutos a cada 40 envios -> Aproximadamente 31 pausas, totalizando ~1,5 horas paradas.
  - **Operação:** O sistema precisa rodar ativamente (ex: das 08h às 21h) para finalizar a cota diária sem chamar tanta atenção por "velocidade excessiva".

---

## Dicas Ouro Anti-Banimento (Validas para qualquer abordagem não-oficial)

1. **Particionamento de Dados:** Nunca suba o CSV de 2500 linhas de uma vez. Crie arquivos menores referenciando lotes diários (ex: `lote_quarta.csv`, `lote_quinta.csv`).
2. **Alta Variância de Texto (Spintax):** Modificar rigorosamente o texto. Enviar a mesma `String` exata centenas de vezes é o gatilho principal para detecção por IA de provedores. Utilize _Spintax_ para gerar variações na saudação, corpo e despedida do texto.
3. **Equilíbrio Receptivo (Inbound):** O algoritmo do WhatsApp avalia a proporção de mensagens enviadas _vs_ recebidas. Durante os disparos, mantenha o WhatsApp Web/App aberto e responda manualmente às pessoas que interagirem com o robô. Uma alta taxa de resposta orgânica aumenta exponencialmente a "saúde" ("Trust Score") do número afetado.
