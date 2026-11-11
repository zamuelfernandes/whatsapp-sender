// ─── CSV / TXT parsing (sem dependência) ──────────────────────────────────────
function cleanPhoneNumber(raw) {
  let digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0") && digits.length > 10) {
    digits = digits.replace(/^0+/, "");
  }
  if (digits.length >= 10 && digits.length <= 11 && !digits.startsWith("55")) {
    digits = "55" + digits;
  }
  return digits;
}

function parseCSV(text) {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) throw new Error("Arquivo vazio.");

  const firstLine = lines[0];
  const delimiter = firstLine.includes(";") ? ";" : ",";
  const headers = firstLine
    .split(delimiter)
    .map((h) => h.trim().toLowerCase().replace(/"/g, ""));

  const nameIdx = headers.findIndex((h) =>
    ["name", "nome", "contato"].includes(h),
  );
  const numberIdx = headers.findIndex((h) =>
    ["number", "numero", "número", "telefone", "celular", "whatsapp", "phone"].includes(h),
  );

  let parsed = [];
  if (numberIdx !== -1) {
    parsed = lines
      .slice(1)
      .map((line) => {
        const cols = line.split(delimiter).map((c) => c.trim().replace(/"/g, ""));
        return {
          name: nameIdx !== -1 ? cols[nameIdx] || "" : "",
          number: cleanPhoneNumber(cols[numberIdx]),
        };
      })
      .filter((c) => c.number.length >= 10);
  } else if (!/[a-zA-Z]/.test(firstLine) && cleanPhoneNumber(firstLine).length >= 10) {
    // Lista simples sem cabeçalho (1 número por linha, ex: .txt)
    parsed = lines
      .map((line) => ({
        name: "",
        number: cleanPhoneNumber(line),
      }))
      .filter((c) => c.number.length >= 10);
  } else {
    throw new Error(
      'Arquivo precisa ter coluna "number" (ou "telefone") ou ser uma lista com 1 número por linha.',
    );
  }

  // Remove números duplicados mantendo a primeira ocorrência
  const seen = new Set();
  return parsed.filter((c) => {
    if (seen.has(c.number)) return false;
    seen.add(c.number);
    return true;
  });
}

// ─── State ────────────────────────────────────────────────────────────────────
let contacts = [];
let waStatus = "disconnected";
let smsStatus = "disconnected";
let polling = null;
let currentMode = "whatsapp"; // whatsapp ou sms

// ─── Elements ─────────────────────────────────────────────────────────────────
const statusBar = document.getElementById("status-bar");
const qrContainer = document.getElementById("qr-container");
const qrImg = document.getElementById("qr-img");
const btnConnect = document.getElementById("btn-connect");
const btnDisconnect = document.getElementById("btn-disconnect");
const csvFile = document.getElementById("csv-file");
const csvInfo = document.getElementById("csv-info");
const previewBox = document.getElementById("preview-box");
const btnSend = document.getElementById("btn-send");
const btnStop = document.getElementById("btn-stop");
const progressSec = document.getElementById("progress-section");
const logBody = document.getElementById("log-body");
const connectionTitle = document.getElementById("connection-title");

// Pega as variações via Spintax
function getVariants() {
  const text = document.getElementById("message-input").value;
  return text ? [text] : [];
}

// ─── Aba Switching ─────────────────────────────────────────────────────────────
window.switchMode = function (mode) {
  currentMode = mode;
  document
    .getElementById("tab-whatsapp")
    .classList.toggle("active", mode === "whatsapp");
  document.getElementById("tab-sms").classList.toggle("active", mode === "sms");

  if (mode === "whatsapp") {
    connectionTitle.textContent = "📱 Conexão WhatsApp";
    document.getElementById("connection-actions").style.display = "flex";
    fetchStatus();
  } else {
    connectionTitle.textContent = "👾 Conexão Android USB (ADB)";
    qrContainer.style.display = "none";
    document.getElementById("connection-actions").style.display = "none"; // ADB não tem botão conectar
    fetchSmsStatus();
  }
  updateSendBtn();
};

// ─── Status polling ───────────────────────────────────────────────────────────
async function fetchStatus() {
  if (currentMode !== "whatsapp") return;
  try {
    const r = await fetch("/api/status").then((r) => r.json());
    setStatus(r.status, r.qr);
  } catch {}
}

async function fetchSmsStatus() {
  if (currentMode !== "sms") return;
  try {
    const r = await fetch("/api/sms/status").then((r) => r.json());
    smsStatus = r.connected ? "ready" : "disconnected";

    if (r.connected) {
      statusBar.className = "status-ready";
      statusBar.textContent = "🟢 Celular pareado no ADB (USB)";
    } else {
      statusBar.className = "status-disconnected";
      statusBar.textContent = "🔴 Celular Inacessível. Depuração USB ativa?";
    }
    updateSendBtn();
  } catch {}
}

function setStatus(s, qr) {
  if (currentMode !== "whatsapp") return;
  waStatus = s;
  statusBar.className = "status-" + s;
  if (s === "disconnected") {
    statusBar.textContent = "⚪ Desconectado";
    qrContainer.style.display = "none";
    btnConnect.disabled = false;
    btnDisconnect.disabled = true;
  } else if (s === "connecting") {
    statusBar.innerHTML = `🔵 Conectando... <span class="spinner"></span>`;
    qrContainer.style.display = "none";
    btnConnect.disabled = true;
    btnDisconnect.disabled = false;
  } else if (s === "qr") {
    statusBar.textContent = "🟡 Aguardando leitura do QR Code...";
    if (qr) {
      qrImg.src = qr;
      qrContainer.style.display = "block";
    }
    btnConnect.disabled = true;
    btnDisconnect.disabled = false;
  } else if (s === "ready") {
    statusBar.textContent = "🟢 WhatsApp conectado!";
    qrContainer.style.display = "none";
    btnConnect.disabled = true;
    btnDisconnect.disabled = false;
  }
  updateSendBtn();
}

// ─── Connect / Disconnect ─────────────────────────────────────────────────────
btnConnect.addEventListener("click", async () => {
  if (currentMode !== "whatsapp") return;
  await fetch("/api/connect", { method: "POST" });
});

btnDisconnect.addEventListener("click", async () => {
  if (currentMode !== "whatsapp") return;
  await fetch("/api/disconnect", { method: "POST" });
  setStatus("disconnected");
});

// ─── CSV ──────────────────────────────────────────────────────────────────────
csvFile.addEventListener("change", () => {
  const file = csvFile.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      contacts = parseCSV(e.target.result);
      if (!contacts.length) {
        throw new Error("Nenhum número válido encontrado no arquivo.");
      }
      csvInfo.style.display = "block";
      const firstLabel = contacts[0].name
        ? `${contacts[0].name} — ${contacts[0].number}`
        : contacts[0].number;
      csvInfo.innerHTML = `✅ <strong>${contacts.length}</strong> contatos carregados. Primeiro: ${escapeHtml(firstLabel)}`;
      updatePreview();
      updateSendBtn();
    } catch (err) {
      csvInfo.style.display = "block";
      csvInfo.textContent = "❌ Erro: " + err.message;
      contacts = [];
      updatePreview();
      updateSendBtn();
    }
  };
  reader.readAsText(file);
});

// ─── Preview ──────────────────────────────────────────────────────────────────
document.querySelectorAll(".variant-input").forEach((t) => {
  t.addEventListener("input", updatePreview);
  t.addEventListener("input", updateSendBtn);
});

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Converte markdown do WhatsApp em HTML seguro para preview
function waMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    .replace(/~(.*?)~/g, "<s>$1</s>")
    .replace(/\n/g, "<br>");
}

