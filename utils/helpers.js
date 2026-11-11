function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Processa o template de Spintax e insere o nome do contato (opcional)
function pickVariant(variants, name) {
  if (!variants || !variants.length) return "";
  let text = variants[0];

  // Resolve o Spintax ({opção1|opção2})
  text = text.replace(/\{([^{}]+)\}/g, (match, content) => {
    // Se for {name}, não é spintax, ignoramos para substituir depois
    if (content.toLowerCase() === "name") return match;
    const parts = content.split("|");
    return parts[Math.floor(Math.random() * parts.length)];
  });

  if (!/\{name\}/i.test(text)) {
    return text;
  }

  // Substitui a tag {name} pelo primeiro nome do contato, se existir
  const firstName = (name || "").trim().split(/\s+/)[0] || "";
  if (firstName) {
    return text.replace(/\{name\}/gi, firstName);
  }

  return text
    .replace(/^[ \t]*(?:\*\{name\}\*|_\{name\}_|~\{name\}~|\{name\})(?:,[ \t]*|[ \t]*)/gim, "")
    .replace(/[ \t]*(?:\*\{name\}\*|_\{name\}_|~\{name\}~|\{name\})/gi, "")
    .replace(/,[ \t]*,/g, ",")
    .replace(/,[ \t]*([!?.])/g, "$1")
    .replace(/^[ \t]*,[ \t]*/gm, "");
}

module.exports = {
  sleep,
  pickVariant,
};
