# SGTA — Suíte de Gestão Técnica da Adquirência

Suíte de serviços de TI para adquirência, com leitura de logs em tempo real, processamento de cargas de tabelas e acesso remoto a servidores.

## 🚀 Inicialização

### Pré-requisitos
- Node.js instalado
- Dependências instaladas: `npm install`
- Arquivo privado `license/private.js`, disponibilizado separadamente e sem inclusão no Git; é necessário para iniciar, compilar e executar os testes de licença.
- Licença válida disponibilizada separadamente para iniciar a aplicação.

### Passo 1: Instalar dependências (primeira vez)
```bash
npm install
```

### Passo 2: Iniciar o servidor
```bash
npm start
```

Ou manualmente:
```bash
cd backend
node ./server.js
```

### Passo 3: Abrir no navegador
Acesse: **http://localhost:3000**

## � Build Executável

Gerar executáveis (.exe para Windows e binário para Linux):

```bash
npm run build
```

Os arquivos compilados ficarão em `dist/`:
- `sgta.exe` (Windows)
- `sgta` (Linux)
- `configLogs.js` (configuração editável)
- `logs/` (pasta para armazenar logs)

O arquivo de licença não é incorporado nem copiado pelo build. Para executar a
aplicação, disponibilize manualmente `license.lic` na mesma pasta do executável:

```text
dist/
├── sgta.exe       # ou sgta no Linux
└── license.lic    # licença externa obrigatória
```

### Executar após build

**Windows:**
```bash
.\dist\sgta.exe
```

**Linux:**
```bash
./dist/sgta
```

## 📁 Estrutura

```
SGTA/
├── backend/
│   ├── server.js           # Servidor principal (Express + Socket.IO)
│   ├── socket.js           # Eventos WebSocket
│   ├── logReader.js        # Leitura de logs
│   ├── configLogs.js       # Configurações
│   ├── logger.js           # Sistema de logs
│   └── logs/               # Arquivos de log
├── frontend/
│   ├── index.html          # Interface
│   ├── app.js              # Lógica do cliente
│   └── style.css           # Estilos
├── scripts/
│   └── build.js            # Script de build
├── dist/                   # (Gerado após build)
│   ├── sgta.exe            # Executável Windows
│   ├── sgta                # Executável Linux
│   ├── configLogs.js
│   └── logs/
└── logs/                   # Logs da aplicação
```

## 🎯 Funcionalidades

- **Log Completo**: Carrega todo o arquivo de log
- **Real Time**: Monitora novos registros em tempo real (a cada 3 segundos)
- **Parar**: Interrompe o monitoramento
- **Carga de Tabelas**: Processa registros posicionais TEF (POS ainda não implementado), com resumo, busca e navegação até os alertas na entrada. Nos alertas, destaca o caractere na posição indicada e mostra até 20 caracteres anteriores e 20 seguintes; a posição começa em zero e considera a entrada sem quebras de linha e sem espaços nas extremidades. O ponto indicado marca o início do registro problemático, que pode estar incompleto ou desalinhado.
- **Parser ISO**: Interpreta mensagens ISO 8583 em texto de bytes (ASCII / Latin-1) ou hexadecimal nos perfis `ISO8583_Parse3` e `ISO8583_93`, com seleção automática pelo MTI. O DE35 é exibido sem máscara; no perfil `ISO8583_93`, o DE2 continua mascarado. Para campos binários, prefira o hexadecimal dos bytes originais, pois copiar texto pode alterar bytes de controle. Se o DE52 for binário, selecione a opção de 8 bytes; o padrão é texto hexadecimal de 16 caracteres. No perfil `ISO8583_Parse3`, o DE53 é lido como texto com prefixo de comprimento de dois dígitos.
- **Acesso Remoto**: Executa comandos e navega em servidores por meio do agente
- **Gestão de Demandas**: Quadro Kanban com cards persistidos externamente em `data/demandas.json`

### Senha para Operações Remotas

Na primeira abertura da tela **Operações Remotas**, se ainda não houver admin
nem senha mestra, a própria interface oferece a configuração inicial. A
primeira pessoa que concluir esse cadastro será administradora; faça o
bootstrap somente em uma rede controlada, pois não existe identidade anterior
para distinguir visitantes. Em produção, prefira definir
`SGTA_REMOTE_OPERATIONS_PASSWORD` no ambiente do servidor antes de expor a
interface; nesse modo, entre como `admin` usando essa senha.

O administrador pode criar acessos nomeados permanentes ou temporários
(1 hora, 8 horas, 24 horas ou 7 dias) e revogá-los em **Gerenciar acessos**.
Cada sessão dura no máximo oito horas e acessos temporários não sobrevivem à
expiração da credencial.

A mesma sessão protege também a tela **Configurações**, incluindo a edição da
configuração central e a atualização do binário do servidor. Leitura de logs e
os outros módulos não são afetados por essa autenticação.

Somente a conta `admin` pode criar ou revogar acessos. Cada conta adicional
usa um nome de usuário próprio e uma senha com pelo menos 12 caracteres.

As credenciais criadas ficam em `data/remote-operations-credentials.json`,
com salt e hash scrypt; as senhas em texto não são armazenadas. Proteja o
arquivo de credenciais e mantenha a senha mestra no ambiente do serviço quando
usar esse modo de autenticação.

Linux/macOS, iniciando pelo shell:

```bash
export SGTA_REMOTE_OPERATIONS_PASSWORD='defina-uma-senha-forte'
npm start
```

Windows PowerShell:

```powershell
$env:SGTA_REMOTE_OPERATIONS_PASSWORD = 'defina-uma-senha-forte'
.\dist\sgta.exe
```

Para serviço Windows, configure a variável no ambiente do serviço antes de
instalá-lo/iniciá-lo. Não grave a senha em `configLogs.js`, `agent.config.js`
ou no código-fonte.

## ⚙️ Configurações

Edite `backend/configLogs.js` (ou `dist/configLogs.js` após build):
```javascript
export const LOG_CONFIG = {
  PATH: "../logs/app.log",              // Caminho do arquivo de log
  ENCODING: "utf-8",
  MAX_BYTES: 10 * 1024 * 1024,          // Tamanho máximo (10MB)
  MAX_LINES_PER_READ: 100                // Máximo de linhas por coleta
};

export const PORT_SERVER = 3000;         // Porta do servidor
```

## 🧪 Teste com dados simulados

Gerar logs de teste:
```bash
sh teste_tail_log.sh
```

Isso cria 100.000 registros com `sleep 3` a cada 100 registros.

## 🐞 Debug no VS Code

Ao depurar com o debugger integrado do VS Code, é conveniente desabilitar o restart automático para evitar conflitos com o adaptador de depuração.

Adicione a variável de ambiente `NO_AUTO_RESTART=1` no `launch.json` para desabilitar o comportamento de reinício automático durante sessões de debug.

Exemplo de configuração de depuração (veja `.vscode/launch.json`):

- **Chave:** `NO_AUTO_RESTART` — define como `1` para evitar que o processo seja reiniciado automaticamente.

Quando terminar a depuração, remova ou altere a variável para restaurar o comportamento de restart automático em ambientes não depurados.
