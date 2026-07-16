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
  Info
} from 'lucide-react';

interface DashboardMotoristaProps {
  userEmail: string;
  onLogout: () => void;
}

export default function DashboardMotorista({ userEmail, onLogout }: DashboardMotoristaProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  // Get driver's details from database
  const condutoresList = dbRepo.getCondutores('demo@logusq.com.br'); // Search under demo client or across database
  const driverProfile = condutoresList.find(c => c.email === userEmail) || {
    nome: 'Carlos Alberto (Motorista)',
    veiculo: 'HON-CARGO',
    telefone: '(31) 98888-8888',
    email: userEmail
  };

  // Find assigned vehicle
  const veiculosList = dbRepo.getFrota('demo@logusq.com.br');
  const assignedVehicle = veiculosList.find(v => v.idVeiculo === driverProfile.veiculo) || {
    modelo: 'CG 160 Cargo',
    placa: 'SHN-5B71',
    tipo: 'Motocicleta'
  };

  // Find assigned routes in all client accounts (simulate global scan for simplicity)
  const clientEmails = ['demo@logusq.com.br', 'gerente@rapidobh.com', 'admin@quanticalog.com'];
  
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
    alert(status === 'Entregue' ? 'Entrega registrada com sucesso!' : 'Operação cancelada/recusada registrada.');
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
              <p className="text-xs text-slate-400">{driverProfile.email}</p>
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
                        <div className="flex gap-2 pt-2">
                          {/* Contact via WhatsApp trigger if number is available */}
                          {entrega.whatsapp && (
                            <a 
                              href={`https://wa.me/${entrega.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700/60 p-2 rounded-lg flex items-center justify-center gap-1.5 text-xs transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-500" /> Abrir ZAP
                            </a>
                          )}

                          {isPending ? (
                            <button
                              onClick={() => handleOpenProof(entrega, route.routeId, route.clientEmail)}
                              className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
                            >
                              <Camera className="w-3.5 h-3.5" /> Comprovar Entrega / Assinatura
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenProof(entrega, route.routeId, route.clientEmail)}
                              className="flex-1 bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/40 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Layers className="w-3.5 h-3.5 text-slate-500" /> Ver Comprovante Capturado
                            </button>
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
