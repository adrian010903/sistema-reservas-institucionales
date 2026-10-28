import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import process from 'node:process'

const frontendDirectory = path.dirname(fileURLToPath(import.meta.url))
const backendDirectory = path.resolve(frontendDirectory, '../backend')
const baseURL = 'http://127.0.0.1:5173'
const backendCommand = process.platform === 'win32'
  ? 'mvnw.cmd --batch-mode --no-transfer-progress -DskipTests test-compile spring-boot:test-run'
  : 'bash ./mvnw --batch-mode --no-transfer-progress -DskipTests test-compile spring-boot:test-run'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: [
    {
      command: backendCommand,
      cwd: backendDirectory,
      url: 'http://127.0.0.1:8081/api/v1/status',
      timeout: 180_000,
      reuseExistingServer: false,
      env: {
        ...process.env,
        SERVER_PORT: '8081',
        SPRING_DATASOURCE_URL: 'jdbc:h2:mem:reservas_e2e;MODE=MySQL;DB_CLOSE_DELAY=-1',
        SPRING_DATASOURCE_DRIVER_CLASS_NAME: 'org.h2.Driver',
        SPRING_DATASOURCE_USERNAME: 'sa',
        SPRING_DATASOURCE_PASSWORD: '',
        SPRING_JPA_HIBERNATE_DDL_AUTO: 'create-drop',
        APP_JWT_SECRET: 'clave-exclusiva-para-pruebas-e2e-automatizadas-2026',
        MAIL_ENABLED: 'false',
      },
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
      cwd: frontendDirectory,
      url: baseURL,
      timeout: 60_000,
      reuseExistingServer: false,
      env: { ...process.env, VITE_API_URL: '/api/v1' },
    },
  ],
})
