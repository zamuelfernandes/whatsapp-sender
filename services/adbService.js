const { execFile } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { sleep } = require("../utils/helpers");

class AdbService {
  constructor() {
    this.isConnected = false;
  }

  // Executa comando adb com argumentos seguros sem interpolação em shell
  executeAdb(args) {
    return new Promise((resolve, reject) => {
      execFile("adb", args, (error, stdout) => {
        if (error) {
          console.error(`Erro no comando adb ${args.join(" ")}`, error);
          return reject(error);
        }
        resolve(stdout);
      });
    });
  }

  // Verifica se há algum dispositivo conectado via ADB
  async checkConnection() {
    try {
      const stdout = await this.executeAdb(["devices"]);
      const lines = stdout
        .trim()
        .split(/\r?\n/)
        .slice(1)
        .filter((l) => /\bdevice\b/.test(l));
      this.isConnected = lines.length > 0;
      return this.isConnected;
    } catch {
      this.isConnected = false;
      return false;
    }
  }

  // Envia o SMS usando Intent nativa do Android via ADB
  async sendSms(phoneNumber, message) {
    const safePhone = String(phoneNumber || "").replace(/[^\d+]/g, "");
    if (!safePhone) {
      throw new Error("Número inválido para envio via SMS.");
    }

    const tapX = String(parseInt(process.env.SMS_TAP_X || "653", 10));
    const tapY = String(parseInt(process.env.SMS_TAP_Y || "1452", 10));
    const tempLocalFile = path.join(os.tmpdir(), "whatsapp-sender-sms-msg.txt");
    const tempScriptFile = path.join(os.tmpdir(), "whatsapp-sender-sms-send.sh");

    try {
      console.log(`\n[ADB] 📱 Abrindo app de SMS para: ${safePhone}`);

      fs.writeFileSync(tempLocalFile, String(message || ""), "utf8");

      const shContent = [
        "#!/system/bin/sh",
        "MSG=$(cat /data/local/tmp/msg.txt)",
        `am start -a android.intent.action.SENDTO -d sms:${safePhone} --es sms_body "$MSG" --ez exit_on_sent true`,
        "",
      ].join("\n");
      fs.writeFileSync(tempScriptFile, shContent, "utf8");

      await this.executeAdb(["push", tempLocalFile, "/data/local/tmp/msg.txt"]);
      await this.executeAdb(["push", tempScriptFile, "/data/local/tmp/send.sh"]);

      await this.executeAdb(["shell", "chmod", "+x", "/data/local/tmp/send.sh"]);
      await this.executeAdb(["shell", "/system/bin/sh", "/data/local/tmp/send.sh"]);

      await sleep(2000);
      await this.executeAdb(["shell", "input", "tap", tapX, tapY]);
      await sleep(1500);
      await this.executeAdb(["shell", "input", "keyevent", "4"]);
      await this.executeAdb(["shell", "input", "keyevent", "4"]);

      console.log(`[ADB] 🎉 SMS enviado para: ${safePhone}`);
      return true;
    } catch (e) {
      console.error(`[ADB ERROR] Falha ao enviar SMS para ${safePhone}:`, e);
      throw new Error(`Falha na automação ADB: ${e.message}`);
    }
  }
}

module.exports = new AdbService();
