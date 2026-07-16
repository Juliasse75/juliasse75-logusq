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

  const handleLoginSuccess = (email: string) => {
    localStorage.setItem('logusq_session_email', email);
    setCurrentUserEmail(email);
  };

  const handleLogout = () => {
    localStorage.removeItem('logusq_session_email');
    setCurrentUserEmail(null);
  };

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
  if (user.perfil === 'MASTER') {
    return (
      <DashboardMaster 
        userEmail={user.email} 
        onLogout={handleLogout} 
      />
    );
  }

  if (user.perfil === 'COLABORADOR') {
    return (
      <DashboardMaster 
        userEmail={user.email} 
        onLogout={handleLogout} 
        colabAccessLevel={user.nivelAcesso} 
      />
    );
  }

  if (user.perfil === 'CLIENTE') {
    return (
      <DashboardCliente 
        userEmail={user.email} 
        onLogout={handleLogout} 
      />
    );
  }

  if (user.perfil === 'MOTORISTA') {
    return (
      <DashboardMotorista 
        userEmail={user.email} 
        onLogout={handleLogout} 
      />
    );
  }

  // Fallback
  return <LoginCadastro onLoginSuccess={handleLoginSuccess} />;
}
