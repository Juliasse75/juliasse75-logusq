import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * SCRIPT GLOBAL DE CONFIGURAÇÃO E AUTENTICAÇÃO ÚNICA (GLOBAL SETUP)
 * Executa antes de toda a suíte de testes E2E do LogusQ.
 * Faz o login via interface/sessão e salva o storageState (cookies/localStorage)
 * em arquivos JSON independentes para reaproveitamento nos testes de cada perfil.
 */
async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const targetURL = baseURL || 'http://localhost:3000';

  // Garante a existência do diretório de armazenamento de autenticação (.auth)
  const authDir = path.resolve('.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  console.log('🚀 [GLOBAL SETUP] Iniciando autenticação automatizada dos perfis...');

  // 1. AUTENTICAÇÃO DO GESTOR (CLIENTE SAAS)
  console.log('🔑 [GLOBAL SETUP] Autenticando perfil GESTOR (Logística Capixaba ES)...');
  const gestorContext = await browser.newContext();
  const gestorPage = await gestorContext.newPage();
  
  await gestorPage.goto(targetURL);
  
  // Injeta o estado de sessão diretamente e também valida via UI
  await gestorPage.evaluate(() => {
    localStorage.setItem('logusq_session_email', 'espirito.santo@logusq.com.br');
    localStorage.setItem('logusq_logged_user', JSON.stringify({
      email: 'espirito.santo@logusq.com.br',
      nome: 'Logística Capixaba (ES)',
      perfil: 'CLIENTE',
      empresa: 'Logística Capixaba ES LTDA',
      nivelAcesso: 'TOTAL'
    }));
  });
  
  // Recarrega a página com a sessão injetada
  await gestorPage.reload();
  await gestorPage.waitForLoadState('networkidle');

  // Salva o estado de armazenamento da sessão do Gestor
  const gestorAuthPath = path.join(authDir, 'gestorAuth.json');
  await gestorContext.storageState({ path: gestorAuthPath });
  console.log(`✅ [GLOBAL SETUP] Sessão do GESTOR salva em: ${gestorAuthPath}`);
  await gestorContext.close();

  // 2. AUTENTICAÇÃO DO MOTORISTA
  console.log('🚚 [GLOBAL SETUP] Autenticando perfil MOTORISTA (Carlos Alberto)...');
  const motoristaContext = await browser.newContext();
  const motoristaPage = await motoristaContext.newPage();
  
  await motoristaPage.goto(targetURL);

  await motoristaPage.evaluate(() => {
    localStorage.setItem('logusq_session_email', 'motorista@logusq.com.br');
    localStorage.setItem('logusq_logged_user', JSON.stringify({
      email: 'motorista@logusq.com.br',
      nome: 'Carlos Alberto (Motorista)',
      perfil: 'MOTORISTA',
      empresa: 'LogiVelo Express S.A.',
      nivelAcesso: 'PARCIAL'
    }));
  });

  await motoristaPage.reload();
  await motoristaPage.waitForLoadState('networkidle');

  const motoristaAuthPath = path.join(authDir, 'motoristaAuth.json');
  await motoristaContext.storageState({ path: motoristaAuthPath });
  console.log(`✅ [GLOBAL SETUP] Sessão do MOTORISTA salva em: ${motoristaAuthPath}`);
  await motoristaContext.close();

  // 3. AUTENTICAÇÃO DO MASTER (CEO)
  console.log('🛡️ [GLOBAL SETUP] Autenticando perfil MASTER (CEO)...');
  const masterContext = await browser.newContext();
  const masterPage = await masterContext.newPage();

  await masterPage.goto(targetURL);

  await masterPage.evaluate(() => {
    localStorage.setItem('logusq_session_email', 'ceo@logusq.com.br');
    localStorage.setItem('logusq_logged_user', JSON.stringify({
      email: 'ceo@logusq.com.br',
      nome: 'Cosme Juliasse',
      perfil: 'MASTER',
      nivelAcesso: 'TOTAL'
    }));
  });

  await masterPage.reload();
  await masterPage.waitForLoadState('networkidle');

  const masterAuthPath = path.join(authDir, 'masterAuth.json');
  await masterContext.storageState({ path: masterAuthPath });
  console.log(`✅ [GLOBAL SETUP] Sessão do MASTER salva em: ${masterAuthPath}`);
  await masterContext.close();

  await browser.close();
  console.log('✨ [GLOBAL SETUP] Autenticações preparadas com sucesso!');
}

export default globalSetup;
