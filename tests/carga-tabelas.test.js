import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { parseCargaTabelas } from "../backend/cargaTabelasParser.js";

test("reports exactly 20 preceding characters, the indicated character and 20 following characters", () => {
  const record = "8abcde8fghij8klmno8pqrst";
  const remainder = "X12345678901234567890EXTRA";
  const result = parseCargaTabelas({ mode: "tef", input: `  ${record}\r\n${remainder}  ` });

  assert.equal(result.recordCount, 4);
  assert.equal(result.warnings[0].position, 24);
  assert.equal(result.warnings[0].recordId, "X");
  assert.equal(result.warnings[0].precedingExcerpt, record.slice(4));
  assert.equal(result.warnings[0].excerpt, "X12345678901234567890");
});

test("reports only the available characters for incomplete records", () => {
  const result = parseCargaTabelas({ mode: "tef", input: "8a b" });

  assert.equal(result.recordCount, 0);
  assert.equal(result.warnings[0].position, 0);
  assert.equal(result.warnings[0].precedingExcerpt, "");
  assert.equal(result.warnings[0].excerpt, "8a b");
});

test("does not add warnings for a complete record", () => {
  const result = parseCargaTabelas({ mode: "tef", input: "8abcde" });

  assert.equal(result.recordCount, 1);
  assert.deepEqual(result.warnings, []);
});

function createElement() {
  const classes = new Set(["hidden"]);
  return {
    innerHTML: "",
    textContent: "",
    classList: {
      add: value => classes.add(value),
      remove: value => classes.delete(value),
      contains: value => classes.has(value)
    }
  };
}

function createRenderContext() {
  const app = readFileSync(new URL("../frontend/app.js", import.meta.url), "utf8");
  const source = app.slice(app.indexOf("function escapeHtml("), app.indexOf("function setConfigFeedback("));
  const context = {
    cargaTabelasWarnings: createElement(),
    cargaTabelasOutput: createElement(),
    parsedRecordsContainer: createElement(),
    cargaTabelasSummary: createElement(),
    cargaTabelasRecordTools: createElement(),
    cargaTabelasSearch: { value: "" },
    cargaTabelasInput: { value: "" },
    cargaTabelasCount: createElement(),
    cargaTabelasStatus: createElement(),
    cargaTabelasRequestId: 0,
    cargaTabelasResult: null
  };
  runInNewContext(source, context);
  return context;
}

test("renders escaped excerpts and keeps warnings visible when no records were parsed", () => {
  const context = createRenderContext();

  const result = parseCargaTabelas({ mode: "tef", input: "<img src=x>" });
  context.renderParsedGroups(result);

  assert.equal(context.cargaTabelasWarnings.classList.contains("hidden"), false);
  assert.match(context.cargaTabelasWarnings.innerHTML, /<mark>&lt;<\/mark>img src=x&gt;/);
  assert.doesNotMatch(context.cargaTabelasWarnings.innerHTML, /<img/);
  assert.equal(context.cargaTabelasOutput.classList.contains("hidden"), false);
});

test("renders warnings alongside parsed records and preserves whitespace", () => {
  const context = createRenderContext();

  context.renderParsedGroups(parseCargaTabelas({ mode: "tef", input: "8a<bde  Xtail" }));

  assert.match(context.cargaTabelasWarnings.innerHTML, /8a&lt;bde<mark> <\/mark> Xtail/);
  assert.equal(context.cargaTabelasWarnings.classList.contains("hidden"), false);
  assert.equal(context.cargaTabelasOutput.classList.contains("hidden"), true);
  assert.match(context.parsedRecordsContainer.innerHTML, /dukptKey/);
});

test("maps normalized positions back to the original input with whitespace and line breaks", () => {
  const context = createRenderContext();
  const raw = " \r\n8ab \ncd\r\nXtail \n ";
  const result = parseCargaTabelas({ mode: "tef", input: raw });
  assert.equal(result.warnings[0].position, 6);
  assert.equal(context.cargaRawPosition(raw, result.warnings[0].position), raw.indexOf("X"));
  assert.equal(context.cargaRawPosition(raw, 0), raw.indexOf("8"));
  assert.equal(context.cargaRawPosition(raw, 999), null);
});

test("summarizes results and filters by field value without hiding warnings", () => {
  const context = createRenderContext();
  const result = parseCargaTabelas({ mode: "tef", input: "8abcde8ghijkXtail" });
  context.cargaTabelasSearch.value = "gh";
  context.renderParsedGroups(result);

  assert.match(context.cargaTabelasSummary.innerHTML, /Registros<\/span><strong>2/);
  assert.match(context.cargaTabelasSummary.innerHTML, /Alertas<\/span><strong>1/);
  assert.match(context.parsedRecordsContainer.innerHTML, /Registro 2/);
  assert.doesNotMatch(context.parsedRecordsContainer.innerHTML, /Registro 1/);
  assert.match(context.cargaTabelasWarnings.innerHTML, /data-carga-position="12"/);
  context.cargaTabelasSearch.value = "não existe";
  context.renderParsedGroups(result);
  assert.match(context.parsedRecordsContainer.innerHTML, /Nenhum registro corresponde/);
});

test("invalidates results when the input changes", () => {
  const context = createRenderContext();
  context.cargaTabelasResult = { records: [] };
  context.cargaTabelasInput.value = "8abcde";
  context.updateCargaInput();
  assert.equal(context.cargaTabelasRequestId, 1);
  assert.equal(context.cargaTabelasResult, null);
  assert.equal(context.cargaTabelasCount.textContent, "6 caracteres");
  assert.match(context.cargaTabelasOutput.textContent, /entrada foi alterada/);
});

test("ignores a processing response after the input changes", async () => {
  const context = createRenderContext();
  const app = readFileSync(new URL("../frontend/app.js", import.meta.url), "utf8");
  const source = app.slice(app.indexOf("async function fetchCargaTabelasStatus("), app.indexOf("function setIsoParserStatus("));
  let resolveFetch;
  context.SERVER_URL = "";
  context.cargaTabelasTipo = { value: "tef" };
  context.cargaTabelasInput.value = "8abcde";
  context.fetch = () => new Promise(resolve => { resolveFetch = resolve; });
  runInNewContext(source, context);

  const pending = context.processCargaTabelas();
  context.cargaTabelasInput.value = "8other";
  context.updateCargaInput();
  resolveFetch({ ok: true, json: async () => parseCargaTabelas({ mode: "tef", input: "8abcde" }) });
  await pending;

  assert.equal(context.cargaTabelasResult, null);
  assert.match(context.cargaTabelasOutput.textContent, /entrada foi alterada/);
  assert.equal(context.cargaTabelasStatus.textContent, "Entrada alterada");
});
