# 🎯 Sistema de Resolução de Caminhos

## Problema Resolvido

A aplicação agora funciona perfeitamente em **dois contextos**:
1. **Desenvolvimento**: `npm start`
2. **Executável**: `npm run build` → `dist/sgta.exe` ou `dist/sgta`

---

## 📐 Como Funciona

### Módulo `paths.js` (Nova Solução)

```javascript
export function getAppDir() {
  // Volta um nível do backend/
  // Funciona em desenvolvimento E no executável pkg
  return path.join(__dirname, "..");
}
```

### Fluxo de Resolução

#### 🔧 Desenvolvimento (npm start)

```
__dirname = C:\...\SGTA\backend
getAppDir() = C:\...\SGTA
LOG_PATH = C:\...\SGTA\logs\app.log ✓
```

#### 📦 Executável (npm run build)

```
__dirname = snapshot/backend (dentro do executável)
getAppDir() = snapshot (raiz do executável)
LOG_PATH = snapshot/logs/app.log ✓
```

---

## 📁 Estrutura

### Desenvolvimento
```
SGTA/
├── backend/
│   ├── server.js
│   ├── logger.js
│   ├── logReader.js
│   ├── paths.js          ← NOVO
│   ├── configLogs.js
│   └── ...
├── frontend/
│   └── ...
└── logs/                 ← Criado automaticamente
    └── app-server.log
```

### Após Build
```
dist/
├── sgta.exe              ← Executável Windows
├── sgta                  ← Executável Linux
├── configLogs.js         ← Copiado automaticamente
├── paths.js              ← Copiado automaticamente
└── logs/                 ← Criado automaticamente
    └── app-server.log
```

---

## 🎮 Uso

### Debug (Desenvolvimento)
```bash
npm start
```
Acesse: http://localhost:3000

### Build (Geração de Executável)
```bash
npm run build
```

### Executar após Build

**Windows:**
```bash
dist\sgta.exe
```

**Linux:**
```bash
./dist/sgta
```

---

## ✅ Vantagens da Solução

- ✅ **Sem caminhos hardcoded**
- ✅ **Funciona em desenvolvimento e em produção**
- ✅ **Portável entre máquinas**
- ✅ **Compatível com pkg (bundler)**
- ✅ **Logs e config na mesma pasta do executável**
- ✅ **Simples e sem complicações**

---

## 📝 Configuração

Edite `dist/configLogs.js` (ou `backend/configLogs.js` em dev):

```javascript
export const LOG_CONFIG = {
  PATH: "logs/app.log",        // Relativo ao diretório de app
  ENCODING: "utf-8",
  MAX_BYTES: 10 * 1024 * 1024,
  MAX_LINES_PER_READ: 100
};

export const PORT_SERVER = 3000;
```
