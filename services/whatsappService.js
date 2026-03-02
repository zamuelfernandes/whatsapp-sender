const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");

let client = null;
let clientStatus = "disconnected"; // disconnected | qr | ready
let lastQR = null;

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

async function disconnect() {
  if (client) {
    await client.destroy().catch(() => {});
    client = null;
    clientStatus = "disconnected";
  }
}

function getStatus() {
  return { status: clientStatus, qr: lastQR };
}

function getClient() {
  return client;
}

module.exports = {
  initClient,
  disconnect,
  getStatus,
  getClient,
};
