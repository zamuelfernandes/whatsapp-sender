require("dotenv").config();

const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const path = require("path");

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ─── Estado global ────────────────────────────────────────────────────────────
let client = null;
let clientStatus = "disconnected"; // disconnected | qr | ready
let lastQR = null;
let sendingJob = null;

// ─── WhatsApp client ──────────────────────────────────────────────────────────
function initClient() {
  client = new Client({
    authStrategy: new LocalAuth({ dataPath: "./.wwebjs_auth" }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  clientStatus = "connecting";

  client.on("qr", async (qr) => {
    clientStatus = "qr";
    lastQR = await qrcode.toDataURL(qr);
    console.log("[WA] QR gerado");
  });

  client.on("ready", () => {
    clientStatus = "ready";
    lastQR = null;
    console.log("[WA] Conectado!");
  });

  client.on("disconnected", () => {
    clientStatus = "disconnected";
    lastQR = null;
    console.log("[WA] Desconectado.");
  });

  client.initialize();
}

// ─── API: Conexão ─────────────────────────────────────────────────────────────
app.get("/api/status", (req, res) => {
  res.json({ status: clientStatus, qr: lastQR });
});

app.post("/api/connect", (req, res) => {
  if (clientStatus !== "disconnected") {
    return res.json({ ok: true, message: "Já conectado ou conectando." });
  }
  initClient();
  res.json({ ok: true });
});

app.post("/api/disconnect", async (req, res) => {
  if (client) {
    await client.destroy().catch(() => {});
    client = null;
    clientStatus = "disconnected";
  }
  res.json({ ok: true });
});

// ─── API: Envio ───────────────────────────────────────────────────────────────
app.post("/api/send", (req, res) => {
  if (clientStatus !== "ready")
    return res.status(400).json({ error: "WhatsApp não conectado." });
  if (sendingJob?.running)
    return res.status(400).json({ error: "Envio já em andamento." });

  const { contacts, variants } = req.body;
  if (!contacts?.length || !variants?.length)
    return res.status(400).json({ error: "Dados inválidos." });

  sendingJob = {
    total: contacts.length,
    sent: 0,
    errors: 0,
    running: true,
    startedAt: Date.now(),
    log: [],
  };

  res.json({ ok: true });

  // Execução em background
  (async () => {
    const blockSize = parseInt(process.env.BLOCK_SIZE || 50);
    const blockPause = parseInt(process.env.BLOCK_PAUSE || 120) * 1000;
    const warmup = process.env.WARMUP_MODE === "true";
    const dailyLimit = parseInt(process.env.WARMUP_DAILY_LIMIT || 30);

    const list = warmup ? contacts.slice(0, dailyLimit) : contacts;
    sendingJob.total = list.length;

    for (let i = 0; i < list.length; i++) {
      if (!sendingJob.running) break;

      const contact = list[i];
      const number = String(contact.number).replace(/\D/g, "");
      const text = pickVariant(variants, contact.name); // variants vem do req.body

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
});

app.get("/api/progress", (req, res) => {
  if (!sendingJob) return res.json({ active: false });
  const elapsed = (Date.now() - sendingJob.startedAt) / 1000;
  const rate = sendingJob.sent / elapsed || 0;
  const remaining = sendingJob.running
    ? Math.round(
        (sendingJob.total - sendingJob.sent - sendingJob.errors) / (rate || 1),
      )
    : 0;
  res.json({
    active: true,
    ...sendingJob,
    elapsed: Math.round(elapsed),
    eta: remaining,
  });
});

app.post("/api/stop", (req, res) => {
  if (sendingJob) sendingJob.running = false;
  res.json({ ok: true });
});

// ─── Start ────────────────────────────────────────────────────────────────────
// ─── Helpers antiban ──────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function randomDelay() {
  const min = parseFloat(process.env.DELAY_MIN || 10) * 1000;
  const max = parseFloat(process.env.DELAY_MAX || 30) * 1000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function warmupDelay() {
  const min = parseFloat(process.env.WARMUP_DELAY_MIN || 20) * 1000;
  const max = parseFloat(process.env.WARMUP_DELAY_MAX || 40) * 1000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Escolhe aleatoriamente uma das variações de mensagem
function pickVariant(variants, name) {
  const valid = variants.filter((v) => v && v.trim());
  const chosen = valid[Math.floor(Math.random() * valid.length)];
  return chosen.replace(/\{name\}/gi, name.trim());
}

// Reconecta automaticamente se já houver sessão salva
initClient();

app.listen(3000, () => {
  console.log("🚀  Acesse: http://localhost:3000");
});
