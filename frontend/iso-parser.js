const FIELD_PROFILES = {
  iso8583: {
    label: "ISO8583_Parse3",
    fields: {
      2: { name: "Card", length: 19, format: "..N" },
      3: { name: "Processing Code", length: 6, format: "N" },
      4: { name: "Amount", length: 12, format: "N" },
      5: { name: "Amount - Reference currency", length: 12, format: "N" },
      6: { name: "Amount - Issuer Reference currency", length: 12, format: "N" },
      7: { name: "Date time transaction", length: 10, format: "ANS" },
      9: { name: "Conversion tax DE05", length: 8, format: "N" },
      10: { name: "Conversion tax DE06", length: 8, format: "N" },
      11: { name: "NSU DE11", length: 6, format: "N" },
      12: { name: "Local Time HHMMSS", length: 6, format: "N" },
      13: { name: "Local Date MMDD", length: 4, format: "N" },
      14: { name: "Card Expiration Date", length: 4, format: "N" },
      18: { name: "Merchant Category Code", length: 4, format: "N" },
      22: { name: "Entry Mode", length: 3, format: "N" },
      23: { name: "Card Sequence Number", length: 3, format: "N" },
      25: { name: "Point of Service Condition Code", length: 2, format: "N" },
      32: { name: "Acquirer Code", length: 3, format: "..N" },
      35: { name: "Track2", length: 0, format: "..ANS" },
      38: { name: "Authorization Code", length: 6, format: "N" },
      39: { name: "Response Code", length: 2, format: "N" },
      41: { name: "Terminal Code", length: 8, format: "ANS" },
      42: { name: "Seller Code", length: 15, format: "N" },
      43: { name: "Softdescriptor", length: 40, format: "ANS" },
      48: { name: "Additional Data", length: 12, format: "...ANS" },
      49: { name: "Currency Code", length: 3, format: "N" },
      50: { name: "Currency Code Reference", length: 3, format: "N" },
      51: { name: "Issuer Currency Code Reference", length: 3, format: "N" },
      52: { name: "Pinblock", length: 16, format: "ANS" },
      53: { name: "Security information", length: 0, format: "..ANS" },
      54: { name: "Additional Amount", length: 12, format: "...ANS" },
      55: { name: "EMV Data", length: 0, format: "...ANS" },
      56: { name: "Telecarga", length: 0, format: "...ANS" },
      58: { name: "BIN", length: 0, format: "..N" },
      61: { name: "Terminal Capabilities", length: 16, format: "...ANS" },
      62: { name: "Cupom de venda", length: 0, format: "...ANS" },
      63: { name: "Indicacao da criptografia", length: 0, format: "...ANS" },
      67: { name: "Installments", length: 2, format: "N" },
      70: { name: "Network management information code", length: 3, format: "N" },
      71: { name: "Message number", length: 8, format: "N" },
      81: { name: "DE81", length: 10, format: "N" },
      90: { name: "Original Transaction Data", length: 42, format: "N" },
      120: { name: "AVS Data", length: 0, format: "...ANS" },
      122: { name: "Card Token", length: 19, format: "...ANS" },
      123: { name: "Acquirer Data", length: 0, format: "...ANS" },
      125: { name: "Original Authorization NSU", length: 9, format: "...ANS" },
      126: { name: "Tribanco Last Trx Data", length: 9, format: "...ANS" },
      127: { name: "Authorization NSU DE127", length: 9, format: "...ANS" }
    }
  },
  iso8583_93: {
    label: "ISO8583_93",
    maskCardData: true,
    fields: {
      2: { name: "Card", length: 19, format: "..N" },
      3: { name: "Processing Code", length: 6, format: "N" },
      4: { name: "Amount", length: 12, format: "N" },
      7: { name: "Date time transaction", length: 10, format: "ANS" },
      11: { name: "NSU DE11", length: 6, format: "N" },
      12: { name: "Local Time HHMMSS", length: 12, format: "N" },
      13: { name: "Local Date MMDD", length: 4, format: "N" },
      14: { name: "Card Expiration Date", length: 4, format: "N" },
      18: { name: "Merchant Category Code", length: 4, format: "N" },
      19: { name: "Country Code", length: 3, format: "N" },
      22: { name: "Entry Mode", length: 12, format: "ANS" },
      23: { name: "Card Sequence Number", length: 3, format: "N" },
      32: { name: "Acquirer Code", length: 11, format: "..N" },
      34: { name: "Security Code", length: 6, format: "..ANS" },
      35: { name: "Track2", length: 0, format: "..ANS" },
      38: { name: "Authorization Code", length: 6, format: "N" },
      39: { name: "Response Code", length: 3, format: "N" },
      41: { name: "Terminal Code", length: 8, format: "ANS" },
      42: { name: "Seller Code", length: 15, format: "N" },
      43: { name: "Softdescriptor", length: 43, format: "..ANS" },
      48: { name: "Additional Data", length: 12, format: "...ANS" },
      49: { name: "Currency Code", length: 3, format: "N" },
      52: { name: "Pinblock", length: 16, format: "ANS" },
      53: { name: "Cryptogram type", length: 14, format: "..B" },
      54: { name: "Additional Amount", length: 120, format: "...N" },
      55: { name: "EMV Data", length: 0, format: "...B" },
      60: { name: "Additional data terminal", length: 16, format: "...ANS" },
      61: { name: "Terminal Capabilities", length: 16, format: "...ANS" },
      64: { name: "Authentication message code", length: 8, format: "B" },
      70: { name: "Network management information code", length: 3, format: "N" },
      90: { name: "Original Transaction Data", length: 26, format: "ANS" },
      120: { name: "AVS Data", length: 0, format: "...ANS" },
      122: { name: "Card Token", length: 19, format: "...ANS" },
      123: { name: "Acquirer Data", length: 0, format: "...ANS" },
      127: { name: "Authorization NSU DE127", length: 9, format: "...N" }
    }
  }
};

