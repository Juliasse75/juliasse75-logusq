# DOSSIÊ TÉCNICO E DE ARQUITETURA — SISTEMA LOGUSQ
**Torre de Controle Logística, Roteirização Avançada e Contingenciamento de Emergências**

---

## 1. INTRODUÇÃO E PROPÓSITO DO SISTEMA

O **LogusQ** é uma plataforma SaaS (Software as a Service) de alto desempenho focada na **otimização de rotas de última milha (last-mile)**, **gestão de frotas**, **monitoramento em tempo real (Torre de Controle)** e **contingenciamento inteligente de cargas em situações de emergência (Cross-Docking de suporte)**. 

O sistema foi concebido para resolver três grandes gargalos do setor logístico:
1. **Ineficiência na roteirização:** Desperdício de quilometragem e tempo de serviço devido à falta de algoritmos matemáticos na ordenação de entregas.
2. **Falta de visibilidade em tempo real:** Distanciamento de comunicação entre a equipe operacional administrativa e os motoristas em campo.
3. **Incapacidade de reação a panes e acidentes:** A falta de ferramentas ágeis para transferir cargas de um veículo avariado para outros veículos ativos sem interromper os SLAs (Service Level Agreements) de entrega.

---

## 2. ARQUITETURA DE SOFTWARE E VISÃO GERAL

O LogusQ possui uma arquitetura modular baseada em **React 18** com **Vite**, utilizando **TypeScript** de forma rigorosa para garantir a segurança de tipos e previsibilidade de dados. 

### 2.1 Componentes Arquiteturais

```
                                  +-----------------------+
                                  |      LoginCadastro    | (Portal de Entrada, Auth)
                                  +-----------+-----------+
                                              |
                     +------------------------+------------------------+
                     |                        |                        |
         +-----------v-----------+  +---------v-----------+  +---------v-----------+
         |    DashboardMaster    |  |   DashboardCliente  |  | DashboardMotorista  |
         | (Gestão de Clientes,  |  |  (Torre de Controle,|  | (App do Motorista,  |
         |  Planos SaaS e Logs)  |  |  Roteirizador, etc) |  |   Rotas e SOS)      |
         +-----------------------+  +---------+-----------+  +---------+-----------+
                                              |                        |
                                              v                        v
                                  +-----------v-----------+            |
                                  |      SimulatedMap     |            |
                                  | (Painel de Mapa GIS,  |<-----------+
                                  |  Alertas SOS Ativos)  |
                                  +-----------------------+
```

### 2.2 Estrutura do Projeto

O código está estruturado de forma limpa e modular:
* `/src/types.ts`: Definições globais de interfaces de dados e tipos TypeScript.
* `/src/data/mockData.ts`: Banco de dados simulado e persistente (`dbRepo`) que opera através do `LocalStorage`, sincronizando alterações entre as sessões dos usuários (Master, Clientes e Motoristas).
* `/src/utils/routingEngine.ts`: O motor matemático de geocodificação, cálculo de distâncias (Haversine), agrupamento espacial (K-Means) e ordenação de rotas (TSP - Caixeiro Viajante).
* `/src/components/LoginCadastro.tsx`: Interface de controle de acesso, criação de contas e gerenciamento de perfil.
* `/src/components/DashboardMaster.tsx`: Painel de administração geral do ecossistema LogusQ.
* `/src/components/DashboardCliente.tsx`: O cérebro logístico do cliente (operador), contendo a criação de rotas, controle de frotas e o transbordo emergencial.
* `/src/components/DashboardMotorista.tsx`: Aplicativo Web do motorista para acompanhamento, atualização de entregas e acionamento de SOS.
* `/src/components/SimulatedMap.tsx`: Visualizador geográfico baseado na biblioteca Leaflet.js, renderizando rotas direcionais, densidade de clientes e sinalizações dinâmicas de emergência.

---

## 3. MODELAGEM DE DADOS (DATABASE SCHEMA)

O sistema utiliza estruturas relacionais e documentos mapeados no `src/types.ts` e persistidos localmente. Cada modelo de dados possui validação de campos:

