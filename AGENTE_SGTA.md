# Agente SGTA

Agente leve para rodar na máquina onde o arquivo de log existe. Ele expõe endpoints HTTP que a central SGTA consegue consumir como fonte remota.

## Executar

No pacote enviado ao cliente, edite `agent.config.js` na mesma pasta do executavel:

```js
export const AGENT_CONFIG = {
  PORT: 3100,
  LOG_PATH: "C:\\logs\\aplicacao.log",
  ENCODING: "utf-8",
  MAX_BYTES: 52428800,
  MAX_LINES_PER_READ: 1000,
  TOKEN: "troque-este-token"
};
```

Depois execute:

```bash
./sgta-agent
```

No Windows:

```powershell
.\sgta-agent.exe
```

## Instalar como Windows Service

O pacote inclui o WinSW, que implementa o protocolo nativo do Windows Service
Control Manager e evita o erro 1053. Abra o Prompt de Comando como
Administrador, acesse a pasta do agente e execute:

```bat
install-service.cmd
```

O serviço será registrado como `SGTAAgent`, com inicialização automática
atrasada, diretório de trabalho na pasta do agente, reinício em caso de falha e
rotação dos arquivos de saída em `logs`.

Os arquivos `out.log` e `err.log` incluem data/hora de São Paulo, nível e
origem em cada linha, por exemplo:

```text
[12/08/2026, 11:23:10] [INFO] [supervisor] Iniciando SGTA Agent...
[12/08/2026, 11:23:11] [INFO] [agent] SGTA Agent escutando na porta 3100
```

Para reiniciar ou remover:

```bat
restart-service.cmd
uninstall-service.cmd
```

Se já existir um serviço criado diretamente com `sc.exe`, remova-o antes em um
Prompt de Comando elevado:

```bat
sc.exe stop SGTAAgent
sc.exe delete SGTAAgent
```

Depois copie o pacote completo e execute `install-service.cmd`. Não registre
`sgta-agent.exe` diretamente com `sc.exe`, pois ele é o processo da
aplicação; `SGTAAgentService.exe` é a camada que conversa com o SCM.

O executavel monitora `agent.config.js`. Ao salvar uma alteracao, o supervisor
interno encerra e inicia novamente apenas o processo do agente, aplicando a nova
configuracao sem depender de reinicio manual do servico do sistema operacional.
O mesmo comportamento e usado por `npm run agent` em desenvolvimento.

### Terminal remoto

Cada navegador mantém uma pasta de trabalho separada para cada agente. Assim,
ao executar `cd pasta`, o comando seguinte continua nessa pasta. Em Linux, os
comandos usam o shell configurado em `SHELL` no modo de login, carregando o
perfil e as variáveis de ambiente do usuário que executa o serviço. No Windows,
o terminal usa `ComSpec` (`cmd.exe`) e herda as variáveis do processo do agente;
reinicie o serviço após alterar variáveis de ambiente do sistema ou do usuário.

Em agentes Linux, a tela **Terminal interativo Linux** abre um PTY persistente,
compatível com `vim`, `top`, `less`, cores, setas, Tab e `Ctrl+C`. O servidor do
agente precisa ter `python3` disponível (ou indicar outro executável compatível
em `SGTA_AGENT_PYTHON`) e `ALLOW_EXEC: true`. A sessão é encerrada ao clicar em
**Encerrar**, fechar a página ou perder a conexão WebSocket.

O SGTA central também pode consultar e alterar essa configuração pela tela
Configuração. O central usa a URL e o token da fonte remota cadastrada. O agente
expõe `GET /api/config` e `PUT /api/config`; mantenha um `TOKEN` configurado e
restrinja a porta do agente à rede do servidor central.

Em desenvolvimento, tambem e possivel usar variaveis de ambiente:

```bash
SGTA_AGENT_LOG_PATH="/caminho/para/aplicacao.log" \
SGTA_AGENT_PORT=3100 \
SGTA_AGENT_TOKEN="troque-este-token" \
npm run agent
```

Variaveis de ambiente sobrescrevem os valores de `agent.config.js`.

### Explorador e edição de arquivos

