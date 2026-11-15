export function getCargaTabelasStatus() {
  return {
    parser: "carga-tabelas",
    title: "Carga de Tabelas",
    enabled: true,
    statusLabel: "Estrutura pronta",
    supportedModes: ["auto", "tef", "pos"],
    message: "Parser TEF posicional habilitado. Parser POS pendente.",
    lastExecution: null,
    availableActions: []
  };
}

function normalizeInput(input) {
  return String(input || "").replace(/\r?\n/g, "").trim();
}

function toNumber(value) {
  const n = Number(String(value || "").trim());
  return Number.isFinite(n) ? n : null;
}

function readFields(raw, schema) {
  const result = {};
  let cursor = 0;

  for (const field of schema) {
    const value = raw.slice(cursor, cursor + field.size);
    cursor += field.size;

    const trimmed = value.trim();
    if (field.type === "number") {
      result[field.key] = toNumber(trimmed);
    } else {
      result[field.key] = trimmed;
    }
  }

  return result;
}

function detectMode(input) {
  const normalized = normalizeInput(input);

  if (!normalized) {
    return { mode: null, confidence: 0, reason: "Entrada vazia." };
  }

  if (normalized.startsWith("S") && normalized.length >= 320) {
    return {
      mode: "tef",
      confidence: 0.9,
      reason: "Inicia com registro SETUP (S) e possui tamanho compatível com layout TEF."
    };
  }

  return {
    mode: null,
    confidence: 0,
    reason: "Formato não identificado automaticamente."
  };
}

function parseRecordSetup(raw) {
  const data = readFields(raw, [
    { key: "recordId", size: 1 },
    { key: "acquirerInstitutionCode", size: 11 },
    { key: "merchantCode", size: 15 },
    { key: "merchantName", size: 38 },
    { key: "merchantAddress1", size: 38 },
    { key: "merchantAddress2", size: 38 },
    { key: "merchantCnpj", size: 14 },
    { key: "setupVersionMMddhhmiss", size: 10 },
    { key: "cutoffTime", size: 4 },
    { key: "transactionTimeoutSeconds", size: 3, type: "number" },
    { key: "merchantCategoryCode", size: 4 },
    { key: "cardDigitsInBit58", size: 2, type: "number" },
    { key: "lastCardDigitsInputSizeSubfield017", size: 2, type: "number" },
    { key: "enableSubfield007", size: 1 },
    { key: "rfu1", size: 1 },
    { key: "enableSubfield009", size: 1 },
    { key: "enableSubfield010", size: 1 },
    { key: "enableSubfield011", size: 1 },
    { key: "rfu2", size: 1 },
    { key: "enableSubfield019", size: 1 },
    { key: "enableBit126LastTransactionData", size: 1 },
    { key: "minimumInstallments", size: 2, type: "number" },
    { key: "maximumInstallments", size: 2, type: "number" },
    { key: "encryptPan", size: 1 },
    { key: "rfu3", size: 2 },
    { key: "rfu4", size: 2 },
    { key: "networkName", size: 40 },
    { key: "cardAcquirerName", size: 40 },
    { key: "bankAcquirerName", size: 40 },
    { key: "maxMinutesBetweenTransactionAndReversal", size: 3, type: "number" }
  ]);

  return {
    recordType: "S",
    recordName: "Tabela de SETUP",
    rawLength: raw.length,
    data
  };
}

function parseRecordProduct(raw) {
  const data = readFields(raw, [
    { key: "recordId", size: 1 },
    { key: "productCode", size: 3 },
    { key: "productName", size: 30 },
    { key: "productType", size: 2 },
    { key: "pinLength", size: 1, type: "number" },
    { key: "cardDataFlagsHex", size: 2, type: "string" },
    { key: "otherDataFlagsHex", size: 2, type: "string" }
  ]);

  return {
    recordType: "0",
    recordName: "Tabela de Produtos",
    rawLength: raw.length,
    data
  };
}

const PRODUCT_RECORD_LENGTH = 41;
const PUBLIC_KEY_RECORD_LENGTH = 571;
const TRANSACTION_LIST_RECORD_LENGTH = 45;

function parseRecordBinRange(raw) {
  return {
    recordType: "4",
    recordName: "Tabela Range de Bins",
    rawLength: raw.length,
    data: readFields(raw, [
      { key: "recordId", size: 1 },
      { key: "productCode", size: 3 },
      { key: "binStart", size: 10 },
      { key: "binEnd", size: 10 }
    ])
  };
}

