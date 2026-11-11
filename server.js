require("dotenv").config();
// Carrega as variáveis adicionais do arquivo .env.sms, se existir
require("dotenv").config({ path: ".env.sms" });

const express = require("express");
const path = require("path");

const whatsappService = require("./services/whatsappService");
const senderService = require("./services/senderService");

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ─── API: Conexão ─────────────────────────────────────────────────────────────
app.get("/api/status", (req, res) => {
  res.json(whatsappService.getStatus());
});

app.post("/api/connect", (req, res) => {
  const status = whatsappService.getStatus().status;
  if (status !== "disconnected") {
    return res.json({ ok: true, message: "Já conectado ou conectando." });
  }
  whatsappService.initClient();
  res.json({ ok: true });
});

app.post("/api/disconnect", async (req, res) => {
  await whatsappService.disconnect();
  res.json({ ok: true });
});

// ─── API: Envio ───────────────────────────────────────────────────────────────
app.post("/api/send", (req, res) => {
  const status = whatsappService.getStatus().status;
  if (status !== "ready")
    return res.status(400).json({ error: "WhatsApp não conectado." });

  if (senderService.isJobRunning())
    return res.status(400).json({ error: "Envio já em andamento." });

  const { contacts, variants } = req.body;
  const validContacts = Array.isArray(contacts)
    ? contacts.filter((c) => c && String(c.number || "").replace(/\D/g, "").length >= 10)
    : [];
  if (!validContacts.length || !Array.isArray(variants) || !variants[0])
    return res.status(400).json({ error: "Dados inválidos." });

  senderService.startJob(validContacts, variants);
  res.json({ ok: true });
});

app.get("/api/progress", (req, res) => {
  res.json(senderService.getProgress());
});

app.post("/api/stop", (req, res) => {
  senderService.stopJob();
  res.json({ ok: true });
});

const smsSenderService = require("./services/smsSenderService");
const adbService = require("./services/adbService");

// ─── API: SMS ─────────────────────────────────────────────────────────────────
app.get("/api/sms/status", async (req, res) => {
  const isConnected = await adbService.checkConnection();
  res.json({ connected: isConnected });
});

app.post("/api/sms/send", async (req, res) => {
  const isConnected = await adbService.checkConnection();
  if (!isConnected)
    return res
      .status(400)
      .json({ error: "Dispositivo Android não conectado via ADB." });

  if (smsSenderService.isJobRunning())
    return res.status(400).json({ error: "Envio de SMS já em andamento." });

  const { contacts, variants } = req.body;
  const validContacts = Array.isArray(contacts)
    ? contacts.filter((c) => c && String(c.number || "").replace(/\D/g, "").length >= 10)
    : [];
  if (!validContacts.length || !Array.isArray(variants) || !variants[0])
    return res.status(400).json({ error: "Dados inválidos." });

  smsSenderService.startJob(validContacts, variants);
  res.json({ ok: true });
});

app.get("/api/sms/progress", (req, res) => {
  res.json(smsSenderService.getProgress());
});

app.post("/api/sms/stop", (req, res) => {
  smsSenderService.stopJob();
  res.json({ ok: true });
});

const BASE_PORT = parseInt(process.env.PORT || "3000", 10) || 3000;

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`🚀 Acesse: http://localhost:${port}`);
    // Reconecta automaticamente se já houver sessão salva
    whatsappService.initClient();
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE" && port < BASE_PORT + 20) {
      console.warn(`⚠️ Porta ${port} em uso, tentando porta ${port + 1}...`);
      startServer(port + 1);
    } else {
      throw err;
    }
  });
}

startServer(BASE_PORT);
