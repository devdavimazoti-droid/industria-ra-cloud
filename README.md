# Sistema de Apoio à Manutenção Industrial com Realidade Aumentada e Serviços em Nuvem

Projeto da Situação de Aprendizagem integrada (Realidade Aumentada + Computação em Nuvem).

- Tema: Centro de Usinagem CNC
- Integrantes: Davi Mazoti Back-End(Docker e Docker Compose, Broker MQTT, API Flask, Comunicação entre os serviços.)  //  João Guilherme Araujo Nunes Front-End(HTML, CSS, JavaScript, A-Frame, MidAr, Integração com a API, Experiência WebAR).

## O que o projeto faz

O técnico aponta a câmera do celular para a identificação visual (target) do centro de usinagem. A aplicação WebAR reconhece o equipamento e mostra 5 pontos interativos (hotspots) em cima da máquina:

1. Área de usinagem
2. Painel de comando
3. Proteção
4. Magazine de ferramentas
5. Monitoramento

Os hotspots 1 a 4 mostram informações técnicas que ficam no próprio frontend. O hotspot 5 consulta a API Flask e mostra os dados de monitoramento (status, temperatura, vibração, horário da atualização e dados de manutenção). Se a API estiver fora do ar, a aplicação continua funcionando e mostra uma mensagem explicando que não foi possível consultar os dados.

**Importante:** todos os valores de temperatura, vibração, status e manutenção são SIMULADOS.


**Diagrama Arquitetura:**

+----------------------------------------------------------------------------------------------------+
|  DISPOSITIVO MÓVEL (Smartphone / Tablet)                                                           |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | Frontend WebAR (A-Frame / MindAR)                                                            |  |
|  | - HTML, CSS, JavaScript                                                                      |  |
|  | - Exibe a câmera e reconhece o Target (.mind)                                                |  |
|  | - Mostra Hotspots 1 a 4 (Dados Estáticos) e Hotspot 5 (Dinâmico)                             |  |
|  +----------------------------------------------------------------------------------------------+  |
|         |                                                                        |                 |
|         | (Abre a câmera via HTTPS)                                              | (HTTP / JSON)   |
|         v                                                                        v                 |
|  [ Navegador do Celular ]                                            [ Requisição GET /api/maquina ]|
+----------------------------------------------------------------------------------|-----------------+
                                                                                   |
                                                                                   | (Rede Externa / 
                                                                                   |  Encaminhamento HTTPS)
                                                                                   v
+----------------------------------------------------------------------------------------------------+
|  DOCKER COMPOSE (Ambiente de Containers Isolados)                                                  |
|                                                                                                    |
|      +-----------------------+              +------------------------+                             |
|      |  API Flask            |              |  Broker MQTT           |                             |
|      |  (Porta 5000)         |              |  (Mosquitto - P 1883)  |                             |
|      |                       |              |                        |                             |
|      |  - Rota /api/maquina  | <----------- |  - Recebe publicações  |                             |
|      |  - Salva em memória   |  (Inscrita   |  - Entrega mensagens   |                             |
|      +-----------------------+   no Tópico) +------------------------+                             |
|                  ^                                       ^                                         |
|                  |                                       |                                         |
|                  +------------------+--------------------+                                         |
|                                     |                                                              |
|                       +---------------------------+                                                |
|                       |  Simulador (Python)       |                                                |
|                       |                           |                                                |
|                       |  - Publica dados fictícios|                                                |
|                       |    a cada 5 segundos      |                                                |
|                       +---------------------------+                                                |
+----------------------------------------------------------------------------------------------------+

## Arquitetura

- **Frontend WebAR** (HTML, CSS, JavaScript, A-Frame e MindAR): reconhece o target, mostra os hotspots e consulta a API por HTTP/JSON.
- **API Flask**: recebe os dados do broker, guarda o último dado em memória e responde em JSON.
- **Broker MQTT (Mosquitto)**: recebe os dados publicados pelo simulador e entrega para a API.
- **Simulador**: publica dados fictícios no broker a cada 5 segundos.
- **Docker e Docker Compose**: sobem e conectam os três serviços (api, mqtt e simulator) com um comando só.

O navegador não fala MQTT. Ele só faz HTTP/JSON com a API, e a API é quem fica inscrita no tópico MQTT.

### Por que usar containers aqui

- Cada serviço roda isolado, com as próprias dependências (Flask e paho-mqtt na API, paho-mqtt no simulador), sem misturar nada na máquina de quem for rodar.
- Qualquer pessoa do grupo (ou o professor) sobe o projeto igual, com `docker compose up`, sem instalar Python, Mosquitto nem configurar nada à mão.
- Os serviços se acham pela rede interna do Compose, usando o nome do serviço no lugar de IP, e dá para parar um serviço sozinho (por exemplo só a API) para testar a falha.

## Estrutura do repositório

```
industria-ra-cloud/
├── README.md
├── compose.yaml
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   ├── js/app.js
│   └── assets/
│       ├── images/        (foto usada como target)
│       └── target/        (arquivo .mind)
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── Dockerfile
├── mqtt/
│   └── mosquitto.conf
├── simulator/
│   ├── simulator.py
│   ├── Dockerfile
│   └── requirements.txt
└── docs/
    ├── arquitetura.png
    └── testes.md
```

## Serviços, portas e dependências

| Serviço (container) | O que faz | Porta | Depende de |

|---|---|---|---|