function parseRecordAidParameters(raw) {
  return {
    recordType: "1",
    recordName: "Tabela de EMV Parâmetros X AID",
    rawLength: raw.length,
    data: readFields(raw, [
      { key: "recordId", size: 1 },
      { key: "acquirerId", size: 2 },
      { key: "recordIndex", size: 3 },
      { key: "productCode", size: 3 },
      { key: "aidLength", size: 2, type: "number" },
      { key: "aid", size: 32 },
      { key: "applicationType", size: 2 },
      { key: "applicationDefaultLabel", size: 16 },
      { key: "applicationPattern", size: 2 },
      { key: "appVersionTerminalOption1", size: 4 },
      { key: "appVersionTerminalOption2", size: 4 },
      { key: "appVersionTerminalOption3", size: 4 },
      { key: "terminalCountryCode", size: 3 },
      { key: "transactionCurrencyCode", size: 3 },
      { key: "transactionCurrencyExponent", size: 1 },
      { key: "merchantIdentifier", size: 15 },
      { key: "merchantCategoryCode", size: 4 },
      { key: "terminalIdentification", size: 8 },
      { key: "terminalCapabilities", size: 6 },
      { key: "additionalTerminalCapabilities", size: 10 },
      { key: "terminalType", size: 2 },
      { key: "terminalActionCodeDefault", size: 10 },
      { key: "terminalActionCodeDenial", size: 10 },
      { key: "terminalActionCodeOnline", size: 10 },
      { key: "terminalFloorLimit", size: 8 },
      { key: "transactionCategoryCode", size: 1 },
      { key: "defaultTdol", size: 40 },
      { key: "defaultDdol", size: 40 },
      { key: "arcOfflineApproved", size: 2 },
      { key: "arcOfflineDeclined", size: 2 },
      { key: "arcUnableOnlineOfflineApproved", size: 2 },
      { key: "arcUnableOnlineOfflineDeclined", size: 2 },
      { key: "targetPercentage", size: 2, type: "number" },
      { key: "thresholdValue", size: 8 },
      { key: "maximumTargetPercentage", size: 2, type: "number" },
      { key: "ctlsMode", size: 1 },
      { key: "ctlsZero", size: 1 },
      { key: "ctlsTerminalContactlessTransactionLimit", size: 8 },
      { key: "ctlsTerminalContactlessFloorLimit", size: 8 },
      { key: "ctlsTerminalCvmRequiredLimit", size: 8 },
      { key: "ctlsPaypassMagStripeApplicationVersion", size: 4 },
      { key: "ctlsTacDefault", size: 10 },
      { key: "ctlsTacDenial", size: 10 },
      { key: "ctlsTacOnline", size: 10 },
      { key: "ctlsTerminalCapabilities", size: 6 },
      { key: "ctlsAdditionalTerminalCapabilities", size: 10 }
    ])
  };
}

function parseRecordPublicKey(raw) {
  return {
    recordType: "2",
    recordName: "Tabela EMV Chaves Publicas",
    rawLength: raw.length,
    data: readFields(raw, [
      { key: "recordId", size: 1 },
      { key: "recordIndex", size: 3 },
      { key: "rid", size: 10 },
      { key: "publicKeyIndex", size: 2 },
      { key: "publicKeyExponentLength", size: 1, type: "number" },
      { key: "publicKeyExponent", size: 6 },
      { key: "publicKeyModulusLength", size: 3, type: "number" },
      { key: "publicKeyModulus", size: 496 },
      { key: "checksumStatus", size: 1 },
      { key: "publicKeyChecksumSha1", size: 48 }
    ])
  };
}

function parseRecordTransactionParameters(raw) {
  return {
    recordType: "5",
    recordName: "Tabela de Parâmetros de Transação",
    rawLength: raw.length,
    data: readFields(raw, [
      { key: "recordId", size: 1 },
      { key: "recordIndex", size: 3 },
      { key: "transactionId", size: 2 },
      { key: "transactionFlagsHex", size: 2 },
      { key: "minimumInstallments", size: 2, type: "number" },
      { key: "maximumInstallments", size: 2, type: "number" },
      { key: "maximumValue", size: 12 },
      { key: "minimumValue", size: 12 },
      { key: "maximumInstallmentValue", size: 12 },
      { key: "minimumInstallmentValue", size: 12 }
    ])
  };
}

