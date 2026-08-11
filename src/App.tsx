import React, { useState } from 'react';
import { dbRepo } from './data/mockData';
import LoginCadastro from './components/LoginCadastro';
import DashboardMaster from './components/DashboardMaster';
import DashboardCliente from './components/DashboardCliente';
import DashboardMotorista from './components/DashboardMotorista';

export default function App() {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    // Check if user session exists in localStorage
    return localStorage.getItem('logusq_session_email');
  });
  const [dbMode, setDbMode] = useState<'offline' | 'supabase'>('offline');

  const handleLoginSuccess = (email: string) => {
    localStorage.setItem('logusq_session_email', email);
    setCurrentUserEmail(email);
  };

  const handleLogout = () => {
    localStorage.removeItem('logusq_session_email');
    localStorage.removeItem('logusq_logged_user');
    setCurrentUserEmail(null);
  };

  // Pull latest data from Supabase to client local cache with automatic polling and real-time broadcast
  React.useEffect(() => {
    if (!currentUserEmail) return;

    let syncChannel: BroadcastChannel | null = null;
    try {
      syncChannel = new BroadcastChannel('logusq_sync_channel');
      syncChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'SYNC_UPDATE') {
          console.log('⚡ REALTIME: Broadcast update received across tabs/windows:', event.data);
          window.dispatchEvent(new Event('logusq_sync_complete'));
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported in this browser, falling back to storage & polling.');
    }

    const performSyncPull = () => {
      const user = dbRepo.getUsuario(currentUserEmail);
      if (!user) return;

      fetch(`/api/sync/pull?email=${encodeURIComponent(currentUserEmail)}&perfil=${user.perfil}&nivelAcesso=${encodeURIComponent(user.nivelAcesso || '')}`)
        .then(res => res.json())
        .then(resData => {
          if (resData.success && resData.mode === 'supabase' && resData.data) {
            setDbMode('supabase');
            const d = resData.data;
            if (d.usuarios && d.usuarios.length > 0) {
              localStorage.setItem('logusq_usuarios', JSON.stringify(d.usuarios));
              const loggedUserRecord = d.usuarios.find((u: any) => (u.email || '').toLowerCase().trim() === currentUserEmail.toLowerCase().trim());
              if (loggedUserRecord) {
                localStorage.setItem('logusq_logged_user', JSON.stringify({
                  email: loggedUserRecord.email,
                  nome: loggedUserRecord.nome,
                  perfil: loggedUserRecord.perfil,
                  empresa: loggedUserRecord.empresa,
                  veiculo: loggedUserRecord.veiculo,
                  nivelAcesso: String(loggedUserRecord.nivel_acesso || loggedUserRecord.nivelAcesso || 'TOTAL').toUpperCase(),
                  criadoEm: loggedUserRecord.criado_em || loggedUserRecord.criadoEm
                }));
              }
            }
            if (d.clientes && d.clientes.length > 0) localStorage.setItem('logusq_clientes', JSON.stringify(d.clientes));
            
            // Hydrate veiculos safely
            if (Array.isArray(d.veiculos)) {
              const currentLocalVehicles = dbRepo.getVeiculos();
              const cleanUserEmail = currentUserEmail.toLowerCase().trim();
              const isMasterRole = user.perfil === 'MASTER' || user.perfil === 'COLABORADOR';

              const otherClientsVehicles = currentLocalVehicles.filter(v => {
                const vEmail = ((v as any).clienteEmail || '').toLowerCase().trim();
                return vEmail && vEmail !== cleanUserEmail;
              });

              const pulled = d.veiculos.map((v: any) => ({
                ...v,
                clienteEmail: isMasterRole ? (v.clienteEmail || v.cliente_email || '') : cleanUserEmail
              }));
              const updatedVehicles = isMasterRole ? pulled : [...otherClientsVehicles, ...pulled];
              localStorage.setItem('logusq_veiculos', JSON.stringify(updatedVehicles));
            }

            // Hydrate condutores safely
            if (Array.isArray(d.condutores)) {
              const currentLocalDrivers = dbRepo.getCondutoresRaw();
              const cleanUserEmail = currentUserEmail.toLowerCase().trim();
              const isMasterRole = user.perfil === 'MASTER' || user.perfil === 'COLABORADOR';

              const otherClientsDrivers = currentLocalDrivers.filter(c => {
                const cEmail = ((c as any).clienteEmail || '').toLowerCase().trim();
                return cEmail && cEmail !== cleanUserEmail;
              });

              const pulled = d.condutores.map((c: any) => ({
                ...c,
                clienteEmail: isMasterRole ? (c.clienteEmail || c.cliente_email || '') : cleanUserEmail
              }));
              const updatedDrivers = isMasterRole ? pulled : [...otherClientsDrivers, ...pulled];
              localStorage.setItem('logusq_condutores', JSON.stringify(updatedDrivers));
            }

            if (Array.isArray(d.entregas)) {
              localStorage.setItem(`logusq_entregas_${currentUserEmail}`, JSON.stringify(d.entregas));
            }
            if (d.rotasAtivas) {
              localStorage.setItem(`logusq_rotas_ativas_${currentUserEmail}`, JSON.stringify(d.rotasAtivas));
            }
            if (d.auditoriaLogs) localStorage.setItem('logusq_auditoria', JSON.stringify(d.auditoriaLogs));
            if (d.mensagensSuporte) localStorage.setItem('logusq_mensagens', JSON.stringify(d.mensagensSuporte));
            
            // Dispatch sync event for active dashboards
            window.dispatchEvent(new Event('logusq_sync_complete'));
          } else {
            setDbMode('offline');
          }
        })
        .catch(err => {
          console.warn('Sync offline: rodando no modo de armazenamento local.', err);
          setDbMode('offline');
        });
    };

    // Initial sync
    performSyncPull();

    // Polling Interval: 20 seconds automatic background pull for Manager <-> Driver synchronization
    const pollingInterval = setInterval(() => {
      performSyncPull();
    }, 20000);

    // Cross-tab storage listener
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('logusq_')) {
        window.dispatchEvent(new Event('logusq_sync_complete'));
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      clearInterval(pollingInterval);
      window.removeEventListener('storage', handleStorageEvent);
      if (syncChannel) syncChannel.close();
    };
  }, [currentUserEmail]);

  // If no user session, show login/signup
  if (!currentUserEmail) {
    return <LoginCadastro onLoginSuccess={handleLoginSuccess} />;
  }

  // Get user details
  const user = dbRepo.getUsuario(currentUserEmail);

  if (!user) {
    // Session corrupted or user deleted, clear session
    handleLogout();
    return <LoginCadastro onLoginSuccess={handleLoginSuccess} />;
  }

  // Route to corresponding Portal
  return (
    <div className="relative min-h-screen">
      {user.perfil === 'MASTER' && (
        <DashboardMaster 
          userEmail={user.email} 
          onLogout={handleLogout} 
        />
      )}

      {user.perfil === 'COLABORADOR' && (
        <DashboardMaster 
          userEmail={user.email} 
          onLogout={handleLogout} 
          colabAccessLevel={user.nivelAcesso} 
        />
      )}

      {user.perfil === 'CLIENTE' && (
        <DashboardCliente 
          userEmail={user.email} 
          onLogout={handleLogout} 
        />
      )}

      {user.perfil === 'MOTORISTA' && (
        <DashboardMotorista 
          userEmail={user.email} 
          onLogout={handleLogout} 
        />
      )}

      {/* Subtle Connection Status Badge */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/90 px-3 py-1 text-[10px] font-medium text-white shadow-lg backdrop-blur-xs select-none">
        <span className={`h-2 w-2 rounded-full ${dbMode === 'supabase' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
        <span>{dbMode === 'supabase' ? 'Banco de Dados On-Line' : 'Banco de Dados Off-Line'}</span>
      </div>
    </div>
  );
}
