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

module.exports = {
  sleep,
  randomDelay,
  warmupDelay,
  pickVariant,
};
