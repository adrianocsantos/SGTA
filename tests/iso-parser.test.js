import assert from "node:assert/strict";
import test from "node:test";
import { convertIsoMessageInput, parseDe122Tlv, parseIsoMessage } from "../frontend/iso-parser.js";

test("parses a basic ISO 8583 message and its fixed numeric fields", () => {
  const message = "0200" + "3000000000000000" + "000000" + "000000001234";
  const result = parseIsoMessage(message);

  assert.equal(result.fields.MTI, "0200");
  assert.equal(result.fields.Bitmap1, "3000000000000000");
  assert.equal(result.fields.DE003, "000000");
  assert.equal(result.fields.DE004, "000000001234");
  assert.equal(result.unparsed, "");
});

test("selects the 1993 profile from the MTI and masks card data", () => {
  const message = "1200" + "6000000000000000" + "161234567890123456" + "000000";
  const result = parseIsoMessage(message);

  assert.equal(result.profile, "ISO8583_93");
  assert.equal(result.fields.DE002, "123456******3456");
  assert.equal(result.fields.DE003, "000000");
});

test("masks short card numbers in the 1993 profile", () => {
  const message = "1200" + "4000000000000000" + "0812345678";
  const result = parseIsoMessage(message);

  assert.equal(result.fields.DE002, "12****78");
});

test("preserves the token in DE35 while masking DE2 in the 1993 profile", () => {
  const message = "1200" + "4000000020000000" + "161234567890123456" + "10TOKEN=1234";
  const result = parseIsoMessage(message);

  assert.equal(result.fields.DE002, "123456******3456");
  assert.equal(result.fields.DE035, "TOKEN=1234");
});

test("accepts alphanumeric card tokens in DE122 for both profiles", () => {
  const primaryBitmap = "8000000000000000";
  const secondaryBitmap = "0000000000000040";
  const tlv = "00711TPAY1.0.0.0";
  const payload = `${primaryBitmap}${secondaryBitmap}${String(tlv.length).padStart(3, "0")}${tlv}`;

  const profile87 = parseIsoMessage(`0200${payload}`, "iso8583");
  const profile93 = parseIsoMessage(`1200${payload}`, "iso8583_93");

  assert.equal(profile87.fields.DE122, tlv);
  assert.equal(profile93.fields.DE122, tlv);
  assert.deepEqual(parseDe122Tlv(profile87.fields.DE122), [
    { tag: "007", length: 11, value: "TPAY1.0.0.0" }
  ]);
});

test("parses DE122 TLV tag, length, and value", () => {
  assert.deepEqual(parseDe122Tlv("00711TPAY1.0.0.0"), [
    { tag: "007", length: 11, value: "TPAY1.0.0.0" }
  ]);
});

test("parses consecutive DE122 TLV items", () => {
  assert.deepEqual(parseDe122Tlv("00711TPAY1.0.0.000202OK"), [
    { tag: "007", length: 11, value: "TPAY1.0.0.0" },
    { tag: "002", length: 2, value: "OK" }
  ]);
});

test("rejects malformed or truncated DE122 TLV items", () => {
  assert.throws(() => parseDe122Tlv("0071"), /incompletos/);
  assert.throws(() => parseDe122Tlv("ABC02XY"), /Tag ou tamanho inválido/);
  assert.throws(() => parseDe122Tlv("00712TPAY1.0.0.0"), /tamanho declarado 12/);
});

test("parses variable-length fields and secondary bitmaps", () => {
  const primaryBitmap = "8000000020000000";
  const secondaryBitmap = "0000000000000000";
  const message = `0200${primaryBitmap}${secondaryBitmap}06ABC123TAIL`;
  const result = parseIsoMessage(message, "iso8583");

  assert.equal(result.fields.Bitmap2, secondaryBitmap);
  assert.equal(result.fields.DE035, "ABC123");
  assert.equal(result.unparsed, "TAIL");
});

test("parses variable-length DE53 and keeps later fields aligned in the 0200 profile", () => {
  const field53 = "032213FFFFF7E885A0DF800132";
  const emv = "9F0607A0000004946010";
  const token = "00711TSOF8.0.5.0";
  const message = "0200" + "8000000000000A40" + "0000000000000040"
    + String(field53.length).padStart(2, "0") + field53
    + String(emv.length).padStart(3, "0") + emv
    + "06650956"
    + String(token.length).padStart(3, "0") + token;
  const result = parseIsoMessage(message);

  assert.equal(result.profile, "ISO8583_Parse3");
  assert.equal(result.fields.DE053, field53);
  assert.equal(result.fields.DE055, emv);
  assert.equal(result.fields.DE058, "650956");
  assert.equal(result.fields.DE122, token);
  assert.equal(result.unparsed, "");
});

