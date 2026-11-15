import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { saveUploadedFile } from "../backend/fileUpload.js";

test("saves uploads under the provided directory without replacing existing files", t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "sgta-file-upload-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));

  const destination = path.join(directory, "uploads");
  const uploaded = saveUploadedFile(destination, "release notes.txt", Buffer.from("new file"));

  assert.deepEqual(uploaded, { fileName: "release notes.txt", size: 8 });
  assert.equal(fs.readFileSync(path.join(destination, "release notes.txt"), "utf8"), "new file");
  assert.throws(
    () => saveUploadedFile(destination, "release notes.txt", Buffer.from("replacement")),
    /Já existe um arquivo/
  );
  assert.equal(fs.readFileSync(path.join(destination, "release notes.txt"), "utf8"), "new file");
});

test("rejects unsafe names, empty files, and upload directories that are symlinks", t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "sgta-file-upload-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));

  for (const name of ["../outside.txt", "folder\\file.txt", "CON.txt", "bad?.txt"]) {
    assert.throws(() => saveUploadedFile(path.join(directory, "uploads"), name, Buffer.from("data")), /Nome de arquivo inválido/);
  }
  assert.throws(() => saveUploadedFile(path.join(directory, "uploads"), "empty.txt", Buffer.alloc(0)), /arquivo enviado está vazio/);

  const actualDirectory = path.join(directory, "actual");
  const linkedDirectory = path.join(directory, "uploads");
  fs.mkdirSync(actualDirectory);
  fs.symlinkSync(actualDirectory, linkedDirectory);
  assert.throws(() => saveUploadedFile(linkedDirectory, "file.txt", Buffer.from("data")), /não é uma pasta válida/);
  assert.equal(fs.existsSync(path.join(actualDirectory, "file.txt")), false);
});
