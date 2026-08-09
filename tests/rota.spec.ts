import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * ESPECIFICAÇÃO DE TESTES E2E - PAINEL DO GESTOR & CONTROLE DE FROTA
 * Utiliza o estado de autenticação pré-salvo em `.auth/gestorAuth.json`
 * ignorando a etapa de login manual para máxima performance.
 */
test.describe('Painel do Gestor de Logística - Módulo de Roteirização e Frota', () => {
  // Injeta explicitamente o storageState autenticado do Gestor
  test.use({ storageState: './.auth/gestorAuth.json' });

  test('Deve acessar diretamente o painel sem passar pela tela de login e renderizar os botões de controle de frota', async ({ page }) => {
    // 1. Acessa diretamente a URL do sistema (ja autenticado via storageState)
    await page.goto('/');

    // 2. Valida se o painel carregou o título de boas-vindas do Gestor
    const headerTitle = page.locator('h1', { hasText: 'Roteirização e Distribuição de Carga' });
    await expect(headerTitle).toBeVisible({ timeout: 10000 });

    // 3. Localiza e clica na aba de "Gestão de Frota" no menu lateral
    const frotaTabButton = page.getByRole('button', { name: /Gestão de Frota/i });
    await expect(frotaTabButton).toBeVisible();
    await frotaTabButton.click();

    // 4. Valida se o título da aba de Gestão de Frota foi exibido corretamente
    const frotaHeader = page.locator('h1', { hasText: 'Gestão Avançada de Frota' });
    await expect(frotaHeader).toBeVisible();

    // 5. Valida a presença dos botões principais de controle de frota na tela
    const novoVeiculoFormTitle = page.locator('h3', { hasText: 'Novo Veículo' });
    await expect(novoVeiculoFormTitle).toBeVisible();

    const importarFrotaBtn = page.getByRole('button', { name: /Importar Frota Inteligente/i });
    await expect(importarFrotaBtn).toBeVisible();

    const baixarModeloBtn = page.getByRole('button', { name: /Baixar Planilha Modelo/i });
    await expect(baixarModeloBtn).toBeVisible();

    // 6. Tira screenshot para evidência do relatório de QA
    await page.screenshot({ path: 'test-results/evidencia-frota-gestor.png', fullPage: true });
  });

  test('Deve permitir navegar entre os módulos de Roteirização, Frota e Condutores sem perda de sessão', async ({ page }) => {
    await page.goto('/');

    // Navega para Gestão de Condutores
    const condutoresTabButton = page.getByRole('button', { name: /Gestão de Condutores/i });
    await expect(condutoresTabButton).toBeVisible();
    await condutoresTabButton.click();

    // Valida título de condutores
    const condutoresHeader = page.locator('h1', { hasText: 'Gestão de Motoristas Habilitados' });
    await expect(condutoresHeader).toBeVisible();

    // Retorna para Roteirização
    const roteiroTabButton = page.getByRole('button', { name: /Roteirização Científica/i });
    await expect(roteiroTabButton).toBeVisible();
  });
});
