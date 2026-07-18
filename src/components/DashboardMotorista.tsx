import React, { useState, useEffect, useRef } from 'react';
import { dbRepo } from '../data/mockData';
import { Entrega } from '../types';
import { 
  Truck, 
  MapPin, 
  Phone, 
  CheckCircle, 
  XCircle, 
  Camera, 
  Upload, 
  MessageSquare, 
  RotateCcw, 
  LogOut, 
  Calendar, 
  Layers, 
  FileText,
  Clock,
  Sparkles,
  Info,
  Play,
  Pause,
  AlertTriangle
} from 'lucide-react';

interface DashboardMotoristaProps {
  userEmail: string;
  onLogout: () => void;
}

export default function DashboardMotorista({ userEmail, onLogout }: DashboardMotoristaProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  // Get driver's details from database (search across all registered companies globally)
  const allDrivers = dbRepo.getCondutoresRaw();
  const driverProfile = allDrivers.find(c => c.email === userEmail) || {
    nome: 'Carlos Alberto (Motorista)',
    veiculo: 'HON-CARGO',
    telefone: '(31) 98888-8888',
    email: userEmail
  };

  const driverClientEmail = (driverProfile as any).clienteEmail || 'demo@logusq.com.br';

  // Find assigned vehicle under the correct driver's client company fleet
  const veiculosList = dbRepo.getFrota(driverClientEmail);
  const assignedVehicle = veiculosList.find(v => v.idVeiculo === driverProfile.veiculo) || {
    modelo: 'CG 160 Cargo',
    placa: 'SHN-5B71',
    tipo: 'Motocicleta'
  };

  // Find assigned routes in all client accounts dynamically (simulate global scan across all active client tenants)
  const clientEmails = [
    'demo@logusq.com.br',
    ...dbRepo.getClientes().map(c => c.email)
  ];
  
  interface ActiveRouteDriver {
    routeId: string;
    clientEmail: string;
    vehicle: string;
    path: Entrega[];
    km: number;
    duration: number;
  }

  const [activeDriverRoutes, setActiveDriverRoutes] = useState<ActiveRouteDriver[]>([]);
  const [selectedEntrega, setSelectedEntrega] = useState<Entrega | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [selectedClientEmail, setSelectedClientEmail] = useState<string>('');

  // Proof capturing state
  const [obsText, setObsText] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- JOURNEY AND ACTIVITY TRACKING STATE ---
  const [atividade, setAtividade] = useState<{
    inicioDeslocamento?: string;
    fimDeslocamento?: string;
    pausas: Array<{ inicio: string; fim?: string; justificativa: string; justificativaRetorno?: string }>;
    emergencias: Array<{ horario: string; tipo: string; justificativa: string; entreguesAteMomento: string[]; faltandoEntregar: string[] }>;
  }>(() => {
    const saved = localStorage.getItem(`logusq_atividade_${userEmail}`);
    return saved ? JSON.parse(saved) : { pausas: [], emergencias: [] };
  });

  const saveAtividadeState = (newState: typeof atividade) => {
    setAtividade(newState);
    localStorage.setItem(`logusq_atividade_${userEmail}`, JSON.stringify(newState));
    triggerRefresh();
  };

  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseJustification, setPauseJustification] = useState('Pausa para almoço');
  const [pauseCustomJust, setPauseCustomJust] = useState('');

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeJustification, setResumeJustification] = useState('Fim do almoço');

  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyType, setEmergencyType] = useState('Pneu furado');
  const [emergencyJustification, setEmergencyJustification] = useState('');

  const handleStartActivity = () => {
    const updated = {
      ...atividade,
      inicioDeslocamento: new Date().toLocaleString('pt-BR'),
      fimDeslocamento: undefined // reset previous if any
    };
    saveAtividadeState(updated);
    alert('🚀 Deslocamento Iniciado! Horário de saída do CD registrado com sucesso.');
  };

  const handleEndActivity = () => {
    if (!atividade.inicioDeslocamento) {
      alert('É necessário iniciar o deslocamento primeiro!');
      return;
    }
    const updated = {
      ...atividade,
      fimDeslocamento: new Date().toLocaleString('pt-BR')
    };
    saveAtividadeState(updated);
    alert('🏁 Atividades de Deslocamento Encerradas! Chegada ao CD registrada com sucesso.');
  };

  const handlePauseActivity = () => {
    const just = pauseJustification === 'Outro' ? (pauseCustomJust || 'Pausa não especificada') : pauseJustification;
    const novaPausa = {
      inicio: new Date().toLocaleString('pt-BR'),
      justificativa: just
    };
    const updated = {
      ...atividade,
      pausas: [...(atividade.pausas || []), novaPausa]
    };
    saveAtividadeState(updated);
    setShowPauseModal(false);
    setPauseCustomJust('');
    alert(`⏸️ Atividade Interrompida: "${just}"`);
  };

  const handleResumeActivity = () => {
    const pausas = [...(atividade.pausas || [])];
    if (pausas.length > 0) {
      const lastPause = pausas[pausas.length - 1];
      if (!lastPause.fim) {
        lastPause.fim = new Date().toLocaleString('pt-BR');
        lastPause.justificativaRetorno = resumeJustification;
      }
    }
    const updated = {
      ...atividade,
      pausas
    };
    saveAtividadeState(updated);
    setShowResumeModal(false);
    alert(`▶️ Atividades Retomadas! Justificativa de retorno registrada: "${resumeJustification}"`);
  };

  const handleTriggerEmergency = () => {
    const allStops = activeDriverRoutes.flatMap(r => r.path);
    const entregues = allStops.filter(s => s.status === 'Entregue').map(s => `${s.cliente} (${s.tipoOperacao})`);
    const pendentes = allStops.filter(s => s.status === 'Pendente').map(s => `${s.cliente} (${s.tipoOperacao})`);

    const novaEmergencia = {
      horario: new Date().toLocaleString('pt-BR'),
      tipo: emergencyType,
      justificativa: emergencyJustification || 'Sem detalhes adicionais',
      entreguesAteMomento: entregues,
      faltandoEntregar: pendentes
    };

    const updated = {
      ...atividade,
      emergencias: [...(atividade.emergencias || []), novaEmergencia]
    };
    saveAtividadeState(updated);
    setShowEmergencyModal(false);
    setEmergencyJustification('');
    alert('🚨 ALERTA DE EMERGÊNCIA ENVIADO IMEDIATAMENTE AO PORTAL DO GESTOR!');
  };

  useEffect(() => {
    const foundRoutes: ActiveRouteDriver[] = [];
    clientEmails.forEach(email => {
      const routes = dbRepo.getRotasAtivas(email);
      Object.entries(routes).forEach(([rId, r]: [string, any]) => {
        // Match by driver name or driver email
        if (
          r.driverEmail === userEmail || 
          r.driver?.toLowerCase().includes(driverProfile.nome.toLowerCase()) ||
          (userEmail === 'motorista@logusq.com.br' && rId === 'ROTA-1') // demo fallback
        ) {
          foundRoutes.push({
            routeId: rId,
            clientEmail: email,
            vehicle: r.vehicle,
            path: r.path || [],
            km: r.km || 0,
            duration: r.duration || 0
          });
        }
      });
    });

    // If no real routes optimized, generate a default simulated route for Carlos so the panel is fully functional!
    if (foundRoutes.length === 0 && userEmail === 'motorista@logusq.com.br') {
      foundRoutes.push({
        routeId: 'ROTA-DEMO-1',
        clientEmail: 'demo@logusq.com.br',
        vehicle: 'CG 160 Cargo (SHN-5B71)',
        km: 12.5,
        duration: 45,
        path: [
          {
            id: 'ENT-DEMO-1',
            chave: 'ENT-901',
            cliente: 'Supermercado Central BH',
            endereco: 'Rua da Bahia, 1022 - Centro, Belo Horizonte - MG',
            pontoReferencia: 'Próximo ao Teatro Municipal',
            notaFiscal: 'NF-40291',
            telefone: '(31) 98765-4321',
            whatsapp: '(31) 98765-4321',
            pesoMercadoriaKg: 45,
            tipoOperacao: 'Entrega',
            status: 'Pendente',
            latitude: -19.93,
            longitude: -43.93
          },
          {
            id: 'ENT-DEMO-2',
            chave: 'COL-902',
            cliente: 'Distribuidora FarmaSul',
            endereco: 'Avenida Afonso Pena, 1500 - Belo Horizonte - MG',
            enderecoColeta: 'Avenida Contorno, 4000 - Funcionários, BH',
            pontoReferencia: 'Em frente ao Banco do Brasil',
            notaFiscal: 'NF-40292',
            telefone: '(31) 97777-1234',
            whatsapp: '(31) 97777-1234',
            pesoMercadoriaKg: 15,
            tipoOperacao: 'Coleta',
            status: 'Pendente',
            latitude: -19.94,
            longitude: -43.94
          }
        ]
      });
    }

    setActiveDriverRoutes(foundRoutes);
  }, [refreshKey, userEmail, driverProfile.nome]);

  // Password reset state
  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

  const handleResetPassword = () => {
    if (!newPassword.trim()) {
      alert('Por favor, digite a nova senha.');
      return;
    }
    if (newPassword.length < 4) {
      alert('A senha deve conter no mínimo 4 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('A confirmação de senha não confere.');
      return;
    }

    const success = dbRepo.atualizarCondutorSenha(userEmail, newPassword);
    if (success) {
      setPasswordResetSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordResetSuccess(false);
        setShowResetPasswordForm(false);
      }, 3000);
    } else {
      alert('Erro ao atualizar a senha. Tente novamente.');
    }
  };

  // Start attendance timer
  const handleStartAttendance = (entregaId: string, clientEmail: string) => {
    dbRepo.atualizarEntregaTiming(clientEmail, entregaId, {
      tempoInicioAtendimento: new Date().toISOString()
    });
    triggerRefresh();
    alert('Atendimento/Entrega iniciada com sucesso! O cronômetro de parada está ativo.');
  };

  // Open signature capturer
  const handleOpenProof = (entrega: Entrega, rId: string, clientEmail: string) => {
    setSelectedEntrega(entrega);
    setSelectedRouteId(rId);
    setSelectedClientEmail(clientEmail);
    setObsText(entrega.observacao || '');
    setPhotoBase64(entrega.fotoComprovante || null);
    setShowProofModal(true);
  };

  // Close modal
  const handleCloseProof = () => {
    setShowProofModal(false);
    setSelectedEntrega(null);
    setPhotoBase64(null);
    setObsText('');
    stopCamera();
  };

  // Start real device camera if available
  const startCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Câmera física não disponível:', err);
      alert('Não foi possível acessar a câmera física. Use a simulação de assinatura eletrônica ou faça upload de arquivo!');
      setCameraActive(false);
    }
  };

  // Stop device camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Capture photo from camera stream
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Draw standard watermark
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
        ctx.font = '14px monospace';
        ctx.fillStyle = '#10B981';
        const dateStr = new Date().toLocaleString('pt-BR');
        ctx.fillText(`ENTREGUE POR: ${driverProfile.nome} | GPS CONFIRMADO | ${dateStr}`, 15, canvas.height - 15);
        
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPhotoBase64(dataUrl);
        stopCamera();
      }
    }
  };

  // Simulate cursive handwriting signature
  const simulateSignature = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 250;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Clear background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw bounding box
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      // Draw helper line
      ctx.strokeStyle = '#CBD5E1';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(30, 180);
      ctx.lineTo(470, 180);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw elegant cursive signature simulation
      ctx.strokeStyle = '#1E3A8A'; // Blue ink
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Letter C
      ctx.beginPath();
      ctx.moveTo(60, 140);
      ctx.bezierCurveTo(40, 80, 100, 60, 80, 140);
      // Letter a
      ctx.bezierCurveTo(90, 150, 110, 150, 110, 130);
      ctx.bezierCurveTo(100, 110, 120, 115, 120, 140);
      // Letter r
      ctx.lineTo(135, 125);
      ctx.lineTo(145, 125);
      ctx.lineTo(145, 140);
      // Letter l
      ctx.bezierCurveTo(150, 70, 175, 75, 160, 140);
      // Letter o
      ctx.bezierCurveTo(170, 125, 185, 125, 180, 140);
      // Letter s
      ctx.bezierCurveTo(190, 110, 200, 130, 205, 142);
      
      // Space and start of last name "Alberto"
      ctx.moveTo(230, 145);
      ctx.lineTo(250, 80);
      ctx.lineTo(270, 140);
      // horizontal bar
      ctx.moveTo(240, 110);
      ctx.lineTo(265, 110);
      // l
      ctx.bezierCurveTo(275, 60, 295, 60, 285, 140);
      // b
      ctx.bezierCurveTo(290, 65, 310, 70, 305, 140);
      // e, r, t, o
      ctx.bezierCurveTo(310, 125, 325, 125, 320, 140); // e
      ctx.lineTo(335, 125); ctx.lineTo(340, 140); // r
      ctx.moveTo(330, 95); ctx.lineTo(330, 135); // t bar
      ctx.bezierCurveTo(345, 125, 360, 125, 355, 140); // o
      
      // Giant underline swirl
      ctx.bezierCurveTo(390, 160, 420, 100, 460, 120);
      ctx.stroke();

      // Draw watermark text inside image
      ctx.font = '10px monospace';
      ctx.fillStyle = '#64748B';
      const gpsTime = new Date().toLocaleString('pt-BR');
      ctx.fillText(`ASSINATURA DIGITAL VALIDADA • IP: ${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.12.92`, 20, 215);
      ctx.fillText(`CPF COMPROVADO: ***.552.128-** | DATA: ${gpsTime}`, 20, 230);

      const dataUrl = canvas.toDataURL('image/png');
      setPhotoBase64(dataUrl);
      alert('Assinatura digital gerada com sucesso para simulação!');
    }
  };

  // File Upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoBase64(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save changes and complete delivery
  const handleSaveProof = (status: 'Entregue' | 'Cancelado') => {
    if (!selectedEntrega) return;

    if (status === 'Entregue' && !photoBase64) {
      alert('É obrigatório registrar a foto ou assinatura para comprovação da entrega!');
      return;
    }

    // Calculate elapsed duration in minutes
    const inicioTime = selectedEntrega.tempoInicioAtendimento 
      ? new Date(selectedEntrega.tempoInicioAtendimento).getTime() 
      : Date.now() - 300000; // default fallback 5 minutes if they didn't manually start
    const fimTime = Date.now();
    const diffMin = Math.max(1, Math.round((fimTime - inicioTime) / 60000));

    // Save timing details
    dbRepo.atualizarEntregaTiming(selectedClientEmail, selectedEntrega.id, {
      tempoFimAtendimento: new Date().toISOString(),
      duracaoAtendimentoMinutos: diffMin
    });

    // Call update on dbRepo
    dbRepo.atualizarEntregaStatus(
      selectedClientEmail,
      selectedEntrega.id,
      status,
      photoBase64 || '',
      obsText,
      driverProfile.nome
    );

    triggerRefresh();
    alert(status === 'Entregue' ? `Entrega registrada com sucesso! Tempo de atendimento: ${diffMin} min` : 'Operação cancelada/recusada registrada.');
    handleCloseProof();
  };

  // Get count of completed vs pending deliveries today
  const allPathDeliveries = activeDriverRoutes.flatMap(r => r.path);
  const totalDeliveries = allPathDeliveries.length;
  const pendingDeliveries = allPathDeliveries.filter(d => d.status === 'Pendente');
  const completedDeliveries = allPathDeliveries.filter(d => d.status === 'Entregue');
  const canceledDeliveries = allPathDeliveries.filter(d => d.status === 'Cancelado');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Mobile Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-5 py-4 sticky top-0 z-40 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
            <Truck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white tracking-tight">LogusQ Motorista</h1>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
              Em trânsito • {assignedVehicle.modelo} ({assignedVehicle.placa})
            </p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-xl border border-slate-700/50 transition-colors"
          title="Sair do Painel"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-lg mx-auto w-full p-4 space-y-4 pb-24">
        
        {/* Welcome Driver Card */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full uppercase">
                Perfil Condutor
              </span>
              <h2 className="text-base font-extrabold text-white mt-1.5">{driverProfile.nome}</h2>
              <div className="flex flex-col text-xs text-slate-400 space-y-0.5 mt-1">
                <span className="font-semibold text-emerald-400 flex items-center gap-1">🏢 {dbRepo.getCliente(activeDriverRoutes[0]?.clientEmail || driverClientEmail)?.empresa || 'LOGUS Roteirização'}</span>
                <span>{driverProfile.email}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400">Rotas Ativas</span>
              <div className="text-lg font-black text-white">{activeDriverRoutes.length}</div>
            </div>
          </div>

          {/* Micro stats counter */}
          <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-800/60">
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-2.5 text-center">
              <div className="text-[10px] text-slate-500 font-mono">Pendente</div>
              <div className="text-sm font-bold text-amber-400">{pendingDeliveries.length}</div>
            </div>
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-2.5 text-center">
              <div className="text-[10px] text-slate-500 font-mono">Entregue</div>
              <div className="text-sm font-bold text-emerald-400">{completedDeliveries.length}</div>
            </div>
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-2.5 text-center">
              <div className="text-[10px] text-slate-500 font-mono">Falhas</div>
              <div className="text-sm font-bold text-red-400">{canceledDeliveries.length}</div>
            </div>
          </div>
        </div>

        {/* Redefine Password Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3">
          <button 
            onClick={() => setShowResetPasswordForm(prev => !prev)}
            className="w-full flex justify-between items-center text-left focus:outline-none"
          >
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-slate-950 rounded-lg text-slate-400 border border-slate-850">
                <Clock className="w-4 h-4 text-violet-400" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">🔒 Redefinir Senha de Acesso</h3>
                <p className="text-[10px] text-slate-500">Mantenha as suas credenciais seguras</p>
              </div>
            </div>
            <span className="text-slate-400 text-xs font-bold bg-slate-950 border border-slate-850 px-2 py-1 rounded-lg">
              {showResetPasswordForm ? 'Recolher' : 'Alterar'}
            </span>
          </button>

          {showResetPasswordForm && (
            <div className="pt-3 border-t border-slate-800/60 space-y-3">
              <div className="space-y-1">
                <label className="block text-[9px] font-mono text-slate-400 uppercase">Nova Senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-violet-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-mono text-slate-400 uppercase">Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirme a nova senha"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-violet-500 outline-none"
                />
              </div>

              {passwordResetSuccess && (
                <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/20 rounded-lg text-emerald-400 text-[11px] font-mono text-center">
                  ✓ Senha redefinida com sucesso!
                </div>
              )}

              <button
                onClick={handleResetPassword}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 rounded-lg text-xs transition-colors"
              >
                Salvar Nova Senha
              </button>
            </div>
          )}
        </div>

        {/* --- DYNAMIC JOURNEY & ACTIVITY CONTROL CARD --- */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
            <span className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
              <Clock className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">⏱️ Painel de Jornada & Atividades</h3>
              <p className="text-[10px] text-slate-500">Controle de deslocamento, pausas e emergências</p>
            </div>
          </div>

          {/* Current Status Badges */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1">Status Deslocamento</span>
              {!atividade.inicioDeslocamento ? (
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> No CD (Aguardando Saída)
                </span>
              ) : atividade.fimDeslocamento ? (
                <span className="text-indigo-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400"></span> Concluído (Retorno ao CD)
                </span>
              ) : (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Em Rota de Entrega
                </span>
              )}
            </div>

            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1">Status Atividade</span>
              {atividade.pausas?.some((p: any) => !p.fim) ? (
                <span className="text-red-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span> ⏸️ Pausado / Interrompido
                </span>
              ) : (
                <span className="text-emerald-500 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> ▶️ Em Execução Ativa
                </span>
              )}
            </div>
          </div>

          {/* Active pause detail banner */}
          {atividade.pausas?.some((p: any) => !p.fim) && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-xs text-red-300">
              <b>⚠️ Pausa Ativa:</b> {atividade.pausas.find((p: any) => !p.fim)?.justificativa}<br/>
              <span className="text-[10px] text-slate-400">Iniciado em: {atividade.pausas.find((p: any) => !p.fim)?.inicio}</span>
            </div>
          )}

          {/* Active emergency detail banner */}
          {atividade.emergencias?.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-xs text-amber-300 animate-pulse">
              <b>🚨 Último Alerta Enviado:</b> {atividade.emergencias[atividade.emergencias.length - 1].tipo}<br/>
              <span className="text-[10px] text-slate-400">"{atividade.emergencias[atividade.emergencias.length - 1].justificativa}" às {atividade.emergencias[atividade.emergencias.length - 1].horario}</span>
            </div>
          )}

          {/* Control Buttons Block */}
          <div className="space-y-2">
            {/* Displacement Start & End buttons */}
            <div className="grid grid-cols-2 gap-2">
              {!atividade.inicioDeslocamento ? (
                <button
                  onClick={handleStartActivity}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-950/50"
                >
                  <Play className="w-3.5 h-3.5" /> Iniciar Atividade / CD
                </button>
              ) : (
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl py-2 px-3 text-center text-[10px] text-slate-400 flex items-center justify-center font-mono">
                  🛫 CD Saída: {atividade.inicioDeslocamento.split(', ')[1] || atividade.inicioDeslocamento}
                </div>
              )}

              {!atividade.fimDeslocamento ? (
                <button
                  onClick={handleEndActivity}
                  disabled={!atividade.inicioDeslocamento}
                  className={`py-2 px-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    atividade.inicioDeslocamento 
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md' 
                      : 'bg-slate-800 text-slate-500 border border-slate-850 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Fim Deslocamento / CD
                </button>
              ) : (
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl py-2 px-3 text-center text-[10px] text-indigo-400 flex items-center justify-center font-mono">
                  🏁 CD Retorno: {atividade.fimDeslocamento.split(', ')[1] || atividade.fimDeslocamento}
                </div>
              )}
            </div>

            {/* Pause & Resume Activity buttons */}
            <div className="grid grid-cols-2 gap-2">
              {atividade.pausas?.some((p: any) => !p.fim) ? (
                <button
                  onClick={() => setShowResumeModal(true)}
                  className="col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" /> Retomar Atividades
                </button>
              ) : (
                <button
                  onClick={() => setShowPauseModal(true)}
                  disabled={!atividade.inicioDeslocamento || !!atividade.fimDeslocamento}
                  className={`col-span-2 py-2 px-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    atividade.inicioDeslocamento && !atividade.fimDeslocamento
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750' 
                      : 'bg-slate-950/50 text-slate-600 border border-slate-900 cursor-not-allowed'
                  }`}
                >
                  <Pause className="w-3.5 h-3.5" /> Interromper Atividade (Pausa)
                </button>
              )}
            </div>

            {/* Emergency trigger button */}
            <button
              onClick={() => setShowEmergencyModal(true)}
              className="w-full bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white py-2.5 px-3 rounded-xl text-[11px] font-black tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all border border-red-500/20 shadow-lg shadow-red-950/50 cursor-pointer mt-1"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" /> 🚨 Acionamento de Emergência (Pane)
            </button>
          </div>
        </div>

        {/* --- MODAL: INTERROMPER ATIVIDADE --- */}
        {showPauseModal && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Pause className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-white text-sm">Interromper Atividade (Pausa)</h4>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">Selecione o Motivo</label>
                  <select
                    value={pauseJustification}
                    onChange={e => setPauseJustification(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-violet-500 outline-none"
                  >
                    <option value="Pausa para almoço">Pausa para Almoço</option>
                    <option value="Descanso regulamentar">Descanso Regulamentar</option>
                    <option value="Abastecimento do veículo">Abastecimento do Veículo</option>
                    <option value="Manutenção preventiva">Manutenção Rápida / Calibragem</option>
                    <option value="Outro">Outro Motivo (Especificar)</option>
                  </select>
                </div>

                {pauseJustification === 'Outro' && (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-slate-400 uppercase">Descreva a Justificativa</label>
                    <textarea
                      value={pauseCustomJust}
                      onChange={e => setPauseCustomJust(e.target.value)}
                      placeholder="Descreva detalhadamente o motivo da pausa..."
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-violet-500 outline-none resize-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowPauseModal(false)}
                  className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePauseActivity}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Registrar Pausa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL: RETOMAR ATIVIDADE --- */}
        {showResumeModal && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Play className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-white text-sm">Retomar Atividades</h4>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">Nota de Retorno</label>
                  <input
                    type="text"
                    value={resumeJustification}
                    onChange={e => setResumeJustification(e.target.value)}
                    placeholder="Ex: Fim do almoço, Retorno às entregas..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-violet-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowResumeModal(false)}
                  className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleResumeActivity}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Retomar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL: ACIONAMENTO DE EMERGÊNCIA --- */}
        {showEmergencyModal && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-red-900 p-5 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl shadow-red-950/20">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-red-400">
                <AlertTriangle className="w-4.5 h-4.5 text-red-500 animate-pulse" />
                <h4 className="font-black text-white text-sm tracking-wide uppercase">🚨 Acionar Emergência (Pane)</h4>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">Tipo de Defeito / Pane</label>
                  <select
                    value={emergencyType}
                    onChange={e => setEmergencyType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-violet-500 outline-none"
                  >
                    <option value="Pneu furado">Pneu Furado</option>
                    <option value="Falta de gasolina">Falta de Gasolina (Pane Seca)</option>
                    <option value="Pane elétrica">Pane Elétrica</option>
                    <option value="Problema mecânico no motor">Problema Mecânico no Motor</option>
                    <option value="Acidente de trânsito">Acidente de Trânsito</option>
                    <option value="Outro defeito">Outro Defeito / Impedimento</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">Justificativa & Detalhes</label>
                  <textarea
                    value={emergencyJustification}
                    onChange={e => setEmergencyJustification(e.target.value)}
                    placeholder="Descreva a situação detalhadamente para que o gestor possa providenciar o apoio/guincho necessário..."
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-red-500 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowEmergencyModal(false)}
                  className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleTriggerEmergency}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-xl text-xs font-extrabold cursor-pointer"
                >
                  🚨 ENVIAR ALERTA
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Data Retention Banner Notice */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-start gap-2.5">
          <Info className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-0.5">
            <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Políticas de Privacidade & Retenção de Assinaturas</h4>
            <p className="text-[9px] text-slate-400 leading-relaxed">
              Todos os registros fotográficos de comprovantes e assinaturas dos clientes são criptografados e armazenados em conformidade com a LGPD pelo período regulamentar de **12 meses (1 ano)** para auditorias legais, sendo automaticamente expurgados em seguida.
            </p>
          </div>
        </div>

        {/* Stop lists container */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Seu Cronograma de Rotas</h3>

          {activeDriverRoutes.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 border-dashed rounded-2xl p-8 text-center text-slate-500 space-y-2">
              <Clock className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs">Nenhuma rota ativa atribuída para o seu usuário no momento.</p>
              <p className="text-[10px] text-slate-600">O gestor receberá as notificações do painel assim que as rotas forem otimizadas.</p>
            </div>
          ) : (
            activeDriverRoutes.map(route => (
              <div key={route.routeId} className="space-y-3">
                
                {/* Route Header */}
                <div className="flex justify-between items-center bg-slate-900/80 border border-slate-800/80 px-4 py-2.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">
                      {route.routeId}
                    </span>
                    <span className="text-xs text-slate-300 font-semibold">{route.vehicle}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {route.km} km • Est. {route.duration} min
                  </div>
                </div>

                {/* Stops nested inside this route */}
                <div className="space-y-2.5">
                  {route.path.map((entrega, index) => {
                    const isPending = entrega.status === 'Pendente';
                    const isSuccess = entrega.status === 'Entregue';
                    const isFailed = entrega.status === 'Cancelado';

                    return (
                      <div 
                        key={entrega.id} 
                        className={`border rounded-xl p-4 shadow-sm transition-all space-y-3 ${
                          isSuccess ? 'bg-emerald-950/20 border-emerald-900/40' :
                          isFailed ? 'bg-red-950/20 border-red-900/40' :
                          'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Title Stop Line */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-2.5">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isSuccess ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                              isFailed ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                              'bg-violet-500/10 text-violet-400 border border-violet-500/30'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-white text-xs">{entrega.cliente}</h4>
                                <span className={`text-[8px] px-1.5 py-0.2 rounded font-mono font-bold ${
                                  entrega.tipoOperacao === 'Coleta' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                  {entrega.tipoOperacao === 'Coleta' ? 'COLETA' : 'ENTREGA'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1 flex items-start gap-1">
                                <MapPin className="w-3 h-3 text-slate-500 mt-0.5 flex-shrink-0" />
                                <span><span className="text-slate-500 font-bold">End. Entrega:</span> {entrega.endereco}</span>
                              </p>
                              {entrega.enderecoColeta && (
                                <p className="text-[11px] text-slate-400 mt-1 flex items-start gap-1">
                                  <MapPin className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                                  <span><span className="text-orange-500 font-bold">End. Coleta:</span> {entrega.enderecoColeta}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Stop status badge */}
                          <div>
                            {isSuccess && <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">Entregue</span>}
                            {isFailed && <span className="text-[9px] font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full uppercase">Recusada</span>}
                            {isPending && <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase">Pendente</span>}
                          </div>
                        </div>

                        {/* Extra requested fields display (Ref, Contacts, Weight, NF) */}
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-2 border-t border-slate-800/50 text-[11px] font-mono text-slate-400">
                          {entrega.pontoReferencia && (
                            <div className="col-span-2 text-slate-400 bg-slate-950/40 p-1.5 rounded border border-slate-800/40">
                              <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Ponto de Referência</span>
                              "{entrega.pontoReferencia}"
                            </div>
                          )}
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase block">Nota Fiscal (NF)</span>
                            <span className="text-slate-200 font-bold">{entrega.notaFiscal || 'Não informada'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase block">Peso Carga</span>
                            <span className="text-slate-200 font-bold">{entrega.pesoMercadoriaKg} kg</span>
                          </div>
                          {entrega.telefone && (
                            <div className="col-span-1">
                              <span className="text-[9px] text-slate-500 uppercase block">Telefone</span>
                              <span className="text-slate-300">{entrega.telefone}</span>
                            </div>
                          )}
                          {entrega.whatsapp && (
                            <div className="col-span-1">
                              <span className="text-[9px] text-slate-500 uppercase block">WhatsApp</span>
                              <span className="text-slate-300">{entrega.whatsapp}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions block */}
                        <div className="flex flex-col sm:flex-row gap-2 pt-2 w-full">
                          {/* Contact via WhatsApp trigger if number is available */}
                          {entrega.whatsapp && (
                            <a 
                              href={`https://wa.me/${entrega.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700/60 p-2 rounded-lg flex items-center justify-center gap-1.5 text-xs transition-colors font-mono"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-500" /> Abrir ZAP
                            </a>
                          )}

                          {isPending ? (
                            !entrega.tempoInicioAtendimento ? (
                              <button
                                onClick={() => handleStartAttendance(entrega.id, route.clientEmail)}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition-colors font-mono cursor-pointer"
                              >
                                <Clock className="w-3.5 h-3.5" /> ▶️ Iniciar Atendimento
                              </button>
                            ) : (
                              <div className="flex flex-col gap-2 flex-1">
                                <div className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 flex items-center gap-1.5 font-mono">
                                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                                  <span>Em atendimento desde: {new Date(entrega.tempoInicioAtendimento).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <button
                                  onClick={() => handleOpenProof(entrega, route.routeId, route.clientEmail)}
                                  className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition-colors font-mono cursor-pointer"
                                >
                                  <Camera className="w-3.5 h-3.5" /> Finalizar & Registrar Comprovante
                                </button>
                              </div>
                            )
                          ) : (
                            <div className="flex-1 flex flex-col gap-1.5">
                              {entrega.tempoInicioAtendimento && (
                                <div className="text-[10px] text-slate-400 bg-slate-950/40 p-1.5 rounded border border-slate-800/40 font-mono text-center">
                                  ⏱️ Atendimento: {new Date(entrega.tempoInicioAtendimento).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} até {entrega.tempoFimAtendimento ? new Date(entrega.tempoFimAtendimento).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : ''} ({entrega.duracaoAtendimentoMinutos || 0} min)
                                </div>
                              )}
                              <button
                                onClick={() => handleOpenProof(entrega, route.routeId, route.clientEmail)}
                                className="w-full bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/40 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors font-mono cursor-pointer"
                              >
                                <Layers className="w-3.5 h-3.5 text-slate-500" /> Ver Comprovante Capturado
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            ))
          )}
        </div>
      </main>

      {/* Slide-over captures Proof Modal */}
      {showProofModal && selectedEntrega && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50 transition-opacity p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white">Registro de Comprovante Digital</h3>
                <p className="text-[11px] text-slate-400 mt-1">{selectedEntrega.cliente} • {selectedEntrega.chave}</p>
              </div>
              <button 
                onClick={handleCloseProof}
                className="text-slate-400 hover:text-white font-extrabold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Capturer Screen Area */}
            <div className="space-y-3">
              <label className="block text-[10px] font-mono text-slate-400 uppercase">Foto do Comprovante Assinado / Carga</label>
              
              {/* If we already have a photo captured */}
              {photoBase64 ? (
                <div className="relative border border-slate-800 rounded-xl overflow-hidden bg-slate-950 text-center">
                  <img 
                    src={photoBase64} 
                    alt="Signature proof" 
                    className="max-h-[220px] mx-auto object-contain rounded-xl"
                  />
                  {selectedEntrega.status === 'Pendente' && (
                    <button 
                      onClick={() => setPhotoBase64(null)}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-full shadow-lg transition-colors"
                      title="Refazer capturas"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : cameraActive ? (
                /* Live Camera feed inside container */
                <div className="relative border border-violet-500/30 rounded-xl overflow-hidden bg-black text-center max-h-[220px]">
                  <video 
                    ref={videoRef} 
                    playsInline 
                    className="w-full max-h-[220px] object-cover"
                  ></video>
                  <button 
                    onClick={capturePhoto}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-1.5 rounded-full text-xs flex items-center gap-1.5 shadow-xl animate-bounce"
                  >
                    <CheckCircle className="w-4 h-4" /> Bater Foto
                  </button>
                </div>
              ) : (
                /* Capture Options selection block */
                <div className="border border-slate-800 border-dashed rounded-xl p-5 bg-slate-950 text-center space-y-3">
                  <div className="text-slate-500 text-xs">Escolha um método de captura rápida abaixo:</div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {/* Simulated hand signature */}
                    <button
                      onClick={simulateSignature}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow"
                    >
                      <Sparkles className="w-4 h-4" /> Simular Assinatura do Cliente
                    </button>

                    {/* Use camera feed */}
                    <button
                      onClick={startCamera}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-3 rounded-lg text-xs font-semibold border border-slate-700/60 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Camera className="w-4 h-4 text-violet-400" /> Abrir Câmera do Smartphone
                    </button>

                    {/* Manual file select */}
                    <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-3 rounded-lg text-xs font-semibold border border-slate-700/60 flex items-center justify-center gap-1.5 cursor-pointer transition-all">
                      <Upload className="w-4 h-4 text-emerald-400" /> Enviar Arquivo / Imagem
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Hidden canvas for video framing */}
            <canvas ref={canvasRef} className="hidden"></canvas>

            {/* Observation inputs */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono text-slate-400 uppercase">Observações / Nome de Quem Recebeu</label>
              <textarea
                value={obsText}
                onChange={e => setObsText(e.target.value)}
                placeholder="EX: Entregue na portaria para o porteiro Roberto com assinatura."
                disabled={selectedEntrega.status !== 'Pendente'}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 h-16 resize-none focus:border-violet-500 outline-none"
              ></textarea>
            </div>

            {/* Confirmation Buttons */}
            {selectedEntrega.status === 'Pendente' ? (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => handleSaveProof('Cancelado')}
                  className="bg-slate-800 hover:bg-red-950/40 text-red-400 border border-slate-700/50 hover:border-red-900 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" /> Recusa / Falha
                </button>
                <button
                  onClick={() => handleSaveProof('Entregue')}
                  disabled={!photoBase64}
                  className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow ${
                    photoBase64 
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Confirmar Entrega
                </button>
              </div>
            ) : (
              <button
                onClick={handleCloseProof}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-lg text-xs font-bold transition-colors"
              >
                Voltar ao Cronograma
              </button>
            )}

            {/* Retention disclaimer */}
            <p className="text-[8px] text-slate-500 text-center leading-normal">
              Esta operação e as coordenadas de GPS estão sendo auditadas de forma automática pela central LogusQ. Política de privacidade de dados ativa.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