### 3.1 `Usuario`
Mapeia todos os perfis cadastrados no LogusQ.
* `email` (`string`): Identificador único do usuário.
* `nome` (`string`): Nome do usuário ou condutor.
* `perfil` (`'MASTER' | 'CLIENTE' | 'MOTORISTA'`): Define os níveis de renderização e permissões.
* `empresa` (`string`, opcional): Razão social ou nome fantasia associado ao cliente.
* `veiculo` (`string`, opcional): Identificador do veículo vinculado (apenas para motoristas).
* `nivelAcesso` (`string`, opcional): Nível de controle interno ('TOTAL' ou 'LIMITADO').
* `criadoEm` (`string`): Timestamp ISO de criação do registro.

### 3.2 `Cliente`
Controla os dados das empresas de logística cadastradas na plataforma.
* `idCliente` (`string`): Código identificador único do cliente.
* `email` (`string`): Conta de e-mail do gestor principal.
* `empresa` (`string`): Nome corporativo da empresa de transporte.
* `cnpj` (`string`, opcional): Cadastro Nacional da Pessoa Jurídica.
* `plano` (`'POC' | 'Start' | 'Pro' | 'Enterprise'`): Nível do contrato SaaS.
* `status` (`'Ativo' | 'Bloqueado' | 'Cancelado'`): Estado de operação do cliente.
* `valorPlano` (`number`): Valor recorrente mensal cobrado.
* `pagamentoConfirmado` (`boolean`): Estado de adimplência do cliente.
* `respNome` (`string`): Nome do responsável legal/operacional pela conta.

### 3.3 `Veiculo`
Controla o inventário de frotas dos clientes.
* `idVeiculo` (`string`): Identificador único do veículo.
* `placa` (`string`): Registro legal do veículo (padrão Mercosul ou antigo).
* `modelo` (`string`): Descrição do modelo (ex: "Fiorino 1.4 EVO").
* `tipo` (`'Carro Leve' | 'Picape 4x4' | 'Van' | 'Caminhão Pesado' | 'Motocicleta'`): Categoria operacional.
* `capacidadeKg` (`number`): Carga útil máxima em quilos (crucial para o algoritmo de transbordo).
* `status` (`'Disponivel' | 'Manutencao' | 'Inativo'`): Estado técnico do veículo.
* `defeito` (`string`, opcional): Descrição de falhas quando em manutenção.

### 3.4 `Condutor` (Motorista)
Gerencia os motoristas vinculados a cada frota.
* `id` (`string`): Identificador interno.
* `nome` (`string`): Nome completo do motorista.
* `cpf` (`string`): Cadastro de Pessoa Física.
* `cnh` (`string`): Registro da Carteira Nacional de Habilitação.
* `categoriaCnh` (`string`): Categoria (A, B, C, D, E).
* `vencCnh` (`string`): Data de validade da habilitação.
* `email` (`string`): E-mail usado para login no aplicativo de bordo.
* `veiculo` (`string`): Placa ou ID do veículo vinculado ao motorista de forma permanente ou dinâmica.
* `status` (`'Ativo' | 'Afastado' | 'Férias' | 'Licença' | 'Inativo'`): Estado ocupacional do condutor.

### 3.5 `Entrega`
Objeto de dados que representa um ponto de parada geográfico na rota de entrega ou coleta.
* `id` (`string`): ID único da fatura ou ponto.
* `chave` (`string`): Chave única de acesso / controle interno.
* `cliente` (`string`): Nome da pessoa física ou jurídica que receberá a mercadoria.
* `endereco` (`string`): Endereço físico completo que alimenta o geocodificador.
* `pontoReferencia` (`string`, opcional): Detalhes adicionais para apoiar o motorista localmente.
* `latitude` (`number`) e `longitude` (`number`): Coordenadas GPS calculadas ou importadas.
* `pesoMercadoriaKg` (`number`): Peso bruto da carga deste ponto de entrega (usado nas restrições de capacidade).
* `tipoOperacao` (`'Entrega' | 'Coleta'`): Tipo de atividade na parada.
* `status` (`'Pendente' | 'Entregue' | 'Cancelado'`): Estado da operação na parada.
* `observacao` (`string`, opcional): Detalhes de justificativas, observações de atrasos ou anotações de ocorrência.
* `motoristaNome` (`string`, opcional): Nome do motorista encarregado.

