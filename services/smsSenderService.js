const JobManager = require("./jobManager");
const adbService = require("./adbService");

// WorkerAdapter converte a interface do adbService para algo que o JobManager entenda
class SmsWorker {
  async sendMessage(number, text) {
    // 1. O número deve ter no máximo DD9XXXXXX (sem 55) caso seja SMS local
    // Ex: "5535999999999" -> "35999999999"
    // Isso depende das operadoras, algumas aceitam o 55, outras recusam.
    // Vamos garantir o formato DDI + DDD + Num para segurança
    const numLimpo = number.startsWith("55") ? "+" + number : number;

    // Verifica log do celular
    const connected = await adbService.checkConnection();
    if (!connected) throw new Error("Aparelho não conectado via USB (ADB)");

    // Envia instrução ao celular
    await adbService.sendSms(numLimpo, text);
    return true;
  }
}

// Instancia JobManager injetando a lógica ADB e as variáveis com prefixo 'SMS_'
const smsSenderService = new JobManager(new SmsWorker(), "SMS_");

module.exports = smsSenderService;
