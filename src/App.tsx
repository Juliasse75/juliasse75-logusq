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

  // Pull latest data from Supabase to client local cache on mount or login
  React.useEffect(() => {
    if (currentUserEmail) {
      const user = dbRepo.getUsuario(currentUserEmail);
      if (user) {
        fetch(`/api/sync/pull?email=${encodeURIComponent(currentUserEmail)}&perfil=${user.perfil}`)
          .then(res => res.json())
          .then(resData => {
            if (resData.success && resData.mode === 'supabase' && resData.data) {
              setDbMode('supabase');
              const d = resData.data;
              console.log('🔄 SYNC: Hydrating local cache with Supabase data...', d);
              if (d.usuarios && d.usuarios.length > 0) localStorage.setItem('logusq_usuarios', JSON.stringify(d.usuarios));
              if (d.clientes && d.clientes.length > 0) localStorage.setItem('logusq_clientes', JSON.stringify(d.clientes));
              
              // Hydrate veiculos safely (merge instead of wiping out local data if pull is empty)
              if (Array.isArray(d.veiculos)) {
                const currentLocalVehicles = dbRepo.getVeiculos();
                const cleanUserEmail = currentUserEmail.toLowerCase().trim();
                const otherClientsVehicles = currentLocalVehicles.filter(v => {
                  const vEmail = ((v as any).clienteEmail || '').toLowerCase().trim();
                  return vEmail && vEmail !== cleanUserEmail;
                });

                let updatedVehicles = [...otherClientsVehicles];
                if (d.veiculos.length > 0) {
                  const pulled = d.veiculos.map((v: any) => ({ ...v, clienteEmail: cleanUserEmail }));
                  updatedVehicles.push(...pulled);
                } else {
                  // Keep local vehicles for this client if present
                  const localUserVehicles = currentLocalVehicles.filter(v => ((v as any).clienteEmail || '').toLowerCase().trim() === cleanUserEmail);
                  if (localUserVehicles.length > 0) {
                    updatedVehicles.push(...localUserVehicles);
                  }
                }
                if (updatedVehicles.length > 0) {
                  localStorage.setItem('logusq_veiculos', JSON.stringify(updatedVehicles));
                }
              }

              // Hydrate condutores safely
              if (Array.isArray(d.condutores)) {
                const currentLocalDrivers = dbRepo.getCondutoresRaw();
                const cleanUserEmail = currentUserEmail.toLowerCase().trim();
                const otherClientsDrivers = currentLocalDrivers.filter(c => {
                  const cEmail = ((c as any).clienteEmail || '').toLowerCase().trim();
                  return cEmail && cEmail !== cleanUserEmail;
                });

                let updatedDrivers = [...otherClientsDrivers];
                if (d.condutores.length > 0) {
                  const pulled = d.condutores.map((c: any) => ({ ...c, clienteEmail: cleanUserEmail }));
                  updatedDrivers.push(...pulled);
                } else {
                  const localUserDrivers = currentLocalDrivers.filter(c => ((c as any).clienteEmail || '').toLowerCase().trim() === cleanUserEmail);
                  if (localUserDrivers.length > 0) {
                    updatedDrivers.push(...localUserDrivers);
                  }
                }
                if (updatedDrivers.length > 0) {
                  localStorage.setItem('logusq_condutores', JSON.stringify(updatedDrivers));
                }
              }

              if (d.entregas && Array.isArray(d.entregas) && d.entregas.length > 0) {
                localStorage.setItem(`logusq_entregas_${currentUserEmail}`, JSON.stringify(d.entregas));
              }
              if (d.rotasAtivas && Object.keys(d.rotasAtivas).length > 0) {
                localStorage.setItem(`logusq_rotas_ativas_${currentUserEmail}`, JSON.stringify(d.rotasAtivas));
              }
              if (d.auditoriaLogs) localStorage.setItem('logusq_auditoria', JSON.stringify(d.auditoriaLogs));
              if (d.mensagensSuporte) localStorage.setItem('logusq_mensagens', JSON.stringify(d.mensagensSuporte));
              
              // Let all dashboard screens know they should reload local state
              window.dispatchEvent(new Event('logusq_sync_complete'));
            } else {
              setDbMode('offline');
            }
          })
          .catch(err => {
            console.warn('Sync offline: rodando no modo de armazenamento local.', err);
            setDbMode('offline');
          });
      }
    }
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
