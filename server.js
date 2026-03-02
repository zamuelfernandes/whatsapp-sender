require("dotenv").config();

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
  if (!contacts?.length || !variants?.length)
    return res.status(400).json({ error: "Dados inválidos." });

  senderService.startJob(contacts, variants);
  res.json({ ok: true });
});

app.get("/api/progress", (req, res) => {
  res.json(senderService.getProgress());
});

app.post("/api/stop", (req, res) => {
  senderService.stopJob();
  res.json({ ok: true });
});

// Reconecta automaticamente se já houver sessão salva
whatsappService.initClient();

app.listen(3000, () => {
  console.log("🚀 Acesse: http://localhost:3000");
});
