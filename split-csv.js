const fs = require("fs");
const path = require("path");

function splitCSV(inputFile, outputDir, prefix) {
  fs.mkdirSync(outputDir, { recursive: true });
  const lines = fs.readFileSync(inputFile, "utf-8").trim().split(/\r?\n/);
  const header = lines[0];
  const data = lines.slice(1);
  const partSize = Math.ceil(data.length / 3);

  for (let i = 0; i < 3; i++) {
    const chunk = data.slice(i * partSize, (i + 1) * partSize);
    const content = [header, ...chunk].join("\r\n");
    const outFile = path.join(outputDir, prefix + "_" + (i + 1) + ".csv");
    fs.writeFileSync(outFile, content, "utf-8");
    console.log(
      "OK " + path.basename(outFile) + ": " + chunk.length + " contatos",
    );
  }
}

const base = path.join(__dirname, "docs", "csvs");
console.log("--- DAY 1 ---");
splitCSV(path.join(base, "day1.csv"), path.join(base, "day1"), "day1");
console.log("--- DAY 2 ---");
splitCSV(path.join(base, "day2.csv"), path.join(base, "day2"), "day2");
console.log("Divisao concluida!");