// Função para simular o spintax no preview
function resolveSpintax(text) {
  return text.replace(/\{([^{}]+)\}/g, (match, content) => {
    if (content.toLowerCase() === "name") return match;
    const parts = content.split("|");
    return parts[Math.floor(Math.random() * parts.length)];
  });
}

function updatePreview() {
  const variants = getVariants();
  if (!contacts.length || !variants.length) {
    previewBox.style.display = "none";
    return;
  }

  let preview = resolveSpintax(variants[0]);
  if (/\{name\}/i.test(preview)) {
    const firstName = (contacts[0].name || "").trim().split(/\s+/)[0] || "";
    if (firstName) {
      preview = preview.replace(/\{name\}/gi, firstName);
    } else {
      preview = preview
        .replace(/^[ \t]*(?:\*\{name\}\*|_\{name\}_|~\{name\}~|\{name\})(?:,[ \t]*|[ \t]*)/gim, "")
        .replace(/[ \t]*(?:\*\{name\}\*|_\{name\}_|~\{name\}~|\{name\})/gi, "")
        .replace(/,[ \t]*,/g, ",")
        .replace(/,[ \t]*([!?.])/g, "$1")
        .replace(/^[ \t]*,[ \t]*/gm, "");
    }
  }

  previewBox.style.display = "block";
  previewBox.innerHTML =
    currentMode === "whatsapp"
      ? waMarkdown(preview)
      : escapeHtml(preview).replace(/\n/g, "<br>");
}

