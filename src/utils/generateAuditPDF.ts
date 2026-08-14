import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Augment jsPDF interface for TypeScript
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

export function generateAuditReportPDF() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Color Palette - Institutional Navy & Slate
  const primaryColor = [15, 23, 42]; // #0f172a (Slate 900)
  const secondaryColor = [79, 70, 229]; // #4f46e5 (Indigo 600)
  const darkTextColor = [30, 41, 59]; // #1e293b
  const mutedTextColor = [100, 116, 139]; // #64748b
  const lightBg = [248, 250, 252]; // #f8fafc

  let currentY = 15;

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Brand Name & Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('LOGUSQ — SISTEMA OPERACIONAL INTEGRADO DE LOGÍSTICA', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(199, 210, 254);
  doc.text('DOSSIÊ DE AUDITORIA EXTERNA, ARQUITETURA TÉCNICA E DIRETRIZES DO SISTEMA', 14, 18);
  doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')} | Versão: 2.6.4 Enterprise`, 14, 23);

  currentY = 36;

  // Section 1: Sumário Executivo
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. SUMÁRIO EXECUTIVO & ESCOPO DA PLATAFORMA', 14, currentY);
  currentY += 2;

  doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setLineWidth(0.8);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  const execSummary = 
    'O LogusQ é uma plataforma SaaS Full-Stack de missão crítica voltada para gestão de frotas, roteirização científica e comprovação digital de entregas em tempo real. O sistema é estruturado em três níveis de acesso complementares e interligados com sincronismo de baixa latência: Painel Master (Governança & SaaS), Painel do Gestor (Torre de Controle Operacional) e Painel do Motorista (Terminal de Campo).';
  const splitSummary = doc.splitTextToSize(execSummary, pageWidth - 28);
  doc.text(splitSummary, 14, currentY);
  currentY += splitSummary.length * 4.5 + 4;

  // Section 2: Arquitetura em 3 Níveis
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('2. MATRIZ DE ARQUITETURA E MÓDULOS DO ECOSSISTEMA', 14, currentY);
  currentY += 2;
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 4;

  doc.autoTable({
    startY: currentY,
    head: [['Módulo / Camada', 'Público Alvo', 'Principais Recursos e Responsabilidades', 'Interligação & Comunicação']],
    body: [
      [
        'PAINEL MASTER\n(Governança Global)',
        'Diretoria Executiva,\nControladoria,\nRH e Suporte SaaS',
        '• Gestão de Clientes / Tenants (Assinantes)\n• Gestão de Planos SaaS (POC, Starter, Enterprise)\n• Controle Financeiro Global, MRR e Faturamento\n• Gestão de RH Interno, Folha e Níveis de Acesso\n• Trilha Imutável de Auditoria de Ações',
        'Controle central de ativação/bloqueio de empresas assinantes e auditoria global de conformidade.'
      ],
      [
        'PAINEL DO GESTOR\n(Torre de Controle)',
        'Gestores de Logística,\nControladores de Tráfego,\nExpedição',
        '• Importação Inteligente (XML NF-e, Excel, OCR)\n• Roteirização Matemática TSP com Clusterização\n• Monitoramento em Tempo Real por GPS e Mapas\n• Painel Crítico de Emergência & Transbordo\n• Auditoria de Jornada de Trabalho (Lei 13.103)',
        'Transmite romaneios e ordens aos motoristas; recebe ocorrências, telemetria e PODs instantaneamente.'
      ],
      [
        'PAINEL DO MOTORISTA\n(Terminal de Campo)',
        'Motoristas, Condutores,\nAjudantes de Entrega',
        '• Manifesto Eletrônico Sequenciado por Paradas\n• Comprovante Digital (Foto, Assinatura e Coordenadas)\n• Navegação com Waze / Google Maps integrado\n• Ponto Digital de Jornada (Início, Pausa, Almoço)\n• Botão de Pânico / Acionamento de Emergência',
        'Envia confirmações de entrega, timestamps e alertas de pane em tempo real para a Torre do Gestor.'
      ]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240]
    },
    columnStyles: {
      0: { cellWidth: 36, fontStyle: 'bold' },
      1: { cellWidth: 32 },
      2: { cellWidth: 70 },
      3: { cellWidth: 46 }
    }
  });

  currentY = doc.lastAutoTable.finalY + 6;

  // Check page break
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = 20;
  }

  // Section 3: Detalhamento do Painel Master
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('3. DETALHAMENTO DO PAINEL MASTER (GOVERNANÇA SAAS)', 14, currentY);
  currentY += 2;
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 4;

  const masterDetails = [
    '• Base de Clientes (Tenancy): Cadastro completo de empresas assinantes com CNPJ, Inscrição Estadual, contatos, dados de faturamento, bloqueio/desbloqueio e personalização de limites de frota.',
    '• Catálogo de Planos SaaS: Parametrização de planos (POC, Padrão, Pro, Enterprise), precificação recorrente, franquia de veículos permitidos e recursos habilitados.',
    '• Módulo Financeiro & MRR: Acompanhamento de receita mensal recorrente, controle de inadimplência, registro de pagamentos e emissão de recibos.',
    '• RH Interno & Gestão de Colaboradores: Cadastro de analistas, suporte e gerentes, com regimes de contratação (CLT/PJ), controle de salários e níveis granulares de permissão (TOTAL, RH, Financeiro).',
    '• Trilha Imutável de Auditoria: Registro rigoroso de todas as operações administrativas críticas com timestamp, operador, IP simulado, payload de modificação e status de conformidade.'
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  masterDetails.forEach(item => {
    const lines = doc.splitTextToSize(item, pageWidth - 28);
    doc.text(lines, 14, currentY);
    currentY += lines.length * 4.2;
  });

  currentY += 4;

  // Check page break for Page 2
  doc.addPage();
  currentY = 20;

  // Header Page 2
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('LOGUSQ — DOSSIÊ TÉCNICO & RELATÓRIO DE AUDITORIA (CONTINUAÇÃO)', 14, 11);

  currentY = 24;

  // Section 4: Protocolos de Emergência e Transbordo
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('4. PROTOCOLOS DE EMERGÊNCIA, PANE E TRANSBORDO DE CARGA', 14, currentY);
  currentY += 2;
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 4;

  doc.autoTable({
    startY: currentY,
    head: [['Comando de Contingência', 'Gatilho Operacional', 'Processamento Algorítmico', 'Resultado no Sistema']],
    body: [
      [
        '1. Recolher Pendentes ao CD',
        'Veículo inoperante com carga a bordo que precisa retornar à base.',
        'Busca o veículo mais próximo com capacidade ociosa e calcula rota até o local da pane.',
        'Insere ponto de coleta emergencial na rota do motorista de apoio e retorna carga ao CD.'
      ],
      [
        '2. Redistribuir Cargas Pendentes',
        'Necessidade de cumprir as entregas no mesmo dia sem retorno ao CD.',
        'Particiona os pacotes restantes entre os veículos ativos mais próximos e executa otimização TSP.',
        'As paradas são reordenadas dinamicamente nas rotas dos veículos de apoio.'
      ],
      [
        '3. Direcionar para Motorista Específico',
        'Decisão do gestor de designar um condutor reserva ou de plantão.',
        'Permite a seleção direta de qualquer condutor cadastrado com verificação de capacidade.',
        'Transfere o manifesto para o condutor selecionado com traçado automático de resgate.'
      ],
      [
        'Marcar como Resolvido / Apoio Enviado',
        'Socorro ou guincho enviado com sucesso.',
        'Arquiva o chamado crítico no banco de auditoria e normaliza os indicadores da frota.',
        'Encerra a sirene e o banner vermelho na Torre de Controle.'
      ]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240]
    },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { cellWidth: 42 },
      2: { cellWidth: 54 },
      3: { cellWidth: 46 }
    }
  });

  currentY = doc.lastAutoTable.finalY + 6;

  // Section 5: Diretrizes de Idealização & Como o Sistema Deve Ser
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('5. DIRETRIZES DE IDEALIZAÇÃO DO SISTEMA (COMO DEVE SER)', 14, currentY);
  currentY += 2;
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 4;

  const idealizacaoItems = [
    '• Sincronismo Fiel & Latência Zero: O sistema opera com atualização bidirecional imediata (BroadcastChannel + Storage Events). Nenhum usuário precisa atualizar páginas (F5) para visualizar alterações.',
    '• Rigor Matemático nas Rotas: O cálculo de rotas não é geométrico linear; ele utiliza modelos de redes viárias (OSRM), otimização combinatória (TSP) e validação de pesos/volumes antes do despacho.',
    '• Comprovação Jurídica Irrefutável: Toda baixa de entrega exige POD completo (foto da mercadoria/canhoto, assinatura digital do recebedor, CPF/Documento e carimbo GPS com timestamp imutável).',
    '• Conformidade com a Lei do Motorista (Lei nº 13.103/2015): Registro inviolável de jornadas, tempo de direção contínua, paradas de descanso e intervalos de refeição.',
    '• Alta Disponibilidade e Resiliência Operacional: Capacidade de operar offline no terminal do motorista com sincronização automática assim que a conectividade for restabelecida.'
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  idealizacaoItems.forEach(item => {
    const lines = doc.splitTextToSize(item, pageWidth - 28);
    doc.text(lines, 14, currentY);
    currentY += lines.length * 4.2;
  });

  currentY += 6;

  // Signature Block
  if (currentY > pageHeight - 40) {
    doc.addPage();
    currentY = 30;
  }

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(14, currentY + 15, 90, currentY + 15);
  doc.line(110, currentY + 15, 186, currentY + 15);

  doc.setFontSize(8);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text('Comitê de Arquitetura & Engenharia LogusQ', 14, currentY + 19);
  doc.text('Auditoria de Conformidade e Segurança da Informação', 110, currentY + 19);

  // Footer on all pages
  const totalPages = (doc as any).getNumberOfPages ? (doc as any).getNumberOfPages() : (doc.internal.pages.length - 1);
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `LogusQ Enterprise Logistics System — Documento Confidencial para Fins de Auditoria e Certificação — Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  doc.save('Dossie_Completo_Auditoria_LogusQ.pdf');
}