function parseRecordTransactionList(raw) {
  return {
    recordType: "6",
    recordName: "Tabela de Transações",
    rawLength: raw.length,
    data: readFields(raw, [
      { key: "recordId", size: 1 },
      { key: "transaction01CardUnlock", size: 2 },
      { key: "transaction02Insurance", size: 2 },
      { key: "transaction03CreditSingle", size: 2 },
      { key: "transaction04CreditInstallmentNoInterestStore", size: 2 },
      { key: "transaction05Rfu", size: 2 },
      { key: "transaction06Rfu", size: 2 },
      { key: "transaction07CreditInstallmentWithInterestIssuer", size: 2 },
      { key: "transaction08CreditWithdraw", size: 2 },
      { key: "transaction09CreditInvoicePayment", size: 2 },
      { key: "transaction10PrepaidLoad", size: 2 },
      { key: "transaction11Cancel", size: 2 },
      { key: "transaction12BalanceLimit", size: 2 },
      { key: "transaction13LastInvoiceAmount", size: 2 },
      { key: "transaction14Debit", size: 2 },
      { key: "transaction15Voucher", size: 2 },
      { key: "transaction16Rfu", size: 2 },
      { key: "transaction17Rfu", size: 2 },
      { key: "transaction18Rfu", size: 2 },
      { key: "transaction19Rfu", size: 2 },
      { key: "transaction20Rfu", size: 2 },
      { key: "transaction21PreAuthorization", size: 2 },
      { key: "transaction22Rfu", size: 2 }
    ])
  };
}

function parseRecordTagsEmv(raw) {
  const recordId = raw.slice(0, 1);
  const aidIndex = raw.slice(1, 4).trim();
  const list1Size = toNumber(raw.slice(4, 7).trim()) || 0;
  const list1 = raw.slice(7, 7 + list1Size);
  const list2SizeStart = 7 + list1Size;
  const list2Size = toNumber(raw.slice(list2SizeStart, list2SizeStart + 3).trim()) || 0;
  const list2 = raw.slice(list2SizeStart + 3, list2SizeStart + 3 + list2Size);

  return {
    recordType: "7",
    recordName: "Tabela de TAGS EMV",
    rawLength: raw.length,
    data: {
      recordId,
      aidIndex,
      firstGenerateAcTagsLength: list1Size,
      firstGenerateAcTags: list1,
      secondGenerateAcTagsLength: list2Size,
      secondGenerateAcTags: list2
    }
  };
}

function parseRecordDukpt(raw) {
  return {
    recordType: "8",
    recordName: "dukptKey",
    rawLength: raw.length,
    data: readFields(raw, [
      { key: "recordId", size: 1 },
      { key: "pinpadVendor", size: 2 },
      { key: "cryptoType", size: 1 },
      { key: "pinpadSlotHex", size: 2 }
    ])
  };
}

function parseRecordTransactionByProduct(raw) {
  const recordId = raw.slice(0, 1);
  const productCode = raw.slice(1, 4).trim();
  const transactionCount = toNumber(raw.slice(4, 6).trim()) || 0;
  const listRaw = raw.slice(6, 6 + transactionCount * 2);
  const transactions = [];

  for (let i = 0; i < transactionCount; i += 1) {
    transactions.push(listRaw.slice(i * 2, i * 2 + 2));
  }

  return {
    recordType: "9",
    recordName: "transactionsByProduct",
    rawLength: raw.length,
    data: {
      recordId,
      productCode,
      transactionCount,
      transactions
    }
  };
}

function expectedLengthForRecord(raw, offset) {
  const id = raw[offset];
  if (!id) return null;

  if (id === "S") return 320;
  if (id === "0") return PRODUCT_RECORD_LENGTH;
  if (id === "4") return 24;
  if (id === "1") return 342;
  if (id === "2") return PUBLIC_KEY_RECORD_LENGTH;
  if (id === "5") return 60;
  if (id === "6") return TRANSACTION_LIST_RECORD_LENGTH;
  if (id === "8") return 6;

  if (id === "9") {
    const base = raw.slice(offset, offset + 6);
    if (base.length < 6) return null;
    const count = toNumber(base.slice(4, 6)) || 0;
    return 6 + count * 2;
  }

  if (id === "7") {
    const minHeader = raw.slice(offset, offset + 7);
    if (minHeader.length < 7) return null;
    const firstSize = toNumber(minHeader.slice(4, 7)) || 0;
    const secondSizeStart = offset + 7 + firstSize;
    const secondSizeStr = raw.slice(secondSizeStart, secondSizeStart + 3);
    if (secondSizeStr.length < 3) return null;
    const secondSize = toNumber(secondSizeStr) || 0;
    return 1 + 3 + 3 + firstSize + 3 + secondSize;
  }

  return null;
}