### 3.6 `AuditLog`
Mapeia as ações críticas do sistema para fins de auditoria e segurança.
* `id` (`string`): Identificador do log.
* `dataHora` (`string`): Data e hora da ação.
* `operadorEmail` (`string`): E-mail do usuário que realizou a ação.
* `acao` (`string`): Título descritivo da ação (ex: "Exclusão de Condutor").
* `descricao` (`string`): Detalhes técnicos e operacionais do evento.
* `modulo` (`'Clientes' | 'RH' | 'Financeiro' | 'Geral'`): Módulo de origem.
* `status` (`'Sucesso' | 'Erro'`): Indicador do resultado da ação.

---

## 4. PERSISTÊNCIA E SINCRONIZAÇÃO EM TEMPO REAL (`mockData.ts`)

O banco de dados é governado pelo repositório dinâmico **`dbRepo`**. Embora seja um ambiente simulado para demonstração prática e offline, ele funciona com consistência total e sincronização local por meio do `localStorage`. 

### 4.1 Mecanismo de Sincronização Cruzada (Cross-Role)
Os motoristas e os clientes acessam a mesma base de dados simulada. Quando o motorista atualiza o status de uma entrega para `'Entregue'` no seu aplicativo:
1. O aplicativo salva a alteração no `localStorage` usando a chave correspondente à rota ativa.
2. A Torre de Controle do Cliente (`DashboardCliente`) detecta a alteração (via gatilho de atualização periódica ou re-renderização por hooks) e atualiza instantaneamente os indicadores visuais, os gráficos de desempenho e o progresso da rota.

### 4.2 Métodos Disponíveis no `dbRepo`
* `getVeiculos(email)`: Retorna a lista de veículos pertencentes à conta do cliente específico.
* `saveVeiculos(email, list)`: Persiste a lista de frotas atualizada.
* `getCondutores(email)`: Retorna os condutores do cliente.
* `saveCondutores(email, list)`: Grava as alterações nos perfis dos condutores.
* `getRotasAtivas(email)`: Retorna as rotas logísticas em andamento na rua.
* `saveRotasAtivas(email, routes)`: Grava e distribui as rotas planejadas para que os motoristas as vejam instantaneamente em seus terminais de bordo.

---

## 5. ALGORITMOS DE ROTEIRIZAÇÃO E GEOLOCALIZAÇÃO (`routingEngine.ts`)

A inteligência de posicionamento e otimização geométrica do LogusQ reside no arquivo `routingEngine.ts`. Abaixo estão descritos os modelos matemáticos implementados:

### 5.1 Geocodificação Robusta com Algoritmo de Jitter
Quando o operador importa ou insere um endereço em formato textual, o sistema realiza um processamento de duas camadas:
1. **Dicionário Exato/Parcial (GEOCODE_DB):** Contém os principais bairros e centros logísticos do Brasil (Savassi, Lourdes, Pampulha, Paulista, Pinheiros, Copacabana, etc.) para as coordenadas exatas correspondentes.
2. **Jitter de Sobreposição:** Para evitar que múltiplas entregas no mesmo bairro fiquem perfeitamente empilhadas (ocultando marcadores no mapa), o algoritmo adiciona um fator de espalhamento aleatório (Jitter):
   $$\text{Lat}_{\text{final}} = \text{Lat}_{\text{bairro}} + (\text{random}() - 0.5) \times 0.005$$
   $$\text{Lng}_{\text{final}} = \text{Lng}_{\text{bairro}} + (\text{random}() - 0.5) \times 0.005$$
3. **Hashing de Endereços Desconhecidos (Fallback):** Se o endereço digitado não estiver na base local, o sistema aplica um algoritmo de hash criptográfico simples sobre a string do endereço para gerar um deslocamento pseudo-aleatório controlado a partir do CD Central. Isso garante que todo endereço inserido pelo operador apareça de forma estável no mapa.

