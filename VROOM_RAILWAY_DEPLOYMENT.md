# 🚀 GUIA DE IMPLANTAÇÃO DO SERVIÇO SATÉLITE VROOM NO RAILWAY (LOGUSQ)

Este guia orienta a implantação do motor de pesquisa operacional **VROOM (Vehicle Routing Open-source Optimization Machine)** em C++ como um serviço satélite na plataforma **Railway**, integrado ao ecossistema do **LogusQ**.

---

## 📌 O que é o VROOM?
O **VROOM** é um motor de otimização de frotas e roteirização industrial de altíssima performance escrito em C++. Ele resolve problemas complexos de **VRP (Vehicle Routing Problem)**, **VRPTW (com janelas de tempo)** e **Logística Reversa (Shipments de Coleta e Entrega Dependente)** em milissegundos.

---

## 🛠️ Passo a Passo para Subir o VROOM no Railway

### Passagem 1: Criar o Novo Serviço Satélite no Railway
1. Acesse o seu Dashboard no **[Railway](https://railway.app/)**.
2. Abra o projeto onde a aplicação **LogusQ** já está rodando.
3. Clique em **"+ New"** > **"GitHub Repo"** (ou crie um novo serviço em branco).
4. Selecione o repositório do LogusQ.
5. Nas configurações do novo serviço, renomeie o serviço para `vroom-service`.

### Passagem 2: Configurar o Dockerfile do VROOM
1. No menu de configurações (**Settings**) do serviço `vroom-service` no Railway:
   - Vá até a seção **Build**.
   - Em **ConfigFile / Dockerfile Path**, informe: `Dockerfile.vroom` (ou aponte para a imagem `ghcr.io/vroom-project/vroom-express:latest`).

### Passagem 3: Variáveis de Ambiente no Railway (`vroom-service`)
No menu **Variables** do `vroom-service`, adicione as seguintes variáveis:

| Variável | Valor Padrão | Descrição |
| :--- | :--- | :--- |
| `PORT` | `3000` | Porta HTTP interna do vroom-express |
| `VROOM_ROUTER` | `osrm` | Roteador de matriz de distâncias (OSRM / OpenRouteService) |
| `OSRM_HOST` | `router.project-osrm.org` | Servidor público OSRM para malha viária real |
| `OSRM_PORT` | `80` | Porta do servidor OSRM |

---

### Passagem 4: Conectar o LogusQ ao VROOM via Rede Privada do Railway
1. No Railway, adicione um **Private Domain** ou copie a URL de rede interna do `vroom-service` (ex: `http://vroom-service.railway.internal:3000` ou a URL pública HTTPS gerada pelo Railway).
2. Abra as **Variables** do serviço principal do **LogusQ** no Railway.
3. Adicione a variável de ambiente:
   ```env
   VROOM_URL=http://vroom-service.railway.internal:3000
   ```
4. Faça o **Redeploy** do serviço principal do LogusQ.

---

## 🔄 Como Funciona a Fallback Automático (Resiliência Operacional)
O backend do LogusQ (`server.js` e `routingEngine.ts`) inclui um mecanismo de resiliência em camadas:
1. **Camada 1 (Principal):** Envia o payload estruturado (jobs + shipments de logística reversa) para o motor **VROOM** via HTTP POST em `VROOM_URL`.
2. **Camada 2 (Fallback Inteligente):** Se a variável `VROOM_URL` não estiver configurada, o serviço estiver offline ou ocorrer timeout, o LogusQ ativa automaticamente a otimização local via **Node.js Worker Threads (K-Means++ e 2-Opt TSP)**.

O sistema **jamais falhará ou sairá do ar** para o usuário final!

---

## 🧪 Como Testar a Rota do VROOM
Você pode testar a saúde do serviço diretamente via cURL:

```bash
# Teste de Health Check
curl http://localhost:3000/health

# Teste de Roteirização VROOM (POST /)
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -d '{
    "vehicles": [{"id": 1, "profile": "car", "start": [-43.9386, -19.9388], "end": [-43.9386, -19.9388]}],
    "jobs": [{"id": 1, "location": [-43.9286, -19.9288], "delivery": [10]}]
  }'
```
