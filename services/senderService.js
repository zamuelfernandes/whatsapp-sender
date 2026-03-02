const {
  sleep,
  randomDelay,
  warmupDelay,
  pickVariant,
} = require("../utils/helpers");
const whatsappService = require("./whatsappService");

let sendingJob = null;

function getProgress() {
  if (!sendingJob) return { active: false };
  const elapsed = (Date.now() - sendingJob.startedAt) / 1000;
  const rate = sendingJob.sent / elapsed || 0;
  const remaining = sendingJob.running
    ? Math.round(
        (sendingJob.total - sendingJob.sent - sendingJob.errors) / (rate || 1),
      )
    : 0;
  return {
    active: true,
    ...sendingJob,
    elapsed: Math.round(elapsed),
    eta: remaining,
  };
}

function stopJob() {
  if (sendingJob) sendingJob.running = false;
}

function isJobRunning() {
  return sendingJob?.running || false;
}

function startJob(contacts, variants) {
  sendingJob = {
    total: contacts.length,
    sent: 0,
    errors: 0,
    running: true,
    startedAt: Date.now(),
    log: [],
  };

  (async () => {
    const blockSize = parseInt(process.env.BLOCK_SIZE || 50);
    const blockPause = parseInt(process.env.BLOCK_PAUSE || 120) * 1000;
    const warmup = process.env.WARMUP_MODE === "true";
    const dailyLimit = parseInt(process.env.WARMUP_DAILY_LIMIT || 30);

    const list = warmup ? contacts.slice(0, dailyLimit) : contacts;
    sendingJob.total = list.length;

    const client = whatsappService.getClient();

    for (let i = 0; i < list.length; i++) {
      if (!sendingJob.running) break;

      const contact = list[i];
      const number = String(contact.number).replace(/\D/g, "");
      const text = pickVariant(variants, contact.name);

      try {
        const resolvedId = await client.getNumberId(number);
        if (!resolvedId) throw new Error("Número não encontrado no WhatsApp");
        await client.sendMessage(resolvedId._serialized, text);
        sendingJob.sent++;
        sendingJob.log.push({ name: contact.name, number, status: "✅" });
      } catch (e) {
        sendingJob.errors++;
        sendingJob.log.push({
          name: contact.name,
          number,
          status: "❌",
          reason: e.message,
        });
      }

      // Pausa de bloco a cada N mensagens (exceto no último)
      const isBlockEnd = (i + 1) % blockSize === 0 && i + 1 < list.length;
      if (isBlockEnd) {
        sendingJob.log.push({
          name: "⏸ Pausa de bloco",
          number: `${blockPause / 1000}s`,
          status: "⏳",
          reason: `Aguardando para retomar...`,
        });
        await sleep(blockPause);
      } else {
        await sleep(warmup ? warmupDelay() : randomDelay());
      }
    }

    sendingJob.running = false;
  })();
}

module.exports = {
  startJob,
  stopJob,
  getProgress,
  isJobRunning,
};