### 5.2 Distância Geodésica (Haversine)
Para calcular a distância real aproximada entre dois pontos da terra sem depender de serviços externos caros de roteamento, o sistema utiliza a **Fórmula de Haversine**:
$$a = \sin^2\left(\frac{\Delta \text{lat}}{2}\right) + \cos(\text{lat}_1) \cdot \cos(\text{lat}_2) \cdot \sin^2\left(\frac{\Delta \text{lon}}{2}\right)$$
$$c = 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$
$$d = R \cdot c$$
*Onde $R = 6371$ km é o raio médio da Terra.*

### 5.3 Otimização TSP (Traveling Salesperson Problem) — Algoritmo do Vizinho Mais Próximo
A ordenação de entrega ideal para um motorista é calculada de forma ágil usando uma heurística gulosa do **Vizinho Mais Próximo (Nearest Neighbor)** a partir do CD Central:
1. Inicia no ponto base (Latitude e Longitude do CD Central).
2. Procura, na lista de paradas pendentes, aquela que apresenta a menor distância euclidiana quadrada em relação ao ponto atual.
3. Remove essa parada da lista de não-visitadas, insere-a na rota ordenada e define-a como o novo ponto de partida de busca.
4. Repete o processo até que todas as entregas tenham sido ordenadas.

### 5.4 Clusterização Espacial K-Means (Roteirização Multiveicular)
Ao planejar o dia com múltiplos veículos, o LogusQ precisa agrupar geograficamente as entregas para evitar cruzamento de frotas (uma Fiorino indo para a Zona Sul e outra indo para a mesma rua). O sistema implementa o **K-Means Clustering**:
1. **Inicialização de Centroides:** Seleciona $k$ pontos uniformemente espaçados na lista de entregas (onde $k$ é o número de frotas ativas).
2. **Atribuição:** Cada entrega é associada ao centroide mais próximo.
3. **Atualização:** Calcula as novas médias geográficas de coordenadas de cada grupo para redefinir as coordenadas do centroide:
   $$\text{Centroid}_{\text{lat}} = \frac{1}{N}\sum_{i=1}^N \text{Lat}_i$$
   $$\text{Centroid}_{\text{lng}} = \frac{1}{N}\sum_{i=1}^N \text{Lng}_i$$
4. **Convergência:** O processo se repete por 10 iterações (convergência ultra-rápida no navegador).
5. **Pós-Processamento:** Aplica a otimização TSP (Vizinho Mais Próximo) individualmente para cada cluster gerado, gerando rotas eficientes, geograficamente isoladas e ordenadas.

---

## 6. SISTEMA DE CONTINGÊNCIAMENTO DE EMERGÊNCIAS (CROSS-DOCKING)

O módulo de contingenciamento de emergência no LogusQ é uma de suas maiores inovações tecnológicas. Em caso de avaria mecânica, pneu furado, acidente ou obstrução de trânsito relatada por um condutor, o operador da central tem três mecanismos automáticos de transbordo à sua disposição:

```
                            +---------------------------------+
                            |    ALERTA DE EMERGÊNCIA (SOS)   |
                            | (Motorista aciona no dispositivo) |
                            +----------------+----------------+
                                             |
                                             v
                            +----------------+----------------+
                            |     SINALIZAÇÃO VISUAL NO MAPA  |
                            | (Ícone 'E' Piscando em Vermelho)|
                            +----------------+----------------+
                                             |
                                             v
                     +-----------------------+-----------------------+
                     |                       |                       |
         +-----------v-----------+  +---------v-----------+  +---------v-----------+
         |      1. RECOLHER      |  |   2. REDISTRIBUIR   |  |     3. DIRECIONAR   |
         | (Evacuação completa   |  | (Distribuição das   |  | (Envio manual para  |
         |  por 1 motorista de   |  |  cargas restantes   |  |  qualquer motorista |
         |  apoio mais próximo)  |  | entre toda a frota) |  |   ativo ou livre)   |
         +-----------------------+  +---------------------+  +---------------------+
```

