const fs = require("fs");
const path = require("path");
const { sleep, pickVariant } = require("../utils/helpers");

function csvEscape(val) {
  const s = String(val ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

class JobManager {
  constructor(workerService, configPrefix = "") {
    this.sendingJob = null;
    this.workerService = workerService; // Injeta o serviço que fará o envio real (Zap ou SMS)
    this.configPrefix = configPrefix; // Ex: "" para Zap, "SMS_" para SMS
  }

  getProgress() {
    if (!this.sendingJob) return { active: false };
    const elapsed = (Date.now() - this.sendingJob.startedAt) / 1000;
    const rate = this.sendingJob.sent / elapsed || 0;
    const remaining = this.sendingJob.running
      ? Math.round(
          (this.sendingJob.total -
            this.sendingJob.sent -
            this.sendingJob.errors) /
            (rate || 1),
        )
      : 0;
    return {
      active: true,
      ...this.sendingJob,
      elapsed: Math.round(elapsed),
      eta: remaining,
    };
  }

  stopJob() {
    if (this.sendingJob) this.sendingJob.running = false;
  }

  isJobRunning() {
    return this.sendingJob?.running || false;
  }

  // Prepara e inicia o Loop Principal
  startJob(contacts, variants) {
    const logsDir = path.join(__dirname, "..", "logs");
    fs.mkdirSync(logsDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const channel = this.configPrefix ? "sms" : "whatsapp";
    const logFile = path.join(logsDir, `envio-${channel}-${stamp}.csv`);
    fs.writeFileSync(logFile, "timestamp,name,number,status,reason\n", "utf-8");

    this.sendingJob = {
      total: contacts.length,
      sent: 0,
      errors: 0,
      running: true,
      startedAt: Date.now(),
      logFile,
      log: [],
    };

    (async () => {
      // Lê as vars de ambiente com o prefixo injetado (Vazio para Zap, "SMS_" para SMS)
      const blockSize = parseInt(
        process.env[`${this.configPrefix}BLOCK_SIZE`] || 50,
      );
      const blockPause =
        parseInt(process.env[`${this.configPrefix}BLOCK_PAUSE`] || 120) * 1000;
      const warmup = process.env[`${this.configPrefix}WARMUP_MODE`] === "true";
      const dailyLimit = parseInt(
        process.env[`${this.configPrefix}WARMUP_DAILY_LIMIT`] || 30,
      );

      const delayMin = parseInt(
        process.env[`${this.configPrefix}DELAY_MIN`] || 10,
      );
      const delayMax = parseInt(
        process.env[`${this.configPrefix}DELAY_MAX`] || 25,
      );
      const warmupDelayMin = parseInt(
        process.env[`${this.configPrefix}WARMUP_DELAY_MIN`] || 25,
      );
      const warmupDelayMax = parseInt(
        process.env[`${this.configPrefix}WARMUP_DELAY_MAX`] || 45,
      );

      const list = warmup ? contacts.slice(0, dailyLimit) : contacts;
      this.sendingJob.total = list.length;

      for (let i = 0; i < list.length; i++) {
        if (!this.sendingJob.running) break;

        const contact = list[i];
        const displayName = (contact.name || "").trim() || "—";
        const number = String(contact.number || "").replace(/\D/g, "");
        const text = pickVariant(variants, contact.name);

        try {
          // Delega o envio real para o WorkerService (WhatsApp ou ADB SMS)
          await this.workerService.sendMessage(number, text);

          this.sendingJob.sent++;
          this.sendingJob.log.push({
            name: displayName,
            number,
            status: "✅",
          });
          fs.appendFileSync(
            logFile,
            `${csvEscape(new Date().toISOString())},${csvEscape(displayName)},${csvEscape(number)},OK,""\n`,
            "utf-8",
          );
        } catch (e) {
          this.sendingJob.errors++;
          this.sendingJob.log.push({
            name: displayName,
            number,
            status: "❌",
            reason: e.message,
          });
          fs.appendFileSync(
            logFile,
            `${csvEscape(new Date().toISOString())},${csvEscape(displayName)},${csvEscape(number)},ERRO,${csvEscape(e.message)}\n`,
            "utf-8",
          );
        }

        // Não espera após o último contato ou se o job foi interrompido
        if (i + 1 >= list.length || !this.sendingJob.running) break;

        // Pausa de bloco a cada N mensagens
        const isBlockEnd = (i + 1) % blockSize === 0;
        if (isBlockEnd) {
          this.sendingJob.log.push({
            name: "⏸ Pausa de bloco",
            number: `${blockPause / 1000}s`,
            status: "⏳",
            reason: `Aguardando para retomar...`,
          });
          await sleep(blockPause);
        } else {
          // Atraso normal entre cada envio
          const min = warmup ? warmupDelayMin : delayMin;
          const max = warmup ? warmupDelayMax : delayMax;
          const delayTime =
            Math.floor(Math.random() * (max - min + 1) + min) * 1000;
          await sleep(delayTime);
        }
      }

      this.sendingJob.running = false;
    })();
  }
}

module.exports = JobManager;
