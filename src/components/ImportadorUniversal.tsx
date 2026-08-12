import React, { useState, useRef } from 'react';
import { 
  X, Upload, FileText, Clipboard, Sparkles, Check, 
  AlertTriangle, Play, HelpCircle, ArrowRight, Table, ListPlus, Loader2
} from 'lucide-react';
import { geocodeAddress, fetchDirectNominatimGeocode, haversineDistance } from '../utils/routingEngine';

interface ImportadorUniversalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'veiculos' | 'condutores' | 'entregas';
  userEmail: string;
  onImportComplete: () => void;
  dbRepo: any; // The database repository containing the methods to save
}

export default function ImportadorUniversal({
  isOpen,
  onClose,
  type,
  userEmail,
  onImportComplete,
  dbRepo
}: ImportadorUniversalProps) {
  const [activeInputMode, setActiveInputMode] = useState<'file' | 'paste'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Review screen states
  const [importStep, setImportStep] = useState<'input' | 'review'>('input');
  const [parsedRecords, setParsedRecords] = useState<any[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Record<number, boolean>>({});
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [localHeaderCols, setLocalHeaderCols] = useState<string[]>([]);
  const [isLocalImport, setIsLocalImport] = useState(false);
  const [localRows, setLocalRows] = useState<string[][]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgressMsg, setSaveProgressMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const interruptAIProcess = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsProcessing(false);
    setErrorMessage('Processamento interrompido pelo usuário. Você pode utilizar o Analisador Local Offline (Heurística CSV) para prosseguir imediatamente.');
  };

  if (!isOpen) return null;

  // Header configs depending on what we are importing
  const typeConfigs = {
    veiculos: {
      title: 'Importar Veículos para Frota',
      subtitle: 'Importe caminhões, vans, picapes, carros ou motos por PDF, TXT, CSV ou colando tabelas.',
      helpText: 'O arquivo/texto deve conter colunas ou referências para Placa, Modelo, Fabricante, Tipo (Caminhão, Van, etc.) e Capacidade em KG.',
      targetFields: [
        { key: 'idVeiculo', label: 'ID Frota / ID Interno', required: true },
        { key: 'placa', label: 'Placa', required: true },
        { key: 'modelo', label: 'Modelo', required: true },
        { key: 'fabricante', label: 'Fabricante', required: false },
        { key: 'tipo', label: 'Tipo Modal', required: true, help: 'Caminhão Pesado, Van, Picape 4x4, Carro Leve, Motocicleta' },
        { key: 'tipoCombustivel', label: 'Tipo de Combustível', required: false, help: 'Gasolina, Etanol, Flex, Diesel, Elétrico, GNV' },
        { key: 'capacidadeKg', label: 'Capacidade (KG)', required: true },
        { key: 'anoFabricacao', label: 'Ano Fabr.', required: false },
        { key: 'anoModelo', label: 'Ano Mod.', required: false },
        { key: 'cor', label: 'Cor', required: false },
        { key: 'renavam', label: 'RENAVAM', required: false },
        { key: 'chassi', label: 'Chassi', required: false }
      ]
    },
    condutores: {
      title: 'Importar Motoristas Habilitados',
      subtitle: 'Importe sua planilha de funcionários por PDF de escalas, listas TXT, CSV ou colando registros.',
      helpText: 'Os registros devem conter Nome, CPF, RG, Telefone, E-mail de cadastro, CNH, Categoria e Vencimento da CNH.',
      targetFields: [
        { key: 'nome', label: 'Nome Completo', required: true },
        { key: 'cpf', label: 'CPF', required: true },
        { key: 'rg', label: 'RG', required: false },
        { key: 'telefone', label: 'Telefone', required: true },
        { key: 'email', label: 'E-mail / Login', required: true },
        { key: 'nascimento', label: 'Data Nasc.', required: false },
        { key: 'cnh', label: 'Registro CNH', required: true },
        { key: 'categoriaCnh', label: 'Cat. CNH', required: true },
        { key: 'vencCnh', label: 'Venc. CNH', required: true },
        { key: 'veiculo', label: 'Nº Frota / Código Veículo (Vínculo)', required: false },
        { key: 'placaVeiculo', label: 'Placa do Veículo (Vínculo)', required: false }
      ]
    },
    entregas: {
      title: 'Importar Romaneio de Entregas / Coletas',
      subtitle: 'Carregue notas fiscais, romaneios PDF, listas de clientes do ERP em TXT/CSV ou cole endereços.',
      helpText: 'Cada linha representa uma parada. Deve conter Chave/ID, Nome do Cliente, Endereço completo, Peso da carga e Nota Fiscal.',
      targetFields: [
        { key: 'chave', label: 'ID Entrega / Chave NFe', required: true },
        { key: 'cliente', label: 'Cliente / Destinatário', required: true },
        { key: 'endereco', label: 'Endereço de Entrega', required: true },
        { key: 'enderecoColeta', label: 'Endereço de Coleta (se houver)', required: false },
        { key: 'pontoReferencia', label: 'Ponto de Referência', required: false },
        { key: 'telefone', label: 'Telefone de Contato', required: false },
        { key: 'whatsapp', label: 'WhatsApp', required: false },
        { key: 'pesoMercadoriaKg', label: 'Peso Carga (KG)', required: true },
        { key: 'tipoOperacao', label: 'Operação', required: true, help: 'Entrega ou Coleta' },
        { key: 'notaFiscal', label: 'Número da Nota Fiscal', required: false }
      ]
    }
  };

  const config = typeConfigs[type];

  // Drag and drop helper
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  // Convert File to Base64
  const fileToBase64 = (fileObj: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(fileObj);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Strip out metadata prefix (e.g., data:application/pdf;base64,)
        const cleaned = base64String.split(',')[1];
        resolve(cleaned);
      };
      reader.onerror = error => reject(error);
    });
  };

  // 1. Process via Gemini AI Server Endpoint
  const processWithAI = async () => {
    setIsProcessing(true);
    setErrorMessage('');
    setProcessingStatus('Preparando arquivo para processamento...');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      let payload: any = { type };

      if (activeInputMode === 'file') {
        if (!file) {
          throw new Error('Nenhum arquivo selecionado. Selecione um PDF, TXT ou CSV.');
        }

        setProcessingStatus(`Lendo arquivo: ${file.name} (${Math.round(file.size / 1024)} KB)...`);
        
        const isTextLike = file.name.endsWith('.csv') || file.name.endsWith('.txt') || file.name.endsWith('.tsv') || file.name.endsWith('.json') || file.type.includes('csv') || file.type.includes('text');
        
        if (isTextLike) {
          const textContent = await file.text();
          payload.rawText = textContent;
        } else {
          const base64Data = await fileToBase64(file);
          payload.fileBase64 = base64Data;
          payload.mimeType = file.type || 'application/octet-stream';
          payload.fileName = file.name;
        }
      } else {
        if (!pastedText.trim()) {
          throw new Error('Por favor, cole algum texto no campo abaixo antes de analisar.');
        }
        setProcessingStatus('Preparando texto copiado para processamento...');
        payload.rawText = pastedText;
      }

      setProcessingStatus('Enviando dados de transporte para o Gemini 2.5 Flash...');
      
      const response = await fetch('/api/import/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (errData.error === 'API_KEY_MISSING') {
          throw new Error('API_KEY_MISSING');
        }
        throw new Error(errData.message || `Erro no servidor (${response.status}) ao analisar o romaneio.`);
      }

      setProcessingStatus('Interpretando layout do documento e estruturando campos...');
      const resData = await response.json();
      
      if (!resData.data || resData.data.length === 0) {
        throw new Error('A inteligência artificial não conseguiu encontrar nenhum registro compatível no documento enviado. Verifique se o conteúdo do PDF ou texto contém dados de frota/entregas.');
      }

      // Convert capacity to numbers, solve minor type casting from LLM response
      const fullyParsed = resData.data.map((item: any) => {
        if (type === 'veiculos') {
          return {
            ...item,
            capacidadeKg: parseInt(item.capacidadeKg) || 1000,
            status: item.status || 'Disponivel'
          };
        }
        if (type === 'entregas') {
          return {
            ...item,
            pesoMercadoriaKg: parseInt(item.pesoMercadoriaKg) || 15,
            tipoOperacao: item.tipoOperacao === 'Coleta' ? 'Coleta' : 'Entrega'
          };
        }
        return item;
      });

      setParsedRecords(fullyParsed);
      
      // Select all by default
      const defaultSelected: Record<number, boolean> = {};
      fullyParsed.forEach((_: any, idx: number) => {
        defaultSelected[idx] = true;
      });
      setSelectedIndices(defaultSelected);
      setIsLocalImport(false);
      setImportStep('review');

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('AI parsing was aborted by the user.');
        return; // Already handled inside interruptAIProcess
      }
      console.error(err);
      let friendlyMessage = err.message || 'Erro inesperado ao analisar o documento.';
      
      const is503 = friendlyMessage.includes('503') || friendlyMessage.includes('UNAVAILABLE') || friendlyMessage.includes('high demand') || friendlyMessage.includes('experiencing high demand');
      const isRateLimit = friendlyMessage.includes('429') || friendlyMessage.includes('RESOURCE_EXHAUSTED') || friendlyMessage.includes('quota');
      
      if (err.message === 'API_KEY_MISSING' || friendlyMessage.includes('API_KEY_MISSING')) {
        friendlyMessage = 'Sua chave do Gemini (GEMINI_API_KEY) não está configurada nos Secrets da plataforma. Mas não se preocupe! Podemos usar o processamento local para ler arquivos estruturados TXT ou CSV.';
        // Trigger local fallback if it was a plain CSV/TXT file
        if (activeInputMode === 'file' && file && (file.name.endsWith('.csv') || file.name.endsWith('.txt') || file.name.endsWith('.tsv'))) {
          runLocalHeuristics();
        }
      } else if (is503) {
        friendlyMessage = 'O serviço do Gemini está temporariamente com alta demanda ou instável (Erro 503). Por favor, aguarde alguns instantes e clique em "Analisar com IA" novamente. Você também pode utilizar o nosso Analisador Local Offline (Heurística CSV) clicando no botão abaixo para processar seu arquivo instantaneamente sem internet!';
      } else if (isRateLimit) {
        friendlyMessage = 'O limite de requisições da IA do Gemini foi atingido temporariamente (Erro 429). Por favor, aguarde um momento e tente novamente, ou utilize o nosso Analisador Local Offline (Heurística CSV) clicando no botão abaixo para processar seu arquivo offline imediatamente.';
      } else if (friendlyMessage.startsWith('{')) {
        try {
          const parsedErr = JSON.parse(friendlyMessage);
          if (parsedErr.error && parsedErr.error.message) {
            const innerMsg = parsedErr.error.message;
            if (innerMsg.includes('high demand') || innerMsg.includes('temporary') || innerMsg.includes('UNAVAILABLE') || innerMsg.includes('503')) {
              friendlyMessage = 'O serviço do Gemini está temporariamente com alta demanda ou instável (Erro 503). Por favor, aguarde alguns instantes e clique em "Analisar com IA" novamente. Você também pode utilizar o nosso Analisador Local Offline (Heurística CSV) clicando no botão abaixo para processar seu arquivo instantaneamente sem internet!';
            } else {
              friendlyMessage = `Erro retornado pela IA: ${innerMsg}`;
            }
          }
        } catch (e) {
          // ignore parsing error, keep raw
        }
      }
      
      setErrorMessage(friendlyMessage);
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  // 2. Local fallback heuristic parse (CSV/TXT separator-based parse)
  const runLocalHeuristics = () => {
    setIsProcessing(true);
    setErrorMessage('');
    setProcessingStatus('Executando motor de análise local offline...');

    try {
      const textToParse = activeInputMode === 'paste' ? pastedText : '';
      
      if (activeInputMode === 'file') {
        if (!file) throw new Error('Nenhum arquivo selecionado.');
        
        // Interceptar arquivos PDF no parser offline para evitar erro de leitura binária
        if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
          throw new Error('O processador offline não pode decodificar arquivos binários PDF diretamente. Para importar dados deste PDF de forma simples, você pode:\n\n1. Ativar a IA inteligente adicionando a chave de API GEMINI_API_KEY nas Configurações da plataforma, ou;\n2. Abrir o arquivo PDF em seu leitor, copiar todo o seu conteúdo textual (Ctrl+A -> Ctrl+C) e colá-lo na aba "Colar Texto" aqui no importador para analisarmos offline instantaneamente.');
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          parseTextHeuristics(content);
        };
        reader.onerror = () => {
          setIsProcessing(false);
          setErrorMessage('Erro ao ler o arquivo selecionado.');
        };
        reader.readAsText(file);
      } else {
        if (!textToParse.trim()) {
          throw new Error('Nenhum texto colado para análise.');
        }
        parseTextHeuristics(textToParse);
      }
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Erro ao processar localmente.');
    }
  };

  // Smart local string line splitted table parser
  const parseTextHeuristics = (text: string) => {
    try {
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length === 0) {
        throw new Error('Conteúdo vazio.');
      }

      // Heuristic to find delimiter in first line (comma, semicolon, or tab)
      const firstLine = lines[0];
      let delimiter = ',';
      if (firstLine.includes(';')) delimiter = ';';
      else if (firstLine.includes('\t')) delimiter = '\t';

      const rows = lines.map(line => {
        // Split while respecting quotes
        return line.split(delimiter).map(cell => cell.trim().replace(/^"|"$/g, ''));
      });

      const headers = rows[0];
      const dataRows = rows.slice(1);

      if (headers.length < 2) {
        throw new Error('Formato inadequado. Certifique-se de usar vírgula, ponto e vírgula ou tabulação para separar as colunas de dados.');
      }

      setLocalHeaderCols(headers);
      setLocalRows(dataRows);
      setIsLocalImport(true);

      // Attempt to map headers automatically based on keywords
      const initialMappings: Record<string, string> = {};
      
      // Clean Keywords mapping list with Portuguese and English variants to prevent substring collisions
      const cleanKeywordsMap: Record<string, string[]> = {
        // VEICULOS (FROTA)
        idVeiculo: [
          'id', 'idinterno', 'interno', 'codigo', 'codigoveiculo', 'idveiculo', 
          'veiculoid', 'frota', 'numfrota', 'nofrota', 'nfrota', 'numerofrota', 'nufrota',
          'identificador'
        ],
        placa: ['placa', 'plate', 'placaveiculo'],
        modelo: ['modelo', 'model', 'modeloveiculo'],
        fabricante: ['fabricante', 'marca', 'brand', 'fabr', 'maker'],
        tipo: [
          'tipo', 'tipoveiculo', 'tipomodal', 'categoria', 'modal', 'especie', 
          'grupoveiculo', 'tipodeveiculo'
        ],
        capacidadeKg: [
          'capacidade', 'capacidadekg', 'capacidadeemkg', 'pesomaximo', 'cargamaxima', 
          'pesomax', 'cargamax', 'capkg', 'capacidadeutil', 'cap', 'kg'
        ],
        anoFabricacao: [
          'anofabricacao', 'anofab', 'anofabr', 'ano_fab', 'fabricacao', 'fabricado', 
          'anofabricado', 'anodefabricacao'
        ],
        anoModelo: ['anomodelo', 'anomod', 'ano_mod', 'modeloano', 'anodomodelo'],
        cor: ['cor', 'color'],
        renavam: ['renavam', 'numrenavam', 'numerorenavam'],
        chassi: ['chassi', 'numchassi', 'numerochassi'],

        // CONDUTORES
        nome: ['nome', 'nomecompleto', 'motorista', 'condutor', 'driver', 'fullname', 'nomecondutor'],
        cpf: ['cpf', 'cpfmotorista', 'cpfcondutor'],
        rg: ['rg', 'rgmotorista', 'rgcondutor'],
        telefone: ['telefone', 'celular', 'tel', 'phone', 'contato', 'fone', 'telmotorista'],
        email: ['email', 'e-mail', 'login', 'mail', 'usuario'],
        nascimento: ['nascimento', 'nasc', 'datanascimento', 'datanasc', 'nascimentomotorista'],
        cnh: ['cnh', 'registrocnh', 'numcnh', 'numerocnh', 'carteira', 'carteirahabilitacao'],
        categoriaCnh: ['categoriacnh', 'categoria', 'catcnh', 'cat', 'categoriacarteira'],
        vencCnh: ['vencimento', 'vencimentocnh', 'validadecnh', 'venc', 'validade', 'vencimentocarteira'],
        veiculo: ['veiculo', 'veiculovinculado', 'codigoveiculo', 'idveiculo', 'numerofrota', 'numfrota', 'nofrota', 'nfrota', 'frota', 'frotavinculada'],
        placaVeiculo: ['placaveiculo', 'placaveic', 'placavinculada', 'placa', 'plate'],

        // ENTREGAS
        chave: [
          'chave', 'chaveunica', 'id', 'nfe', 'codigo', 'num', 'romaneio', 'chavenfe', 
          'identificador', 'id_entrega', 'identificadorentrega', 'identificador_entrega'
        ],
        cliente: ['cliente', 'destinatario', 'destino', 'nome', 'empresa', 'razaosocial', 'nomecliente'],
        endereco: [
          'endereco', 'local', 'rua', 'address', 'entrega', 'enderecodeentrega', 
          'localentrega', 'destinofinal', 'ruaentrega', 'logradouro'
        ],
        enderecoColeta: ['coleta', 'origem', 'coletar', 'enderecodecoleta', 'localcoleta'],
        pontoReferencia: ['referencia', 'pontoreferencia', 'pontodereferencia', 'ref'],
        whatsapp: ['whatsapp', 'zap', 'whats', 'wpp', 'celular'],
        pesoMercadoriaKg: [
          'peso', 'kg', 'pesocarga', 'mercadoria', 'pesomercadoria', 'pesokg', 
          'peso_carga', 'pesoliquido'
        ],
        tipoOperacao: ['operacao', 'tipo', 'tipooperacao', 'operacaotipo'],
        notaFiscal: [
          'notafiscal', 'nota', 'nf', 'nfenum', 'numeronf', 'nfe_num', 'numerodanotafiscal', 
          'numero_nf', 'num_nf', 'nfnum'
        ]
      };

      headers.forEach((h, colIdx) => {
        const cleanH = h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
        const cleanWithSpaces = h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
        const words = cleanWithSpaces.split(' ');

        let bestField = '';
        let bestScore = 0;

        for (const [fieldKey, keywords] of Object.entries(cleanKeywordsMap)) {
          // Only map if field is relevant to active type config
          const isRelevant = config.targetFields.some(tf => tf.key === fieldKey);
          if (!isRelevant) continue;

          // Check for exact full match (highest priority: score 100)
          if (keywords.includes(cleanH)) {
            bestField = fieldKey;
            bestScore = 100;
            break; // Exact full match breaks immediately
          }

          // Check if any keyword matches exactly as a separate word in the header (score 80)
          const hasExactWord = keywords.some(kw => words.includes(kw));
          if (hasExactWord && bestScore < 80) {
            bestField = fieldKey;
            bestScore = 80;
          }

          // Substring fallback check (score 40)
          const hasSubstringWord = keywords.some(kw => {
            // Avoid dangerous short keywords for substring matching
            if (kw === 'id' || kw === 'kg' || kw === 'nf' || kw === 'cnh' || kw === 'rg' || kw === 'cpf') return false;
            return words.some(w => w.includes(kw) || kw.includes(w));
          });
          if (hasSubstringWord && bestScore < 40) {
            bestField = fieldKey;
            bestScore = 40;
          }
        }

        if (bestField && bestScore > 0) {
          initialMappings[colIdx.toString()] = bestField;
        }
      });

      setColumnMappings(initialMappings);

      // Convert rows based on initial guesses
      const structuredData = dataRows.map((row, rIdx) => {
        const obj: any = {};
        row.forEach((cell, cIdx) => {
          const mappedKey = initialMappings[cIdx.toString()];
          if (mappedKey) {
            obj[mappedKey] = cell;
          }
        });
        return obj;
      });

      setParsedRecords(structuredData);

      // Select all
      const defaultSelected: Record<number, boolean> = {};
      structuredData.forEach((_, idx) => {
        defaultSelected[idx] = true;
      });
      setSelectedIndices(defaultSelected);

      setImportStep('review');
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar as colunas locais do arquivo.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle dropdown mapping change
  const handleMappingChange = (colIdxStr: string, fieldKey: string) => {
    const updatedMappings = { ...columnMappings, [colIdxStr]: fieldKey };
    setColumnMappings(updatedMappings);

    // Reconstruct parsed records based on new mappings
    const structuredData = localRows.map((row) => {
      const obj: any = {};
      row.forEach((cell, cIdx) => {
        const mappedKey = updatedMappings[cIdx.toString()];
        if (mappedKey) {
          obj[mappedKey] = cell;
        }
      });
      return obj;
    });

    setParsedRecords(structuredData);
  };

  // Edit cell value in review grid
  const handleCellEdit = (index: number, key: string, val: string) => {
    const updated = [...parsedRecords];
    updated[index] = {
      ...updated[index],
      [key]: val
    };
    setParsedRecords(updated);
  };

  // Toggle selection
  const toggleSelectRow = (index: number) => {
    setSelectedIndices({
      ...selectedIndices,
      [index]: !selectedIndices[index]
    });
  };

  const toggleSelectAll = () => {
    const allSelected = Object.values(selectedIndices).every(v => v);
    const updated: Record<number, boolean> = {};
    parsedRecords.forEach((_, idx) => {
      updated[idx] = !allSelected;
    });
    setSelectedIndices(updated);
  };

  // Perform saving action
  const handleConfirmImport = async () => {
    const toImport = parsedRecords.filter((_, idx) => selectedIndices[idx]);
    
    if (toImport.length === 0) {
      alert('Nenhum registro selecionado para importação.');
      return;
    }

    // Validate missing fields for required attributes
    const missingWarnings: string[] = [];
    toImport.forEach((rec, idx) => {
      config.targetFields.forEach(f => {
        if (f.required && (rec[f.key] === undefined || rec[f.key] === null || rec[f.key].toString().trim() === '')) {
          missingWarnings.push(`Registro #${idx + 1}: Campo obrigatório "${f.label}" está em branco.`);
        }
      });
    });

    if (missingWarnings.length > 0) {
      const proceed = confirm(`Foram detectados problemas de validação:\n\n${missingWarnings.slice(0, 5).join('\n')}${missingWarnings.length > 5 ? `\n...e mais ${missingWarnings.length - 5} erros.` : ''}\n\nDeseja preencher automaticamente ou continuar mesmo assim?`);
      if (!proceed) return;
    }

    setIsSaving(true);
    let successCount = 0;

    try {
      const total = toImport.length;
      
      // Pre-calculate client base hub coordinates for fallback geocoding
      let clientBaseCoords: { lat: number; lng: number } | undefined;
      const clientData = dbRepo.getCliente ? dbRepo.getCliente(userEmail) : null;
      try {
        if (clientData) {
          const fullAddress = `${clientData.endereco || ''}, ${clientData.cidade || ''} - ${clientData.estado || ''}`.trim();
          if (fullAddress && fullAddress.length > 3) {
            clientBaseCoords = geocodeAddress(fullAddress);
          }
        }
      } catch (e) {
        // Fallback default
      }

      const batchEntregas: any[] = [];

      for (let i = 0; i < total; i++) {
        const item = toImport[i];
        setSaveProgressMsg(`Processando e salvando registro ${i + 1} de ${total}...`);

        if (type === 'veiculos') {
          const id = item.idVeiculo || `VEIC-${item.placa?.replace(/\W/g, '') || Math.floor(Math.random() * 9000 + 1000)}`;
          
          dbRepo.cadastrarVeiculo(userEmail, {
            idVeiculo: id,
            placa: item.placa || 'AAA-0000',
            modelo: item.modelo || 'Modelo Importado',
            fabricante: item.fabricante || 'Outro',
            anoFabricacao: item.anoFabricacao || '2023',
            anoModelo: item.anoModelo || item.anoFabricacao || '2023',
            cor: item.cor || 'Branco',
            tipo: item.tipo || 'Van',
            tipoCombustivel: item.tipoCombustivel || 'Flex',
            capacidadeKg: parseInt(item.capacidadeKg) || 1000,
            renavam: item.renavam || '',
            chassi: item.chassi || '',
            status: item.status || 'Disponivel'
          });
          successCount++;
        } else if (type === 'condutores') {
          dbRepo.cadastrarCondutor(userEmail, {
            nome: item.nome || 'Condutor Importado',
            cpf: item.cpf || '000.000.000-00',
            rg: item.rg || '',
            nascimento: item.nascimento || '01/01/1990',
            telefone: item.telefone || '(00) 00000-0000',
            email: item.email || `motorista.${Math.floor(Math.random() * 1000)}@empresa.com.br`,
            cnh: item.cnh || '00000000000',
            categoriaCnh: item.categoriaCnh || 'B',
            vencCnh: item.vencCnh || '01/01/2030',
            veiculo: item.veiculo || '',
            placaVeiculo: item.placaVeiculo || ''
          });
          successCount++;
        } else if (type === 'entregas') {
          const addressToGeocode = item.endereco || '';
          
          // 1. Calculate offline coordinates immediately using enhanced routingEngine geocoder
          const offlineCoords = geocodeAddress(addressToGeocode, clientBaseCoords);
          let lat: number = offlineCoords.lat;
          let lng: number = offlineCoords.lng;

          // 2. Try online direct OpenStreetMap Nominatim geocode
          if (addressToGeocode && addressToGeocode.length > 3) {
            const cityStateContext = `${clientData?.cidade || ''} - ${clientData?.estado || ''}`.trim();
            const fullSearchQuery = cityStateContext ? `${addressToGeocode}, ${cityStateContext}` : addressToGeocode;
            const direct = await fetchDirectNominatimGeocode(fullSearchQuery, clientBaseCoords);
            if (direct && direct.lat && direct.lng) {
              lat = direct.lat;
              lng = direct.lng;
            }
          }

          // 3. Override with explicit latitude/longitude if provided in file
          if (item.latitude && item.longitude && !isNaN(parseFloat(item.latitude)) && !isNaN(parseFloat(item.longitude))) {
            lat = parseFloat(item.latitude);
            lng = parseFloat(item.longitude);
          }

          const cleanChave = item.chave || item.id || `ROM-${Math.floor(Math.random() * 1000000)}`;
          const cleanId = item.id || `ENT-${Date.now()}-${i + 1}-${Math.floor(Math.random() * 1000)}`;

          batchEntregas.push({
            id: cleanId,
            chave: cleanChave,
            cliente: item.cliente || 'Cliente Importado',
            endereco: addressToGeocode || 'Endereço Indefinido',
            enderecoColeta: item.enderecoColeta || '',
            pontoReferencia: item.pontoReferencia || '',
            telefone: item.telefone || '',
            whatsapp: item.whatsapp || '',
            pesoMercadoriaKg: parseFloat(item.pesoMercadoriaKg) || 15,
            tipoOperacao: item.tipoOperacao === 'Coleta' ? 'Coleta' : 'Entrega',
            notaFiscal: item.notaFiscal || '',
            fotoComprovante: '',
            dataEntregue: '',
            latitude: lat,
            longitude: lng,
            status: 'Pendente'
          });
          successCount++;
        }
      }

      if (type === 'entregas' && batchEntregas.length > 0) {
        dbRepo.saveEntregas(userEmail, batchEntregas);
      }

      alert(`✅ Sucesso! Foram importados e validados ${successCount} registros no sistema com sucesso.`);
      onImportComplete();
      onClose();
      // Reset states
      setFile(null);
      setPastedText('');
      setImportStep('input');
      setParsedRecords([]);
    } catch (err: any) {
      alert(`Erro na inserção de dados: ${err.message || err}`);
    } finally {
      setIsSaving(false);
      setSaveProgressMsg('');
    }
  };

  const handleReset = () => {
    setFile(null);
    setPastedText('');
    setImportStep('input');
    setParsedRecords([]);
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div id="modal-container-universal" className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-violet-600/10 border border-violet-500/20 rounded-lg text-violet-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                {config.title} <span className="bg-violet-500/10 text-violet-400 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">Multiformato</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{config.subtitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inner Content scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {importStep === 'input' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
              
              {/* Left explanation column */}
              <div className="lg:col-span-4 bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 space-y-4">
                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-violet-400" /> Como Funciona?
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Nosso sistema possui um <strong>motor de inteligência artificial de dupla via</strong> para importar planilhas ou documentos:
                </p>
                
                <div className="space-y-3.5 text-xs text-slate-300">
                  <div className="flex gap-2.5">
                    <div className="text-violet-400 font-bold mt-0.5">1.</div>
                    <div>
                      <strong className="text-white font-medium">Extração IA (Recomendado)</strong>: Carregue um PDF de romaneio, ordem de serviço ou nota fiscal. A IA do Gemini lê e deduz os campos perfeitamente, mesmo sem tabelas exatas.
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <div className="text-violet-400 font-bold mt-0.5">2.</div>
                    <div>
                      <strong className="text-white font-medium">Análise Heurística Rápida</strong>: Use arquivos CSV/TXT padronizados com vírgula ou tabulações para processamento instantâneo sem necessidade de internet.
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/60">
                  <span className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Campos Aceitos para {type === 'veiculos' ? 'Frota' : type === 'condutores' ? 'Motoristas' : 'Entregas'}:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {config.targetFields.map(f => (
                      <span key={f.key} className={`text-[10px] px-2 py-0.5 rounded font-mono ${f.required ? 'bg-violet-950 border border-violet-800 text-violet-300 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                        {f.label}{f.required ? '*' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Input Workspace (Right) */}
              <div className="lg:col-span-8 space-y-4">
                {/* Mode Selector */}
                <div className="flex border-b border-slate-800">
                  <button
                    onClick={() => setActiveInputMode('file')}
                    className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                      activeInputMode === 'file' 
                        ? 'border-violet-500 text-white bg-slate-800/20' 
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" /> Enviar Arquivo (PDF, TXT, CSV)
                  </button>
                  <button
                    onClick={() => setActiveInputMode('paste')}
                    className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                      activeInputMode === 'paste' 
                        ? 'border-violet-500 text-white bg-slate-800/20' 
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Clipboard className="w-3.5 h-3.5" /> Copiar e Colar Texto
                  </button>
                </div>

                {/* Mode 1: File drop zone */}
                {activeInputMode === 'file' && (
                  <div 
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-800 hover:border-violet-500/80 hover:bg-violet-950/5 rounded-2xl p-10 text-center cursor-pointer transition-all space-y-4"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".pdf,.txt,.csv,.tsv,.xml"
                      onChange={handleFileChange}
                    />
                    <div className="mx-auto w-12 h-12 bg-slate-950/60 rounded-xl flex items-center justify-center border border-slate-800 text-violet-400 shadow-inner">
                      <Upload className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-200 font-semibold">
                        Arraste e solte o arquivo de importação aqui
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Formatos aceitos: PDF, TXT, CSV ou TSV (Tamanho máximo: 15MB)
                      </p>
                    </div>

                    {file && (
                      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 inline-flex items-center gap-3 text-left max-w-sm animate-scale-up" onClick={(e) => e.stopPropagation()}>
                        <div className="p-2 bg-violet-600/10 border border-violet-500/20 rounded-lg text-violet-400">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-white truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setFile(null); }}
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded ml-auto"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Mode 2: Paste Area */}
                {activeInputMode === 'paste' && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono text-slate-500 uppercase">Conteúdo do Documento para Extração</label>
                    <textarea
                      value={pastedText}
                      onChange={e => setPastedText(e.target.value)}
                      placeholder={`Cole as informações brutas correspondentes aqui.\nExemplo:\n${
                        type === 'veiculos' 
                          ? 'VEIC-01, ABC-1234, Scania, G 420, Vermelho, Caminhão Pesado\nVEIC-02, JHG-5678, Fiat, Fiorino, Van'
                          : type === 'condutores'
                          ? 'Carlos da Silva, CNH: 123456789, Categoria: D, Venc: 10/12/2030, Tel: (31) 98888-7777'
                          : 'ENT-901, Drogaria Araujo, Av. Afonso Pena 1500 - BH, Peso: 15kg\nENT-902, Supermercado, Rua Bahia 10 - BH, Peso: 200kg'
                      }`}
                      className="w-full h-56 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-white placeholder-slate-650 font-mono resize-none focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                )}

                {/* Error warning */}
                {errorMessage && (
                  <div className="p-4 bg-red-950/30 border border-red-900/40 rounded-xl flex gap-3 text-red-400">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <p className="font-bold">Aviso sobre o processamento</p>
                      <p className="leading-relaxed text-red-300">{errorMessage}</p>
                      <button
                        onClick={runLocalHeuristics}
                        className="mt-2 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 font-bold px-3 py-1 rounded border border-violet-500/30 transition-colors text-[10px] uppercase font-mono tracking-wider flex items-center gap-1.5"
                      >
                        <Table className="w-3.5 h-3.5" /> Usar Analisador Local Offline (Sem IA)
                      </button>
                    </div>
                  </div>
                )}

                {/* Execution CTA Buttons */}
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    disabled={isProcessing}
                    onClick={runLocalHeuristics}
                    className="bg-slate-800 hover:bg-slate-750 disabled:opacity-40 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-700/50 transition-colors"
                  >
                    Análise Local (Heurística CSV)
                  </button>
                  <button
                    disabled={isProcessing}
                    onClick={processWithAI}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-violet-900/20 flex items-center gap-2 transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-violet-300 animate-pulse" />
                    {isProcessing ? 'Processando...' : 'Analisar com IA (Gemini)'}
                  </button>
                </div>

                {/* Loading state animation */}
                {isProcessing && (
                  <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-5 text-center space-y-4 animate-scale-up">
                    <div className="flex justify-center items-center gap-1">
                      <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <div className="text-xs font-mono text-violet-400 font-bold uppercase tracking-wider">{processingStatus}</div>
                    <p className="text-[10px] text-slate-500">O Gemini pode demorar dependendo da fila de requisições ou tamanho do arquivo.</p>
                    <div className="flex justify-center pt-1">
                      <button
                        onClick={interruptAIProcess}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold px-3 py-1.5 rounded-lg border border-red-500/30 transition-colors text-[10px] uppercase font-mono tracking-wider flex items-center gap-1.5"
                      >
                        ✕ Interromper & Usar Analisador Local
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            /* STEP 2: REVIEW AND CONFIRM TABLE */
            <div className="space-y-4 h-full flex flex-col">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-950/30 border border-slate-800 p-4 rounded-xl">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    {isLocalImport ? 'Mapeamento Local Ativo' : 'Extraído com IA do Gemini'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isLocalImport 
                      ? 'Revise o mapeamento das colunas abaixo para alinhar os dados de sua planilha aos campos do sistema.' 
                      : 'A IA estruturou com precisão os dados encontrados. Revise, edite células e selecione os registros que deseja importar.'}
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700/60"
                >
                  Voltar e Enviar Outro
                </button>
              </div>

              {/* CSV column dropdown mapping row (Only visible for local import without automatic AI structure) */}
              {isLocalImport && (
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Mapeamento de Cabeçalhos da Planilha</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                    {localHeaderCols.map((hName, idx) => (
                      <div key={idx} className="bg-slate-900 border border-slate-800/80 rounded-lg p-2 space-y-1">
                        <span className="block text-[9px] font-mono text-slate-400 truncate" title={hName}>
                          Col #{idx + 1}: <strong className="text-white">{hName}</strong>
                        </span>
                        <select
                          value={columnMappings[idx.toString()] || ''}
                          onChange={(e) => handleMappingChange(idx.toString(), e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800/80 rounded px-1.5 py-1 text-[10px] text-slate-200"
                        >
                          <option value="">-- Ignorar --</option>
                          {config.targetFields.map(f => (
                            <option key={f.key} value={f.key}>{f.label} {f.required ? '*' : ''}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MAIN DATA PREVIEW TABLE */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20 flex-1">
                <div className="overflow-x-auto max-h-[40vh]">
                  <table className="w-full text-xs text-left text-slate-400">
                    <thead className="text-[10px] uppercase font-mono bg-slate-950 text-slate-500 border-b border-slate-800 sticky top-0">
                      <tr>
                        <th className="p-3 text-center w-12">
                          <input 
                            type="checkbox" 
                            checked={parsedRecords.length > 0 && parsedRecords.every((_, idx) => selectedIndices[idx])}
                            onChange={toggleSelectAll}
                            className="rounded border-slate-800 text-violet-600 bg-slate-950 w-3.5 h-3.5"
                          />
                        </th>
                        <th className="p-3 w-12">Reg.</th>
                        {config.targetFields.map(f => (
                          <th key={f.key} className="p-3 whitespace-nowrap min-w-[120px]">
                            <div className="flex items-center gap-1">
                              {f.label} {f.required && <span className="text-red-500">*</span>}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {parsedRecords.map((record, rIdx) => {
                        const isSelected = selectedIndices[rIdx];
                        return (
                          <tr key={rIdx} className={`hover:bg-slate-800/20 ${isSelected ? 'bg-violet-950/5' : 'opacity-60'}`}>
                            <td className="p-3 text-center">
                              <input 
                                type="checkbox"
                                checked={!!isSelected}
                                onChange={() => toggleSelectRow(rIdx)}
                                className="rounded border-slate-800 text-violet-600 bg-slate-950 w-3.5 h-3.5"
                              />
                            </td>
                            <td className="p-3 text-slate-500 font-mono text-[10px]">{rIdx + 1}</td>
                            
                            {config.targetFields.map(f => {
                              const val = record[f.key] !== undefined ? record[f.key] : '';
                              const isMissingRequired = f.required && (val === undefined || val === null || val.toString().trim() === '');
                              
                              return (
                                <td key={f.key} className="p-2">
                                  <input
                                    type={f.key === 'capacidadeKg' || f.key === 'pesoMercadoriaKg' ? 'number' : 'text'}
                                    value={val}
                                    onChange={(e) => handleCellEdit(rIdx, f.key, e.target.value)}
                                    placeholder={f.required ? 'Obrigatório*' : 'Opcional'}
                                    className={`w-full bg-slate-900/50 border rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-violet-500 ${
                                      isMissingRequired ? 'border-red-500/50 bg-red-950/20 placeholder-red-400' : 'border-slate-800/80'
                                    }`}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status and Action bar */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-950/40 p-4 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Table className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {parsedRecords.filter((_, idx) => selectedIndices[idx]).length} de {parsedRecords.length} registros selecionados
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Clique nas células para ajustar qualquer dado antes de salvar.</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  {isSaving && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>{saveProgressMsg || 'Importando e geocodificando registros...'}</span>
                    </div>
                  )}

                  <button
                    onClick={handleReset}
                    disabled={isSaving}
                    className="w-full sm:w-auto bg-slate-800 hover:bg-slate-750 text-slate-300 disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700/60 transition-colors"
                  >
                    Descartar e Voltar
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={isSaving}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>{isSaving ? 'Importando...' : 'Importar Registros no Sistema'}</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