function bitmapSetBits(bitmap) {
  const bits = [];
  for (let index = 0; index < bitmap.length; index += 1) {
    const nibble = Number.parseInt(bitmap[index], 16);
    for (let offset = 0; offset < 4; offset += 1) {
      if (nibble & (1 << (3 - offset))) bits.push(index * 4 + offset + 1);
    }
  }
  return bits;
}

function maskCardValue(value) {
  if (value.length <= 4) return "*".repeat(value.length);
  if (value.length <= 10) return `${value.slice(0, 2)}${"*".repeat(value.length - 4)}${value.slice(-2)}`;
  return `${value.slice(0, 6)}${"*".repeat(value.length - 10)}${value.slice(-4)}`;
}

export function parseDe122Tlv(value) {
  const tlvs = [];
  let cursor = 0;

  while (cursor < value.length) {
    if (value.length - cursor < 5) {
      throw new Error(`Dados TLV incompletos a partir da posição ${cursor + 1}.`);
    }

    const tag = value.slice(cursor, cursor + 3);
    const lengthText = value.slice(cursor + 3, cursor + 5);
    if (!/^\d{3}$/.test(tag) || !/^\d{2}$/.test(lengthText)) {
      throw new Error(`Tag ou tamanho inválido na posição ${cursor + 1}.`);
    }

    const length = Number(lengthText);
    const valueStart = cursor + 5;
    const tlvValue = value.slice(valueStart, valueStart + length);
    if (tlvValue.length !== length) {
      throw new Error(`Tag ${tag}: tamanho declarado ${length}, mas restam apenas ${tlvValue.length} caractere(s).`);
    }

    tlvs.push({ tag, length, value: tlvValue });
    cursor = valueStart + length;
  }

  return tlvs;
}

export function convertIsoMessageInput(input, format = "ascii") {
  const raw = String(input ?? "");
  if (!raw.trim()) throw new Error("Informe a mensagem ISO para processar.");

  if (format === "hex") {
    let hex = raw.trim().replace(/^0x/i, "").replace(/[\s:-]/g, "");
    if (!hex) throw new Error("Informe a mensagem ISO em hexadecimal.");
    if (!/^[0-9a-f]+$/i.test(hex)) {
      throw new Error("A mensagem hexadecimal contém caracteres inválidos.");
    }
    if (hex.length % 2 !== 0) {
      throw new Error("A mensagem hexadecimal deve conter um número par de dígitos.");
    }

    hex = hex.toUpperCase();
    let ascii = "";
    for (let index = 0; index < hex.length; index += 2) {
      const byte = Number.parseInt(hex.slice(index, index + 2), 16);
      ascii += String.fromCharCode(byte);
    }
    return { ascii, hex };
  }

  if (format !== "ascii") throw new Error("Formato de entrada desconhecido.");

  let hex = "";
  for (let index = 0; index < raw.length; index += 1) {
    const code = raw.charCodeAt(index);
    if (code > 0xff) {
      throw new Error(`O caractere na posição ${index + 1} não representa um único byte. Use o hexadecimal dos bytes originais.`);
    }
    hex += code.toString(16).padStart(2, "0");
  }
  return { ascii: raw, hex: hex.toUpperCase() };
}