function parseTef(input) {
  const records = [];
  const warnings = [];
  const normalized = normalizeInput(input);
  let cursor = 0;

  while (cursor < normalized.length) {
    const recordId = normalized[cursor];
    const expectedLength = expectedLengthForRecord(normalized, cursor);

    if (!expectedLength || cursor + expectedLength > normalized.length) {
      warnings.push({
        position: cursor,
        recordId,
        precedingExcerpt: normalized.slice(Math.max(0, cursor - 20), cursor),
        excerpt: normalized.slice(cursor, cursor + 21),
        message: "Registro incompleto ou identificador desconhecido."
      });
      break;
    }

    const chunk = normalized.slice(cursor, cursor + expectedLength);

    try {
      if (recordId === "S") records.push(parseRecordSetup(chunk));
      else if (recordId === "0") records.push(parseRecordProduct(chunk));
      else if (recordId === "4") records.push(parseRecordBinRange(chunk));
      else if (recordId === "1") records.push(parseRecordAidParameters(chunk));
      else if (recordId === "2") records.push(parseRecordPublicKey(chunk));
      else if (recordId === "5") records.push(parseRecordTransactionParameters(chunk));
      else if (recordId === "6") records.push(parseRecordTransactionList(chunk));
      else if (recordId === "7") records.push(parseRecordTagsEmv(chunk));
      else if (recordId === "8") records.push(parseRecordDukpt(chunk));
      else if (recordId === "9") records.push(parseRecordTransactionByProduct(chunk));
    } catch (err) {
      warnings.push({
        position: cursor,
        recordId,
        precedingExcerpt: normalized.slice(Math.max(0, cursor - 20), cursor),
        excerpt: normalized.slice(cursor, cursor + 21),
        message: err && err.message ? err.message : "Falha ao processar registro."
      });
    }

    cursor += expectedLength;
  }

  const summary = records.reduce((acc, record) => {
    acc[record.recordType] = (acc[record.recordType] || 0) + 1;
    return acc;
  }, {});

  return {
    ok: true,
    parser: "carga-tabelas",
    selectedMode: "tef",
    statusLabel: warnings.length ? "Processado com alertas" : "Processado",
    normalizedLength: normalized.length,
    parsedLength: cursor,
    recordCount: records.length,
    summary,
    warnings,
    records
  };
}

export function parseCargaTabelas({ mode = "auto", input = "" } = {}) {
  const normalized = normalizeInput(input);

  if (!normalized) {
    return {
      ok: false,
      parser: "carga-tabelas",
      statusLabel: "Entrada inválida",
      message: "A string posicional não foi informada."
    };
  }

  const requestedMode = String(mode || "auto").toLowerCase();
  const validModes = new Set(["auto", "tef", "pos"]);

  if (!validModes.has(requestedMode)) {
    return {
      ok: false,
      parser: "carga-tabelas",
      statusLabel: "Formato inválido",
      message: `Formato não suportado: ${requestedMode}`
    };
  }

  if (requestedMode === "auto") {
    const detection = detectMode(normalized);

    if (detection.mode === "tef") {
      return {
        ...parseTef(normalized),
        requestedMode,
        detectedMode: detection.mode,
        detectionConfidence: detection.confidence,
        detectionReason: detection.reason
      };
    }

    return {
      ok: false,
      parser: "carga-tabelas",
      requestedMode,
      detectedMode: detection.mode,
      detectionConfidence: detection.confidence,
      statusLabel: "Detecção pendente",
      message: detection.reason,
      normalizedLength: normalized.length,
      rawPreview: normalized.slice(0, 200)
    };
  }

  if (requestedMode === "tef") {
    return parseTef(normalized);
  }

  return {
    ok: false,
    parser: "carga-tabelas",
    selectedMode: requestedMode,
    normalizedLength: normalized.length,
    statusLabel: "POS pendente",
    message: "Layout POS ainda não implementado.",
    rawPreview: normalized.slice(0, 200)
  };
}