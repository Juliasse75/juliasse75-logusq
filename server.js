import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies with a generous size limit for files
app.use(express.json({ limit: '15mb' }));

// Initialize Google GenAI
let ai = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn('AVISO: GEMINI_API_KEY não foi configurada. O importador inteligente por IA usará fallback local.');
}

// API: Parse documents using Gemini 3.5 Flash
app.post('/api/import/parse', async (req, res) => {
  try {
    const { fileBase64, mimeType, fileName, type, rawText } = req.body;

    if (!ai) {
      return res.status(400).json({
        error: 'API_KEY_MISSING',
        message: 'A chave de API do Gemini não está configurada neste ambiente. Por favor, acesse o menu "Configurações" ou adicione GEMINI_API_KEY no arquivo .env para ativar a inteligência artificial.'
      });
    }

    let contents = [];

    // Construct the specific prompt based on what type of data we are importing
    let typeInstructions = '';
    if (type === 'veiculos') {
      typeInstructions = `Você é um assistente de IA especialista em logística de transportes e frotas brasileiras. Extraia a lista de veículos do documento fornecido (que pode ser um PDF, CSV, planilha ou texto avulso). Retorne APENAS um array JSON contendo objetos com as seguintes propriedades (se um valor não for encontrado, tente deduzir ou deixe vazio, mas mantenha a propriedade):
- "idVeiculo": identificador único interno ou número de frota (ex: "VEIC-101", ou a própria placa se não houver ID)
- "placa": placa do veículo formatada (ex: "ABC-1234" ou formato Mercosul "ABC1D23")
- "modelo": nome do modelo (ex: "Fiorino", "FH 540", "Van", "L200")
- "fabricante": marca / fabricante (ex: "Fiat", "Volvo", "Mercedes", "Toyota")
- "anoFabricacao": ano de fabricação (string, ex: "2021")
- "anoModelo": ano do modelo (string, ex: "2022")
- "cor": cor do veículo (ex: "Branco", "Prata", "Preto")
- "tipo": tipo do veículo que DEVE ser obrigatoriamente um destes valores válidos: "Caminhão Pesado", "Van", "Picape 4x4", "Carro Leve", "Motocicleta". Escolha o que melhor se encaixa no modelo.
- "capacidadeKg": capacidade de carga em kg (número inteiro, ex: 650 para Fiorino, 25000 para caminhão pesado, 1000 para picape, 150 para moto)
- "renavam": string opcional com o número do renavam (apenas dígitos se houver)
- "chassi": string opcional com o número do chassi (ex: 17 caracteres se houver)`;
    } else if (type === 'condutores') {
      typeInstructions = `Você é um assistente de IA especialista em gestão de motoristas e recursos humanos logísticos. Extraia a lista de motoristas/condutores do documento fornecido (que pode ser um PDF de escala, cadastro, TXT ou planilha). Retorne APENAS um array JSON contendo objetos com as seguintes propriedades:
- "nome": nome completo do motorista
- "cpf": CPF formatado (ex: "111.222.333-44" ou "11122233344")
- "rg": RG formatado ou apenas número (ex: "MG-12.345.678")
- "nascimento": data de nascimento formatada (ex: "12/03/1985")
- "telefone": telefone de contato (ex: "(31) 98888-7777")
- "email": e-mail de contato corporativo ou pessoal (ex: "carlos@empresa.com.br")
- "cnh": número de registro da CNH (ex: 11 dígitos)
- "categoriaCnh": categoria da habilitação (ex: "A", "B", "C", "D", "E", "AB", "AD")
- "vencCnh": data de vencimento da CNH (ex: "10/12/2030")
- "veiculo": identificador do veículo inicial atribuído se houver, como o número da frota, ID Interno ou placa (ex: "V-001" ou "RTY3A19")`;
    } else if (type === 'entregas') {
      typeInstructions = `Você é um assistente de IA especialista em roteirização e entregas logísticas. Extraia a lista de pontos de entrega ou coleta do documento fornecido (que pode ser um romaneio, nota fiscal, fatura, PDF de pedidos ou planilha). Retorne APENAS um array JSON contendo objetos com as seguintes propriedades:
- "chave": chave única da entrega, identificador de pedido ou número da NFe (ex: "ENT-201", "NFE-54321")
- "cliente": nome do cliente, empresa destinatária ou remetente (ex: "Supermercado BH", "Drogaria Savassi")
- "endereco": endereço de entrega COMPLETO (rua, número, bairro, cidade, estado, cep). Tente extrair com a máxima precisão possível para que nosso roteirizador possa geolocalizar corretamente. Se houver CEP no documento, inclua-o no endereço.
- "pesoMercadoriaKg": peso estimado da carga em kg (número inteiro, ex: 45. Se não houver, use o padrão 15)
- "tipoOperacao": DEVE ser obrigatoriamente "Entrega" ou "Coleta" (padrão "Entrega")`;
    }

    const systemPrompt = `${typeInstructions}
Retorne estritamente um array JSON de objetos válidos, sem formatação markdown, sem tags \`\`\`json ou textos explicativos de introdução/conclusão. Apenas a estrutura JSON pura.`;

    if (fileBase64 && mimeType) {
      // Analyze file directly (Gemini 3.5 Flash supports PDF, CSV, TXT etc.)
      contents.push({
        inlineData: {
          mimeType: mimeType,
          data: fileBase64
        }
      });
      contents.push(systemPrompt);
    } else if (rawText) {
      // Analyze raw pasted text
      contents.push(`Texto colado pelo usuário:\n\n${rawText}\n\nInstrução:\n${systemPrompt}`);
    } else {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'Nenhum arquivo ou texto fornecido para análise.' });
    }

    console.log(`Chamando Gemini 3.5 Flash para analisar importação do tipo: ${type}...`);
    
    // Implementation of retry logic with exponential backoff for 503/429/UNAVAILABLE/RESOURCE_EXHAUSTED errors
    let response;
    let retries = 3;
    let delay = 1000;
    
    for (let i = 0; i < retries; i++) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: contents,
          config: {
            responseMimeType: 'application/json'
          }
        });
        break; // Success! Exit retry loop.
      } catch (error) {
        const errorStr = (error.message || '').toString();
        const isTransient = 
          errorStr.includes('503') || 
          errorStr.includes('429') || 
          errorStr.includes('UNAVAILABLE') || 
          errorStr.includes('RESOURCE_EXHAUSTED') ||
          error.status === 503 || 
          error.status === 429;
          
        if (isTransient && i < retries - 1) {
          console.warn(`Gemini API retornou erro temporário. Tentando novamente em ${delay}ms... (Tentativa ${i + 1} de ${retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
          continue;
        }
        
        // If we ran out of retries, or it is a non-transient error, throw it
        throw error;
      }
    }

    const responseText = response.text || '';
    console.log(`Resposta recebida do Gemini.`);

    try {
      // Clean possible leading/trailing markers if Gemini added them despite prompt
      let cleanedJson = responseText.trim();
      if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanedJson.startsWith('```')) {
        cleanedJson = cleanedJson.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const parsedArray = JSON.parse(cleanedJson);
      if (!Array.isArray(parsedArray)) {
        return res.status(500).json({
          error: 'NOT_AN_ARRAY',
          message: 'O modelo de IA retornou um formato de dados inesperado (não é uma lista).',
          raw: responseText
        });
      }

      res.json({ data: parsedArray });
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON retornado pelo Gemini:', parseError);
      res.status(500).json({
        error: 'JSON_PARSE_ERROR',
        message: 'Não foi possível interpretar os dados processados pela IA. O formato recebido não é um JSON válido.',
        raw: responseText
      });
    }

  } catch (error) {
    console.error('Erro geral no endpoint de importação:', error);
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message || 'Erro inesperado no servidor ao processar o documento.' });
  }
});

// Vite middleware for asset serving in development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Iniciando em modo de DESENVOLVIMENTO com middleware do Vite...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Iniciando em modo de PRODUÇÃO...');
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LogusQ Servidor Integrado rodando em http://localhost:${PORT}`);
  });
}

startServer();
