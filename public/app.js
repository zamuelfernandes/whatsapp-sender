// ─── CSV parsing (sem dependência) ────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  const nameIdx = headers.indexOf("name");
  const numberIdx = headers.indexOf("number");
  if (nameIdx === -1 || numberIdx === -1)
    throw new Error('CSV precisa ter colunas "name" e "number"');
  return lines
    .slice(1)
    .map((line) => {
      const cols = line.split(",").map((c) => c.trim().replace(/"/g, ""));
      return { name: cols[nameIdx] || "", number: cols[numberIdx] || "" };
    })
    .filter((c) => c.name && c.number);
}

// ─── State ────────────────────────────────────────────────────────────────────
let contacts = [];
let waStatus = "disconnected";
let polling = null;

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

// Pega as variações via Spintax
function getVariants() {
  const text = document.getElementById("message-input").value;
  return text ? [text] : [];
}

// ─── Status polling ───────────────────────────────────────────────────────────
async function fetchStatus() {
  try {
    const r = await fetch("/api/status").then((r) => r.json());
    setStatus(r.status, r.qr);
  } catch {}
}

function setStatus(s, qr) {
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
  await fetch("/api/connect", { method: "POST" });
  if (!polling) polling = setInterval(fetchStatus, 2000);
});

btnDisconnect.addEventListener("click", async () => {
  await fetch("/api/disconnect", { method: "POST" });
  clearInterval(polling);
  polling = null;
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
      csvInfo.style.display = "block";
      csvInfo.innerHTML = `✅ <strong>${contacts.length}</strong> contatos carregados. Primeiro: ${contacts[0].name} — ${contacts[0].number}`;
      updatePreview();
      updateSendBtn();
    } catch (err) {
      csvInfo.style.display = "block";
      csvInfo.textContent = "❌ Erro: " + err.message;
      contacts = [];
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

// Converte markdown do WhatsApp em HTML para preview
function waMarkdown(text) {
  return text
    .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    .replace(/~(.*?)~/g, "<s>$1</s>")
    .replace(/\n/g, "<br>");
}

// Função para simular o spintax no preview
function resolveSpintax(text) {
  return text.replace(/\{([^{}]+)\}/g, (match, content) => {
    // Se for {name}, não é spintax, ignoramos para substituir depois
    if (content === "name") return match;
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

  // Resolve o spintax antes de aplicar os nomes
  let preview = resolveSpintax(variants[0]);
  preview = preview.replace(/\{name\}/gi, contacts[0].name);

  previewBox.style.display = "block";
  previewBox.innerHTML = waMarkdown(preview);
}

// Botões de formatação — envolve o texto selecionado ou insere marcação
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
  btnSend.disabled = !(
    waStatus === "ready" &&
    contacts.length &&
    variants.length >= 1
  );
}

// ─── Send ─────────────────────────────────────────────────────────────────────
btnSend.addEventListener("click", async () => {
  if (!confirm(`Enviar mensagem para ${contacts.length} contatos?`)) return;

  const res = await fetch("/api/send", {
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
  await fetch("/api/stop", { method: "POST" });
  btnStop.disabled = true;
});

// ─── Progress polling ─────────────────────────────────────────────────────────
let logCount = 0;
function startProgressPolling() {
  logCount = 0;
  const iv = setInterval(async () => {
    const d = await fetch("/api/progress").then((r) => r.json());
    if (!d.active) return;

    const pct = Math.round(((d.sent + d.errors) / d.total) * 100);
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
      tr.innerHTML = `<td>${logCount + i + 1}</td><td>${row.name}</td><td>${row.number}</td>
  <td>${row.status}</td><td style="color:#a0aec0;font-size:.78rem">${row.reason || ""}</td>`;
      logBody.appendChild(tr);
    });
    logCount = d.log.length;

    // Auto-scroll log
    const wrap = document.getElementById("log-table-wrap");
    wrap.scrollTop = wrap.scrollHeight;

    if (!d.running) {
      clearInterval(iv);
      btnStop.disabled = true;
      btnSend.disabled = false;
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
polling = setInterval(fetchStatus, 3000);