| api | API Flask (GET /api/maquina) | 5000 | mqtt |
| mqtt | Broker Mosquitto | 1883 | null |
| simulator | Publica dados fictícios no broker | null | mqtt |

O frontend não roda no Compose: é um site estático que fica publicado em HTTPS. Para testar no computador, usa-se um servidor local na porta 8080.

O broker precisa estar no ar antes da API e do simulador. No Compose isso já é tratado com a dependência entre os serviços.

## Como executar

### Pré-requisitos

- Docker e Docker Compose instalados
- Navegador de celular compatível com WebAR (testado com Chrome no Android)

### Subindo os serviços com Docker Compose

Na pasta raiz do projeto:

```
docker compose up --build
```

Isso constrói a imagem da API e do simulador e sobe os três containers (api, mqtt e simulator). Para rodar em segundo plano, use `docker compose up --build -d`.

Comandos úteis:

```
docker compose ps                  (ver os serviços rodando)
docker compose logs -f api         (acompanhar os logs da API)
docker compose logs -f simulator   (ver os dados sendo publicados)
docker compose down                (parar e remover tudo)
```

Testar se a API está respondendo:

```
url http://localhost:5000/api/maquina
```

Nos primeiros segundos, antes do simulador publicar o primeiro dado, a API responde 404 com a mensagem "Nenhum dado recebido até o momento". Depois disso ela passa a responder com os dados.

### Simulando uma falha da API (para a demonstração)

```

docker compose stop api       (a RA passa a mostrar a mensagem de indisponibilidade)
docker compose start api      (a consulta volta a funcionar)

```

### Rodando sem Docker (opcional)

Se quiser rodar cada serviço direto na máquina, precisa de Python 3 e Mosquitto instalados. Em três terminais, na ordem abaixo.

1. Broker, na pasta raiz do projeto:

```
mosquitto -c mqtt/mosquitto.conf

```

2. API:

```
cd backend
python -m venv venv
source venv/bin/activate        (no Windows: venv\Scripts\activate)
pip install -r requirements.txt
python app.py
```

3. Simulador:

```
cd simulator
python -m venv venv
source venv/bin/activate        (no Windows: venv\Scripts\activate)
pip install -r requirements.txt
python simulator.py
```

Nesse modo, o endereço do broker usado pela API e pelo simulador tem que ser `localhost`.

## Frontend (WebAR)

Para testar no computador:

```
cd frontend
python -m http.server 8080
```

Abra `http://localhost:8080` no navegador. A câmera funciona em `localhost`.

No celular a câmera só funciona em HTTPS, então o frontend precisa estar publicado como site estático (Netlify, Vercel ou GitHub Pages) ou aberto por um túnel HTTPS. A URL publicada fica no topo deste README.

O endereço da API fica no começo do `frontend/js/app.js`:

```

const API_URL = "http://localhost:5000";

```

No celular, `localhost` é o próprio celular, então esse valor precisa apontar para onde a API está rodando (o IP do computador na mesma rede ou uma URL pública). Se o frontend estiver em HTTPS, a API também precisa estar em HTTPS, senão o navegador bloqueia a chamada.

Para testar o reconhecimento, abra a imagem `frontend/assets/images/centro-usinagem-target.jpg` em outra tela (ou imprima) e aponte a câmera do celular.

## API

### GET /api/maquina

Retorna o último dado recebido do broker.

Exemplo de resposta (200):

```json
{
  "status": "EM OPERAÇÃO",
  "temperatura": 47.2,
  "vibracao": 3.1,
  "ultimaAtualizacao": "2026-10-05T10:42:16",
  "manutencao": {
    "horasUso": "300",
    "proximaRevisao": "12-03-2027"
  }
}
```

Se a API ainda não recebeu nenhum dado do broker, responde 404:

```json
{ "mensagem": "Nenhum dado recebido até o momento" }
```

O último dado fica guardado só em memória na API. Se ela reiniciar, o dado some até o simulador publicar o próximo (no máximo 5 segundos depois).

## MQTT

- Tópico: `centroUsi/status`
- Quem publica: o simulador, a cada 5 segundos
- Quem assina: a API Flask
- Payload: o mesmo JSON mostrado acima, com temperatura e vibração aleatórias

Para publicar um valor na mão e ver a RA atualizar:

```
docker compose exec mqtt mosquitto_pub -t centroUsi/status -m '{"status":"EM OPERAÇÃO","temperatura":50.0,"vibracao":2.0,"ultimaAtualizacao":"2026-10-05T10:00:00","manutencao":{"horasUso":"300","proximaRevisao":"12-03-2027"}}'
```

Depois é só tocar de novo no hotspot 5 (ou no botão de consultar) e o novo valor aparece na RA. Como o simulador publica a cada 5 segundos, o valor manual pode ser trocado pelo do simulador logo em seguida.

## Testes

A matriz de testes está em `docs/testes.md`.

## Problemas comuns

- **A câmera não abre:** o navegador só libera a câmera em HTTPS ou em localhost. Confira se o site está publicado em HTTPS.
- **O hotspot 5 sempre mostra a mensagem de indisponibilidade:** confira o `API_URL` no `app.js` (no celular não pode ser localhost) e se a API está rodando (`docker compose ps`).
- **O hotspot 5 mostra "Aguardando dados do equipamento":** a API está no ar, mas ainda não recebeu nada do broker. Confira se o simulador está rodando (`docker compose logs -f simulator`).
- **Os hotspots não aparecem:** o target ainda não foi reconhecido. Melhore a luz e aponte a câmera de frente para a imagem.