// Botões de formatação
window.fmt = function fmt(index, type) {
  const ta = document.getElementById("message-input");
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const sel = ta.value.substring(start, end);

  const wrapMap = { bold: "*", italic: "_", strike: "~" };

  let insert;
  if (type === "name") {
    insert = "{name}";
  } else if (type === "spin") {
    insert = sel ? `{${sel}|opção2}` : `{opção1|opção2}`;
  } else {
    const char = wrapMap[type];
    insert = sel ? `${char}${sel}${char}` : `${char}texto${char}`;
  }

  ta.value = ta.value.substring(0, start) + insert + ta.value.substring(end);
  ta.focus();
  ta.selectionStart = ta.selectionEnd = start + insert.length;
  updatePreview();
  updateSendBtn();
};

// ─── Send button state ────────────────────────────────────────────────────────
function updateSendBtn() {
  const variants = getVariants();
  const isReady =
    currentMode === "whatsapp" ? waStatus === "ready" : smsStatus === "ready";

  btnSend.disabled = !(isReady && contacts.length && variants.length >= 1);
}

// ─── Send ─────────────────────────────────────────────────────────────────────
btnSend.addEventListener("click", async () => {
  if (
    !confirm(
      `Enviar mensagem via ${currentMode.toUpperCase()} para ${contacts.length} contatos?`,
    )
  )
    return;

  const endpoint = currentMode === "whatsapp" ? "/api/send" : "/api/sms/send";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contacts,
      variants: getVariants(),
    }),
  }).then((r) => r.json());

  if (!res.ok) {
    alert("Erro: " + res.error);
    return;
  }

  btnSend.disabled = true;
  btnStop.disabled = false;
  progressSec.style.display = "block";
  logBody.innerHTML = "";
  startProgressPolling();
});

btnStop.addEventListener("click", async () => {
  const endpoint = currentMode === "whatsapp" ? "/api/stop" : "/api/sms/stop";
  await fetch(endpoint, { method: "POST" });
  btnStop.disabled = true;
});

// ─── Progress polling ─────────────────────────────────────────────────────────
let logCount = 0;
function startProgressPolling() {
  logCount = 0;
  const iv = setInterval(async () => {
    const endpoint =
      currentMode === "whatsapp" ? "/api/progress" : "/api/sms/progress";
    const d = await fetch(endpoint).then((r) => r.json());
    if (!d.active) return;

    const pct = Math.round(((d.sent + d.errors) / (d.total || 1)) * 100);
    document.getElementById("progress-fill").style.width = pct + "%";
    document.getElementById("p-total").textContent = d.total;
    document.getElementById("p-sent").textContent = d.sent;
    document.getElementById("p-errors").textContent = d.errors;
    document.getElementById("p-eta").textContent = d.running
      ? fmtTime(d.eta)
      : "Concluído";
    document.getElementById("p-elapsed").textContent = fmtTime(d.elapsed);

    // Append new log rows
    const newRows = d.log.slice(logCount);
    newRows.forEach((row, i) => {
      const tr = document.createElement("tr");
      const cells = [
        logCount + i + 1,
        row.name || "—",
        row.number,
        row.status,
        row.reason || "",
      ];
      cells.forEach((val, idx) => {
        const td = document.createElement("td");
        td.textContent = String(val);
        if (idx === 4) {
          td.style.color = "#a0aec0";
          td.style.fontSize = ".78rem";
        }
        tr.appendChild(td);
      });
      logBody.appendChild(tr);
    });
    logCount = d.log.length;

    // Auto-scroll log
    const wrap = document.getElementById("log-table-wrap");
    wrap.scrollTop = wrap.scrollHeight;

    if (!d.running) {
      clearInterval(iv);
      btnStop.disabled = true;
      updateSendBtn();
    }
  }, 1500);
}

function fmtTime(s) {
  if (!s || s < 0) return "--";
  const m = Math.floor(s / 60),
    sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

// ─── Init ─────────────────────────────────────────────────────────────────────
fetchStatus();
polling = setInterval(() => {
  if (currentMode === "whatsapp") fetchStatus();
  else fetchSmsStatus();
}, 3000);
