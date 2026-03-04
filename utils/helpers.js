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

// Processa o template de Spintax e insere o nome do contato
function pickVariant(variants, name) {
  if (!variants || !variants.length) return "";
  let text = variants[0];

  // Resolve o Spintax ({opção1|opção2})
  text = text.replace(/\{([^{}]+)\}/g, (match, content) => {
    // Se for {name}, não é spintax, ignoramos para substituir depois
    if (content === "name") return match;
    const parts = content.split("|");
    return parts[Math.floor(Math.random() * parts.length)];
  });

  // Substitui a tag {name} pelo primeiro nome do contato
  const firstName = name.trim().split(" ")[0];
  return text.replace(/\{name\}/gi, firstName);
}

module.exports = {
  sleep,
  randomDelay,
  warmupDelay,
  pickVariant,
};
