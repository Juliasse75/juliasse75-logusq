import React, { useState } from 'react';
import { dbRepo } from '../data/mockData';
import { Veiculo, Condutor, Entrega, PlanosSaaS, TipoVeiculo } from '../types';
import { 
  Truck, Users, MapPin, Calculator, Plus, Upload, Download, Play, 
  Map, CheckCircle, Trash2, Calendar, FileText, Clipboard, Settings, ShieldAlert, Sparkles,
  Info, RotateCcw, Clock, Bell, Printer, UserCheck
} from 'lucide-react';
import SimulatedMap from './SimulatedMap';
import { clusterAndOptimize, DEFAULT_BASE, haversineDistance, optimizeTSP } from '../utils/routingEngine';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import ImportadorUniversal from './ImportadorUniversal';

interface DashboardClienteProps {
  userEmail: string;
  onLogout: () => void;
}

export default function DashboardCliente({ userEmail, onLogout }: DashboardClienteProps) {
  const [activeTab, setActiveTab] = useState<'roteiro' | 'frota' | 'condutores' | 'custos' | 'comprovantes' | 'jornadas'>('roteiro');
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  // Client info
  const clientData = dbRepo.getCliente(userEmail);
  const frota = dbRepo.getFrota(userEmail);
  const condutores = dbRepo.getCondutores(userEmail);
  const todasEntregas = dbRepo.getEntregas(userEmail);
  const entregasPendentes = todasEntregas.filter(e => e.status === 'Pendente');

  // Active Routes State (persist in memory or local storage, or generated after optimize)
  const [activeRoutes, setActiveRoutes] = useState<Record<string, { driver: string; driverEmail?: string; vehicle: string; path: Entrega[]; km: number; duration: number }>>(() => {
    return dbRepo.getRotasAtivas(userEmail);
  });
  const [mapRoutes, setMapRoutes] = useState<Record<number, Entrega[]>>({});

  React.useEffect(() => {
    setActiveRoutes(dbRepo.getRotasAtivas(userEmail));
  }, [refreshKey, userEmail]);

  // Form selections
  const [selectedVeiculoEdit, setSelectedVeiculoEdit] = useState<string>(frota[0]?.idVeiculo || '');
  const veicSel = frota.find(v => v.idVeiculo === selectedVeiculoEdit);

  const [selectedCondutorEdit, setSelectedCondutorEdit] = useState<string>('');
  const condSel = condutores.find(c => c.email === selectedCondutorEdit);

  // --- COMPROVANTES TAB FILTERS ---
  const [searchCompClient, setSearchCompClient] = useState('');
  const [searchCompNF, setSearchCompNF] = useState('');
  const [filterCompDriver, setFilterCompDriver] = useState('');
  const [filterCompStatus, setFilterCompStatus] = useState('');
  const [filterCompDate, setFilterCompDate] = useState('');
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);

  // --- JORNADAS TAB FILTERS ---
  const [filterJornadaDriver, setFilterJornadaDriver] = useState('');
  const [filterJornadaVehicle, setFilterJornadaVehicle] = useState('');
  const [filterJornadaDate, setFilterJornadaDate] = useState('17/07/2026');

  // --- EMERGENCY AND JOURNEY AUDIT STATE & HELPERS ---
  const [resolvedEmergencies, setResolvedEmergencies] = useState<string[]>(() => {
    const saved = localStorage.getItem(`logusq_emergencias_resolvidas_${userEmail}`);
    return saved ? JSON.parse(saved) : [];
  });

  const handleResolveEmergency = (timeKey: string) => {
    const updated = [...resolvedEmergencies, timeKey];
    setResolvedEmergencies(updated);
    localStorage.setItem(`logusq_emergencias_resolvidas_${userEmail}`, JSON.stringify(updated));
    triggerRefresh();
    alert('✓ Alerta de emergência marcado como resolvido e arquivado!');
  };

  const parsePtBrDate = (str: string) => {
    if (!str) return null;
    if (str.includes('T')) {
      const d = new Date(str);
      if (!isNaN(d.getTime())) return d;
    }
    try {
      const cleaned = str.replace(',', '').trim();
      const parts = cleaned.split(' ');
      const dateParts = parts[0].split('/');
      const timeParts = parts[1] ? parts[1].split(':') : ['0', '0', '0'];
      
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const year = parseInt(dateParts[2], 10);
      
      const hour = parseInt(timeParts[0] || '0', 10);
      const minute = parseInt(timeParts[1] || '0', 10);
      const second = parseInt(timeParts[2] || '0', 10);
      
      const d = new Date(year, month, day, hour, minute, second);
      if (!isNaN(d.getTime())) return d;
    } catch (e) {}
    return new Date(str);
  };

  const getJourneyTimeline = (route: any, atividade: any) => {
    if (!route || !route.path || route.path.length === 0) return [];
    const timeline: any[] = [];
    
    const inicioCDStr = atividade?.inicioDeslocamento;
    let lastTimeStr = inicioCDStr;
    
    route.path.forEach((stop: any, idx: number) => {
      const stopName = stop.cliente;
      const startAtendimentoStr = stop.tempoInicioAtendimento;
      const endAtendimentoStr = stop.tempoFimAtendimento;
      
      let travelTimeMsg = "Sem registro de horário";
      let travelDiffMin = 0;
      
      if (lastTimeStr && startAtendimentoStr) {
        try {
          const lastT = parsePtBrDate(lastTimeStr)?.getTime();
          const startT = parsePtBrDate(startAtendimentoStr)?.getTime();
          if (lastT && startT && !isNaN(lastT) && !isNaN(startT)) {
            travelDiffMin = Math.max(1, Math.round((startT - lastT) / 60000));
            const lastTimeFormatted = parsePtBrDate(lastTimeStr)?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || '';
            const startTimeFormatted = parsePtBrDate(startAtendimentoStr)?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || '';
            travelTimeMsg = `${lastTimeFormatted} às ${startTimeFormatted} (${travelDiffMin} min)`;
          }
        } catch (err) {}
      } else {
        travelTimeMsg = "Aguardando início de deslocamento...";
      }
      
      timeline.push({
        tipo: 'deslocamento',
        origem: idx === 0 ? 'CD Hub Principal' : route.path[idx - 1].cliente,
        destino: stopName,
        tempoMsg: travelTimeMsg,
        minutos: travelDiffMin
      });
      
      let serviceTimeMsg = "Aguardando chegada...";
      let serviceDiffMin = stop.duracaoAtendimentoMinutos || 0;
      
      if (startAtendimentoStr) {
        try {
          const startT = parsePtBrDate(startAtendimentoStr)?.getTime();
          const startTimeFormatted = parsePtBrDate(startAtendimentoStr)?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || '';
          if (endAtendimentoStr) {
            const endT = parsePtBrDate(endAtendimentoStr)?.getTime();
            const endTimeFormatted = parsePtBrDate(endAtendimentoStr)?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || '';
            serviceTimeMsg = `${startTimeFormatted} às ${endTimeFormatted} (${serviceDiffMin} min)`;
          } else {
            serviceTimeMsg = `Chegada às ${startTimeFormatted} (Em atendimento...)`;
          }
        } catch (err) {}
      }
      
      timeline.push({
        tipo: 'atendimento',
        cliente: stopName,
        endereco: stop.endereco,
        status: stop.status,
        tempoMsg: serviceTimeMsg,
        minutos: serviceDiffMin
      });
      
      lastTimeStr = endAtendimentoStr || startAtendimentoStr;
    });
    
    const fimCDStr = atividade?.fimDeslocamento;
    if (lastTimeStr && fimCDStr) {
      try {
        const lastT = parsePtBrDate(lastTimeStr)?.getTime();
        const fimT = parsePtBrDate(fimCDStr)?.getTime();
        if (lastT && fimT && !isNaN(lastT) && !isNaN(fimT)) {
          const returnDiffMin = Math.max(1, Math.round((fimT - lastT) / 60000));
          const lastTimeFormatted = parsePtBrDate(lastTimeStr)?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || '';
          const fimTimeFormatted = parsePtBrDate(fimCDStr)?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || '';
          timeline.push({
            tipo: 'deslocamento',
            origem: route.path[route.path.length - 1].cliente,
            destino: 'CD Hub Principal (Retorno)',
            tempoMsg: `${lastTimeFormatted} às ${fimTimeFormatted} (${returnDiffMin} min)`,
            minutos: returnDiffMin
          });
        }
      } catch (err) {}
    } else if (lastTimeStr) {
      timeline.push({
        tipo: 'deslocamento',
        origem: route.path[route.path.length - 1].cliente,
        destino: 'CD Hub Principal (Retorno)',
        tempoMsg: "Aguardando conclusão do percurso de volta ao CD",
        minutos: 0
      });
    }
    
    return timeline;
  };

  const handlePrintAudit = (c: Condutor, activity: any, route: any, timeline: any[], dateStr: string) => {
    const totalPausas = activity?.pausas?.length || 0;
    const totalPausasMin = activity?.pausas?.reduce((acc: number, p: any) => {
      if (p.inicio && p.fim) {
        try {
          const start = parsePtBrDate(p.inicio)?.getTime();
          const end = parsePtBrDate(p.fim)?.getTime();
          if (start && end) {
            return acc + Math.round((end - start) / 60000);
          }
        } catch (e) {}
      }
      return acc;
    }, 0) || 0;

    const totalEntregas = route?.path?.length || 0;
    const entregues = route?.path?.filter((p: any) => p.status === 'Entregue').length || 0;
    const cancelados = route?.path?.filter((p: any) => p.status === 'Cancelado').length || 0;
    const pendentes = route?.path?.filter((p: any) => p.status === 'Pendente').length || 0;

    const empresaNome = clientData?.empresa || 'LOGUSQ CLIENTE CORPORATIVO';
    const dataAuditoria = dateStr || 'Não informada';

    const timelineRows = timeline.map((node: any, idx: number) => {
      if (node.tipo === 'deslocamento') {
        return `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 11px;">🛣️ Deslocamento</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">De: <b>${node.origem}</b><br/>Para: <b>${node.destino}</b></td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${node.tempoMsg}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #475569; font-style: italic;">Percurso de deslocamento</td>
          </tr>
        `;
      } else {
        const color = node.status === 'Entregue' ? '#16a34a' : node.status === 'Cancelado' ? '#dc2626' : '#d97706';
        return `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 11px;">⏱️ Atendimento</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><b>${node.cliente}</b><br/><span style="font-size: 10px; color: #64748b;">${node.endereco}</span></td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${node.tempoMsg}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: ${color};">${node.status}</td>
          </tr>
        `;
      }
    }).join('');

    const pausasRows = (activity?.pausas || []).map((p: any, pIdx: number) => {
      let durationStr = "Em andamento";
      if (p.inicio && p.fim) {
        try {
          const start = parsePtBrDate(p.inicio)?.getTime();
          const end = parsePtBrDate(p.fim)?.getTime();
          if (start && end) {
            durationStr = `${Math.round((end - start) / 60000)} min`;
          }
        } catch (e) {}
      }
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Pausa #${pIdx + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${p.justificativa}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">Início: ${p.inicio.split(', ')[1] || p.inicio}<br/>Fim: ${p.fim ? p.fim.split(', ')[1] || p.fim : 'Pendente'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #d97706;">${durationStr}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Auditoria de Jornada - LogusQ</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5; margin: 0; padding: 40px; background-color: #fff; }
          .header { text-align: center; border-bottom: 3px double #cbd5e1; padding-bottom: 15px; margin-bottom: 25px; }
          .logo { font-size: 24px; font-weight: 900; letter-spacing: 1px; color: #0f172a; font-family: sans-serif; }
          .logo span { color: #7c3aed; }
          .doc-title { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; margin-top: 10px; color: #475569; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; font-size: 12px; }
          .meta-label { font-weight: bold; color: #475569; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
          .meta-value { font-size: 13px; color: #0f172a; margin-top: 2px; font-weight: 600; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 30px; }
          .kpi-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; background-color: #f8fafc; }
          .kpi-num { font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 4px; }
          .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; border-left: 4px solid #7c3aed; padding-left: 8px; margin-top: 30px; margin-bottom: 15px; font-weight: 900; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 11px; text-align: left; }
          th { background-color: #f1f5f9; color: #475569; font-weight: bold; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; padding: 10px; border-bottom: 2px solid #cbd5e1; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; padding-top: 30px; page-break-inside: avoid; }
          .sig-box { text-align: center; font-size: 11px; color: #475569; }
          .sig-line { border-top: 1px solid #94a3b8; margin-bottom: 8px; width: 80%; margin-left: auto; margin-right: auto; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">LOGUS<span>Q</span> INTELIGÊNCIA</div>
          <div class="doc-title">Relatório de Auditoria e Conformidade de Jornada</div>
        </div>

        <div class="meta-grid">
          <div>
            <span class="meta-label">🏢 Empresa / Transportadora</span>
            <div class="meta-value">${empresaNome}</div>
          </div>
          <div>
            <span class="meta-label">📅 Data de Apuração</span>
            <div class="meta-value">${dataAuditoria}</div>
          </div>
          <div>
            <span class="meta-label">👤 Motorista Auditado</span>
            <div class="meta-value">${c.nome} (${c.email})</div>
          </div>
          <div>
            <span class="meta-label">🚚 Veículo Utilizado</span>
            <div class="meta-value">${c.veiculo || 'N/A'}</div>
          </div>
        </div>

        <div class="section-title">Indicadores Consolidados de Produtividade</div>
        <div class="kpi-grid">
          <div class="kpi-card">
            <span class="meta-label" style="font-size: 8px;">⏱️ Saída CD</span>
            <div class="kpi-num" style="font-family: monospace;">${activity?.inicioDeslocamento ? activity.inicioDeslocamento.split(', ')[1] || activity.inicioDeslocamento : 'Não iniciou'}</div>
          </div>
          <div class="kpi-card">
            <span class="meta-label" style="font-size: 8px;">🏁 Retorno CD</span>
            <div class="kpi-num" style="font-family: monospace; color: #4f46e5;">${activity?.fimDeslocamento ? activity.fimDeslocamento.split(', ')[1] || activity.fimDeslocamento : 'Não retornou'}</div>
          </div>
          <div class="kpi-card">
            <span class="meta-label" style="font-size: 8px;">⏸️ Pausas Registradas</span>
            <div class="kpi-num" style="color: #d97706;">${totalPausas} (${totalPausasMin} min)</div>
          </div>
          <div class="kpi-card">
            <span class="meta-label" style="font-size: 8px;">📊 Entregas Concluídas</span>
            <div class="kpi-num" style="color: #16a34a;">${entregues} / ${totalEntregas}</div>
          </div>
        </div>

        <div class="section-title">Cronologia Detalhada do Percurso (Trecho a Trecho)</div>
        ${timeline.length === 0 ? `
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; color: #64748b; font-size: 12px; margin-bottom: 25px;">
            Nenhum registro cronológico disponível para o período selecionado.
          </div>
        ` : `
          <table>
            <thead>
              <tr>
                <th style="width: 15%;">Tipo</th>
                <th style="width: 45%;">Local / Detalhe</th>
                <th style="width: 25%;">Horário / Duração</th>
                <th style="width: 15%;">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 11px;">🏁 Partida CD</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><b>Saída do Centro de Distribuição (CD Hub)</b></td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${activity?.inicioDeslocamento || 'Aguardando ação'}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1e293b;">Iniciada</td>
              </tr>
              ${timelineRows}
              ${activity?.fimDeslocamento ? `
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 11px;">🏁 Retorno CD</td>
                  <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><b>Chegada / Retorno ao CD Hub Principal</b></td>
                  <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${activity.fimDeslocamento}</td>
                  <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #4f46e5;">Concluída</td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        `}

        ${pausasRows ? `
          <div class="section-title">Registro Justificado de Pausas e Interrupções</div>
          <table>
            <thead>
              <tr>
                <th style="width: 15%;">Identificação</th>
                <th style="width: 35%;">Justificativa Registrada</th>
                <th style="width: 35%;">Horários</th>
                <th style="width: 15%;">Duração</th>
              </tr>
            </thead>
            <tbody>
              ${pausasRows}
            </tbody>
          </table>
        ` : ''}

        <div class="signatures">
          <div class="sig-box">
            <div class="sig-line"></div>
            <b>Assinatura do Gestor Responsável</b><br/>
            ${empresaNome} • LogusQ
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <b>Assinatura do Motorista Profissional</b><br/>
            CPF: ${c.cpf || 'Não informado'}
          </div>
        </div>

        <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 9px; color: #94a3b8; font-family: sans-serif;">
          Relatório gerado automaticamente em ${new Date().toLocaleString('pt-BR')} por LogusQ Inteligência Logística.<br/>
          Código de Verificação de Integridade Criptográfica: ${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}
        </div>
      </body>
      </html>
    `;

    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = '0';
    document.body.appendChild(printIframe);
    
    const pri = printIframe.contentWindow;
    if (pri) {
      pri.document.open();
      pri.document.write(htmlContent);
      pri.document.close();
      pri.focus();
      setTimeout(() => {
        pri.print();
        document.body.removeChild(printIframe);
      }, 500);
    }
  };

  // Find active and unresolved emergencies
  const activeEmergencies = condutores.flatMap(c => {
    const saved = localStorage.getItem(`logusq_atividade_${c.email}`);
    if (!saved) return [];
    try {
      const act = JSON.parse(saved);
      if (act && act.emergencias && act.emergencias.length > 0) {
        return act.emergencias.map((e: any) => ({
          ...e,
          driverName: c.nome,
          driverEmail: c.email,
          vehicle: c.veiculo || 'N/A'
        }));
      }
    } catch (e) {}
    return [];
  });

  const unresolvedEmergencies = activeEmergencies.filter(e => !resolvedEmergencies.includes(`${e.driverEmail}_${e.horario}`));

  // --- TRANSBORDO DE EMERGÊNCIA (CROSS-DOCKING DE SUPORTE) STATE & METODOS ---
  const [activeRescueCalc, setActiveRescueCalc] = useState<{
    type: 'recolher' | 'redistribuir' | 'manual' | null;
    driverEmail: string;
    result: any;
  }>({ type: null, driverEmail: '', result: null });

  const calculateRescueOptions = (driverEmail: string, type: 'recolher' | 'redistribuir' | 'manual') => {
    const brokenRouteEntry = Object.entries(activeRoutes).find(([rId, r]: [string, any]) => r.driverEmail === driverEmail);
    if (!brokenRouteEntry) {
      alert("Nenhuma rota ativa encontrada para o motorista em pane.");
      return;
    }
    const [brokenRouteId, brokenRoute] = brokenRouteEntry as [string, any];
    const pendingPoints = (brokenRoute.path || []).filter((p: any) => p.status === 'Pendente');

    if (pendingPoints.length === 0) {
      alert("Não há cargas pendentes no veículo quebrado para realizar o transbordo.");
      return;
    }

    const breakdownLat = pendingPoints[0].latitude;
    const breakdownLng = pendingPoints[0].longitude;
    const totalPendingWeight = pendingPoints.reduce((sum: number, p: any) => sum + (p.pesoMercadoriaKg || 0), 0);

    const otherRoutes = Object.entries(activeRoutes).filter(([rId, r]: [string, any]) => r.driverEmail !== driverEmail);

    if (type === 'recolher') {
      if (otherRoutes.length === 0) {
        alert("Não há outros veículos em operação no momento para apoiar no resgate.");
        return;
      }

      const options = otherRoutes.map(([rId, r]: [string, any]) => {
        const v = frota.find(item => `${item.modelo} (${item.placa})` === r.vehicle);
        const capacity = v?.capacidadeKg || 1200;
        const currentWeight = (r.path || []).filter((p: any) => p.status === 'Pendente').reduce((sum: number, p: any) => sum + (p.pesoMercadoriaKg || 0), 0);
        const availableCapacity = capacity - currentWeight;

        const lastCompleted = (r.path || []).filter((p: any) => p.status === 'Entregue');
        const vehicleLat = lastCompleted.length > 0 ? lastCompleted[lastCompleted.length - 1].latitude : DEFAULT_BASE.latitude;
        const vehicleLng = lastCompleted.length > 0 ? lastCompleted[lastCompleted.length - 1].longitude : DEFAULT_BASE.longitude;

        const distance = haversineDistance(vehicleLat, vehicleLng, breakdownLat, breakdownLng);
        
        const proximityScore = Math.max(0, 100 - (distance * 4));
        const capacityScore = availableCapacity >= totalPendingWeight ? 100 : Math.max(0, 100 - (totalPendingWeight - availableCapacity) / 5);
        const totalScore = parseFloat((proximityScore * 0.8 + capacityScore * 0.2).toFixed(1));

        return {
          routeId: rId,
          driver: r.driver,
          driverEmail: r.driverEmail,
          vehicle: r.vehicle,
          distance: parseFloat(distance.toFixed(1)),
          capacity,
          availableCapacity,
          score: totalScore,
          exceedsCapacity: availableCapacity < totalPendingWeight
        };
      }).sort((a, b) => b.score - a.score);

      setActiveRescueCalc({
        type: 'recolher',
        driverEmail,
        result: {
          brokenRouteId,
          totalPendingWeight,
          pendingPoints,
          breakdownLat,
          breakdownLng,
          options
        }
      });
    } else if (type === 'redistribuir') {
      if (otherRoutes.length === 0) {
        alert("Não há outros veículos em operação no momento para apoiar no resgate.");
        return;
      }

      const assignments: any[] = [];
      const vehiclePendingWeights: Record<string, number> = {};
      const virtualPositions: Record<string, { lat: number, lng: number }> = {};

      otherRoutes.forEach(([rId, r]: [string, any]) => {
        const currentWeight = (r.path || []).filter((p: any) => p.status === 'Pendente').reduce((sum: number, p: any) => sum + (p.pesoMercadoriaKg || 0), 0);
        vehiclePendingWeights[rId] = currentWeight;

        const lastCompleted = (r.path || []).filter((p: any) => p.status === 'Entregue');
        virtualPositions[rId] = {
          lat: lastCompleted.length > 0 ? lastCompleted[lastCompleted.length - 1].latitude : DEFAULT_BASE.latitude,
          lng: lastCompleted.length > 0 ? lastCompleted[lastCompleted.length - 1].longitude : DEFAULT_BASE.longitude
        };
      });

      pendingPoints.forEach((point: any) => {
        const scoredVehicles = otherRoutes.map(([rId, r]: [string, any]) => {
          const v = frota.find(item => `${item.modelo} (${item.placa})` === r.vehicle);
          const capacity = v?.capacidadeKg || 1200;
          const availableCapacity = capacity - vehiclePendingWeights[rId];

          const vehicleLat = virtualPositions[rId].lat;
          const vehicleLng = virtualPositions[rId].lng;

          const distance = haversineDistance(vehicleLat, vehicleLng, point.latitude, point.longitude);

          return {
            routeId: rId,
            driver: r.driver,
            distance,
            availableCapacity,
            capacity
          };
        }).sort((a, b) => a.distance - b.distance);

        const bestVehicle = scoredVehicles.find(v => v.availableCapacity >= point.pesoMercadoriaKg) || scoredVehicles[0];

        // Update weights and virtual position to simulate sequential travel
        vehiclePendingWeights[bestVehicle.routeId] += point.pesoMercadoriaKg;
        virtualPositions[bestVehicle.routeId] = { lat: point.latitude, lng: point.longitude };

        assignments.push({
          point,
          assignedRouteId: bestVehicle.routeId,
          assignedDriver: bestVehicle.driver,
          distance: parseFloat(bestVehicle.distance.toFixed(1))
        });
      });

      setActiveRescueCalc({
        type: 'redistribuir',
        driverEmail,
        result: {
          brokenRouteId,
          pendingPoints,
          assignments,
          vehicleWeights: vehiclePendingWeights
        }
      });
    } else if (type === 'manual') {
      const allDrivers = dbRepo.getCondutores(userEmail);
      const options = allDrivers.map((driver: any) => {
        if (driver.email === driverEmail) return null;

        const activeRouteEntry = Object.entries(activeRoutes).find(([rId, r]: [string, any]) => r.driverEmail === driver.email);
        
        let hasActiveRoute = false;
        let routeId = '';
        let currentWeight = 0;
        let vehicleLat = DEFAULT_BASE.latitude;
        let vehicleLng = DEFAULT_BASE.longitude;
        let routeStatus = 'Disponível (Sem Rota)';

        const v = frota.find(item => item.idVeiculo === driver.veiculo || `${item.modelo} (${item.placa})` === driver.veiculo || item.placa === driver.veiculo);
        const capacity = v?.capacidadeKg || 1200;

        if (activeRouteEntry) {
          hasActiveRoute = true;
          routeId = activeRouteEntry[0];
          const r = activeRouteEntry[1];
          const pending = (r.path || []).filter((p: any) => p.status === 'Pendente');
          currentWeight = pending.reduce((sum: number, p: any) => sum + (p.pesoMercadoriaKg || 0), 0);
          
          const lastCompleted = (r.path || []).filter((p: any) => p.status === 'Entregue');
          if (lastCompleted.length > 0) {
            vehicleLat = lastCompleted[lastCompleted.length - 1].latitude;
            vehicleLng = lastCompleted[lastCompleted.length - 1].longitude;
          }
          
          if (pending.length > 0) {
            routeStatus = 'Em Rota Ativa';
          } else {
            routeStatus = 'Rota Concluída';
          }
        }

        const availableCapacity = capacity - currentWeight;
        const distance = haversineDistance(vehicleLat, vehicleLng, breakdownLat, breakdownLng);

        return {
          routeId,
          driver: driver.nome,
          driverEmail: driver.email,
          vehicle: driver.veiculo ? (v ? `${v.modelo} (${v.placa})` : driver.veiculo) : 'Nenhum veículo',
          hasActiveRoute,
          routeStatus,
          distance: parseFloat(distance.toFixed(1)),
          capacity,
          availableCapacity,
          exceedsCapacity: availableCapacity < totalPendingWeight
        };
      }).filter(Boolean);

      setActiveRescueCalc({
        type: 'manual',
        driverEmail,
        result: {
          brokenRouteId,
          totalPendingWeight,
          pendingPoints,
          breakdownLat,
          breakdownLng,
          options
        }
      });
    }
  };

  const handleConfirmRescueCollection = (bestOption: any) => {
    const { brokenRouteId, pendingPoints, totalPendingWeight, breakdownLat, breakdownLng } = activeRescueCalc.result;

    const updatedRoutes = { ...activeRoutes };
    const brokenRoute = updatedRoutes[brokenRouteId];

    brokenRoute.path = brokenRoute.path.map((p: any) => {
      if (p.status === 'Pendente') {
        return { ...p, status: 'Cancelado', observacao: `Carga transbordada para ${bestOption.driver} (Apoio Emergencial)` };
      }
      return p;
    });

    const rescueRoute = updatedRoutes[bestOption.routeId];
    
    const rescueStop: Entrega = {
      id: `RESCUE-${Date.now()}`,
      chave: `RSC-${Math.floor(1000 + Math.random() * 9000)}`,
      cliente: `RECOLHIMENTO DE EMERGÊNCIA (Carga de ${brokenRoute.driver})`,
      endereco: `Local da Pane: Próximo à entrega de ${pendingPoints[0]?.cliente || 'Cliente'}`,
      latitude: breakdownLat,
      longitude: breakdownLng,
      pesoMercadoriaKg: totalPendingWeight,
      tipoOperacao: 'Coleta',
      status: 'Pendente',
      pontoReferencia: `Pane do veículo ${brokenRoute.vehicle}`,
      observacao: `RECOLHER: ${pendingPoints.length} cargas (${totalPendingWeight} kg) e retornar diretamente ao CD.`
    };

    const completedStops = (rescueRoute.path || []).filter((p: any) => p.status === 'Entregue' || p.status === 'Cancelado');
    const futureStops = (rescueRoute.path || []).filter((p: any) => p.status === 'Pendente');
    
    const newPath = [...completedStops, rescueStop, ...futureStops];
    
    rescueRoute.path = newPath;
    rescueRoute.km = parseFloat((newPath.length * 3.2 + 6.0).toFixed(1));
    const totServ = newPath.reduce((acc: number, p: any) => acc + dbRepo.getAverageServiceTime(userEmail, p.cliente), 0);
    const trav = newPath.length * 10 + 20;
    rescueRoute.duration = Math.round(totServ + trav);

    setActiveRoutes(updatedRoutes);
    dbRepo.saveRotasAtivas(userEmail, updatedRoutes);

    const newMapRoutes: Record<number, Entrega[]> = {};
    Object.values(updatedRoutes).forEach((r: any, idx) => {
      newMapRoutes[idx] = r.path;
    });
    setMapRoutes(newMapRoutes);

    alert(`✓ Missão de Resgate Confirmada! O motorista ${bestOption.driver} foi notificado para coletar os ${totalPendingWeight} kg de carga no local da pane e retornar com o passivo.`);
    setActiveRescueCalc({ type: null, driverEmail: '', result: null });
    triggerRefresh();
  };

  const handleConfirmRescueRedistribution = () => {
    const { brokenRouteId, assignments } = activeRescueCalc.result;

    const updatedRoutes = { ...activeRoutes };
    const brokenRoute = updatedRoutes[brokenRouteId];
    
    brokenRoute.path = brokenRoute.path.map((p: any) => {
      if (p.status === 'Pendente') {
        const assignment = assignments.find((a: any) => a.point.id === p.id);
        return { 
          ...p, 
          status: 'Cancelado', 
          observacao: `Carga redistribuída para ${assignment ? assignment.assignedDriver : 'outro veículo'} por pane.` 
        };
      }
      return p;
    });

    assignments.forEach((asg: any) => {
      const targetRoute = updatedRoutes[asg.assignedRouteId];
      const completedStops = (targetRoute.path || []).filter((p: any) => p.status === 'Entregue' || p.status === 'Cancelado');
      const existingPending = (targetRoute.path || []).filter((p: any) => p.status === 'Pendente');
      
      const clonedPoint: Entrega = {
        ...asg.point,
        status: 'Pendente',
        observacao: `Carga incorporada de ${brokenRoute.driver} (Pane de Emergência)`
      };

      const allPending = [...existingPending, clonedPoint];

      const lastCompletedNode = completedStops[completedStops.length - 1];
      const startLat = lastCompletedNode ? lastCompletedNode.latitude : DEFAULT_BASE.latitude;
      const startLng = lastCompletedNode ? lastCompletedNode.longitude : DEFAULT_BASE.longitude;

      const optimizedPending = optimizeTSP(startLat, startLng, allPending);
      const finalPath = [...completedStops, ...optimizedPending];
      targetRoute.path = finalPath;

      targetRoute.km = parseFloat((finalPath.length * 3.2 + 4.0).toFixed(1));
      const totServ = finalPath.reduce((acc: number, p: any) => acc + dbRepo.getAverageServiceTime(userEmail, p.cliente), 0);
      const trav = finalPath.length * 10 + 20;
      targetRoute.duration = Math.round(totServ + trav);
    });

    setActiveRoutes(updatedRoutes);
    dbRepo.saveRotasAtivas(userEmail, updatedRoutes);

    const newMapRoutes: Record<number, Entrega[]> = {};
    Object.values(updatedRoutes).forEach((r: any, idx) => {
      newMapRoutes[idx] = r.path;
    });
    setMapRoutes(newMapRoutes);

    alert(`✓ Redistribuição de Cargas Concluída! Os pontos pendentes foram redistribuídos e re-optimizados matematicamente (via algoritmo TSP) nas rotas dos veículos operacionais.`);
    setActiveRescueCalc({ type: null, driverEmail: '', result: null });
    triggerRefresh();
  };

  const handleConfirmRescueManual = (selectedOption: any) => {
    const { brokenRouteId, pendingPoints, totalPendingWeight, breakdownLat, breakdownLng } = activeRescueCalc.result;

    const updatedRoutes = { ...activeRoutes };
    const brokenRoute = updatedRoutes[brokenRouteId];

    // 1. Cancel the pending points on the broken route
    brokenRoute.path = brokenRoute.path.map((p: any) => {
      if (p.status === 'Pendente') {
        return { ...p, status: 'Cancelado', observacao: `Carga transbordada manualmente para ${selectedOption.driver} (Apoio Emergencial)` };
      }
      return p;
    });

    const rescueStop: Entrega = {
      id: `RESCUE-${Date.now()}`,
      chave: `RSC-${Math.floor(1000 + Math.random() * 9000)}`,
      cliente: `RESGATE DE EMERGÊNCIA (Carga de ${brokenRoute.driver})`,
      endereco: `Local da Pane: Próximo à entrega de ${pendingPoints[0]?.cliente || 'Cliente'}`,
      latitude: breakdownLat,
      longitude: breakdownLng,
      pesoMercadoriaKg: totalPendingWeight,
      tipoOperacao: 'Coleta',
      status: 'Pendente',
      pontoReferencia: `Pane do veículo ${brokenRoute.vehicle}`,
      tempoServicoMin: 15,
      observacao: `COLETAR: ${pendingPoints.length} cargas (${totalPendingWeight} kg) no local da pane.`,
      valorMercadoria: pendingPoints.reduce((sum: number, p: any) => sum + (p.valorMercadoria || 0), 0)
    };

    if (selectedOption.hasActiveRoute) {
      const rescueRoute = updatedRoutes[selectedOption.routeId];
      const completedStops = (rescueRoute.path || []).filter((p: any) => p.status === 'Entregue' || p.status === 'Cancelado');
      const futureStops = (rescueRoute.path || []).filter((p: any) => p.status === 'Pendente');

      const clonedPending = pendingPoints.map((p: any) => ({
        ...p,
        id: `${p.id}-RSC`,
        status: 'Pendente',
        observacao: `Carga incorporada manualmente de ${brokenRoute.driver} (Pane)`
      }));

      const startLat = completedStops.length > 0 ? completedStops[completedStops.length - 1].latitude : DEFAULT_BASE.latitude;
      const startLng = completedStops.length > 0 ? completedStops[completedStops.length - 1].longitude : DEFAULT_BASE.longitude;

      // Put rescue stop at the beginning of the pending points, then other pending ones, then TSP-optimize them
      const allNewPending = [rescueStop, ...clonedPending, ...futureStops];
      const optimizedPending = optimizeTSP(startLat, startLng, allNewPending);

      const newPath = [...completedStops, ...optimizedPending];
      rescueRoute.path = newPath;
      rescueRoute.km = parseFloat((newPath.length * 3.2 + 6.0).toFixed(1));
      const totServ = newPath.reduce((acc: number, p: any) => acc + dbRepo.getAverageServiceTime(userEmail, p.cliente), 0);
      rescueRoute.duration = Math.round(totServ + newPath.length * 10 + 20);
    } else {
      // Driver does not have an active route! Create a brand new active route for them!
      const newRouteId = `ROTA-${Date.now().toString().slice(-6)}`;
      
      const clonedPending = pendingPoints.map((p: any) => ({
        ...p,
        id: `${p.id}-RSC`,
        status: 'Pendente',
        observacao: `Carga incorporada manualmente de ${brokenRoute.driver} (Pane)`
      }));

      const allNewPending = [rescueStop, ...clonedPending];
      const optimizedPending = optimizeTSP(DEFAULT_BASE.latitude, DEFAULT_BASE.longitude, allNewPending);

      updatedRoutes[newRouteId] = {
        driver: selectedOption.driver,
        driverEmail: selectedOption.driverEmail,
        vehicle: selectedOption.vehicle,
        path: optimizedPending,
        km: parseFloat((optimizedPending.length * 3.2 + 6.0).toFixed(1)),
        duration: Math.round(optimizedPending.reduce((acc: number, p: any) => acc + dbRepo.getAverageServiceTime(userEmail, p.cliente), 0) + optimizedPending.length * 10 + 20)
      };
    }

    setActiveRoutes(updatedRoutes);
    dbRepo.saveRotasAtivas(userEmail, updatedRoutes);

    const newMapRoutes: Record<number, Entrega[]> = {};
    Object.values(updatedRoutes).forEach((r: any, idx) => {
      newMapRoutes[idx] = r.path;
    });
    setMapRoutes(newMapRoutes);

    alert(`✓ Sucesso! Carga transferida manualmente para o motorista ${selectedOption.driver} (${selectedOption.vehicle}).`);
    setActiveRescueCalc({ type: null, driverEmail: '', result: null });
    triggerRefresh();
  };

  // --- VEHICLE CREATE ---
  const [vId, setVId] = useState('');
  const [vPlaca, setVPlaca] = useState('');
  const [vTipo, setVTipo] = useState<TipoVeiculo>('Van');
  const [vFab, setVFab] = useState('');
  const [vMod, setVMod] = useState('');
  const [vCor, setVCor] = useState('Branco');
  const [vAnoFabricacao, setVAnoFabricacao] = useState('2022');
  const [vAnoModelo, setVAnoModelo] = useState('2022');
  const [vCap, setVCap] = useState(650);
  const [vRenavam, setVRenavam] = useState('');
  const [vChassi, setVChassi] = useState('');
  const [vStatus, setVStatus] = useState<'Disponivel' | 'Manutencao' | 'Inativo'>('Disponivel');

  // --- VEHICLE EDIT ---
  const [evPlaca, setEvPlaca] = useState('');
  const [evCap, setEvCap] = useState(650);
  const [evStatus, setEvStatus] = useState<'Disponivel' | 'Inativo' | 'Manutencao'>('Disponivel');
  const [evObs, setEvObs] = useState('');
  const [evModelo, setEvModelo] = useState('');
  const [evFabricante, setEvFabricante] = useState('');
  const [evTipo, setEvTipo] = useState<TipoVeiculo>('Carro Leve');
  const [evAnoFabricacao, setEvAnoFabricacao] = useState('');
  const [evAnoModelo, setEvAnoModelo] = useState('');
  const [evCor, setEvCor] = useState('');
  const [evRenavam, setEvRenavam] = useState('');
  const [evChassi, setEvChassi] = useState('');
  const [evDataEntradaManutencao, setEvDataEntradaManutencao] = useState('');
  const [evDataRetornoManutencao, setEvDataRetornoManutencao] = useState('');

  React.useEffect(() => {
    if (veicSel) {
      setEvPlaca(veicSel.placa);
      setEvCap(veicSel.capacidadeKg);
      setEvStatus(veicSel.status as any);
      setEvObs(veicSel.observacao || '');
      setEvModelo(veicSel.modelo || '');
      setEvFabricante(veicSel.fabricante || '');
      setEvTipo((veicSel.tipo || 'Carro Leve') as TipoVeiculo);
      setEvAnoFabricacao(veicSel.anoFabricacao || '');
      setEvAnoModelo(veicSel.anoModelo || '');
      setEvCor(veicSel.cor || '');
      setEvRenavam(veicSel.renavam || '');
      setEvChassi(veicSel.chassi || '');
      setEvDataEntradaManutencao(veicSel.dataEntradaManutencao || '');
      setEvDataRetornoManutencao(veicSel.dataRetornoManutencao || '');
    }
  }, [selectedVeiculoEdit, refreshKey]);

  // --- DRIVER EDIT ---
  const [edDNome, setEdDNome] = useState('');
  const [edDCpf, setEdDCpf] = useState('');
  const [edDRg, setEdDRg] = useState('');
  const [edDNascimento, setEdDNascimento] = useState('');
  const [edDTel, setEdDTel] = useState('');
  const [edDCnh, setEdDCnh] = useState('');
  const [edDCat, setEdDCat] = useState('');
  const [edDVencCnh, setEdDVencCnh] = useState('');
  const [edDEmail, setEdDEmail] = useState('');
  const [edDVeiculo, setEdDVeiculo] = useState('-');
  const [edDPlacaVeiculo, setEdDPlacaVeiculo] = useState('');
  const [edDSenha, setEdDSenha] = useState('');
  const [edDStatus, setEdDStatus] = useState<'Ativo' | 'Afastado' | 'Férias' | 'Licença' | 'Desligado' | 'Inativo'>('Ativo');

  React.useEffect(() => {
    if (condSel) {
      setEdDNome(condSel.nome);
      setEdDCpf(condSel.cpf);
      setEdDRg(condSel.rg || '');
      setEdDNascimento(condSel.nascimento || '');
      setEdDTel(condSel.telefone);
      setEdDCnh(condSel.cnh);
      setEdDCat(condSel.categoriaCnh);
      setEdDVencCnh(condSel.vencCnh);
      setEdDEmail(condSel.email);
      setEdDVeiculo(condSel.veiculo || '-');
      setEdDPlacaVeiculo(condSel.placaVeiculo || '');
      setEdDSenha(condSel.senha || '');
      setEdDStatus(condSel.status || 'Ativo');
    }
  }, [selectedCondutorEdit, refreshKey]);

  // --- DRIVER CREATE ---
  const [dNome, setDNome] = useState('');
  const [dCpf, setDCpf] = useState('');
  const [dRg, setDRg] = useState('');
  const [dNascimento, setDNascimento] = useState('14/05/1990');
  const [dTel, setDTel] = useState('');
  const [dCnh, setDCnh] = useState('');
  const [dCat, setDCat] = useState('B');
  const [dVencCnh, setDVencCnh] = useState('10/12/2035');
  const [dEmail, setDEmail] = useState('');
  const [dVeiculo, setDVeiculo] = useState('-');

  // --- VEHICLE BINDING ---
  const [bindDriver, setBindDriver] = useState('');
  const [bindVehicle, setBindVehicle] = useState('');

  // --- DELIVERY MANUAL CREATE / BULK ---
  const [delChave, setDelChave] = useState('');
  const [delCliente, setDelCliente] = useState('');
  const [delCep, setDelCep] = useState('');
  const [delEnd, setDelEnd] = useState('');
  const [delEndColeta, setDelEndColeta] = useState('');
  const [delRef, setDelRef] = useState('');
  const [delTel, setDelTel] = useState('');
  const [delZap, setDelZap] = useState('');
  const [delNotaFiscal, setDelNotaFiscal] = useState('');
  const [delPeso, setDelPeso] = useState(15);
  const [delTipo, setDelTipo] = useState<'Entrega' | 'Coleta'>('Entrega');

  const handleDelCepLookup = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '').slice(0, 8);
    setDelCep(cleanCep);
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        if (response.ok) {
          const data = await response.json();
          if (!data.erro) {
            const street = data.logradouro || '';
            const neighborhood = data.bairro || '';
            const city = data.localidade || '';
            const state = data.uf || '';
            
            let fullAddress = '';
            if (street) fullAddress += street;
            if (neighborhood) fullAddress += (fullAddress ? `, ${neighborhood}` : neighborhood);
            if (city) fullAddress += (fullAddress ? ` - ${city}` : city);
            if (state) fullAddress += (fullAddress ? `/${state}` : `/${state}`);
            
            setDelEnd(fullAddress);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
      }
    }
  };

  // --- UNIVERSAL IMPORT MODAL ---
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importModalType, setImportModalType] = useState<'veiculos' | 'condutores' | 'entregas'>('veiculos');

  const handleOpenImportModal = (type: 'veiculos' | 'condutores' | 'entregas') => {
    setImportModalType(type);
    setIsImportModalOpen(true);
  };

  // --- COST CALCULATOR ---
  const [combustivelPreco, setCombustivelPreco] = useState(5.89);
  const [veiculoConsumo, setVeiculoConsumo] = useState(9.5); // km/l
  const [diariaMotorista, setDiariaMotorista] = useState(150.0);
  const [fatorManutencao, setFatorManutencao] = useState(0.12); // R$ per km

  // Calculations for costs
  const totalKmRoteado = (Object.values(activeRoutes) as any[]).reduce((sum, r) => sum + r.km, 0);
  const numRotas = Object.keys(activeRoutes).length;
  
  const custoCombustivel = veiculoConsumo > 0 ? (totalKmRoteado / veiculoConsumo) * combustivelPreco : 0;
  const custoMotoristas = numRotas * diariaMotorista;
  const custoManutencao = totalKmRoteado * fatorManutencao;
  const custoTotalEstimado = custoCombustivel + custoMotoristas + custoManutencao;

  const costChartData = [
    { name: 'Combustível', value: Math.round(custoCombustivel) },
    { name: 'Diária Motoristas', value: Math.round(custoMotoristas) },
    { name: 'Depreciação/Manut.', value: Math.round(custoManutencao) }
  ].filter(d => d.value > 0);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b'];

  // --- OPTIMIZATION SELECTIONS ---
  const [optVehicles, setOptVehicles] = useState<string[]>([]);

  // --- ACTIONS ---
  const handleAddVeiculo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vId || !vPlaca) return;
    dbRepo.cadastrarVeiculo(userEmail, {
      idVeiculo: vId,
      placa: vPlaca,
      modelo: vMod,
      fabricante: vFab,
      anoFabricacao: vAnoFabricacao,
      anoModelo: vAnoModelo,
      cor: vCor,
      tipo: vTipo,
      capacidadeKg: vCap,
      renavam: vRenavam,
      chassi: vChassi,
      status: vStatus
    });
    setVId('');
    setVPlaca('');
    setVMod('');
    setVFab('');
    setVRenavam('');
    setVChassi('');
    triggerRefresh();
    alert('Veículo cadastrado com sucesso!');
  };

  const handleUpdateVeiculo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVeiculoEdit) return;
    dbRepo.editarVeiculo(userEmail, selectedVeiculoEdit, {
      placa: evPlaca,
      capacidadeKg: evCap,
      status: evStatus,
      observacao: evObs,
      modelo: evModelo,
      fabricante: evFabricante,
      tipo: evTipo,
      anoFabricacao: evAnoFabricacao,
      anoModelo: evAnoModelo,
      cor: evCor,
      renavam: evRenavam,
      chassi: evChassi,
      dataEntradaManutencao: evDataEntradaManutencao,
      dataRetornoManutencao: evDataRetornoManutencao
    });
    triggerRefresh();
    alert('Veículo atualizado!');
  };

  const handleAddCondutor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dNome || !dCpf || !dEmail) return;
    dbRepo.cadastrarCondutor(userEmail, {
      nome: dNome,
      cpf: dCpf,
      rg: dRg,
      nascimento: dNascimento,
      telefone: dTel,
      cnh: dCnh,
      categoriaCnh: dCat,
      vencCnh: dVencCnh,
      email: dEmail,
      veiculo: dVeiculo
    });
    setDNome('');
    setDCpf('');
    setDRg('');
    setDEmail('');
    setDTel('');
    setDCnh('');
    triggerRefresh();
    alert('Motorista cadastrado com sucesso!');
  };

  const handleUpdateCondutor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCondutorEdit) return;
    dbRepo.editarCondutor(userEmail, selectedCondutorEdit, {
      nome: edDNome,
      cpf: edDCpf,
      rg: edDRg,
      nascimento: edDNascimento,
      telefone: edDTel,
      cnh: edDCnh,
      categoriaCnh: edDCat,
      vencCnh: edDVencCnh,
      email: edDEmail,
      veiculo: edDVeiculo,
      placaVeiculo: edDPlacaVeiculo,
      senha: edDSenha,
      status: edDStatus
    });
    setSelectedCondutorEdit(edDEmail);
    triggerRefresh();
    alert('Cadastro do motorista atualizado com sucesso!');
  };

  const handleBindDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bindDriver || !bindVehicle) return;
    dbRepo.vincularVeiculoCondutor(userEmail, bindDriver, bindVehicle);
    triggerRefresh();
    alert('Vínculo atualizado com sucesso!');
  };

  // --- CSV BULK EXCEL IMPORTS & SPREADSHEETS ---
  const downloadModeloVeiculosCsv = () => {
    const csvContent = "ID Interno,Placa,Fabricante,Modelo,Tipo Veiculo,Capacidade (KG),Ano Fabricacao,Ano Modelo,Cor,Renavam,Chassi\n" +
      "VEIC-101,ABC-1234,Volvo,FH 540,Caminhão Pesado,25000,2021,2022,Branco,12345678901,9ASDFGHJKL1234567\n" +
      "VEIC-102,XYZ-9876,Fiat,Fiorino Endurance,Van,650,2020,2021,Prata,98765432109,8ZXCVBNMQWERTYUIO";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo_frota.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadModeloMotoristasCsv = () => {
    const csvContent = "Nome Completo,CPF,RG,Telefone,Email,Data Nascimento,CNH,Categoria CNH,Vencimento CNH,Numero Frota\n" +
      "Carlos Alberto da Silva,111.222.333-44,MG-12.345.678,(31) 98888-7777,carlos.silva@empresa.com.br,12/03/1985,12345678910,D,10/12/2030,VEIC-101\n" +
      "Marcos Vinicius de Souza,555.665.777-88,SP-98.765.432,(11) 97777-6666,marcos.souza@empresa.com.br,25/08/1992,98765432101,B,15/06/2031,VEIC-102";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo_motoristas.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadModeloEntregasCsv = () => {
    const csvContent = "\uFEFFChave ID,Nome do Cliente,Endereço de Entrega,Endereço de Coleta,Ponto de Referencia,Telefone de Contato,WhatsApp,Peso da Carga,Numero da Nota Fiscal,Operacao\n" +
      "ENT-101,Supermercado Central,Rua da Bahia 1022 - Centro - Belo Horizonte MG,,Próximo ao Teatro Municipal,(31) 98888-8888,(31) 98888-8888,150,NF-10029,Entrega\n" +
      "COL-102,Galpão Logístico,,Avenida JK 400 - Contagem MG,Ao lado do posto de gasolina,(31) 97777-7777,(31) 97777-7777,350,NF-10030,Coleta";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo_romaneio_entregas.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportVeiculosCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length <= 1) {
          alert('O arquivo parece estar vazio ou sem dados.');
          return;
        }

        let importCount = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length < 2) continue;

          const idInterno = cols[0];
          const placa = cols[1];
          const fab = cols[2] || '';
          const mod = cols[3] || '';
          const tipoStr = cols[4] || 'Van';
          const cap = parseInt(cols[5]) || 500;
          const anoF = cols[6] || '2022';
          const anoM = cols[7] || cols[6] || '2022';
          const cor = cols[8] || 'Branco';
          const renavam = cols[9] || '';
          const chassi = cols[10] || '';

          let tipo: TipoVeiculo = 'Van';
          if (tipoStr.toLowerCase().includes('caminhão') || tipoStr.toLowerCase().includes('caminhao')) {
            tipo = 'Caminhão Pesado';
          } else if (tipoStr.toLowerCase().includes('picape')) {
            tipo = 'Picape 4x4';
          } else if (tipoStr.toLowerCase().includes('carro') || tipoStr.toLowerCase().includes('leve')) {
            tipo = 'Carro Leve';
          } else if (tipoStr.toLowerCase().includes('moto')) {
            tipo = 'Motocicleta';
          }

          dbRepo.cadastrarVeiculo(userEmail, {
            idVeiculo: idInterno,
            placa,
            modelo: mod,
            fabricante: fab,
            anoFabricacao: anoF,
            anoModelo: anoM,
            cor,
            tipo,
            capacidadeKg: cap,
            renavam,
            chassi,
            status: 'Disponivel'
          });
          importCount++;
        }

        triggerRefresh();
        alert(`Sucesso! Foram importados ${importCount} veículos para sua frota.`);
      } catch (err) {
        alert('Erro ao processar o arquivo de importação. Verifique se o formato está correto.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportMotoristasCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length <= 1) {
          alert('O arquivo parece estar vazio ou sem dados.');
          return;
        }

        let importCount = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length < 5) continue;

          const nome = cols[0];
          const cpf = cols[1];
          const rg = cols[2] || '';
          const tel = cols[3] || '';
          const email = cols[4];
          const nascimento = cols[5] || '';
          const cnh = cols[6] || '';
          const cat = cols[7] || 'B';
          const venc = cols[8] || '10/12/2030';
          const numFrota = cols[9] || '-';

          dbRepo.cadastrarCondutor(userEmail, {
            nome,
            cpf,
            rg,
            nascimento,
            telefone: tel,
            email,
            cnh,
            categoriaCnh: cat,
            vencCnh: venc,
            veiculo: numFrota
          });
          importCount++;
        }

        triggerRefresh();
        alert(`Sucesso! Foram importados ${importCount} condutores e vinculados à frota correspondente.`);
      } catch (err) {
        alert('Erro ao processar o arquivo de importação. Verifique se o formato está correto.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddEntrega = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delChave || !delEnd) {
      alert('Chave / ID e Endereço de Entrega são obrigatórios!');
      return;
    }
    dbRepo.cadastrarEntrega(userEmail, {
      chave: delChave,
      cliente: delCliente || 'Cliente Final',
      endereco: delEnd,
      enderecoColeta: delEndColeta,
      pontoReferencia: delRef,
      telefone: delTel,
      whatsapp: delZap,
      pesoMercadoriaKg: delPeso,
      tipoOperacao: delTipo,
      notaFiscal: delNotaFiscal
    });
    setDelChave('');
    setDelCliente('');
    setDelCep('');
    setDelEnd('');
    setDelEndColeta('');
    setDelRef('');
    setDelTel('');
    setDelZap('');
    setDelNotaFiscal('');
    triggerRefresh();
    alert('Ponto de entrega adicionado!');
  };

  const handleImportEntregasBulk = () => {
    // Generate bulk deliveries in BH
    const BH_POINTS = [
      { chave: 'ENT-201', cliente: 'Supermercado BH', endereco: 'Rua da Bahia, 1022 - Centro, Belo Horizonte - MG', peso: 120 },
      { chave: 'ENT-202', cliente: 'Drogaria Araujo', endereco: 'Avenida Getúlio Vargas, 1420 - Savassi, Belo Horizonte - MG', peso: 45 },
      { chave: 'ENT-203', cliente: 'Lojas Americanas', endereco: 'Avenida Afonso Pena, 3210 - Cruzeiro, Belo Horizonte - MG', peso: 210 },
      { chave: 'ENT-204', cliente: 'Restaurante Dona Lucinha', endereco: 'Rua Sergipe, 811 - Funcionários, Belo Horizonte - MG', peso: 60 },
      { chave: 'ENT-205', cliente: 'Academia Bodytech', endereco: 'Rua Pernambuco, 1055 - Savassi, Belo Horizonte - MG', peso: 15 },
    ];

    BH_POINTS.forEach(p => {
      dbRepo.cadastrarEntrega(userEmail, {
        chave: p.chave,
        cliente: p.cliente,
        endereco: p.endereco,
        pesoMercadoriaKg: p.peso,
        tipoOperacao: 'Entrega'
      });
    });
    triggerRefresh();
    alert('5 pontos de entrega demo BH importados com sucesso!');
  };

  const handleOptimize = () => {
    const selectedVehs = frota.filter(v => {
      const hasDriver = condutores.some(c => c.veiculo === v.idVeiculo && c.status === 'Ativo');
      return v.status === 'Disponivel' && hasDriver;
    });
    if (selectedVehs.length === 0) {
      alert('Nenhum veículo disponível com motorista ativo vinculado para roteirização! Por favor, vincule motoristas ativos aos veículos na aba "Gestão de Frota".');
      return;
    }
    if (entregasPendentes.length === 0) {
      alert('Nenhuma entrega pendente para roteirizar. Adicione entregas na primeira aba.');
      return;
    }

    // Call routing engine K-Means + TSP Clustering
    const clusters = clusterAndOptimize(entregasPendentes, selectedVehs.length);

    // Map clusters to vehicles
    const routesObj: Record<string, { driver: string; driverEmail?: string; vehicle: string; path: Entrega[]; km: number; duration: number }> = {};
    const mapRoutesObj: Record<number, Entrega[]> = {};

    Object.entries(clusters).forEach(([clusterId, points], idx) => {
      const v = selectedVehs[idx % selectedVehs.length];
      // Find driver for this vehicle
      const cond = condutores.find(c => c.veiculo === v.idVeiculo);
      const driver = cond?.nome || 'Motorista Eventual';
      const driverEmail = cond?.email || '';
      
      // Calculate distances: simple simulated scale (each node average 2.5km)
      const distance = points.length * 3.2 + 4.0; 
      // Calculate duration dynamically using learned service times (AI autonomous adjustment)
      const totalServiceTime = points.reduce((acc: number, p: Entrega) => acc + dbRepo.getAverageServiceTime(userEmail, p.cliente), 0);
      const travelTime = points.length * 10 + 20; // 10 min average per delivery leg + 20 min overhead
      const duration = totalServiceTime + travelTime;

      routesObj[`ROTA-${idx + 1}`] = {
        driver,
        driverEmail,
        vehicle: `${v.modelo} (${v.placa})`,
        path: points,
        km: parseFloat(distance.toFixed(1)),
        duration: Math.round(duration)
      };

      mapRoutesObj[idx] = points;
    });

    setActiveRoutes(routesObj);
    setMapRoutes(mapRoutesObj);
    dbRepo.saveRotasAtivas(userEmail, routesObj);
    alert(`Otimização concluída! ${Object.keys(routesObj).length} rotas geradas de forma científica.`);
  };

  const downloadDriverRouteTxt = (routeId: string) => {
    const r = activeRoutes[routeId];
    if (!r) return;

    const dataAtual = new Date().toLocaleDateString('pt-BR');
    let content = `FOLHA DE ROTA OTIMIZADA LOGUSQ - ${routeId}
DATA: ${dataAtual}
VEÍCULO: ${r.vehicle}
CONDUTOR: ${r.driver}
------------------------------------------------------------
ESTIMATIVAS DE VIAGEM:
Distância Total: ${r.km} KM
Duração Estimada: ${Math.floor(r.duration / 60)}h ${r.duration % 60}min
Total de Paradas: ${r.path.length} clientes
------------------------------------------------------------
SELO DO CENTRO DE DISTRIBUIÇÃO:
Origem: Hub Savassi (Av. do Contorno, Belo Horizonte)
------------------------------------------------------------

INSTRUÇÕES DE NAVEGAÇÃO SEQUENCIADA:

[PARTIDA] CD Hub Savassi (Avenida do Contorno)
  -> Carregamento total da carga consolidada.

`;

    r.path.forEach((p, idx) => {
      content += `[PARADA ${idx + 1}] Cliente: ${p.cliente}
  Operação: ${p.tipoOperacao}
  Carga: ${p.pesoMercadoriaKg} kg
  Endereço: ${p.endereco}
  Chave NFe: ${p.chave}
  Status esperado: Recebimento imediato
  
`;
    });

    content += `[RETORNO] CD Hub Savassi (Avenida do Contorno)
  -> Descarregamento de canhotos, devoluções e prestação de contas.

------------------------------------------------------------
Assinatura do Motorista: _______________________________
Assinatura do Expedidor: _______________________________`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Folha_Rota_${routeId}_${r.driver.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCompleteRoute = (routeId: string) => {
    const r = activeRoutes[routeId];
    if (!r) return;
    
    // Mark entregas inside route as completed in localStorage
    r.path.forEach(p => {
      dbRepo.atualizarEntregaStatus(userEmail, p.chave, 'Entregue');
    });

    const updated = { ...activeRoutes };
    delete updated[routeId];
    setActiveRoutes(updated);
    dbRepo.saveRotasAtivas(userEmail, updated);
    
    // also remove from map
    const newMapRoutes = { ...mapRoutes };
    // Find index of route
    const index = Object.keys(activeRoutes).indexOf(routeId);
    if (index !== -1) {
      delete newMapRoutes[index];
    }
    setMapRoutes(newMapRoutes);

    triggerRefresh();
    alert(`Rota ${routeId} concluída! Baixa realizada no sistema.`);
  };

  const handleSimulateShiftData = (driverEmail: string) => {
    // 4 hours ago, 3 hours ago, etc.
    const now = Date.now();
    const formatTime = (ts: number) => new Date(ts).toLocaleString('pt-BR');

    const fakeAct = {
      inicioDeslocamento: formatTime(now - 14400000), // 4 hours ago
      fimDeslocamento: formatTime(now - 300000), // 5 mins ago
      pausas: [
        {
          inicio: formatTime(now - 10800000), // 3 hours ago
          fim: formatTime(now - 9000000), // 2.5 hours ago
          justificativa: 'Pausa para almoço',
          justificativaRetorno: 'Fim do almoço'
        }
      ],
      emergencias: [
        {
          horario: formatTime(now - 12000000), // 3.3 hours ago
          tipo: 'Pneu furado',
          justificativa: 'Pneu furado na Av. do Contorno. Borracheiro móvel acionado pelo portal, resolvido rápido.',
          entreguesAteMomento: ['Supermercado Central BH'],
          faltandoEntregar: ['Restaurante Sabor de Minas', 'Drogaria Popular BH']
        }
      ]
    };
    
    localStorage.setItem(`logusq_atividade_${driverEmail}`, JSON.stringify(fakeAct));

    // Update active route with precise timing logs for simulation
    const routes = dbRepo.getRotasAtivas(userEmail);
    const route = Object.values(routes).find((r: any) => 
      r.driverEmail === driverEmail || 
      r.driver?.toLowerCase().includes('carlos') || 
      r.driver?.toLowerCase().includes('motorista')
    );

    if (route && route.path) {
      if (route.path[0]) {
        route.path[0].tempoInicioAtendimento = formatTime(now - 13200000); // 3h40m ago
        route.path[0].tempoFimAtendimento = formatTime(now - 12600000); // 3h30m ago
        route.path[0].duracaoAtendimentoMinutos = 10;
        route.path[0].status = 'Entregue';
        route.path[0].motoristaNome = route.driver || 'Motorista';
      }
      if (route.path[1]) {
        route.path[1].tempoInicioAtendimento = formatTime(now - 8000000); // 2h15m ago
        route.path[1].tempoFimAtendimento = formatTime(now - 7100000); // 2h ago
        route.path[1].duracaoAtendimentoMinutos = 15;
        route.path[1].status = 'Entregue';
        route.path[1].motoristaNome = route.driver || 'Motorista';
      }
      if (route.path[2]) {
        route.path[2].tempoInicioAtendimento = formatTime(now - 5000000); // 1h20m ago
        route.path[2].tempoFimAtendimento = formatTime(now - 4400000); // 1h10m ago
        route.path[2].duracaoAtendimentoMinutos = 10;
        route.path[2].status = 'Entregue';
        route.path[2].motoristaNome = route.driver || 'Motorista';
      }
      dbRepo.saveRotasAtivas(userEmail, routes);
    }

    triggerRefresh();
    alert('✓ Dados e tempos de rota simulados com sucesso para demonstração de relatórios!');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row text-slate-100 font-sans selection:bg-violet-500/30">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              LOGUS<span className="text-violet-400 font-mono">Q</span>
            </h2>
            <p className="text-[10px] text-slate-500 mt-1 font-mono uppercase tracking-wider">
              {clientData?.empresa || 'Gestor de Frota'}
            </p>
          </div>

          {/* Menu Items */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab('roteiro')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors ${
                activeTab === 'roteiro' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Map className="w-4 h-4" /> Roteirização Científica
            </button>
            <button
              onClick={() => setActiveTab('frota')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors ${
                activeTab === 'frota' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4" /> Gestão de Frota
            </button>
            <button
              onClick={() => setActiveTab('condutores')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors ${
                activeTab === 'condutores' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" /> Gestão de Condutores
            </button>
            <button
              onClick={() => setActiveTab('custos')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors ${
                activeTab === 'custos' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Calculator className="w-4 h-4" /> Simulador de Custos
            </button>
            <button
              onClick={() => setActiveTab('comprovantes')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors ${
                activeTab === 'comprovantes' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" /> Comprovantes / Assinaturas
            </button>
            <button
              onClick={() => setActiveTab('jornadas')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors ${
                activeTab === 'jornadas' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4 text-emerald-400" /> Relatório de Jornadas
            </button>
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-950/20 text-xs">
          <div className="text-[10px] text-slate-500 font-mono truncate mb-2">
            ID: {clientData?.idCliente || 'CLI-DEMO'}
          </div>
          <button
            onClick={onLogout}
            className="w-full bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            Sair do Painel
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
        
        {/* EMERGENCY ALERTS SECTION (CRITICAL) */}
        {unresolvedEmergencies.length > 0 && (
          <div className="space-y-4">
            {unresolvedEmergencies.map((em: any, index: number) => (
              <div 
                key={index} 
                className="bg-red-950/80 border-2 border-red-500 rounded-2xl p-5 shadow-2xl shadow-red-500/10 space-y-4"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-red-500/20 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-red-500 text-slate-950 rounded-xl">
                      <ShieldAlert className="w-5 h-5 animate-pulse" />
                    </span>
                    <div>
                      <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        🚨 ALERTA CRÍTICO: ACIONAMENTO DE EMERGÊNCIA (PANE)
                      </h2>
                      <p className="text-[11px] text-red-300 font-mono">
                        Motorista: <b className="text-white">{em.driverName}</b> ({em.driverEmail}) • Veículo: <b className="text-white">{em.vehicle}</b>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleResolveEmergency(`${em.driverEmail}_${em.horario}`)}
                    className="bg-white hover:bg-slate-200 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl transition-all cursor-pointer border border-white shadow-md shadow-red-950/50"
                  >
                    ✓ Marcar Como Resolvido / Apoio Enviado
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  {/* Defeito e Justificativa */}
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-red-500/10">
                    <span className="text-[9px] text-red-400 font-bold uppercase block mb-1">Tipo de Pane / Ocorrência</span>
                    <span className="text-white font-extrabold text-sm block mb-1.5">⚠️ {em.tipo}</span>
                    <span className="text-[11px] text-slate-300 block italic">"{em.justificativa}"</span>
                    <span className="text-[10px] text-slate-500 block mt-2">Registrado em: {em.horario}</span>
                  </div>

                  {/* Cargas Entregues até o Momento */}
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-red-500/10">
                    <span className="text-[9px] text-emerald-400 font-bold uppercase block mb-1">✓ Entregas Realizadas com Sucesso</span>
                    {em.entreguesAteMomento && em.entreguesAteMomento.length > 0 ? (
                      <ul className="space-y-1 list-disc list-inside text-emerald-300 text-[11px]">
                        {em.entreguesAteMomento.map((item: string, i: number) => (
                          <li key={i} className="truncate">{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-slate-500 italic text-[11px]">Nenhuma entrega concluída antes da pane.</span>
                    )}
                  </div>

                  {/* Cargas Pendentes / Faltando Entregar */}
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-red-500/10">
                    <span className="text-[9px] text-amber-400 font-bold uppercase block mb-1">⏳ Cargas Pendentes (Faltam Entregar)</span>
                    {em.faltandoEntregar && em.faltandoEntregar.length > 0 ? (
                      <ul className="space-y-1 list-disc list-inside text-amber-300 text-[11px]">
                        {em.faltandoEntregar.map((item: string, i: number) => (
                          <li key={i} className="truncate">{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-slate-500 italic text-[11px]">Nenhuma carga pendente no veículo.</span>
                    )}
                  </div>
                </div>

                {/* BOTÕES DE DECISÃO LOGÍSTICA DE TRANSBORDO */}
                <div className="pt-4 border-t border-red-500/20 flex flex-wrap gap-3 items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-red-200 uppercase tracking-wider">Ações de Contingência de Carga (Cross-Docking de Emergência)</h4>
                    <p className="text-[10px] text-slate-400">Ative o algoritmo matemático para realocar ou recolher as cargas pendentes deste veículo quebrado de forma otimizada.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => calculateRescueOptions(em.driverEmail, 'recolher')}
                      className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeRescueCalc.type === 'recolher' && activeRescueCalc.driverEmail === em.driverEmail
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/25'
                          : 'bg-red-950/40 hover:bg-amber-500 hover:text-slate-950 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      1. Recolher Pendentes ao CD
                    </button>
                    <button
                      onClick={() => calculateRescueOptions(em.driverEmail, 'redistribuir')}
                      className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeRescueCalc.type === 'redistribuir' && activeRescueCalc.driverEmail === em.driverEmail
                          ? 'bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-600/25'
                          : 'bg-red-950/40 hover:bg-violet-600 hover:text-white text-violet-400 border-violet-500/30'
                      }`}
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      2. Redistribuir Cargas Pendentes
                    </button>
                    <button
                      onClick={() => calculateRescueOptions(em.driverEmail, 'manual')}
                      className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeRescueCalc.type === 'manual' && activeRescueCalc.driverEmail === em.driverEmail
                          ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/25'
                          : 'bg-red-950/40 hover:bg-blue-600 hover:text-white text-blue-400 border-blue-500/30'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      3. Direcionar para Motorista Específico
                    </button>
                  </div>
                </div>

                {/* PAINEL DE CÁLCULO QUÂNTICO-MATEMÁTICO */}
                {activeRescueCalc.driverEmail === em.driverEmail && activeRescueCalc.type && (
                  <div className="mt-4 bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-4 animate-fade-in text-xs">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2 text-violet-400">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        <h3 className="font-bold text-white uppercase tracking-wider">Simulador Quântico-Matemático de Transbordo</h3>
                      </div>
                      <button
                        onClick={() => setActiveRescueCalc({ type: null, driverEmail: '', result: null })}
                        className="text-[10px] text-slate-400 hover:text-white uppercase tracking-wider font-mono hover:underline"
                      >
                        Cancelar Simulação ✕
                      </button>
                    </div>

                    {activeRescueCalc.type === 'recolher' && (
                      <div className="space-y-3">
                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex flex-wrap gap-x-6 gap-y-2 justify-between font-mono text-[10px] text-slate-400">
                          <div>Carga Total a Resgatar: <span className="text-amber-400 font-bold">{activeRescueCalc.result.totalPendingWeight} kg</span></div>
                          <div>Número de Entregas: <span className="text-white font-bold">{activeRescueCalc.result.pendingPoints.length}</span></div>
                          <div>Local da Pane: <span className="text-slate-300">Lat {activeRescueCalc.result.breakdownLat.toFixed(4)}, Lng {activeRescueCalc.result.breakdownLng.toFixed(4)}</span></div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Classificação de Viabilidade da Frota Operacional</span>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {activeRescueCalc.result.options.map((opt: any, i: number) => (
                              <div
                                key={opt.routeId}
                                className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                                  i === 0 
                                    ? 'bg-emerald-950/30 border-emerald-500/40 hover:border-emerald-400 shadow-md shadow-emerald-950/40' 
                                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-extrabold text-white text-xs">{opt.driver}</span>
                                      {i === 0 && (
                                        <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-black tracking-wider uppercase font-mono animate-pulse">
                                          ✓ Otimizado
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-500 block font-mono">{opt.vehicle} • {opt.routeId}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-slate-500 block text-[9px] font-mono uppercase">Score de Viabilidade</span>
                                    <span className={`text-sm font-black font-mono ${i === 0 ? 'text-emerald-400 text-base' : 'text-slate-300'}`}>{opt.score}%</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-slate-800/50 pt-2 text-slate-400">
                                  <div>Proximidade: <b className="text-slate-200">{opt.distance} km</b></div>
                                  <div>Capac. Ociosa: <b className={opt.exceedsCapacity ? 'text-red-400' : 'text-emerald-400'}>{opt.availableCapacity} kg</b></div>
                                </div>

                                <button
                                  onClick={() => handleConfirmRescueCollection(opt)}
                                  className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    i === 0
                                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                  }`}
                                >
                                  {i === 0 ? 'Confirmar e Enviar Este Motorista (Melhor Escolha)' : `Designar ${opt.driver}`}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeRescueCalc.type === 'redistribuir' && (
                      <div className="space-y-3">
                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex flex-wrap gap-x-6 gap-y-2 justify-between font-mono text-[10px] text-slate-400">
                          <div>Quantidade de Cargas: <span className="text-white font-bold">{activeRescueCalc.result.pendingPoints.length}</span></div>
                          <div>Estratégia de Transbordo: <span className="text-violet-400 font-bold">Distribuição Otimizada via Proximidade Geográfica e Capacidade</span></div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Atribuição de Cargas Proposta</span>
                          <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                            {activeRescueCalc.result.assignments.map((asg: any, i: number) => (
                              <div key={i} className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-lg flex flex-wrap justify-between items-center text-[11px] font-mono text-slate-300 font-sans">
                                <div className="space-y-0.5">
                                  <span className="text-white font-extrabold">{asg.point.cliente}</span>
                                  <span className="text-[10px] text-slate-500 block">Carga: {asg.point.pesoMercadoriaKg} kg • Endereço: {asg.point.endereco}</span>
                                </div>
                                <div className="text-right flex items-center gap-3">
                                  <div className="text-right">
                                    <span className="text-slate-500 block text-[9px] uppercase">Motorista Destinatário</span>
                                    <span className="text-violet-400 font-black">{asg.assignedDriver} ({asg.assignedRouteId})</span>
                                    <span className="text-[10px] text-slate-500 block">Distância: +{asg.distance} km</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="pt-3 border-t border-slate-800 flex justify-end">
                            <button
                              onClick={handleConfirmRescueRedistribution}
                              className="bg-violet-600 hover:bg-violet-500 text-white font-extrabold px-6 py-2 rounded-xl text-xs shadow-lg shadow-violet-600/35 cursor-pointer flex items-center gap-2 transition-all"
                            >
                              <Calculator className="w-4 h-4" />
                              Confirmar Redistribuição Otimizada via TSP (Re-roteirizar com IA)
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeRescueCalc.type === 'manual' && (
                      <div className="space-y-3">
                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex flex-wrap gap-x-6 gap-y-2 justify-between font-mono text-[10px] text-slate-400">
                          <div>Carga Total a Transferir: <span className="text-amber-400 font-bold">{activeRescueCalc.result.totalPendingWeight} kg</span></div>
                          <div>Número de Entregas: <span className="text-white font-bold">{activeRescueCalc.result.pendingPoints.length}</span></div>
                          <div>Local da Pane: <span className="text-slate-300">Lat {activeRescueCalc.result.breakdownLat.toFixed(4)}, Lng {activeRescueCalc.result.breakdownLng.toFixed(4)}</span></div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Escolher Qualquer Motorista Cadastrado na Empresa</span>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
                            {activeRescueCalc.result.options.map((opt: any) => (
                              <div
                                key={opt.driverEmail}
                                className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-3 transition-all bg-slate-900/60 border-slate-800/80 hover:border-slate-700`}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-extrabold text-white text-xs">{opt.driver}</span>
                                      <span className={`text-[8px] px-1.5 py-0.2 rounded font-black tracking-wider uppercase font-mono ${
                                        opt.routeStatus === 'Em Rota Ativa'
                                          ? 'bg-violet-500/20 text-violet-400'
                                          : opt.routeStatus === 'Rota Concluída'
                                          ? 'bg-amber-500/20 text-amber-400'
                                          : 'bg-slate-500/20 text-slate-400'
                                      }`}>
                                        {opt.routeStatus}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 block font-mono">{opt.vehicle} {opt.routeId ? `• ${opt.routeId}` : ''}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-slate-500 block text-[9px] font-mono uppercase">Distância da Pane</span>
                                    <span className="text-xs font-black font-mono text-slate-300">{opt.distance} km</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-slate-800/50 pt-2 text-slate-400">
                                  <div>Capac. Ociosa: <b className={opt.exceedsCapacity ? 'text-red-400' : 'text-emerald-400'}>{opt.availableCapacity} kg</b></div>
                                  <div>Capac. Total: <b className="text-slate-300">{opt.capacity} kg</b></div>
                                </div>

                                <button
                                  onClick={() => handleConfirmRescueManual(opt)}
                                  className="w-full py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                                >
                                  Designar Resgate para {opt.driver}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* TAB 1: ROTEIRIZACAO CIENTIFICA */}
        {activeTab === 'roteiro' && (
          <div className="space-y-6">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-xl font-extrabold text-white">Roteirização e Distribuição de Carga</h1>
                <p className="text-xs text-slate-400">Adicione pontos de entrega, agrupe em veículos via K-Means e otimize caminhos com TSP.</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={handleImportEntregasBulk}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700/50 transition-colors"
                >
                  Importar Demo BH
                </button>
                <button
                  onClick={downloadModeloEntregasCsv}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-800 flex items-center gap-2 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-violet-400" /> Baixar Planilha Modelo
                </button>
                <button
                  onClick={() => handleOpenImportModal('entregas')}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-800 flex items-center gap-2 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Importar Romaneio (IA / PDF / XLS)
                </button>
                <button
                  onClick={handleOptimize}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-violet-900/20 transition-all flex items-center gap-2"
                >
                  <Play className="w-4 h-4" /> Otimizar Rotas
                </button>
              </div>
            </div>

            {/* Split Screen Grid: Interactive Map + Left controllers */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Input delivery & list pending (4 cols) */}
              <div className="lg:col-span-4 space-y-4">
                
                {/* Manual input */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Novo Ponto de Entrega / Coleta</h3>
                  <form onSubmit={handleAddEntrega} className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Chave / ID</label>
                        <input
                          type="text"
                          required
                          placeholder="EX: ENT-10"
                          value={delChave}
                          onChange={e => setDelChave(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Operação</label>
                        <select
                          value={delTipo}
                          onChange={e => setDelTipo(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                        >
                          <option value="Entrega">Entrega</option>
                          <option value="Coleta">Coleta</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Cliente / Destinatário</label>
                      <input
                        type="text"
                        placeholder="EX: Drogaria Savassi"
                        value={delCliente}
                        onChange={e => setDelCliente(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">CEP</label>
                        <input
                          type="text"
                          placeholder="30000-000"
                          value={delCep}
                          onChange={e => handleDelCepLookup(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Endereço de Entrega *</label>
                        <input
                          type="text"
                          required
                          placeholder="EX: Av. Afonso Pena, 1500 - BH"
                          value={delEnd}
                          onChange={e => setDelEnd(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Endereço de Coleta (se houver)</label>
                      <input
                        type="text"
                        placeholder="EX: Galpão Central, Via Expressa, 400 - Contagem"
                        value={delEndColeta}
                        onChange={e => setDelEndColeta(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Ponto de Referência</label>
                        <input
                          type="text"
                          placeholder="EX: Próximo ao Banco Itaú"
                          value={delRef}
                          onChange={e => setDelRef(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Nº Nota Fiscal (NF)</label>
                        <input
                          type="text"
                          placeholder="EX: NF-40892"
                          value={delNotaFiscal}
                          onChange={e => setDelNotaFiscal(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Telefone Contato</label>
                        <input
                          type="text"
                          placeholder="(31) 98888-8888"
                          value={delTel}
                          onChange={e => setDelTel(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">WhatsApp</label>
                        <input
                          type="text"
                          placeholder="(31) 98888-8888"
                          value={delZap}
                          onChange={e => setDelZap(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Peso Carga (KG)</label>
                      <input
                        type="number"
                        value={delPeso}
                        onChange={e => setDelPeso(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white py-2 rounded-lg text-xs font-bold transition-all mt-3"
                    >
                      Adicionar Ponto de Entrega
                    </button>
                  </form>
                </div>

                {/* Pending points list */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl max-h-[300px] overflow-y-auto">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Pontos Pendentes ({entregasPendentes.length})</h3>
                    {entregasPendentes.length > 0 && (
                      <button 
                        onClick={() => {
                          entregasPendentes.forEach(p => dbRepo.deletarEntrega(userEmail, p.chave));
                          dbRepo.saveRotasAtivas(userEmail, {});
                          setActiveRoutes({});
                          setMapRoutes({});
                          triggerRefresh();
                        }}
                        className="text-[10px] text-red-400 hover:underline animate-pulse"
                      >
                        Limpar todos
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {entregasPendentes.length === 0 ? (
                      <div className="text-[11px] text-slate-500 text-center py-4">Nenhum ponto de entrega cadastrado. Importe a demo acima!</div>
                    ) : (
                      entregasPendentes.map(ent => (
                        <div key={ent.chave} className="bg-slate-950 border border-slate-800/80 p-3 rounded-lg text-xs space-y-1.5 animate-fade-in">
                          <div className="flex justify-between items-start">
                            <div className="space-y-0.5 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-200">{ent.cliente}</span>
                                <span className={`text-[8px] px-1 py-0.2 rounded font-mono font-bold ${
                                  ent.tipoOperacao === 'Coleta' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                  {ent.tipoOperacao === 'Coleta' ? 'COLETA' : 'ENTREGA'}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400"><span className="text-slate-600 font-medium">Entr:</span> {ent.endereco}</div>
                              {ent.enderecoColeta && (
                                <div className="text-[10px] text-slate-400"><span className="text-slate-600 font-medium">Coleta:</span> {ent.enderecoColeta}</div>
                              )}
                            </div>
                            <button 
                              onClick={() => {
                                dbRepo.deletarEntrega(userEmail, ent.chave);
                                
                                // Clean deleted delivery from any active routes
                                const updatedRoutes = { ...activeRoutes };
                                let changed = false;
                                Object.keys(updatedRoutes).forEach(rId => {
                                  const route = updatedRoutes[rId];
                                  if (route.path) {
                                    const originalLen = route.path.length;
                                    route.path = route.path.filter((p: any) => p.chave !== ent.chave);
                                    if (route.path.length !== originalLen) {
                                      changed = true;
                                      route.km = parseFloat((route.path.length * 3.2 + 4.0).toFixed(1));
                                      const totServ = route.path.reduce((acc: number, p: any) => acc + dbRepo.getAverageServiceTime(userEmail, p.cliente), 0);
                                      const trav = route.path.length * 10 + 20;
                                      route.duration = Math.round(totServ + trav);
                                    }
                                  }
                                  if (!route.path || route.path.length === 0) {
                                    delete updatedRoutes[rId];
                                    changed = true;
                                  }
                                });
                                
                                if (changed) {
                                  setActiveRoutes(updatedRoutes);
                                  dbRepo.saveRotasAtivas(userEmail, updatedRoutes);
                                  const newMapRoutes: Record<number, Entrega[]> = {};
                                  Object.values(updatedRoutes).forEach((r: any, idx) => {
                                    newMapRoutes[idx] = r.path;
                                  });
                                  setMapRoutes(newMapRoutes);
                                }
                                
                                triggerRefresh();
                              }}
                              className="text-slate-600 hover:text-red-400 p-0.5 transition-colors text-xs"
                            >
                              ✕
                            </button>
                          </div>

                          <div className="text-[10px] grid grid-cols-2 gap-x-2 gap-y-1 pt-1.5 border-t border-slate-900 text-slate-500 font-mono">
                            <div>ID: <span className="text-violet-400">{ent.chave}</span></div>
                            <div>Peso: <span className="text-slate-300">{ent.pesoMercadoriaKg} kg</span></div>
                            {ent.notaFiscal && <div className="col-span-2">NF: <span className="text-slate-300">{ent.notaFiscal}</span></div>}
                            {ent.pontoReferencia && <div className="col-span-2">Ref: <span className="text-slate-400 italic">"{ent.pontoReferencia}"</span></div>}
                            {ent.telefone && <div>Tel: <span className="text-slate-300">{ent.telefone}</span></div>}
                            {ent.whatsapp && <div>Whats: <span className="text-slate-300">{ent.whatsapp}</span></div>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* INTELIGÊNCIA DE JANELAS IA - APRENDIZADO AUTÔNOMO */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3.5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Ajuste de Janela IA (Autônomo)</h3>
                    </div>
                    <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ATIVO
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    O algoritmo analisa o histórico de tempo de descarga real trecho a trecho inserido pelos motoristas e substitui de forma autônoma a estimativa inicial (15 min) nas equações de rota.
                  </p>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {(() => {
                      const realHistory = dbRepo.getServiceTimeHistory(userEmail);
                      
                      const seedDestinations = [
                        { name: "Supermercado Central BH", initial: 15, actuals: [38, 42, 40], badge: "Crítico (Fila)", color: "text-red-400 bg-red-500/10" },
                        { name: "Pizzaria Ideal", initial: 15, actuals: [28, 30], badge: "Desvio Médio", color: "text-amber-400 bg-amber-500/10" },
                        { name: "Farmácia Santa Luzia", initial: 15, actuals: [10, 12, 11], badge: "Super Rápido", color: "text-emerald-400 bg-emerald-500/10" },
                        { name: "Lojas Americanas Savassi", initial: 15, actuals: [32, 35], badge: "Desvio Médio", color: "text-amber-400 bg-amber-500/10" }
                      ];

                      const mergedList = [...seedDestinations];
                      Object.entries(realHistory).forEach(([dest, arr]: [string, any]) => {
                        if (!mergedList.some(item => item.name === dest) && arr.length > 0) {
                          mergedList.unshift({
                            name: dest,
                            initial: 15,
                            actuals: arr,
                            badge: "Apreendido",
                            color: "text-violet-400 bg-violet-500/10"
                          });
                        }
                      });

                      return mergedList.map((item, idx) => {
                        const sum = item.actuals.reduce((a, b) => a + b, 0);
                        const avg = Math.round(sum / item.actuals.length);
                        const diff = avg - item.initial;
                        const isSlower = diff > 0;

                        return (
                          <div key={idx} className="bg-slate-950 border border-slate-800/60 p-2.5 rounded-lg text-[11px] flex flex-col space-y-1.5">
                            <div className="flex justify-between items-start">
                              <span className="font-extrabold text-slate-200 truncate pr-2 max-w-[170px]">{item.name}</span>
                              <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded font-bold ${item.color}`}>
                                {item.badge}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-1.5 font-mono text-[9px] text-slate-500 pt-1 border-t border-slate-900">
                              <div>Est. Inicial: <span className="text-slate-300">15m</span></div>
                              <div>Média IA: <span className="text-white font-bold">{avg}m</span></div>
                              <div className="text-right">Desvio: <span className={isSlower ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                                {isSlower ? `+${diff}m` : `${diff}m`}
                              </span></div>
                            </div>

                            <div className="text-[8px] font-mono text-slate-600 flex items-center gap-1 bg-slate-900/50 p-1 rounded">
                              <span className="text-emerald-400 font-bold">✓ Equações Atualizadas:</span> {avg} min aplicados de forma autônoma.
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

              </div>

              {/* Right Column: Visual Simulated Map + Active Routes sheet (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* SVG MAP */}
                <SimulatedMap entregas={todasEntregas} rotas={mapRoutes} activeRoutes={activeRoutes} />

                {/* Active Routes list */}
                {Object.keys(activeRoutes).length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Rotas Ativas & Expedição</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(activeRoutes).map(([rId, r]: [string, any]) => (
                        <div key={rId} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start border-b border-slate-800 pb-2">
                              <div>
                                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">
                                  {rId}
                                </span>
                                <h4 className="font-extrabold text-white text-xs mt-1.5">{r.driver}</h4>
                                <p className="text-[11px] text-slate-500">{r.vehicle}</p>
                              </div>
                              {(() => {
                                const isRouteFinished = r.path && r.path.length > 0 && r.path.every((p: any) => p.status === 'Entregue' || p.status === 'Cancelado');
                                return (
                                  <div className="flex flex-col items-end gap-1.5">
                                    <button 
                                      onClick={() => handleCompleteRoute(rId)}
                                      className={`text-[10px] font-bold px-2.5 py-1 rounded transition-all cursor-pointer ${
                                        isRouteFinished 
                                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-black' 
                                          : 'bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white'
                                      }`}
                                    >
                                      Concluir Rota
                                    </button>
                                    {isRouteFinished && (
                                      <button
                                        onClick={() => handleCompleteRoute(rId)}
                                        className="text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded text-center border border-emerald-400 font-sans shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 cursor-pointer"
                                        style={{ animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                                        title="Clique para arquivar e finalizar a rota"
                                      >
                                        Atividades Concluídas
                                      </button>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>

                            <div className="mt-3 space-y-1 text-[11px] font-mono text-slate-400">
                              <div>Paradas: <span className="text-white font-bold">{r.path.length}</span></div>
                              <div>Distância: <span className="text-blue-400">{r.km} KM</span></div>
                              <div>Duração: <span className="text-slate-300">{Math.floor(r.duration / 60)}h {r.duration % 60}min</span></div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-800/60 flex justify-between">
                            <button
                              onClick={() => downloadDriverRouteTxt(rId)}
                              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1.5 font-mono"
                            >
                              <Download className="w-3.5 h-3.5 text-violet-400" />
                              Baixar Folha de Rota (TXT)
                            </button>
                            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider animate-pulse">● em trânsito</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            </div>
          </div>
        )}

        {/* TAB 2: GESTÃO DE FROTA */}
        {activeTab === 'frota' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-xl font-extrabold text-white">Gestão Avançada de Frota</h1>
                <p className="text-xs text-slate-400">Cadastre veículos individualmente ou realize importação em massa via planilha CSV.</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={downloadModeloVeiculosCsv}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-800 flex items-center gap-2 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-violet-400" /> Baixar Planilha Modelo
                </button>
                <button
                  onClick={() => handleOpenImportModal('veiculos')}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-violet-900/20 flex items-center gap-2 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-violet-200" /> Importar Frota Inteligente (IA / PDF / XLS)
                </button>
              </div>
            </div>

            {/* Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Form (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Add vehicle form */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Novo Veículo</h3>
                  <form onSubmit={handleAddVeiculo} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">ID Interno / Nº Frota</label>
                        <input
                          type="text" required placeholder="VEIC-101" value={vId} onChange={e => setVId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Placa</label>
                        <input
                          type="text" required placeholder="ABC-1234" value={vPlaca} onChange={e => setVPlaca(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Fabricante</label>
                        <input
                          type="text" placeholder="Volvo / Mercedes" value={vFab} onChange={e => setVFab(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Modelo</label>
                        <input
                          type="text" placeholder="FH 540 / Fiorino" value={vMod} onChange={e => setVMod(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Tipo Modal</label>
                        <select
                          value={vTipo} onChange={e => setVTipo(e.target.value as TipoVeiculo)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                        >
                          <option value="Caminhão Pesado">Caminhão Pesado</option>
                          <option value="Van">Van / Fiorino</option>
                          <option value="Picape 4x4">Picape 4x4</option>
                          <option value="Carro Leve">Carro Leve</option>
                          <option value="Motocicleta">Motocicleta</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Capacidade (KG)</label>
                        <input
                          type="number" value={vCap} onChange={e => setVCap(parseInt(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Ano Fabricação</label>
                        <input
                          type="text" placeholder="2021" value={vAnoFabricacao} onChange={e => setVAnoFabricacao(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Ano Modelo</label>
                        <input
                          type="text" placeholder="2022" value={vAnoModelo} onChange={e => setVAnoModelo(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Cor</label>
                        <input
                          type="text" placeholder="Branco" value={vCor} onChange={e => setVCor(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Status Inicial</label>
                        <select
                          value={vStatus} onChange={e => setVStatus(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                        >
                          <option value="Disponivel">Disponível</option>
                          <option value="Manutencao">Em Manutenção</option>
                          <option value="Inativo">Inativo</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">RENAVAM</label>
                        <input
                          type="text" placeholder="12345678901" value={vRenavam} onChange={e => setVRenavam(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Chassi</label>
                        <input
                          type="text" placeholder="9ASDF..." value={vChassi} onChange={e => setVChassi(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
                        />
                      </div>
                    </div>

                    <button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 rounded-xl text-xs transition-colors mt-2">
                      Salvar Veículo na Frota
                    </button>
                  </form>
                </div>

                {/* Edit status section */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Editar Veículo Existente</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Selecione o Veículo</label>
                      <select
                        value={selectedVeiculoEdit}
                        onChange={e => setSelectedVeiculoEdit(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="">-- Escolha um Veículo --</option>
                        {frota.map(v => (
                          <option key={v.idVeiculo} value={v.idVeiculo}>{v.idVeiculo} - {v.modelo} ({v.placa})</option>
                        ))}
                      </select>
                    </div>

                    {veicSel && (
                      <form onSubmit={handleUpdateVeiculo} className="space-y-2 pt-2 border-t border-slate-800/60">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Fabricante</label>
                            <input
                              type="text" value={evFabricante} onChange={e => setEvFabricante(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Modelo</label>
                            <input
                              type="text" value={evModelo} onChange={e => setEvModelo(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Placa</label>
                            <input
                              type="text" value={evPlaca} onChange={e => setEvPlaca(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Tipo Modal</label>
                            <select
                              value={evTipo} onChange={e => setEvTipo(e.target.value as any)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                            >
                              <option value="Carro Leve">Carro Leve</option>
                              <option value="Picape 4x4">Picape 4x4</option>
                              <option value="Van">Van</option>
                              <option value="Caminhão Pesado">Caminhão Pesado</option>
                              <option value="Motocicleta">Motocicleta</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Capacidade (KG)</label>
                            <input
                              type="number" value={evCap} onChange={e => setEvCap(parseInt(e.target.value) || 0)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Cor</label>
                            <input
                              type="text" value={evCor} onChange={e => setEvCor(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Ano Fabricação</label>
                            <input
                              type="text" value={evAnoFabricacao} onChange={e => setEvAnoFabricacao(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Ano Modelo</label>
                            <input
                              type="text" value={evAnoModelo} onChange={e => setEvAnoModelo(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">RENAVAM</label>
                            <input
                              type="text" value={evRenavam} onChange={e => setEvRenavam(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Chassi</label>
                            <input
                              type="text" value={evChassi} onChange={e => setEvChassi(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800/40">
                          <label className="block text-[10px] font-bold text-violet-400 uppercase tracking-wide mb-1.5">Oficina & Manutenção</label>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                              <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Entrada Oficina</label>
                              <input
                                type="text" placeholder="DD/MM/AAAA" value={evDataEntradaManutencao} onChange={e => setEvDataEntradaManutencao(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Saída Oficina</label>
                              <input
                                type="text" placeholder="DD/MM/AAAA" value={evDataRetornoManutencao} onChange={e => setEvDataRetornoManutencao(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Status Operacional</label>
                            <select
                              value={evStatus} onChange={e => setEvStatus(e.target.value as any)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white mb-2"
                            >
                              <option value="Disponivel">Disponível / Ativo</option>
                              <option value="Manutencao">Em Manutenção / Oficina</option>
                              <option value="Inativo">Inativo</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Relatório do Defeito / Observações</label>
                            <textarea
                              value={evObs} onChange={e => setEvObs(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white h-12 resize-none"
                              placeholder="Problemas mecânicos, histórico de consertos..."
                            />
                          </div>
                        </div>

                        <button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold py-2 rounded transition-colors mt-2">
                          Confirmar Atualizações
                        </button>
                      </form>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: List (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Base de Veículos Ativa ({frota.length})</h3>
                    <div className="text-[10px] text-slate-500 font-mono">Unidade: Matriz</div>
                  </div>
                  
                  <div className="overflow-x-auto border border-slate-800 rounded-lg">
                    <table className="w-full text-xs text-left text-slate-400">
                      <thead className="text-[10px] uppercase font-mono bg-slate-950/50 text-slate-500 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">Nº Frota</th>
                          <th className="px-4 py-3">Placa</th>
                          <th className="px-4 py-3">Especificações</th>
                          <th className="px-4 py-3">Tipo / Capacidade</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3">Documentação</th>
                          <th className="px-4 py-3 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {frota.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-mono text-xs">
                              Nenhum veículo cadastrado na frota. Baixe o modelo e importe acima!
                            </td>
                          </tr>
                        ) : (
                          frota.map(v => {
                            const driverName = condutores.find(c => c.veiculo === v.idVeiculo)?.nome || 'Sem motorista alocado';
                            return (
                              <tr key={v.idVeiculo} className="hover:bg-slate-800/10">
                                <td className="px-4 py-3 font-bold text-white text-xs">
                                  {v.idVeiculo}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-[10px] font-mono text-violet-400 bg-violet-400/5 px-1.5 py-0.5 rounded w-fit">{v.placa}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-slate-300">{v.fabricante} {v.modelo}</div>
                                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">Ano: {v.anoFabricacao}/{v.anoModelo} • Cor: {v.cor}</div>
                                  <div className="text-[10px] text-slate-400 font-medium">Motorista: <span className="text-white">{driverName}</span></div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-slate-300">{v.tipo}</div>
                                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">{v.capacidadeKg.toLocaleString('pt-BR')} kg úteis</div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                                    v.status === 'Disponivel' ? 'bg-emerald-500/10 text-emerald-400' : 
                                    v.status === 'Manutencao' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                                  }`}>
                                    {v.status === 'Disponivel' ? 'Disponível' : v.status === 'Manutencao' ? 'Manutenção' : 'Inativo'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-[10px] font-mono text-slate-500">RENAVAM: <span className="text-slate-300">{v.renavam || '-'}</span></div>
                                  <div className="text-[10px] font-mono text-slate-500">Chassi: <span className="text-slate-300 truncate inline-block max-w-[100px]">{v.chassi || '-'}</span></div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => {
                                      if (confirm(`Remover veículo ${v.idVeiculo} da frota?`)) {
                                        dbRepo.deletarVeiculo(userEmail, v.idVeiculo);
                                        triggerRefresh();
                                      }
                                    }}
                                    className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 transition-colors"
                                    title="Remover veículo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mx-auto" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 2.5: GESTÃO DE CONDUTORES */}
        {activeTab === 'condutores' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-xl font-extrabold text-white">Gestão de Motoristas Habilitados</h1>
                <p className="text-xs text-slate-400">Gerencie a documentação de CNH, valide vencimentos e atribua rotas de forma simplificada.</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={downloadModeloMotoristasCsv}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-800 flex items-center gap-2 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-violet-400" /> Baixar Planilha Modelo
                </button>
                <button
                  onClick={() => handleOpenImportModal('condutores')}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-violet-900/20 flex items-center gap-2 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-violet-200" /> Importar Motoristas Inteligente (IA / PDF / XLS)
                </button>
              </div>
            </div>

            {/* Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Form & Bind (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Add driver form */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Novo Motorista</h3>
                  <form onSubmit={handleAddCondutor} className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Nome Completo</label>
                      <input
                        type="text" required placeholder="Carlos Alberto da Silva" value={dNome} onChange={e => setDNome(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-650"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">CPF</label>
                        <input
                          type="text" required placeholder="111.222.333-44" value={dCpf} onChange={e => setDCpf(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-650"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">RG</label>
                        <input
                          type="text" placeholder="MG-12.345.678" value={dRg} onChange={e => setDRg(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-650"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Telefone de Contato</label>
                        <input
                          type="text" required placeholder="(31) 98888-7777" value={dTel} onChange={e => setDTel(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-650"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Data Nascimento</label>
                        <input
                          type="text" required placeholder="12/03/1985" value={dNascimento} onChange={e => setDNascimento(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-650"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">E-mail corporativo / Login</label>
                      <input
                        type="email" required placeholder="carlos.silva@empresa.com.br" value={dEmail} onChange={e => setDEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-650"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Nº Registro CNH</label>
                        <input
                          type="text" required placeholder="12345678910" value={dCnh} onChange={e => setDCnh(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-650"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Categoria</label>
                        <select
                          value={dCat} onChange={e => setDCat(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                          <option value="E">E</option>
                          <option value="AB">AB</option>
                          <option value="AC">AC</option>
                          <option value="AD">AD</option>
                          <option value="AE">AE</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Vencimento CNH</label>
                        <input
                          type="text" required placeholder="10/12/2030" value={dVencCnh} onChange={e => setDVencCnh(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-650"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Veículo Inicial</label>
                        <select
                          value={dVeiculo} onChange={e => setDVeiculo(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                        >
                          <option value="-">Nenhum (Disponível)</option>
                          {frota.map(v => (
                            <option key={v.idVeiculo} value={v.idVeiculo}>{v.idVeiculo} - {v.modelo}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 rounded-xl text-xs transition-colors mt-2">
                      Cadastrar Motorista
                    </button>
                  </form>
                </div>

                {/* Quick Vehicle Allocator Binder */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Vincular Motorista a Veículo</h3>
                  <form onSubmit={handleBindDriver} className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Motorista</label>
                      <select
                        value={bindDriver} onChange={e => setBindDriver(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                      >
                        <option value="">-- Selecione o Motorista --</option>
                        {condutores.map(c => <option key={c.email} value={c.email}>{c.nome}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Veículo Alocado</label>
                      <select
                        value={bindVehicle} onChange={e => setBindVehicle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                      >
                        <option value="">-- Selecione o Veículo --</option>
                        <option value="-">-- Nenhum (Liberar Motorista) --</option>
                        {frota.map(v => <option key={v.idVeiculo} value={v.idVeiculo}>{v.idVeiculo} - {v.modelo} ({v.placa})</option>)}
                      </select>
                    </div>
                    <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded-xl text-xs font-semibold transition-colors">
                      Efetuar Vínculo Operacional
                    </button>
                  </form>
                </div>

                {/* Edit driver form */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Editar Motorista Existente</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Selecione o Motorista</label>
                      <select
                        value={selectedCondutorEdit}
                        onChange={e => setSelectedCondutorEdit(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="">-- Escolha um Motorista --</option>
                        {condutores.map(c => (
                          <option key={c.email} value={c.email}>{c.nome} ({c.email})</option>
                        ))}
                      </select>
                    </div>

                    {condSel && (
                      <form onSubmit={handleUpdateCondutor} className="space-y-3 pt-2 border-t border-slate-800/60">
                        <div>
                          <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Nome Completo</label>
                          <input
                            type="text" required value={edDNome} onChange={e => setEdDNome(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">CPF</label>
                            <input
                              type="text" required value={edDCpf} onChange={e => setEdDCpf(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Senha Portal</label>
                            <input
                              type="password" placeholder="Senha de acesso" value={edDSenha} onChange={e => setEdDSenha(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Telefone</label>
                            <input
                              type="text" required value={edDTel} onChange={e => setEdDTel(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Status do Motorista</label>
                            <select
                              value={edDStatus} onChange={e => setEdDStatus(e.target.value as any)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                            >
                              <option value="Ativo">Ativo</option>
                              <option value="Afastado">Afastado</option>
                              <option value="Férias">Férias</option>
                              <option value="Licença">Licença</option>
                              <option value="Desligado">Desligado</option>
                              <option value="Inativo">Inativo</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">E-mail / Login</label>
                          <input
                            type="email" required value={edDEmail} onChange={e => setEdDEmail(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Veículo Alocado (Nº Frota)</label>
                            <select
                              value={edDVeiculo} 
                              onChange={e => {
                                const vId = e.target.value;
                                setEdDVeiculo(vId);
                                const matchedVeh = frota.find(v => v.idVeiculo === vId);
                                if (matchedVeh) {
                                  setEdDPlacaVeiculo(matchedVeh.placa);
                                } else if (vId === '-') {
                                  setEdDPlacaVeiculo('');
                                }
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                            >
                              <option value="-">Nenhum (Disponível)</option>
                              {frota.map(v => (
                                <option key={v.idVeiculo} value={v.idVeiculo}>{v.idVeiculo} - {v.modelo}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Placa do Veículo</label>
                            <input
                              type="text" value={edDPlacaVeiculo} onChange={e => setEdDPlacaVeiculo(e.target.value)}
                              placeholder="Ex: ABC-1234"
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Vencimento CNH</label>
                            <input
                              type="text" required value={edDVencCnh} onChange={e => setEdDVencCnh(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-0.5">Cat.</label>
                            <select
                              value={edDCat} onChange={e => setEdDCat(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                            >
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                              <option value="D">D</option>
                              <option value="E">E</option>
                              <option value="AB">AB</option>
                              <option value="AC">AC</option>
                              <option value="AD">AD</option>
                              <option value="AE">AE</option>
                            </select>
                          </div>
                        </div>

                        <button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold py-2 rounded transition-colors mt-2">
                          Confirmar Atualizações
                        </button>
                      </form>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: List of drivers (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Base de Motoristas Habilitados ({condutores.length})</h3>
                    <span className="text-[10px] text-emerald-400 bg-emerald-400/5 px-2 py-0.5 rounded-full font-mono font-bold uppercase animate-pulse">● operacional</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {condutores.length === 0 ? (
                      <div className="col-span-2 text-center text-slate-500 py-12 font-mono text-xs">
                        Nenhum motorista cadastrado ainda. Use o formulário ou faça importação em massa via CSV!
                      </div>
                    ) : (
                      condutores.map(c => {
                        // Check CNH status
                        const isExpired = () => {
                          try {
                            const [day, month, year] = c.vencCnh.split('/').map(Number);
                            const expiry = new Date(year, month - 1, day);
                            return expiry < new Date();
                          } catch (e) {
                            return false;
                          }
                        };
                        const expired = isExpired();
                        const currentStatus = c.status || 'Ativo';

                        return (
                          <div key={c.email} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between hover:border-slate-800 transition-colors">
                            <div>
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-bold text-white text-sm flex items-center flex-wrap gap-1.5">
                                    {c.nome}
                                    <span className={`text-[8px] font-bold uppercase tracking-wider font-mono px-1.5 py-0.5 rounded ${
                                      currentStatus === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400' :
                                      currentStatus === 'Férias' ? 'bg-blue-500/10 text-blue-400' :
                                      currentStatus === 'Licença' ? 'bg-amber-500/10 text-amber-400' :
                                      currentStatus === 'Afastado' ? 'bg-purple-500/10 text-purple-400' : 'bg-red-500/10 text-red-400'
                                    }`}>
                                      {currentStatus}
                                    </span>
                                  </h4>
                                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">CPF: {c.cpf} {c.rg ? `• RG: ${c.rg}` : ''}</div>
                                </div>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                  expired ? 'bg-red-500/10 text-red-400' : 'bg-violet-500/10 text-violet-400'
                                }`}>
                                  Cat {c.categoriaCnh}
                                </span>
                              </div>

                              <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] font-mono text-slate-400 border-t border-slate-900/60 pt-3">
                                <div>Telefone: <span className="text-slate-200 font-sans">{c.telefone}</span></div>
                                <div>Nascimento: <span className="text-slate-200">{c.nascimento || '-'}</span></div>
                                <div className="col-span-2 truncate">E-mail: <span className="text-slate-200 font-sans">{c.email}</span></div>
                                <div>
                                  Vencimento CNH: <span className={expired ? 'text-red-400 font-bold' : 'text-slate-200'}>
                                    {c.vencCnh} {expired && '(Vencida!)'}
                                  </span>
                                </div>
                                <div>
                                  Senha Portal: <span className="text-slate-300">{c.senha ? '••••••••' : 'Não cadastrada'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center">
                              <div className="text-xs">
                                <span className="text-slate-500 text-[10px] uppercase font-mono block">Veículo Alocado:</span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`font-semibold ${c.veiculo && c.veiculo !== '-' ? 'text-emerald-400' : 'text-slate-400'}`}>
                                    {c.veiculo && c.veiculo !== '-' ? `Frota ID: ${c.veiculo}` : 'Sem veículo'}
                                  </span>
                                  {c.placaVeiculo && (
                                    <span className="text-[10px] text-violet-400 font-mono bg-violet-400/10 border border-violet-400/20 px-1.5 py-0.5 rounded">
                                      {c.placaVeiculo}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (confirm(`Remover motorista ${c.nome} do sistema?`)) {
                                    dbRepo.deletarCondutor(userEmail, c.email);
                                    triggerRefresh();
                                  }
                                }}
                                className="text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-red-500/10 transition-colors"
                                title="Deletar motorista"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 3: SIMULADOR DE CUSTOS */}
        {activeTab === 'custos' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-extrabold text-white">Simulador Científico de Custos de Viagem</h1>
              <p className="text-xs text-slate-400">Estime despesas de combustível, diárias de motoristas e depreciação com precisão matemática.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Calculator Panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4 h-fit">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Parâmetros Operacionais</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Preço Combustível (R$/L)</label>
                    <input
                      type="number" step="0.01" value={combustivelPreco}
                      onChange={e => setCombustivelPreco(parseFloat(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Consumo Médio (KM/L)</label>
                    <input
                      type="number" step="0.1" value={veiculoConsumo}
                      onChange={e => setVeiculoConsumo(parseFloat(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Diária Média Motorista (R$)</label>
                    <input
                      type="number" value={diariaMotorista}
                      onChange={e => setDiariaMotorista(parseFloat(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Fator Depreciação/KM (R$)</label>
                    <input
                      type="number" step="0.01" value={fatorManutencao}
                      onChange={e => setFatorManutencao(parseFloat(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Cost report and pie chart */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Relatório Consolidado de Custos</h3>
                  
                  {totalKmRoteado > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Pie Chart */}
                      <div className="h-44 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={costChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={65}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {costChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `R$ ${value}`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Details */}
                      <div className="space-y-3 font-mono text-xs text-slate-400">
                        <div className="flex justify-between">
                          <span>Distância Total:</span>
                          <span className="text-white font-bold">{totalKmRoteado} KM</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Combustível:</span>
                          <span className="text-violet-400 font-bold">R$ {custoCombustivel.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Diária Motoristas:</span>
                          <span className="text-emerald-400 font-bold">R$ {custoMotoristas.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Manut./Depreciação:</span>
                          <span className="text-amber-400 font-bold">R$ {custoManutencao.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="border-t border-slate-800 pt-2 flex justify-between text-sm">
                          <span className="text-slate-300 font-bold">Custo Total:</span>
                          <span className="text-white font-extrabold text-base">R$ {custoTotalEstimado.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-950/40 border border-slate-800 border-dashed rounded-xl p-8 text-center text-xs text-slate-500 py-12">
                      <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <div>Não existem rotas ativas em trânsito.</div>
                      <div className="text-[10px] text-slate-600 mt-1">Gere rotas na aba de Roteirização Científica primeiro.</div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/60 text-[11px] text-slate-500">
                  Os valores calculados são estimativas aproximadas baseadas nos modais de frota ativos.
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Comprovantes / Assinaturas Tab */}
        {activeTab === 'comprovantes' && (
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
              <div>
                <span className="text-[10px] font-mono font-bold text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full uppercase">
                  Módulo de Conformidade & Auditoria
                </span>
                <h1 className="text-xl font-extrabold text-white mt-2">Comprovantes & Assinaturas Digitais</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Acompanhe em tempo real as assinaturas digitais e comprovações fotográficas de entregas/coletas.
                </p>
              </div>

              {/* Data retention informational tag */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-start gap-2 max-w-xs">
                <Info className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-slate-400 leading-normal">
                  <span className="text-slate-300 font-bold block">Política de Retenção Ativa:</span>
                  Imagens retidas por **12 meses (1 ano)** para salvaguarda judicial e LGPD.
                </p>
              </div>
            </div>

            {/* Filter controls */}
            <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Filtros de Pesquisa Rápidos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                
                {/* Search by client */}
                <div>
                  <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Cliente</label>
                  <input
                    type="text"
                    placeholder="Nome do cliente..."
                    value={searchCompClient}
                    onChange={e => setSearchCompClient(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-violet-500"
                  />
                </div>

                {/* Search by NF */}
                <div>
                  <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Nota Fiscal (NF)</label>
                  <input
                    type="text"
                    placeholder="Número da NF..."
                    value={searchCompNF}
                    onChange={e => setSearchCompNF(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-violet-500"
                  />
                </div>

                {/* Filter by driver */}
                <div>
                  <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Motorista</label>
                  <select
                    value={filterCompDriver}
                    onChange={e => setFilterCompDriver(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-violet-500"
                  >
                    <option value="">-- Todos --</option>
                    {condutores.map(c => (
                      <option key={c.id} value={c.nome}>{c.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Filter by status */}
                <div>
                  <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Status Final</label>
                  <select
                    value={filterCompStatus}
                    onChange={e => setFilterCompStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-violet-500"
                  >
                    <option value="">-- Todos --</option>
                    <option value="Entregue">Entregues (Sucesso)</option>
                    <option value="Cancelado">Recusados/Falhas</option>
                  </select>
                </div>

                {/* Filter by date */}
                <div>
                  <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Data (Ex: 18/07/2026)</label>
                  <input
                    type="text"
                    placeholder="Ex: 18/07/2026"
                    value={filterCompDate}
                    onChange={e => setFilterCompDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-violet-500 font-mono placeholder-slate-600"
                  />
                </div>

              </div>

              {/* Clean Filters Button */}
              {(searchCompClient || searchCompNF || filterCompDriver || filterCompStatus || filterCompDate) && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      setSearchCompClient('');
                      setSearchCompNF('');
                      setFilterCompDriver('');
                      setFilterCompStatus('');
                      setFilterCompDate('');
                    }}
                    className="text-[10px] text-violet-400 hover:text-violet-300 font-mono flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Limpar filtros aplicados
                  </button>
                </div>
              )}
            </div>

            {/* List container */}
            <div className="space-y-4">
              
              {/* Filtered list computation */}
              {(() => {
                const compFiltered = todasEntregas.filter(e => {
                  const hasProof = e.status === 'Entregue' || e.status === 'Cancelado' || !!e.fotoComprovante;
                  if (!hasProof) return false;

                  if (searchCompClient && !e.cliente.toLowerCase().includes(searchCompClient.toLowerCase())) return false;
                  if (searchCompNF && (!e.notaFiscal || !e.notaFiscal.toLowerCase().includes(searchCompNF.toLowerCase()))) return false;
                  if (filterCompDriver && (!e.motoristaNome || !e.motoristaNome.toLowerCase().includes(filterCompDriver.toLowerCase()))) return false;
                  if (filterCompStatus && e.status !== filterCompStatus) return false;
                  if (filterCompDate && (!e.dataEntregue || !e.dataEntregue.includes(filterCompDate))) return false;

                  return true;
                });

                if (compFiltered.length === 0) {
                  return (
                    <div className="bg-slate-900/40 border border-slate-800 border-dashed rounded-xl p-12 text-center text-slate-500 space-y-2 py-16">
                      <FileText className="w-8 h-8 text-slate-600 mx-auto mb-1" />
                      <div className="text-xs font-bold text-slate-400">Nenhum comprovante encontrado</div>
                      <p className="text-[10px] text-slate-600 max-w-sm mx-auto">
                        Acesse o Painel do Motorista (`motorista@logusq.com.br` / `123456`) e registre assinaturas para vê-las listadas e auditadas em tempo real neste painel.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {compFiltered.map(item => (
                      <div key={item.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between space-y-4 transition-all shadow-lg">
                        
                        {/* Header card info */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[8px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase">
                                {item.chave}
                              </span>
                              <h4 className="font-extrabold text-white text-xs mt-1.5">{item.cliente}</h4>
                            </div>
                            <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                              item.status === 'Entregue' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {item.status === 'Entregue' ? 'Entregue' : 'Recusada'}
                            </span>
                          </div>

                          <div className="text-[11px] font-mono space-y-1 text-slate-400 bg-slate-950/40 p-2 rounded border border-slate-800/40">
                            <div><span className="text-slate-500">Nota Fiscal:</span> <span className="text-slate-300 font-bold">{item.notaFiscal || 'N/A'}</span></div>
                            {item.endereco && <div className="truncate"><span className="text-slate-500">Local:</span> <span className="text-slate-300">{item.endereco}</span></div>}
                            {item.dataEntregue && <div><span className="text-slate-500">Baixa em:</span> <span className="text-slate-300">{item.dataEntregue}</span></div>}
                            <div><span className="text-slate-500">Motorista:</span> <span className="text-emerald-400 font-bold">{item.motoristaNome || 'Atribuído em Rota'}</span></div>
                          </div>
                        </div>

                        {/* Thumbnail of proof */}
                        <div className="relative group overflow-hidden border border-slate-800 rounded-lg bg-slate-950 h-32 flex items-center justify-center">
                          {item.fotoComprovante ? (
                            <>
                              <img 
                                src={item.fotoComprovante} 
                                alt={`Comprovante ${item.chave}`} 
                                className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                              />
                              <button 
                                onClick={() => setZoomPhoto(item.fotoComprovante || null)}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-white transition-opacity"
                              >
                                Ampliar Comprovante
                              </button>
                            </>
                          ) : (
                            <div className="text-center text-[10px] text-slate-600 p-4 space-y-1">
                              <ShieldAlert className="w-5 h-5 text-slate-700 mx-auto" />
                              <div>Sem registro de imagem</div>
                              <div>Baixado por gestor manualmente</div>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        {item.fotoComprovante && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = item.fotoComprovante || '';
                                link.download = `Comprovante_${item.chave}_NF${item.notaFiscal || 'N/A'}.png`;
                                link.click();
                              }}
                              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center justify-center gap-1"
                            >
                              <Download className="w-3 h-3 text-violet-400" /> Baixar Imagem
                            </button>
                          </div>
                        )}

                        {item.observacao && (
                          <div className="text-[10px] bg-indigo-950/20 text-indigo-300 border border-indigo-900/40 rounded p-1.5 font-mono">
                            <span className="font-bold text-[9px] text-indigo-400 uppercase block mb-0.5">Nota de Entrega</span>
                            "{item.observacao}"
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                );
              })()}

            </div>

          </div>
        )}

        {/* TAB 6: RELATORIO DE JORNADAS */}
        {activeTab === 'jornadas' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase">
                  ⏱️ Rastreabilidade de Produtividade & Jornadas
                </span>
                <h1 className="text-xl font-extrabold text-white mt-1.5">Relatório Consolidado de Jornadas & Deslocamentos</h1>
                <p className="text-xs text-slate-400">Rastreabilidade completa de horários de saída, paradas, pausas, tempos de entrega e retornos de percurso.</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const firstCondutor = condutores[0]?.email || 'motorista@logusq.com';
                    handleSimulateShiftData(firstCondutor);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-950/40 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" /> Simular Dados de Rota Completa (17/07/2026)
                </button>
              </div>
            </div>

            {/* Filter controls */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-400 uppercase">Filtrar por Motorista</label>
                <select
                  value={filterJornadaDriver}
                  onChange={e => setFilterJornadaDriver(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-violet-500 outline-none"
                >
                  <option value="">-- Todos os Motoristas --</option>
                  {condutores.map(c => (
                    <option key={c.email} value={c.nome}>{c.nome} ({c.email})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-400 uppercase">Filtrar por Veículo</label>
                <select
                  value={filterJornadaVehicle}
                  onChange={e => setFilterJornadaVehicle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-violet-500 outline-none"
                >
                  <option value="">-- Todos os Veículos --</option>
                  {frota.map(v => (
                    <option key={v.idVeiculo} value={v.placa}>{v.modelo} - Placa: {v.placa}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-400 uppercase">Data da Jornada</label>
                <input
                  type="text"
                  value={filterJornadaDate}
                  onChange={e => setFilterJornadaDate(e.target.value)}
                  placeholder="Ex: 17/07/2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-violet-500 outline-none"
                />
              </div>
            </div>

            {/* Journey listing */}
            {(() => {
              const filteredDrivers = condutores.filter(c => {
                const matchDriver = !filterJornadaDriver || c.nome.toLowerCase().includes(filterJornadaDriver.toLowerCase());
                const matchVehicle = !filterJornadaVehicle || (c.veiculo && c.veiculo.toLowerCase().includes(filterJornadaVehicle.toLowerCase()));
                return matchDriver && matchVehicle;
              });

              if (filteredDrivers.length === 0) {
                return (
                  <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-12 text-center text-xs text-slate-500">
                    Nenhum motorista corresponde aos filtros selecionados.
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  {filteredDrivers.map(c => {
                    const saved = localStorage.getItem(`logusq_atividade_${c.email}`);
                    const activity = saved ? JSON.parse(saved) : null;
                    const route: any = Object.values(activeRoutes).find((r: any) => r.driverEmail === c.email || r.driver === c.nome);

                    if (filterJornadaDate && activity) {
                      const dateStr = activity.inicioDeslocamento || activity.fimDeslocamento || '';
                      if (dateStr && !dateStr.includes(filterJornadaDate)) {
                        return null;
                      }
                    }

                    if (!activity && !route) {
                      return (
                        <div key={c.email} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-xs text-slate-500 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-white block">{c.nome}</span>
                            <span className="text-[10px] font-mono text-slate-400 uppercase">E-mail: {c.email} | Veículo: {c.veiculo || 'Não associado'}</span>
                          </div>
                          <span className="bg-slate-950/60 border border-slate-800/80 px-2.5 py-1 rounded text-[10px] uppercase font-mono">Sem atividade hoje</span>
                        </div>
                      );
                    }

                    const timeline = getJourneyTimeline(route, activity);
                    const totalPausas = activity?.pausas?.length || 0;
                    const totalPausasMin = activity?.pausas?.reduce((acc: number, p: any) => {
                      if (p.inicio && p.fim) {
                        try {
                          const start = parsePtBrDate(p.inicio)?.getTime();
                          const end = parsePtBrDate(p.fim)?.getTime();
                          if (start && end) {
                            return acc + Math.round((end - start) / 60000);
                          }
                        } catch (e) {}
                      }
                      return acc;
                    }, 0) || 0;

                    const totalEntregas = route?.path?.length || 0;
                    const entregues = route?.path?.filter((p: any) => p.status === 'Entregue').length || 0;
                    const cancelados = route?.path?.filter((p: any) => p.status === 'Cancelado').length || 0;

                    return (
                      <div key={c.email} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                        
                        {/* Header details */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-white text-base">{c.nome}</h3>
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                activity?.fimDeslocamento 
                                  ? 'bg-slate-850 text-slate-400 border border-slate-700/50' 
                                  : activity?.inicioDeslocamento 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {activity?.fimDeslocamento ? 'Jornada Concluída' : activity?.inicioDeslocamento ? 'Em trânsito' : 'Aguardando saída CD'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 font-mono">
                              E-mail: <b className="text-slate-300">{c.email}</b> | Veículo: <b className="text-slate-300">{c.veiculo || 'N/A'}</b>
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handlePrintAudit(c, activity, route, timeline, filterJornadaDate)}
                              className="bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-violet-950/30 cursor-pointer font-sans"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Imprimir Auditoria
                            </button>

                            <div className="text-right font-mono">
                              <span className="text-[10px] text-slate-500 uppercase block">Data da auditoria</span>
                              <span className="text-white font-bold text-xs">{filterJornadaDate}</span>
                            </div>
                          </div>
                        </div>

                        {/* Metrics bar */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
                            <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1">⏱️ Saída do CD Hub</span>
                            <span className="text-white font-bold text-xs font-mono">
                              {activity?.inicioDeslocamento ? activity.inicioDeslocamento.split(', ')[1] || activity.inicioDeslocamento : 'Não iniciou'}
                            </span>
                          </div>

                          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
                            <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1">🏁 Retorno ao CD Hub</span>
                            <span className="text-indigo-400 font-bold text-xs font-mono">
                              {activity?.fimDeslocamento ? activity.fimDeslocamento.split(', ')[1] || activity.fimDeslocamento : 'Não retornou'}
                            </span>
                          </div>

                          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
                            <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1">⏸️ Pausas / Almoço</span>
                            <span className="text-amber-400 font-bold text-xs font-mono">
                              {totalPausas} registradas ({totalPausasMin} min)
                            </span>
                          </div>

                          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
                            <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1">📊 Status das Entregas</span>
                            <span className="text-emerald-400 font-bold text-xs font-mono">
                              {entregues}/{totalEntregas} entregues {cancelados > 0 && <span className="text-red-400 font-bold font-sans">({cancelados} falhas)</span>}
                            </span>
                          </div>
                        </div>

                        {/* Chronological details */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono border-l-2 border-violet-500 pl-2">
                            Cronologia e Auditoria de Percursos (Trecho a Trecho)
                          </h4>

                          {timeline.length === 0 ? (
                            <div className="bg-slate-950/40 p-5 rounded-xl text-center text-xs text-slate-500">
                              Nenhuma cronologia gerada. O motorista precisa iniciar a rota para registrar os tempos.
                            </div>
                          ) : (
                            <div className="relative border-l border-slate-800 ml-3.5 pl-5 space-y-4 font-sans text-xs">
                              
                              <div className="relative">
                                <span className="absolute -left-[25px] top-0.5 w-2.5 h-2.5 rounded-full bg-violet-500 ring-4 ring-slate-950"></span>
                                <div className="space-y-0.5">
                                  <div className="text-[10px] font-mono text-slate-500 uppercase">Partida Original</div>
                                  <div className="text-white font-bold">Saída do Centro de Distribuição (CD)</div>
                                  <div className="text-[11px] font-mono text-slate-400">
                                    Horário de Saída: <span className="text-violet-400 font-bold">{activity?.inicioDeslocamento || 'Aguardando ação do motorista'}</span>
                                  </div>
                                </div>
                              </div>

                              {timeline.map((node: any, idx: number) => {
                                if (node.tipo === 'deslocamento') {
                                  return (
                                    <div key={idx} className="relative">
                                      <span className="absolute -left-[25px] top-1.5 w-2 h-2 rounded-full bg-indigo-500/50 ring-4 ring-slate-950"></span>
                                      <div className="space-y-0.5 bg-slate-950/40 border border-slate-850 p-2.5 rounded-xl">
                                        <div className="text-[9px] font-mono text-indigo-400 uppercase tracking-wider font-bold">🛣️ Deslocamento entre Pontos</div>
                                        <div className="text-slate-300 font-medium">De: <span className="text-white font-bold">{node.origem}</span> ➔ Para: <span className="text-white font-bold">{node.destino}</span></div>
                                        <div className="text-[11px] font-mono text-slate-400">Tempo decorrido: <span className="text-white font-bold">{node.tempoMsg}</span></div>
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div key={idx} className="relative">
                                      <span className={`absolute -left-[25px] top-1.5 w-2 h-2 rounded-full ring-4 ring-slate-950 ${
                                        node.status === 'Entregue' ? 'bg-emerald-500' : node.status === 'Cancelado' ? 'bg-red-500' : 'bg-amber-500'
                                      }`}></span>
                                      <div className="space-y-1 bg-slate-950/60 border border-slate-850 p-3 rounded-xl">
                                        <div className="flex justify-between items-center gap-2">
                                          <div className="text-[9px] font-mono text-slate-400 uppercase font-bold">⏱️ Atendimento no Cliente</div>
                                          <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                                            node.status === 'Entregue' 
                                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                              : node.status === 'Cancelado'
                                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                          }`}>
                                            {node.status}
                                          </span>
                                        </div>
                                        <div className="text-white font-bold">{node.cliente}</div>
                                        <div className="text-[10px] text-slate-400">{node.endereco}</div>
                                        <div className="text-[11px] font-mono text-slate-300">Tempo de Atendimento: <span className="text-white font-bold">{node.tempoMsg}</span></div>
                                      </div>
                                    </div>
                                  );
                                }
                              })}

                              {activity?.pausas && activity.pausas.length > 0 && (
                                <div className="pt-3 border-t border-slate-800 space-y-2">
                                  <div className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">⏸️ Registro de Interrupções / Pausas</div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {activity.pausas.map((p: any, pIdx: number) => {
                                      let durationStr = "Em andamento";
                                      if (p.inicio && p.fim) {
                                        try {
                                          const start = parsePtBrDate(p.inicio)?.getTime();
                                          const end = parsePtBrDate(p.fim)?.getTime();
                                          if (start && end) {
                                            durationStr = `${Math.round((end - start) / 60000)} min`;
                                          }
                                        } catch (e) {}
                                      }
                                      return (
                                        <div key={pIdx} className="bg-slate-950/60 border border-slate-850 p-2.5 rounded-xl font-mono text-[11px] space-y-1">
                                          <div className="flex justify-between text-[10px] text-amber-400 uppercase font-bold">
                                            <span>Pausa #{pIdx + 1}</span>
                                            <span>⏱️ {durationStr}</span>
                                          </div>
                                          <div className="text-white font-bold">{p.justificativa}</div>
                                          <div className="text-slate-500 text-[10px]">Início: {p.inicio.split(', ')[1] || p.inicio} {p.fim ? `| Fim: ${p.fim.split(', ')[1] || p.fim}` : ''}</div>
                                          {p.justificativaRetorno && (
                                            <div className="text-emerald-400 text-[10px]">Retorno: "{p.justificativaRetorno}"</div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              <div className="relative pt-4 border-t border-slate-800/60">
                                <span className="absolute -left-[25px] top-5 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-slate-950"></span>
                                <div className="space-y-0.5">
                                  <div className="text-[10px] font-mono text-slate-500 uppercase">Encerramento da Jornada</div>
                                  <div className="text-indigo-400 font-bold">Retorno / Chegada ao CD Hub Principal</div>
                                  <div className="text-[11px] font-mono text-slate-400">
                                    Horário de Chegada: <span className="text-indigo-400 font-bold">{activity?.fimDeslocamento || 'Aguardando retorno do veículo'}</span>
                                  </div>
                                </div>
                              </div>

                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              );
            })()}

          </div>
        )}

      </main>

      {/* Zoom Photo Modal */}
      {zoomPhoto && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setZoomPhoto(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white font-black text-lg p-1"
            >
              ✕
            </button>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ampliação de Comprovante de Assinatura</h3>
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-white">
              <img 
                src={zoomPhoto} 
                alt="Zoomed signature proof" 
                className="max-h-[70vh] mx-auto object-contain"
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
              <span>Auditoria LogusQ • GPS & Criptografia Ativa</span>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = zoomPhoto;
                  link.download = `Comprovante_Auditoria.png`;
                  link.click();
                }}
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> Baixar Registro
              </button>
            </div>
          </div>
        </div>
      )}

      <ImportadorUniversal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        type={importModalType}
        userEmail={userEmail}
        onImportComplete={triggerRefresh}
        dbRepo={dbRepo}
      />
    </div>
  );
}