### 6.1 Método 1: Recolher (Carga Completa)
Destina as entregas pendentes do veículo avariado a **um único motorista de suporte**.
* **Como funciona:** O algoritmo varre todos os outros veículos ativos, calcula a distância geográfica de cada um até o local exato da pane e verifica sua capacidade de carga ociosa restante.
* **Inteligência:** Filtra e ordena os motoristas mais próximos que possuem espaço livre em KG no baú maior do que a soma das cargas pendentes a serem resgatadas.
* **Operação:** O motorista escolhido recebe uma parada prioritária de "Coleta de Resgate" no local da pane e, em seguida, as entregas herdadas são otimizadas na sua rota por meio do TSP.

### 6.2 Método 2: Redistribuir (Fatiamento Inteligente)
Divide as entregas pendentes da pane entre **múltiplos veículos em trânsito**.
* **Como funciona:** Recomendado para grandes cargas que excedem a capacidade ociosa de um único veículo de suporte.
* **Simulação Sequencial:** O algoritmo calcula a "posição virtual" atual de todos os outros veículos ativos (a última parada que completaram com sucesso).
* **Distribuição Dinâmica:** Para cada caixa a ser transbordada, ele pontua e ranqueia as frotas em trânsito de forma sequencial com base no peso admissível e na distância incremental até o ponto da entrega pendente. Ao atribuir um item para uma frota de suporte, ela atualiza o seu peso virtual acumulado e a sua coordenada virtual para a próxima entrega, simulando o trajeto sequencial de socorro.

### 6.3 Método 3: Direcionar para Motorista Específico (Manual Dinâmico)
Permite ao gestor escolher **qualquer condutor** cadastrado no sistema (mesmo aqueles sem rota ativa no dia, ou seja, de plantão no pátio).
* **Flexibilidade:** Excelente para despachar um motorista reserva de prontidão no CD.
* **Algoritmo de Rota Nova:** Se o condutor selecionado não tiver rota ativa, o sistema cria instantaneamente uma nova rota para ele contendo uma parada inicial de Coleta no local exato da pane e, logo em seguida, as paradas das entregas do veículo quebrado de forma sequencial e otimizada por TSP.
* **Algoritmo de Rota Ativa:** Se o condutor escolhido já estiver na rua operando, a parada de coleta e as novas paradas de entrega são injetadas em sua lista, e o motor de otimização TSP recalcula sua rota em tempo real, partindo de sua última entrega realizada.

### 6.4 Mecanismo do Sinalizador "E" Piscando no Mapa
Proposto na Etapa 3 e integrado com absoluto sucesso:
* **Detecção Exata:** Quando o condutor aciona o botão SOS no painel móvel, o terminal calcula as coordenadas exatas daquele momento com base na sua rota e localização atual.
* **Feedback de Alerta:** No mapa central da Torre de Controle, um marcador especial vermelho é desenhado. Ele contém uma animação pulsante CSS (`animate-ping`) circular de alcance e a letra **E** piscando no centro em estilo negrito display de alta visibilidade.
* **Integração de Popups:** Ao clicar no marcador pulsante, o operador visualiza um cartão informativo com o nome do motorista, o veículo, o horário exato da chamada, o tipo de pane e a justificativa preenchida pelo condutor, além das opções de acionamento imediato das contingências de carga.

---

## 7. VISÃO DETALHADA DOS MÓDULOS DE INTERFACE

### 7.1 Portal de Login e Cadastro (`LoginCadastro.tsx`)
* Fornece um portal unificado e estilizado em tons profissionais escuros (*Slate Theme*).
* Permite acesso imediato com contas de teste configuradas (ex: `demo@logusq.com.br`, `master@logusq.com.br`, `motorista@logusq.com.br`).
* Registro estruturado para empresas (solicitando CNPJ, Telefone, Plano selecionado) e Motoristas (solicitando CNH, placa de veículo e e-mail).

### 7.2 Painel Master (`DashboardMaster.tsx`)
* **Telemetria de Plataforma:** Mostra faturamento recorrente total mensal (MRR), número de empresas cadastradas, frota total sob gerenciamento e auditoria de logs.
* **Aprovações e Bloqueios:** Interface de controle administrativo para aprovar novas empresas registradas, alterar planos ou suspender contas por inadimplência.
* **Auditoria Forense (Audit Logs):** Tabela de logs operacionais detalhada para monitorar ações ilegais, exclusões ou erros na plataforma de forma centralizada.

