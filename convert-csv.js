/**
 * Converte os CSVs originais do Clube (nome, telefone, tel_contato)
 * para o formato esperado pelo WhatsApp Sender (name, number).
 *
 * Regras:
 * - Prioriza "tel_contato" (celular) sobre "telefone" (fixo)
 * - Remove parênteses, hífens, espaços e caracteres inválidos
 * - Adiciona código do país 55 se ausente
 * - Ignora linhas sem nenhum telefone válido
 * - Formata o nome: "JOÃO SILVA" → "João Silva"
 */

const fs = require("fs");
const path = require("path");

const CSV_DIR = path.join(__dirname, "docs", "csvs");

function cleanPhone(raw) {
  if (!raw) return "";
  // Remove tudo que não for dígito
  let num = raw.replace(/[^\d]/g, "");
  // Remove zeros à esquerda excedentes de DDD longo (0xx, 0XX)
  if (num.startsWith("0") && num.length > 10) {
    num = num.replace(/^0+/, "");
  }
  // Números muito curtos ou claramente inválidos (ex: "0000-0000")
  if (num.length < 10) return "";
  // Se não começa com 55, adiciona
  if (!num.startsWith("55")) {
    num = "55" + num;
  }
  // Remove DDDs inválidos (código de país duplicado, etc)
  if (num.length > 13) return "";
  return num;
}

function titleCase(str) {
  const exceptions = ["de", "da", "do", "dos", "das", "e", "du"];
  return str
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word, i) => {
      if (i > 0 && exceptions.includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function isMobile(num) {
  // Números brasileiros de celular: 55 + DDD(2) + 9XXXX-XXXX
  // Total: 13 dígitos, o 5º dígito é 9
  if (num.length === 13 && num[4] === "9") return true;
  // Formato antigo sem o 9: 12 dígitos
  if (num.length === 12) return true;
  return false;
}

function convertFile(inputFile, outputFile) {
  const raw = fs.readFileSync(inputFile, "utf-8");
  const lines = raw.trim().split(/\r?\n/);
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());

  const nameIdx = header.indexOf("nome");
  const phoneIdx = header.indexOf("telefone");
  const contactIdx = header.indexOf("tel_contato");

  const rows = ["name,number"];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const name = cols[nameIdx] || "";
    const phone1 = cleanPhone(cols[phoneIdx]);
    const phone2 = cleanPhone(cols[contactIdx]);

    // Prioriza celular: se tel_contato é celular, usa ele
    let chosen = "";
    if (phone2 && isMobile(phone2)) {
      chosen = phone2;
    } else if (phone1 && isMobile(phone1)) {
      chosen = phone1;
    } else if (phone2) {
      chosen = phone2;
    } else if (phone1) {
      chosen = phone1;
    }

    if (!chosen || !name) {
      skipped++;
      continue;
    }

    rows.push(`${titleCase(name)},${chosen}`);
  }

  fs.writeFileSync(outputFile, rows.join("\r\n"), "utf-8");
  console.log(
    `✅ ${path.basename(outputFile)}: ${rows.length - 1} contatos exportados (${skipped} ignorados)`,
  );
}

// Converte ambos os dias
convertFile(
  path.join(CSV_DIR, "csv_clube - day1.csv"),
  path.join(CSV_DIR, "day1.csv"),
);
convertFile(
  path.join(CSV_DIR, "csv_clube - day2.csv"),
  path.join(CSV_DIR, "day2.csv"),
);

console.log("\n🎯 Conversão concluída! Arquivos gerados em docs/csvs/");
