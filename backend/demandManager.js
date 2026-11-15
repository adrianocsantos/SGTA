import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getAppDir } from "./paths.js";

export const DEMAND_STATUSES = ["backlog", "todo", "doing", "blocked", "done"];
const PRIORITIES = ["low", "medium", "high", "urgent"];
const DATA_DIR = process.env.SGTA_DATA_DIR
  ? path.resolve(process.env.SGTA_DATA_DIR)
  : path.join(getAppDir(), "data");
const DATA_FILE = path.join(DATA_DIR, "demandas.json");

function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) writeStore([]);
}

function readStore() {
  ensureStore();
  const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8") || "[]");
  if (!Array.isArray(parsed)) throw new Error("Arquivo de demandas inválido.");
  return parsed;
}

function writeStore(demands) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const temporary = path.join(DATA_DIR, `.demandas.${process.pid}.${Date.now()}.tmp`);
  fs.writeFileSync(temporary, `${JSON.stringify(demands, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  fs.renameSync(temporary, DATA_FILE);
}

function cleanText(value, maxLength = 5000) {
  return String(value || "").trim().slice(0, maxLength);
}

function normalizeSubtasks(value, current = []) {
  if (!Array.isArray(value)) return Array.isArray(current) ? current : [];
  return value.slice(0, 100).map(item => ({
    id: cleanText(item?.id, 80) || crypto.randomUUID(),
    title: cleanText(item?.title, 180),
    completed: Boolean(item?.completed)
  })).filter(item => item.title);
}

function normalizeDemand(input, current = {}) {
  const title = cleanText(input.title ?? current.title, 180);
  if (!title) throw new Error("Informe o título da demanda.");

  const status = DEMAND_STATUSES.includes(input.status) ? input.status : (current.status || "backlog");
  const priority = PRIORITIES.includes(input.priority) ? input.priority : (current.priority || "medium");
  const tags = Array.isArray(input.tags)
    ? input.tags.map(tag => cleanText(tag, 40)).filter(Boolean).slice(0, 10)
    : (current.tags || []);

  return {
    ...current,
    title,
    description: cleanText(input.description ?? current.description),
    project: cleanText(input.project ?? current.project, 120),
    assignee: cleanText(input.assignee ?? current.assignee, 100),
    category: cleanText(input.category ?? current.category, 100),
    dueDate: cleanText(input.dueDate ?? current.dueDate, 10),
    priority,
    status,
    tags,
    subtasks: normalizeSubtasks(input.subtasks, current.subtasks)
  };
}

function sortDemands(demands) {
  return [...demands].sort((a, b) => {
    const statusDiff = DEMAND_STATUSES.indexOf(a.status) - DEMAND_STATUSES.indexOf(b.status);
    return statusDiff || Number(a.order || 0) - Number(b.order || 0);
  });
}

export function listDemands() {
  return { demands: sortDemands(readStore()), dataFile: DATA_FILE };
}

export function createDemand(input) {
  const demands = readStore();
  const now = new Date().toISOString();
  const normalized = normalizeDemand(input || {});
  const order = demands.filter(item => item.status === normalized.status).length;
  const demand = { id: crypto.randomUUID(), ...normalized, order, createdAt: now, updatedAt: now };
  demands.push(demand);
  writeStore(demands);
  return demand;
}

export function updateDemand(id, input) {
  const demands = readStore();
  const index = demands.findIndex(item => item.id === id);
  if (index < 0) throw new Error("Demanda não encontrada.");
  const previousStatus = demands[index].status;
  const demand = normalizeDemand(input || {}, demands[index]);
  demand.updatedAt = new Date().toISOString();
  if (demand.status !== previousStatus) {
    demand.order = demands.filter(item => item.status === demand.status).length;
  }
  demands[index] = demand;
  writeStore(demands);
  return demand;
}

export function moveDemand(id, status, position) {
  if (!DEMAND_STATUSES.includes(status)) throw new Error("Coluna de destino inválida.");
  const demands = readStore();
  const demand = demands.find(item => item.id === id);
  if (!demand) throw new Error("Demanda não encontrada.");

  demand.status = status;
  demand.updatedAt = new Date().toISOString();
  const destination = demands
    .filter(item => item.status === status && item.id !== id)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  const safePosition = Math.max(0, Math.min(Number(position) || 0, destination.length));
  destination.splice(safePosition, 0, demand);
  destination.forEach((item, index) => { item.order = index; });
  writeStore(demands);
  return demand;
}

export function deleteDemand(id) {
  const demands = readStore();
  const next = demands.filter(item => item.id !== id);
  if (next.length === demands.length) throw new Error("Demanda não encontrada.");
  writeStore(next);
}