export function parseIsoMessage(input, selectedProfile = "auto", { pinBlockEncoding = "text" } = {}) {
  const message = String(input ?? "");
  if (!message.trim()) throw new Error("Informe a mensagem ISO para processar.");
  if (pinBlockEncoding !== "text" && pinBlockEncoding !== "binary") {
    throw new Error("Codificação do DE052 desconhecida.");
  }

  const mti = message.slice(0, 4);
  if (!/^\d{4}$/.test(mti)) throw new Error("MTI inválido: a mensagem deve começar com 4 dígitos.");

  const profileKey = selectedProfile === "auto"
    ? (mti.startsWith("1") ? "iso8583_93" : "iso8583")
    : selectedProfile;
  const profile = FIELD_PROFILES[profileKey];
  if (!profile) throw new Error("Perfil ISO desconhecido.");

  const primaryBitmap = message.slice(4, 20);
  if (primaryBitmap.length !== 16 || !/^[0-9a-f]{16}$/i.test(primaryBitmap)) {
    throw new Error("Bitmap primário inválido: são necessários 16 caracteres hexadecimais após o MTI.");
  }

  const hasSecondaryBitmap = (Number.parseInt(primaryBitmap[0], 16) & 0x8) !== 0;
  const secondaryBitmap = hasSecondaryBitmap ? message.slice(20, 36) : "";
  if (hasSecondaryBitmap && (secondaryBitmap.length !== 16 || !/^[0-9a-f]{16}$/i.test(secondaryBitmap))) {
    throw new Error("Bitmap secundário inválido: são necessários 16 caracteres hexadecimais.");
  }

  const bitmap = primaryBitmap + secondaryBitmap;
  const bits = bitmapSetBits(bitmap);
  let cursor = 0;
  const fields = { MTI: mti, DE001: mti, Bitmap1: primaryBitmap };
  const entries = [
    { bit: 0, key: "MTI", name: "MTI", value: mti },
    { bit: 1, key: "Bitmap1", name: "Bitmap primário", value: primaryBitmap }
  ];

  const read = (length, description) => {
    const value = message.slice(cursor, cursor + length);
    if (value.length !== length) {
      throw new Error(`Mensagem truncada ao ler ${description}: esperados ${length} caracteres, encontrados ${value.length}.`);
    }
    cursor += length;
    return value;
  };

  cursor = 4;
  read(16, "bitmap primário");
  if (hasSecondaryBitmap) {
    fields.Bitmap2 = read(16, "bitmap secundário");
    entries.push({ bit: 65, key: "Bitmap2", name: "Bitmap secundário", value: fields.Bitmap2 });
  }

  for (const bit of bits) {
    if (bit === 1) continue;
    let definition = profile.fields[bit];
    if (!definition) throw new Error(`Bit ${bit} está presente, mas não possui configuração no perfil ${profile.label}.`);
    if (bit === 52 && pinBlockEncoding === "binary") {
      definition = { ...definition, length: 8, format: "B" };
    }

    let length = definition.length;
    let value;
    if (definition.format.startsWith("..")) {
      const prefixLength = definition.format.startsWith("...") ? 3 : 2;
      const prefix = read(prefixLength, `prefixo de tamanho do DE${String(bit).padStart(3, "0")}`);
      if (!/^\d+$/.test(prefix)) throw new Error(`Prefixo de tamanho inválido no DE${String(bit).padStart(3, "0")}.`);
      length = Number(prefix);
      value = read(length, `DE${String(bit).padStart(3, "0")}`);
    } else {
      value = read(length, `DE${String(bit).padStart(3, "0")}`);
    }

    if (definition.format.endsWith("N") && !/^\d*$/.test(value)) {
      throw new Error(`DE${String(bit).padStart(3, "0")} deve conter somente números.`);
    }
    if (definition.format.endsWith("B")) {
      value = Array.from(value, character => character.charCodeAt(0).toString(16).padStart(2, "0")).join("");
    }
    if (profile.maskCardData && bit === 2) value = maskCardValue(value);

    const key = `DE${String(bit).padStart(3, "0")}`;
    fields[key] = value;
    entries.push({ bit, key, name: definition.name, value });
  }

  const unparsed = message.slice(cursor);
  return {
    profile: profile.label,
    fields,
    entries,
    fieldCount: bits.filter(bit => bit !== 1).length,
    parse: entries.map(entry => entry.bit <= 1
      ? `${entry.name === "MTI" ? "MTI" : entry.name}: ${entry.value}`
      : `Bit: ${entry.bit}  Value: ${entry.value}`),
    unparsed
  };
}

globalThis.ISO8583Parser = Object.freeze({
  convertIsoMessageInput,
  parseIsoMessage,
  parseDe122Tlv
});
