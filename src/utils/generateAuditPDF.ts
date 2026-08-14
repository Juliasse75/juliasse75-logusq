import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateAuditReportPDF() {
  try {
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

    let currentY = 15;

    // ==========================================
    // PÁGINA 1: CAPA & SUMÁRIO EXECUTIVO
    // ==========================================
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 32, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('LOGUSQ — SISTEMA OPERACIONAL INTEGRADO DE LOGÍSTICA', 14, 13);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(199, 210, 254);
    doc.text('DOSSIÊ TÉCNICO OFICIAL DE AUDITORIA DE SISTEMA E ESCOPO FUNCIONAL', 14, 20);
    doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} | Versão: 2.6.4 Enterprise | Ref: AUD-LOGUSQ-2026`, 14, 26);

    currentY = 40;

    // Section 1: Escopo e Identificação do Sistema
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('1. ESCOPO DA AUDITORIA, OBJETIVO & IDENTIFICAÇÃO DO PRODUTO', 14, currentY);
    currentY += 2;

    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setLineWidth(0.8);
    doc.line(14, currentY, pageWidth - 14, currentY);
    currentY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    const execSummary = 
      'O presente documento constitui o dossiê técnico e funcional do ecossistema LOGUSQ, elaborado para fins de auditoria de sistemas, certificação de conformidade e verificação de processos operacionais e de governança. O LOGUSQ é uma solução SaaS Full-Stack desenhada para centralizar a gestão de fretes, roteirização científica, telemetria de tráfego em tempo real, auditoria de jornada trabalhista e comprovação digital de entregas.';
    const splitSummary = doc.splitTextToSize(execSummary, pageWidth - 28);
    doc.text(splitSummary, 14, currentY);
    currentY += splitSummary.length * 4.2 + 4;

    // Section 2: Arquitetura em 3 Camadas
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('2. ARQUITETURA EM TRÊS NÍVEIS & MATRIZ DE RESPONSABILIDADES', 14, currentY);
    currentY += 2;
    doc.line(14, currentY, pageWidth - 14, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      head: [['Camada / Nível', 'Perfil de Usuário', 'Responsabilidades & Funções Centrais', 'Interligação & Protocolo']],
      body: [
        [
          'PAINEL MASTER\n(Governança & SaaS)',
          'Diretoria Executiva,\nControladoria,\nRH e Suporte SaaS',
          '• Gestão Multi-Tenancy (Empresas/Assinantes)\n• Parametrização de Planos SaaS & Franquias\n• Gestão Financeira, MRR e Faturamento\n• RH Interno, Salários e Níveis de Permissão\n• Trilha Imutável de Auditoria de Ações',
          'Administração e controle de acessos em nível global.'
        ],
        [
          'PAINEL DO GESTOR\n(Torre de Controle)',
          'Gerentes de Logística,\nControladores de Tráfego,\nExpedição',
          '• Importação Multiformato (XML NF-e, Excel, OCR)\n• Roteirização Matemática TSP com Clusterização\n• Telemetria no Mapa com Traçado Viário Real\n• Módulo de Contingência e Transbordo de Pane\n• Auditoria de Jornada de Trabalho (Lei 13.103)',
          'Gera romaneios, transmite aos motoristas e monitora execução.'
        ],
        [
          'PAINEL DO MOTORISTA\n(Terminal de Campo)',
          'Motoristas,\nCondutores de Frota,\nAjudantes',
          '• Manifesto Sequenciado com Navegação (Waze/Maps)\n• Comprovação Digital de Entrega (POD com Foto e Assinatura)\n• Controle Digital de Jornada (Início, Pausa, Almoço)\n• Botão de Pânico & Alerta de Emergência',
          'Transmite telemetria, ocorrências e baixas em tempo real.'
        ]
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.2,
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

    currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 6 : currentY + 65;

    // Section 3: Inventário Completo do Painel Master
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('3. INVENTÁRIO FUNCIONAL DO PAINEL MASTER (GOVERNANÇA SAAS)', 14, currentY);
    currentY += 2;
    doc.line(14, currentY, pageWidth - 14, currentY);
    currentY += 4;

    const masterItems = [
      '• Módulo de Clientes (Tenancy): Cadastro completo com Razão Social, CNPJ, Inscrição Estadual, contatos, dados de faturamento e bloqueio/desbloqueio instantâneo de acesso.',
      '• Módulo de Planos: Criação de planos de assinatura (POC, Starter, Pro, Enterprise), precificação recorrente e franquia de veículos permitidos.',
      '• Módulo Financeiro & MRR: Acompanhamento de receita recorrente mensal, controle de faturas, registro de recebimentos e emissão de recibos.',
      '• Módulo de RH Interno: Gestão da equipe da mantenedora com controle de salários, regimes (CLT/PJ) e permissões de acesso (TOTAL, RH, Financeiro).',
      '• Trilha Imutável de Auditoria: Log cronológico de ações administrativas críticas com carimbo de data/hora, operador e detalhes da alteração.'
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    masterItems.forEach(item => {
      const lines = doc.splitTextToSize(item, pageWidth - 28);
      doc.text(lines, 14, currentY);
      currentY += lines.length * 3.8;
    });

    // ==========================================
    // PÁGINA 2: PAINEL DO GESTOR, ROTEIRIZAÇÃO & TRANSBORDO
    // ==========================================
    doc.addPage();
    currentY = 20;

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('LOGUSQ — DOSSIÊ DE AUDITORIA: TORRE DO GESTOR & ROTEIRIZAÇÃO (PÁG 2)', 14, 11);

    currentY = 24;

    // Section 4: Funcionalidades do Painel do Gestor
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('4. INVENTÁRIO FUNCIONAL DA TORRE DO GESTOR (OPERAÇÕES LOGÍSTICAS)', 14, currentY);
    currentY += 2;
    doc.line(14, currentY, pageWidth - 14, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      head: [['Módulo Operacional', 'Recursos e Metodologia Técnica']],
      body: [
        [
          'Importação Inteligente',
          'Processamento de XML de NF-e/CT-e, planilhas Excel/CSV e digitação manual com geocodificação de endereços e validação de duplicidade.'
        ],
        [
          'Motor de Roteirização Matemática',
          'Clusterização K-Means de entregas por setores e resolução de TSP (Traveling Salesperson Problem), calculando KM total, consumo de combustível e emissão de CO2.'
        ],
        [
          'Telemetria e Mapa de Operações',
          'Visualização Leaflet com traçados viários reais (OSRM), camadas de satélite/mapa e marcadores dinâmicos de status (Pendente, Trânsito, Atendimento, Entregue).'
        ],
        [
          'Auditoria de Jornada (Lei 13.103/15)',
          'Controle dos tempos de saída da base, trânsito, atendimento, repouso e almoço com cálculo de horas líquidas trabalhadas e relatórios para impressão.'
        ],
        [
          'Gestão de Frota e Condutores',
          'Cadastro de veículos (Placa, Modelo, Capacidade em kg e m³), controle de validade de CNH e histórico de rotas por motorista.'
        ]
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240]
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 134 }
      }
    });

    currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 6 : currentY + 50;

    // Section 5: Protocolos de Emergência e Transbordo
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('5. PROTOCOLOS DE EMERGÊNCIA, PANE E TRANSBORDO DE CARGAS', 14, currentY);
    currentY += 2;
    doc.line(14, currentY, pageWidth - 14, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      head: [['Comando de Contingência', 'Gatilho Operacional', 'Processamento Algorítmico', 'Resultado no Sistema']],
      body: [
        [
          '1. Recolher Pendentes ao CD',
          'Veículo inoperante com carga a bordo que precisa retornar à base.',
          'Busca o veículo operacional mais próximo com capacidade de carga ociosa e calcula rota até o local da pane.',
          'Insere ponto de coleta emergencial na rota do motorista de apoio e retorna a carga ao CD.'
        ],
        [
          '2. Redistribuir Cargas Pendentes',
          'Necessidade de cumprir as entregas no mesmo dia sem retorno à base.',
          'Particiona os pacotes restantes entre os veículos ativos mais próximos e executa nova otimização TSP.',
          'As paradas são reordenadas dinamicamente nas rotas dos veículos de apoio.'
        ],
        [
          '3. Direcionar para Motorista Específico',
          'Decisão do gestor de designar um condutor reserva ou de plantão.',
          'Permite a seleção direta de qualquer condutor cadastrado com verificação em tempo real de capacidade de peso.',
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
        fontSize: 8
      },
      styles: {
        fontSize: 7.2,
        cellPadding: 2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240]
      },
      columnStyles: {
        0: { cellWidth: 42, fontStyle: 'bold' },
        1: { cellWidth: 40 },
        2: { cellWidth: 54 },
        3: { cellWidth: 48 }
      }
    });

    // ==========================================
    // PÁGINA 3: TERMINAL DO MOTORISTA, COMPROVAÇÃO DIGITAL & CONFORMIDADE
    // ==========================================
    doc.addPage();
    currentY = 20;

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('LOGUSQ — DOSSIÊ DE AUDITORIA: TERMINAL DO MOTORISTA & AUDITORIA (PÁG 3)', 14, 11);

    currentY = 24;

    // Section 6: Terminal do Motorista
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('6. INVENTÁRIO DO TERMINAL DO MOTORISTA & COMPROVAÇÃO DIGITAL (POD)', 14, currentY);
    currentY += 2;
    doc.line(14, currentY, pageWidth - 14, currentY);
    currentY += 4;

    const driverItems = [
      '• Cockpit de Entregas Sequenciado: Lista de paradas organizada pela ordem ótima calculada pela Torre, com botão de navegação direta via Waze e Google Maps.',
      '• Comprovante Digital de Entrega (POD): Captura obrigatória de foto do canhoto/mercadoria, coleta de assinatura digital na tela, registro do nome e documento do recebedor e carimbo de geolocalização com timestamp.',
      '• Registro de Insucessos: Menu estruturado para apontamento de recusas (Cliente Ausente, Endereço Incorreto, Avaria, etc.) com registro de foto comprobatória.',
      '• Ponto Digital de Jornada: Botões para registro de início de viagem, pausas, intervalo de refeição e encerramento com transmissão imediata à Torre.',
      '• Botão de Pânico / Pane Mecânica: Envio de alerta de emergência com coordenadas GPS para a Torre do Gestor.'
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    driverItems.forEach(item => {
      const lines = doc.splitTextToSize(item, pageWidth - 28);
      doc.text(lines, 14, currentY);
      currentY += lines.length * 3.8;
    });

    currentY += 4;

    // Section 7: Checklist de Auditoria & Conformidade
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('7. CHECKLIST DE CONFORMIDADE PARA AUDITORIA EXTERNA', 14, currentY);
    currentY += 2;
    doc.line(14, currentY, pageWidth - 14, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      head: [['Item de Auditoria', 'Requisito Auditado', 'Mecanismo de Validação no LogusQ', 'Status']],
      body: [
        ['AUD-01', 'Integridade e Trilha de Auditoria', 'Logs imutáveis de ações administrativas com data/hora e operador no Painel Master.', 'CONFORME'],
        ['AUD-02', 'Segurança Jurídica na Entrega (POD)', 'Foto, assinatura, documento e GPS registrados na conclusão de cada parada.', 'CONFORME'],
        ['AUD-03', 'Controle da Lei do Motorista', 'Registro eletrônico de paradas, intervalos e jornada conforme Lei nº 13.103/2015.', 'CONFORME'],
        ['AUD-04', 'Resiliência Operacional (Plano B)', 'Algoritmos automatizados de transbordo e contingência em caso de pane do veículo.', 'CONFORME'],
        ['AUD-05', 'Isolamento de Dados (Multi-Tenancy)', 'Separação estrutural de dados por identificador de cliente (idCliente / Tenant).', 'CONFORME']
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      styles: {
        fontSize: 7.2,
        cellPadding: 2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240]
      },
      columnStyles: {
        0: { cellWidth: 20, fontStyle: 'bold' },
        1: { cellWidth: 54 },
        2: { cellWidth: 84 },
        3: { cellWidth: 26, textColor: [16, 185, 129], fontStyle: 'bold' }
      }
    });

    currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : currentY + 45;

    // Signature Block
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(14, currentY + 12, 90, currentY + 12);
    doc.line(110, currentY + 12, 186, currentY + 12);

    doc.setFontSize(7.5);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text('Engenharia de Software & Arquitetura LogusQ', 14, currentY + 16);
    doc.text('Auditoria de Conformidade e Segurança da Informação', 110, currentY + 16);

    // Footer on all pages
    const totalPages = (doc as any).getNumberOfPages ? (doc as any).getNumberOfPages() : (doc.internal.pages.length - 1);
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `LogusQ Enterprise Logistics System — Documento Oficial de Auditoria — Página ${i} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
    }

    // MULTI-TIER ROBUST DOWNLOAD STRATEGY
    // Strategy 1: Blob URL with explicit hidden <a> click
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = 'Dossie_Completo_Auditoria_LogusQ.pdf';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 1000);

    // Strategy 2: In case popup / iframe blocks standard download link, also trigger doc.save
    try {
      doc.save('Dossie_Completo_Auditoria_LogusQ.pdf');
    } catch (e) {
      console.log('doc.save fallback handled:', e);
    }

  } catch (error) {
    console.error('Erro ao gerar PDF de Auditoria:', error);
    alert('Não foi possível gerar o PDF diretamente pelo navegador. Verifique se o bloqueador de downloads/popups está ativo.');
  }
}
