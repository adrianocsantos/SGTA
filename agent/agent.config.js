export const AGENT_CONFIG = {
  PORT: 3100,
  LOG_PATH: "C:\\logs\\aplicacao.log",
  // Opcional: várias fontes na mesma porta. LOG_PATH continua compatível.
  // LOG_SOURCES: {
  //   autorizador: { label: "Autorizador", PATH: "C:\\logs\\autorizador.log" },
  //   conciliador: { label: "Conciliador", PATH: "C:\\logs\\conciliador.log" }
  //   importa: {
  //     label: "Importa Transações",
  //     PATH_TEMPLATE: "C:\\logs\\{DDMMYYYY}_ImportaTransacaoes.log",
  //     TIMEZONE: "America/Sao_Paulo",
  //     DATE_FALLBACK_DAYS: 1
  //     // Para arquivos horários: {YYYYMMDDHH}, {HH}, {mm} e DATE_FALLBACK_HOURS
  //   }
  // },
  ENCODING: "utf-8",
  MAX_BYTES: 52428800,
  MAX_LINES_PER_READ: 1000,
  TOKEN: "",
  // Habilite para permitir que o servidor central execute comandos remotamente
  // neste servidor (ex.: reiniciar a aplicação). Requer TOKEN configurado.
  ALLOW_EXEC: false,
  EXEC_TIMEOUT_MS: 30000,
  // Habilite para permitir listar o conteúdo de pastas deste servidor pela tela
  // de operações remotas.
  ALLOW_FS_BROWSE: false,
  // Habilite separadamente para ler e salvar arquivos de texto de até 512 KiB.
  ALLOW_FS_EDIT: false
};
