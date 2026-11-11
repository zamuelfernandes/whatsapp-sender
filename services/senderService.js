const JobManager = require("./jobManager");
const whatsappService = require("./whatsappService");
const { sleep } = require("../utils/helpers");

async function waitForChatReadyOrInvalid(page, timeoutMs = 35000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const result = await page.evaluate(() => {
      // 1. Verifica se desconectou (voltou para QR)
      if (document.querySelector("[data-ref] canvas")) {
        return { state: "logged_out" };
      }

      // 2. Verifica modal de número inválido / sem WhatsApp
      const dialogs = Array.from(
        document.querySelectorAll('[data-animate-modal-popup="true"], div[role="dialog"]'),
      );
      for (const dlg of dialogs) {
        const txt = (dlg.innerText || "").trim();
        if (/inválido|invalid|não está no whatsapp|not on whatsapp/i.test(txt)) {
          const okBtn = Array.from(dlg.querySelectorAll("button")).find((b) =>
            /^(ok|fechar|close)$/i.test((b.innerText || "").trim()),
          );
          if (okBtn) okBtn.click();
          return { state: "invalid", detail: txt };
        }
      }

      // 3. Verifica caixa de mensagem dentro do rodapé da conversa aberta
      const input =
        document.querySelector('footer div[contenteditable="true"][data-tab]') ||
        document.querySelector('footer div[contenteditable="true"]');
      if (input) {
        const hasSendBtn = Boolean(
          document.querySelector(
            'footer button[aria-label="Enviar"], footer button[aria-label="Send"], footer span[data-icon="send"], footer span[data-icon="wds-ic-send-filled"]',
          ),
        );
        return {
          state: "ready",
          hasText: (input.innerText || "").trim().length > 0,
          hasSendBtn,
        };
      }

      return { state: "loading" };
    });

    if (result.state === "logged_out") {
      throw new Error("Sessão do WhatsApp desconectada.");
    }
    if (result.state === "invalid") {
      throw new Error("Número não encontrado no WhatsApp");
    }
    if (result.state === "ready" && (result.hasText || result.hasSendBtn)) {
      return result;
    }

    await sleep(500);
  }
  throw new Error("Tempo esgotado ao abrir conversa no WhatsApp Web");
}

async function typeMultilineText(page, text) {
  const input =
    (await page.$('footer div[contenteditable="true"][data-tab]')) ||
    (await page.$('footer div[contenteditable="true"]'));
  if (!input) throw new Error("Campo de mensagem não encontrado");

  await input.click();
  const cdp = await page.createCDPSession();
  try {
    const lines = String(text).split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]) {
        await cdp.send("Input.insertText", { text: lines[i] });
      }
      if (i < lines.length - 1) {
        await page.keyboard.down("Shift");
        await page.keyboard.press("Enter");
        await page.keyboard.up("Shift");
      }
    }
  } finally {
    await cdp.detach().catch(() => {});
  }
}

async function clickSendOrPressEnter(page) {
  const clicked = await page.evaluate(() => {
    const btn =
      document.querySelector('footer button[aria-label="Enviar"]') ||
      document.querySelector('footer button[aria-label="Send"]') ||
      document.querySelector('footer span[data-icon="send"]')?.closest("button") ||
      document
        .querySelector('footer span[data-icon="wds-ic-send-filled"]')
        ?.closest("button");
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });

  if (!clicked) {
    const input =
      (await page.$('footer div[contenteditable="true"][data-tab]')) ||
      (await page.$('footer div[contenteditable="true"]'));
    if (!input) throw new Error("Botão enviar não encontrado");
    await input.focus();
    await page.keyboard.press("Enter");
  }
}

async function waitForComposeCleared(page, timeoutMs = 6000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const remaining = await page.evaluate(() => {
      const input =
        document.querySelector('footer div[contenteditable="true"][data-tab]') ||
        document.querySelector('footer div[contenteditable="true"]');
      return input ? (input.innerText || "").trim().length : 0;
    });
    if (remaining === 0) return true;
    await sleep(300);
  }
  return false;
}

// WorkerAdapter converte a interface do Puppeteer para algo que o JobManager entenda
class WhatsAppWorker {
  async sendMessage(number, text) {
    const page = whatsappService.getPage();
    const { status } = whatsappService.getStatus();
    if (!page || status !== "ready") {
      throw new Error("WhatsApp não está conectado.");
    }

    const phone = String(number || "").replace(/\D/g, "");
    if (!phone) throw new Error("Número inválido.");

    whatsappService.setBusy(true);
    try {
      const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });

      await waitForChatReadyOrInvalid(page, 35000);

      // Aguarda até 3s para o parâmetro &text= preencher o campo automaticamente
      let hasText = false;
      const textWaitStart = Date.now();
      while (Date.now() - textWaitStart < 3000) {
        hasText = await page.evaluate(() => {
          const input =
            document.querySelector('footer div[contenteditable="true"][data-tab]') ||
            document.querySelector('footer div[contenteditable="true"]');
          return input ? (input.innerText || "").trim().length > 0 : false;
        });
        if (hasText) break;
        await sleep(250);
      }

      // Se a URL não preencheu o campo por algum motivo, preenche manualmente
      if (!hasText) {
        await typeMultilineText(page, text);
      }

      // Pequena pausa humana antes de clicar em enviar
      await sleep(900 + Math.floor(Math.random() * 700));

      await clickSendOrPressEnter(page);
      let cleared = await waitForComposeCleared(page, 5000);
      if (!cleared) {
        // Segunda tentativa focando no campo e pressionando Enter
        const input =
          (await page.$('footer div[contenteditable="true"][data-tab]')) ||
          (await page.$('footer div[contenteditable="true"]'));
        if (input) {
          await input.focus();
          await page.keyboard.press("Enter");
          cleared = await waitForComposeCleared(page, 4000);
        }
      }

      if (!cleared) {
        throw new Error("Mensagem não foi enviada (campo não limpou).");
      }

      // Aguarda breve instante para garantir envio do frame antes do próximo
      await sleep(1500);
      return true;
    } finally {
      whatsappService.setBusy(false);
    }
  }
}

// Instancia JobManager injetando a lógica do WhatsApp
const senderService = new JobManager(new WhatsAppWorker());

module.exports = senderService;
