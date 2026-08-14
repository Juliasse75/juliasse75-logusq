import React from 'react';
import { X, Download, Printer, ShieldCheck, CheckCircle2, FileText, Layers, Truck, Smartphone } from 'lucide-react';
import { generateAuditReportPDF } from '../utils/generateAuditPDF';

interface DossierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DossierModal: React.FC<DossierModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Dossiê Oficial de Auditoria & Especificação Técnica — LOGUSQ
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                  v2.6.4 Enterprise
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Documento de governança, arquitetura técnica e conformidade operacional (Lei nº 13.103/2015 e LGPD).
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => generateAuditReportPDF()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
              title="Baixar arquivo .PDF"
            >
              <Download className="w-4 h-4" /> Baixar PDF
            </button>
            <button
              onClick={() => window.print()}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Imprimir"
            >
              <Printer className="w-4 h-4" /> Imprimir
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 font-sans leading-relaxed">
          
          {/* Box 1: Sumário */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" /> 1. Sumário Executivo & Escopo da Auditoria
            </h3>
            <p className="text-slate-300 leading-normal">
              O ecossistema <strong>LOGUSQ</strong> é uma plataforma SaaS Full-Stack de missão crítica voltada para gestão de fretes, roteirização científica, telemetria de tráfego em tempo real, auditoria de jornada trabalhista e comprovação digital de entregas. Estruturado em três camadas complementares com sincronismo de baixa latência (BroadcastChannel e nuvem): <strong>Painel Master</strong> (Governança & SaaS), <strong>Painel do Gestor</strong> (Torre de Controle) e <strong>Painel do Motorista</strong> (Terminal de Campo).
            </p>
          </div>

          {/* Box 2: Três Camadas */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" /> 2. Arquitetura em 3 Níveis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-violet-500/20">
                <div className="text-violet-400 font-bold text-xs mb-1.5">NÍVEL 1: PAINEL MASTER</div>
                <div className="text-[11px] text-slate-400 mb-2">Governança, SaaS e Multi-Tenancy</div>
                <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
                  <li>Gestão de Tenants (Empresas)</li>
                  <li>Parametrização de Planos SaaS</li>
                  <li>Módulo Financeiro & MRR</li>
                  <li>RH Interno e Níveis de Acesso</li>
                  <li>Trilha Imutável de Auditoria</li>
                </ul>
              </div>

              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-blue-500/20">
                <div className="text-blue-400 font-bold text-xs mb-1.5">NÍVEL 2: PAINEL DO GESTOR</div>
                <div className="text-[11px] text-slate-400 mb-2">Torre de Controle Operacional</div>
                <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
                  <li>Importação (XML NF-e, Excel, OCR)</li>
                  <li>Roteirização TSP e Clusterização</li>
                  <li>Telemetria e Traçado Viário Real</li>
                  <li>Transbordo de Pane em Trânsito</li>
                  <li>Auditoria de Jornada (Lei 13.103)</li>
                </ul>
              </div>

              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-emerald-500/20">
                <div className="text-emerald-400 font-bold text-xs mb-1.5">NÍVEL 3: PAINEL DO MOTORISTA</div>
                <div className="text-[11px] text-slate-400 mb-2">Terminal de Campo Mobile</div>
                <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
                  <li>Manifesto Sequenciado</li>
                  <li>POD Digital (Foto, Assinatura, GPS)</li>
                  <li>Navegação direta Waze / Maps</li>
                  <li>Ponto Digital de Jornada</li>
                  <li>Botão de Pânico / Emergência</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Box 3: Contingência */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-400" /> 3. Protocolos de Emergência e Transbordo de Cargas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2 text-[11px]">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <strong className="text-amber-300 block mb-1">1. Recolher Pendentes ao CD</strong>
                Identifica o veículo mais próximo com capacidade ociosa para coletar a carga no ponto da pane e retornar à base.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <strong className="text-amber-300 block mb-1">2. Redistribuir Cargas</strong>
                Particiona as notas pendentes entre veículos ativos da região e reordena via algoritmo matemático TSP.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <strong className="text-amber-300 block mb-1">3. Direcionar Específico</strong>
                Permite ao gestor alocar um condutor reserva ou de plantão imediatamente para assumir o manifesto.
              </div>
            </div>
          </div>

          {/* Box 4: Checklist Auditoria */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 4. Checklist de Conformidade para Auditoria Externa
            </h3>
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between p-2 rounded bg-slate-900 text-[11px]">
                <span><strong>AUD-01:</strong> Integridade e Trilha Imutável de Auditoria</span>
                <span className="text-emerald-400 font-bold">✓ CONFORME</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900 text-[11px]">
                <span><strong>AUD-02:</strong> Segurança Jurídica e Comprovante Digital (POD)</span>
                <span className="text-emerald-400 font-bold">✓ CONFORME</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900 text-[11px]">
                <span><strong>AUD-03:</strong> Conformidade com a Lei do Motorista (Lei nº 13.103/2015)</span>
                <span className="text-emerald-400 font-bold">✓ CONFORME</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900 text-[11px]">
                <span><strong>AUD-04:</strong> Resiliência e Plano B de Transbordo em Trânsito</span>
                <span className="text-emerald-400 font-bold">✓ CONFORME</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            LogusQ Enterprise Logistics • Documento Oficial de Auditoria Externa
          </span>
          <button
            onClick={() => generateAuditReportPDF()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 shadow cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" /> Baixar Arquivo PDF Completo
          </button>
        </div>

      </div>
    </div>
  );
};
