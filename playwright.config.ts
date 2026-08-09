import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * CONFIGURAÇÃO GLOBAL DO PLAYWRIGHT E2E - LOGUSQ SAAS
 * Suporta autenticação única (Global Setup) e reúso de sessões (storageState).
 */
export default defineConfig({
  testDir: './tests',
  /* Apenas arquivos .spec.ts são testes E2E do Playwright */
  testMatch: '**/*.spec.ts',
  /* Executa testes em arquivos em paralelo */
  fullyParallel: true,
  /* Impede acidental test.only em ambiente de CI */
  forbidOnly: !!process.env.CI,
  /* Tentativas em caso de falha */
  retries: process.env.CI ? 2 : 0,
  /* Número de workers paralelos */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter do Playwright */
  reporter: [['html', { open: 'never' }], ['list']],
  
  /* Executa o script de login global prévio para gerar sessões reaproveitáveis */
  globalSetup: './tests/global-setup.ts',

  use: {
    /* URL base do ambiente de desenvolvimento/produção */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    /* Grava rastros em caso de falha no primeiro retry */
    trace: 'on-first-retry',
    /* Captura screenshot em falhas */
    screenshot: 'only-on-failure',
    /* Ignora erros HTTPS em ambiente local/staging */
    ignoreHTTPSErrors: true,
  },

  /* Configuração dos Projetos por Perfil de Usuário */
  projects: [
    {
      name: 'Gestor',
      use: {
        ...devices['Desktop Chrome'],
        // Injeta a sessão pré-autenticada do Gestor
        storageState: './.auth/gestorAuth.json',
      },
    },
    {
      name: 'Motorista',
      use: {
        ...devices['Desktop Chrome'],
        // Injeta a sessão pré-autenticada do Motorista
        storageState: './.auth/motoristaAuth.json',
      },
    },
    {
      name: 'Master',
      use: {
        ...devices['Desktop Chrome'],
        // Injeta a sessão pré-autenticada do Master CEO
        storageState: './.auth/masterAuth.json',
      },
    },
  ],

  /* Servidor Web local opcional para rodar testes se o servidor não estiver rodando */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