test("rejects malformed or truncated DE53 in the 0200 profile", () => {
  const header = "0200" + "0000000000000800";
  assert.throws(() => parseIsoMessage(header + "XX"), /Prefixo de tamanho inválido no DE053/);
  assert.throws(() => parseIsoMessage(header + "05AB"), /Mensagem truncada ao ler DE053/);
});

test("reports invalid bitmap, unsupported bits, and truncated fields", () => {
  assert.throws(() => parseIsoMessage("0200NOT-A-BITMAP"), /Bitmap primário inválido/);
  assert.throws(() => parseIsoMessage("0200" + "0000000000000001"), /Bit 64.*não possui configuração/);
  assert.throws(() => parseIsoMessage("0200" + "2000000000000000" + "00"), /Mensagem truncada/);
});

test("converts hexadecimal ISO messages to ASCII and parses them", () => {
  const ascii = ["0200", "3000000000000000", "000000", "000000001234"].join("");
  const hex = Buffer.from(ascii, "ascii").toString("hex");
  assert.equal(typeof globalThis.ISO8583Parser.convertIsoMessageInput, "function");
  const converted = convertIsoMessageInput(hex, "hex");
  const result = parseIsoMessage(converted.ascii);

  assert.equal(converted.ascii, ascii);
  assert.equal(converted.hex, hex.toUpperCase());
  assert.equal(result.fields.MTI, "0200");
  assert.equal(result.fields.DE003, "000000");
  assert.equal(result.fields.DE004, "000000001234");
});

test("accepts spaced hexadecimal and an optional 0x prefix", () => {
  const converted = convertIsoMessageInput("0x30 32:30-30", "hex");

  assert.deepEqual(converted, { ascii: "0200", hex: "30323030" });
});

test("parses binary fields from byte text and hexadecimal without shifting later fields", () => {
  const message = "1200" + "0000000000000A01"
    + "03" + "\x80\x9d\xff"
    + "004" + "\x00\x80\x9f\xff"
    + "\x00\x01\x02\x03\x80\x9d\xfe\xff";
  const hex = Buffer.from(message, "latin1").toString("hex").toUpperCase();

  for (const [input, format] of [[message, "ascii"], [hex, "hex"]]) {
    const converted = convertIsoMessageInput(input, format);
    const result = parseIsoMessage(converted.ascii);
    assert.equal(converted.hex, hex);
    assert.equal(result.fields.DE053, "809dff");
    assert.equal(result.fields.DE055, "00809fff");
    assert.equal(result.fields.DE064, "00010203809dfeff");
    assert.equal(result.unparsed, "");
  }
});

test("parses an eight-byte binary PIN block without shifting subsequent fields", () => {
  const message = "1200" + "0000000000001A01"
    + "\x80\x01\x02\x03\x04\x05\x06\xff"
    + "03" + "\x80\x9d\xff"
    + "004" + "\x00\x80\x9f\xff"
    + "\x00\x01\x02\x03\x80\x9d\xfe\xff";
  for (const [input, format] of [[message, "ascii"], [Buffer.from(message, "latin1").toString("hex"), "hex"]]) {
    const result = parseIsoMessage(convertIsoMessageInput(input, format).ascii, "auto", { pinBlockEncoding: "binary" });
    assert.equal(result.fields.DE052, "80010203040506ff");
    assert.equal(result.fields.DE053, "809dff");
    assert.equal(result.fields.DE055, "00809fff");
    assert.equal(result.fields.DE064, "00010203809dfeff");
    assert.equal(result.unparsed, "");
  }
});

test("keeps the existing sixteen-character PIN block format by default", () => {
  const message = "1200" + "0000000000001A01"
    + "0123456789ABCDEF" + "01" + "\x80" + "001" + "\xff" + "12345678";
  const result = parseIsoMessage(message);
  assert.equal(result.fields.DE052, "0123456789ABCDEF");
  assert.equal(result.fields.DE053, "80");
  assert.equal(result.fields.DE055, "ff");
  assert.equal(result.fields.DE064, "3132333435363738");
  assert.equal(result.unparsed, "");
});

test("rejects malformed hexadecimal and text outside the byte range", () => {
  assert.throws(() => convertIsoMessageInput("30323G", "hex"), /caracteres inválidos/);
  assert.throws(() => convertIsoMessageInput("303", "hex"), /número par/);
  assert.throws(() => convertIsoMessageInput("0200\u20ac", "ascii"), /não representa um único byte/);
});