### 7.3 Torre de Controle do Cliente/Operador (`DashboardCliente.tsx`)
Contém abas de gerenciamento para todas as atividades logísticas da empresa:
1. **Painel de Controle (Monitoramento Ativo):** Exibe métricas de desempenho diário (entregas realizadas, pendências, frotas ativas, taxa de eficiência e alertas).
2. **Nova Rota (Roteirizador K-Means + TSP):** Permite colar ou digitar listas de endereços e pesos das cargas, definir as frotas do dia e gerar instantaneamente rotas balanceadas com o clique de um botão.
3. **Importador de Cargas (Universal):** Ferramenta avançada para importar arquivos CSV ou planilhas. Reconhece cabeçalhos automaticamente e converte colas de tabelas em entregas estruturadas com coordenadas geocodificadas automáticas.
4. **Gestão de Condutores e Frotas:** Cadastro completo de motoristas, veículos e status (disponível, manutenção, afastado).
5. **Auditoria de Ocorrências e SOS:** Centraliza todos os chamados de socorro mecânico e humano, abrindo a tela de Cross-Docking de suporte.

### 7.4 Aplicativo de Bordo do Motorista (`DashboardMotorista.tsx`)
* **Layout Responsivo:** Desenhado com foco em toque em telas de smartphones.
* **Checklist Sequencial:** Exibe as entregas ordenadas pelo algoritmo TSP. O motorista clica em "Iniciar Viagem", "Marcar como Entregue" ou "Relatar Insucesso" para cada ponto.
* **Controle de Jornada:** Botões para iniciar deslocamento, registrar pausas (almoço, descanso) com justificativa e encerrar o dia.
* **Botão do Pânico (SOS):** Um botão vermelho destacado que, ao ser acionado, dispara o alerta de emergência mecânica ou médica, salvando a localização GPS atual e transmitindo para a Torre de Controle.

### 7.5 Mapa de Telemetria GIS (`SimulatedMap.tsx`)
* Desenvolvido com **React Leaflet**, integrando mapas interativos completos no navegador sem custo de consumo de APIs proprietárias.
* **Traçados Street Geometry:** Linhas de trajetória que utilizam lógica Manhattan de curva de quarteirão para simular caminhos em ruas reais em vez de linhas retas diretas sobre prédios.
* **Filtros Inteligentes:** Permite isolar o mapa para exibir apenas rotas de um motorista específico ou veículo selecionado.
* **Marcadores Personalizados:** Diferenciação visual por cores para paradas (Entregue = Verde, Pendente = Azul, Cancelado/Erro = Laranja, Alerta SOS = Vermelho Pulsante).

---

## 8. GUIA DE EXPORTAÇÃO PARA ARQUIVO PDF (IMPRESSÃO PERFEITA)

Este dossiê e a plataforma LogusQ foram preparados para gerar relatórios e documentos PDF limpos diretamente pelo navegador. Para salvar este dossiê ou as telas do sistema como PDF:

1. **Através do Visualizador do Código:** 
   * Se estiver visualizando o arquivo `.md` em um editor (como VS Code), clique com o botão direito e selecione a opção **"Markdown PDF: Export (pdf)"** ou abra a visualização prévia e use o comando de impressão do navegador (`Ctrl + P`).
2. **Através do Painel LogusQ (Torre de Controle):**
   * Em qualquer tela de relatório, tabela de rotas ou dados de frotas, o LogusQ possui um botão de **"Imprimir Relatório"**. Ele aciona uma folha de estilo CSS otimizada para impressão que oculta menus laterais e botões interativos, exibindo tabelas, métricas e o mapa formatados perfeitamente para folhas A4.
   * Na caixa de diálogo de impressão do seu sistema operacional (Chrome, Edge ou Firefox), altere a impressora de destino para **"Salvar como PDF"** ou **"Microsoft Print to PDF"**.
   * Defina o layout como **"Paisagem"** (para mapas e tabelas largas) ou **"Retrato"** e clique em **"Salvar"**.

---
*Dossiê técnico elaborado pelo Assistente de Codificação de Inteligência Artificial — LogusQ © 2026.*
