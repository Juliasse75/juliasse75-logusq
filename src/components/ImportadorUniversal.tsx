import React, { useState, useRef } from 'react';
import { 
  X, Upload, FileText, Clipboard, Sparkles, Check, 
  AlertTriangle, Play, HelpCircle, ArrowRight, Table, ListPlus
} from 'lucide-react';

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

  const fileInputRef = useRef<HTMLInputElement>(null);

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
        { key: 'veiculo', label: 'Código Veículo (Vínculo)', required: false }
      ]
    },
    entregas: {
      title: 'Importar Romaneio de Entregas / Coletas',
      subtitle: 'Carregue notas fiscais, romaneios PDF, listas de clientes do ERP em TXT/CSV ou cole endereços.',
      helpText: 'Cada linha representa uma parada. Deve conter Chave/ID, Nome do Cliente, Endereço completo com cidade/UF e o peso da mercadoria.',
      targetFields: [
        { key: 'chave', label: 'ID Entrega / Chave NFe', required: true },
        { key: 'cliente', label: 'Cliente / Destinatário', required: true },
        { key: 'endereco', label: 'Endereço Completo', required: true },
        { key: 'pesoMercadoriaKg', label: 'Peso Carga (KG)', required: true },
        { key: 'tipoOperacao', label: 'Operação', required: true, help: 'Entrega ou Coleta' }
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

    try {
      let payload: any = { type };

      if (activeInputMode === 'file') {
        if (!file) {
          throw new Error('Nenhum arquivo selecionado. Selecione um PDF, TXT ou CSV.');
        }

        setProcessingStatus(`Lendo arquivo: ${file.name} (${Math.round(file.size / 1024)} KB)...`);
        const base64Data = await fileToBase64(file);
        
        payload.fileBase64 = base64Data;
        payload.mimeType = file.type || 'application/octet-stream';
        payload.fileName = file.name;
      } else {
        if (!pastedText.trim()) {
          throw new Error('Por favor, cole algum texto no campo abaixo antes de analisar.');
        }
        setProcessingStatus('Preparando texto copiado para processamento...');
        payload.rawText = pastedText;
      }

      setProcessingStatus('Enviando dados de transporte para o Gemini 3.5 Flash...');
      
      const response = await fetch('/api/import/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
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
      console.error(err);
      if (err.message === 'API_KEY_MISSING') {
        // Offer local heuristic parse option directly to user
        setErrorMessage('Sua chave do Gemini (GEMINI_API_KEY) não está configurada nos Secrets da plataforma. Mas não se preocupe! Podemos usar o processamento local para ler arquivos estruturados TXT ou CSV.');
        // Trigger local fallback if it was a plain CSV/TXT file
        if (activeInputMode === 'file' && file && (file.name.endsWith('.csv') || file.name.endsWith('.txt') || file.name.endsWith('.tsv'))) {
          runLocalHeuristics();
        }
      } else {
        setErrorMessage(err.message || 'Erro inesperado ao analisar o documento.');
      }
    } finally {
      setIsProcessing(false);
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
      
      // Keywords mapping list
      const keywordsMap: Record<string, string[]> = {
        idVeiculo: ['id', 'frota', 'numero', 'veiculo', 'veic', 'interno', 'codigo'],
        placa: ['placa', 'plate'],
        modelo: ['modelo', 'model'],
        fabricante: ['fabricante', 'marca', 'brand', 'fab'],
        tipo: ['tipo', 'categoria', 'modal'],
        capacidadeKg: ['capacidade', 'peso', 'carga', 'kg', 'cap'],
        anoFabricacao: ['fabricacao', 'ano_fab', 'fabr'],
        anoModelo: ['ano_mod', 'modelo_ano'],
        cor: ['cor', 'color'],
        renavam: ['renavam'],
        chassi: ['chassi'],
        
        nome: ['nome', 'motorista', 'condutor', 'driver', 'fullname'],
        cpf: ['cpf'],
        rg: ['rg'],
        telefone: ['telefone', 'celular', 'tel', 'phone'],
        email: ['email', 'e-mail', 'login', 'mail'],
        nascimento: ['nascimento', 'nasc'],
        cnh: ['cnh', 'registro'],
        categoriaCnh: ['categoria', 'cat'],
        vencCnh: ['vencimento', 'validade', 'venc'],
        
        chave: ['chave', 'id', 'nfe', 'codigo', 'nº', 'romaneio'],
        cliente: ['cliente', 'destinatario', 'destino', 'nome'],
        endereco: ['endereco', 'local', 'rua', 'address'],
        pesoMercadoriaKg: ['peso', 'kg', 'peso_carga', 'mercadoria'],
        tipoOperacao: ['operacao', 'tipo']
      };

      headers.forEach((h, colIdx) => {
        const lowerH = h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        // Search if any target fields match these keywords
        let matchedField = '';
        for (const [fieldKey, keywords] of Object.entries(keywordsMap)) {
          // Only map if field is relevant to active type config
          const isRelevant = config.targetFields.some(tf => tf.key === fieldKey);
          if (!isRelevant) continue;

          if (keywords.some(kw => lowerH.includes(kw))) {
            matchedField = fieldKey;
            break;
          }
        }
        if (matchedField) {
          initialMappings[colIdx.toString()] = matchedField;
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
  const handleConfirmImport = () => {
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

    let successCount = 0;

    try {
      toImport.forEach(item => {
        if (type === 'veiculos') {
          // Generate an ID if missing
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
            veiculo: item.veiculo || ''
          });
          successCount++;
        } else if (type === 'entregas') {
          dbRepo.cadastrarEntrega(userEmail, {
            chave: item.chave || `ENT-${Math.floor(Math.random() * 1000000)}`,
            cliente: item.cliente || 'Cliente Importado',
            endereco: item.endereco || 'Endereço Indefinido',
            pesoMercadoriaKg: parseInt(item.pesoMercadoriaKg) || 15,
            tipoOperacao: item.tipoOperacao === 'Coleta' ? 'Coleta' : 'Entrega'
          });
          successCount++;
        }
      });

      alert(`Sucesso! Foram importados e validados ${successCount} registros no sistema.`);
      onImportComplete();
      onClose();
      // Reset states
      setFile(null);
      setPastedText('');
      setImportStep('input');
      setParsedRecords([]);
    } catch (err: any) {
      alert(`Erro na inserção de dados: ${err.message || err}`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
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
                      {errorMessage.includes('GEMINI_API_KEY') && (
                        <button
                          onClick={runLocalHeuristics}
                          className="mt-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold px-3 py-1 rounded border border-red-500/30 transition-colors text-[10px] uppercase font-mono tracking-wider"
                        >
                          Usar Analisador Local Offline (Sem IA)
                        </button>
                      )}
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
                    {isProcessing ? 'Processando...' : 'Analisar com IA (Recomendado)'}
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
                    <p className="text-[10px] text-slate-500">Isso pode levar alguns segundos dependendo do tamanho do documento.</p>
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

                <div className="flex gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={handleReset}
                    className="w-full sm:w-auto bg-slate-800 hover:bg-slate-750 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700/60 transition-colors"
                  >
                    Descartar e Voltar
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <Check className="w-4 h-4" /> Importar Registros no Sistema
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
