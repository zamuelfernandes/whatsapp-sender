const path = require("path");
const puppeteer = require("puppeteer");

let browser = null;
let page = null;
let clientStatus = "disconnected"; // disconnected | connecting | qr | ready
let lastQR = null;
let watcherTimer = null;
let watcherBusy = false;
let jobBusy = false;

const SESSION_DIR = path.join(__dirname, "..", ".wwebjs_auth", "session");

async function inspectPageState() {
  if (!page || page.isClosed() || watcherBusy || jobBusy) return;
  watcherBusy = true;
  try {
    const state = await page.evaluate(() => {
      // Verifica modal "Usar aqui" (quando outra aba abriu o WhatsApp Web)
      const buttons = Array.from(document.querySelectorAll("button"));
      const useHereBtn = buttons.find((b) =>
        /^(usar aqui|use here)$/i.test((b.innerText || "").trim()),
      );
      if (useHereBtn) {
        useHereBtn.click();
        return { status: "connecting" };
      }

      // Verifica se já está logado
      const isReady = Boolean(
        document.querySelector(
          '#pane-side, [data-testid="chat-list"], [data-icon="new-chat-outline"], div[contenteditable="true"][data-tab="3"]',
        ),
      );
      if (isReady) {
        return { status: "ready" };
      }

      // Verifica se o QR Code está na tela
      const qrCanvas =
        document.querySelector("[data-ref] canvas") ||
        Array.from(document.querySelectorAll("canvas")).find(
          (c) => c.width >= 150 && c.height >= 150,
        );

      if (qrCanvas) {
        try {
          const pad = 16;
          const out = document.createElement("canvas");
          out.width = qrCanvas.width + pad * 2;
          out.height = qrCanvas.height + pad * 2;
          const ctx = out.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, out.width, out.height);
          ctx.drawImage(qrCanvas, pad, pad);
          return { status: "qr", qr: out.toDataURL("image/png") };
        } catch {
          return { status: "connecting" };
        }
      }

      return { status: "connecting" };
    });

    if (state.status === "ready") {
      if (clientStatus !== "ready") console.log("[WA] Conectado!");
      clientStatus = "ready";
      lastQR = null;
    } else if (state.status === "qr" && state.qr) {
      if (clientStatus !== "qr") console.log("[WA] QR gerado");
      clientStatus = "qr";
      lastQR = state.qr;
    } else if (clientStatus !== "ready") {
      clientStatus = "connecting";
    }
  } catch {
    // Página navegando ou sendo fechada; ignora ciclo
  } finally {
    watcherBusy = false;
  }
}

function initClient() {
  if (browser && clientStatus !== "disconnected") return;

  clientStatus = "connecting";
  lastQR = null;

  (async () => {
    try {
      const headless = process.env.WA_HEADLESS !== "false";
      browser = await puppeteer.launch({
        headless,
        userDataDir: SESSION_DIR,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
      });

      browser.on("disconnected", () => {
        stopWatcher();
        browser = null;
        page = null;
        clientStatus = "disconnected";
        lastQR = null;
        console.log("[WA] Desconectado.");
      });

      const pages = await browser.pages();
      page = pages[0] || (await browser.newPage());
      await page.setViewport({ width: 1280, height: 800 });
      await page.setUserAgent(
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      );

      // Aceita diálogos beforeunload automaticamente ao navegar entre contatos
      page.on("dialog", (dialog) => {
        dialog.accept().catch(() => {});
      });

      await page.goto("https://web.whatsapp.com/", {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });

      startWatcher();
      await inspectPageState();
    } catch (err) {
      console.error("[WA] Erro ao inicializar:", err.message);
      await disconnect();
    }
  })();
}

function startWatcher() {
  stopWatcher();
  watcherTimer = setInterval(inspectPageState, 1500);
}

function stopWatcher() {
  if (watcherTimer) {
    clearInterval(watcherTimer);
    watcherTimer = null;
  }
}

async function disconnect() {
  stopWatcher();
  jobBusy = false;
  watcherBusy = false;
  if (browser) {
    const b = browser;
    browser = null;
    page = null;
    await b.close().catch(() => {});
  }
  clientStatus = "disconnected";
  lastQR = null;
}

function getStatus() {
  return { status: clientStatus, qr: lastQR };
}

function getPage() {
  return page;
}

function setBusy(busy) {
  jobBusy = Boolean(busy);
}

// Garante encerramento limpo do Chrome ao fechar o processo Node
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, async () => {
    await disconnect();
    process.exit(0);
  });
}

module.exports = {
  initClient,
  disconnect,
  getStatus,
  getPage,
  setBusy,
};