Para navegar, habilite `ALLOW_FS_BROWSE: true`. Para abrir e salvar arquivos de
texto pelo explorador, habilite também `ALLOW_FS_EDIT: true` no `agent.config.js`.
A edição aceita arquivos UTF-8 de até 512 KiB; arquivos binários e maiores são
recusados. Mantenha um `TOKEN` configurado e restrinja a porta do agente à rede
do servidor central, pois essa permissão permite gravar arquivos na máquina do
agente.

Na tela de configuração, o administrador pode enviar arquivos de até 100 MB
para o servidor central ou para um agente cadastrado. O arquivo fica em
`uploads/`, na pasta de instalação do destino; nomes já existentes são
recusados. O recebimento no agente não depende de `ALLOW_FS_EDIT`, mas exige
`TOKEN` configurado e acesso à porta restrito à rede do servidor central.

## Varias fontes na mesma porta

`LOG_PATH` continua funcionando para configuracoes antigas. Para publicar mais
de um arquivo pela mesma instancia e porta, use `LOG_SOURCES`:

```js
export const AGENT_CONFIG = {
  PORT: 3100,
  LOG_SOURCES: {
    autorizador: { label: "Autorizador", PATH: "/var/log/autorizador/app.log" },
    conciliador: { label: "Conciliador", PATH: "/var/log/conciliador/app.log" }
  },
  ENCODING: "utf-8",
  MAX_BYTES: 52428800,
  MAX_LINES_PER_READ: 1000,
  TOKEN: "troque-este-token"
};
```

Quando houver varias fontes, informe `source`, por exemplo
`GET /api/log?source=autorizador`. Se `LOG_PATH` estiver presente, chamadas
antigas sem `source` continuam lendo esse arquivo.

### Arquivos com data no nome

Use `PATH_TEMPLATE` quando o nome muda diariamente. A resolução acontece em
cada leitura, portanto a virada do dia não exige reinício:

```js
importa: {
  label: "Importa Transações",
  PATH_TEMPLATE: "/var/log/importa/{DDMMYYYY}_ImportaTransacaoes.log",
  TIMEZONE: "America/Sao_Paulo",
  DATE_FALLBACK_DAYS: 1
}
```

Marcadores: `{DD}`, `{MM}`, `{YYYY}`, `{YY}`, `{DDMMYYYY}` e `{YYYYMMDD}`.
`DATE_FALLBACK_DAYS` procura arquivos anteriores quando o arquivo de hoje ainda
não existe. O valor `0` (padrão) consulta somente a data atual.

Para arquivos horários, também estão disponíveis `{HH}` (00–23), `{mm}`,
`{YYYYMMDDHH}`, `{YYYYMMDDHHmm}` e `{DDMMYYYYHH}`:

```js
importa: {
  label: "Importa Transações",
  PATH_TEMPLATE: "/var/log/importa/{YYYYMMDDHH}_ImportaTransacoes.log",
  TIMEZONE: "America/Sao_Paulo",
  DATE_FALLBACK_HOURS: 3
}
```

`DATE_FALLBACK_HOURS: 3` tenta a hora atual e as três horas anteriores. É
possível combiná-lo com `DATE_FALLBACK_DAYS`; em templates horários, cada dia
adiciona 24 horas à janela de busca.

No Windows PowerShell:

```powershell
$env:SGTA_AGENT_LOG_PATH="C:\logs\aplicacao.log"
$env:SGTA_AGENT_PORT="3100"
$env:SGTA_AGENT_TOKEN="troque-este-token"
npm run agent
```

## Configurar no SGTA central

Na tela Configuracao, adicione uma aplicacao, selecione o tipo `Agente`, informe a URL do agente e o token.

Exemplo equivalente em `configLogs.js`:

```js
export const LOG_SOURCES = {
  app_remota: {
    label: "Aplicacao Remota",
    type: "remote-http",
    URL: "http://10.0.0.25:3100",
    SOURCE: "autorizador",
    TOKEN: "troque-este-token"
  }
};
```

## Endpoints do agente

- `GET /health`
- `GET /api/log`
- `GET /api/log/tail/realtime?cursor=0&initialLines=50`

Se `SGTA_AGENT_TOKEN` estiver definido, envie o token pelo header `x-sgta-token`.
