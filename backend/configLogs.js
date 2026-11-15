export const LOG_SOURCES = {
  exemplo: { label: "Aplicação", type: "local", PATH: "./logs/app.log" }
};

export const ACTIVE_LOG_SOURCE = "exemplo";

export const LOG_CONFIG = {
  PATH: "./logs/app.log",
  ENCODING: "utf-8",
  MAX_BYTES: 10 * 1024 * 1024,
  MAX_LINES_PER_READ: 100
};

export const PORT_SERVER = 3000;
