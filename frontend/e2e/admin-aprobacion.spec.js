import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import process from 'node:process'

const adminEmail = process.env.E2E_ADMIN_EMAIL
const adminPassword = process.env.E2E_ADMIN_PASSWORD

async function iniciarSesion(page, email, password) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await page.getByLabel('Correo').fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

test('staging: un administrador aprueba la reserva pendiente de un usuario', async ({ browser }) => {
  test.skip(!process.env.E2E_BASE_URL, 'Requiere staging publicado')
  test.skip(!adminEmail || !adminPassword, 'Requiere E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD')
  test.setTimeout(180_000)

  const name = 'Usuario E2E Aprobación'
  const email = `e2e-aprobacion-${randomUUID()}@example.test`
  const password = 'PruebaE2E2026'
  console.log(`Cuenta temporal E2E: ${email}`)
  const reservationDate = new Date()
  // Fecha distinta en cada ejecución para no chocar con reservas de corridas anteriores.
  reservationDate.setDate(reservationDate.getDate() + 150 + Math.floor(Math.random() * 300))
  const dateValue = `${reservationDate.getFullYear()}-${String(reservationDate.getMonth() + 1).padStart(2, '0')}-${String(reservationDate.getDate()).padStart(2, '0')}`
  const displayedDate = new Intl.DateTimeFormat('es-CR', { day: '2-digit', month: 'short', year: 'numeric' }).format(reservationDate).replace('.', '')

  const userContext = await browser.newContext()
  const adminContext = await browser.newContext()
  const userPage = await userContext.newPage()
  const adminPage = await adminContext.newPage()
  let spaceName = ''

  try {
    // 1. Un usuario nuevo se registra y crea una reserva, que queda PENDIENTE.
    await userPage.goto('/')
    await userPage.getByRole('button', { name: 'Iniciar sesión' }).click()
    await userPage.getByRole('button', { name: 'Crear cuenta' }).click()
    await userPage.getByLabel('Nombre').fill(name)
    await userPage.getByLabel('Correo').fill(email)
    await userPage.getByLabel('Contraseña', { exact: true }).fill(password)
    await userPage.getByLabel('Confirmar contraseña').fill(password)
    await userPage.getByRole('button', { name: 'Crear cuenta' }).click()
    await expect(userPage.getByText('Registro exitoso. Ya puedes iniciar sesión.')).toBeVisible({ timeout: 60_000 })
    await userPage.getByLabel('Correo').fill(email)
    await userPage.getByLabel('Contraseña', { exact: true }).fill(password)
    await userPage.getByRole('button', { name: 'Entrar' }).click()
    await expect(userPage).toHaveURL(/\/dashboard$/)

    await userPage.getByRole('button', { name: 'Espacios', exact: true }).click()
    await userPage.locator('.availability-bar input[type="date"]').fill(dateValue)
    await userPage.getByRole('button', { name: 'Consultar disponibilidad' }).click()
    const availableSpace = userPage.locator('.space-card').first()
    await expect(availableSpace).toBeVisible({ timeout: 30_000 })
    spaceName = await availableSpace.locator('h3').innerText()
    await availableSpace.getByRole('button', { name: 'Reservar' }).click()
    await expect(userPage.getByRole('heading', { name: 'Configura tu visita' })).toBeVisible()
    await userPage.locator('.custom-picker-trigger').click()
    await userPage.locator('.custom-calendar-grid button:not(.outside):not([disabled])')
      .filter({ hasText: new RegExp(`^${reservationDate.getDate()}$`) }).click()
    await userPage.getByRole('button', { name: 'Comprobar y revisar reserva' }).click()
    await expect(userPage.getByRole('dialog')).toBeVisible()
    await userPage.getByRole('button', { name: 'Confirmar y continuar al pago' }).click()
    await expect(userPage).toHaveURL(/\/pagos$/)

    // 2. El administrador entra al panel y busca la reserva por el correo del usuario.
    await iniciarSesion(adminPage, adminEmail, adminPassword)
    await expect(adminPage).not.toHaveURL(/\/login/)
    await adminPage.goto('/admin')
    const opcionesAvanzadas = adminPage.getByRole('button', { name: 'Mostrar opciones avanzadas' })
    if (await opcionesAvanzadas.isVisible().catch(() => false)) await opcionesAvanzadas.click()
    await adminPage.locator('.admin-tabs button').filter({ hasText: /^Reservas$/ }).click()
    await adminPage.getByPlaceholder('Espacio, correo o número…').fill(email)
    const adminRow = adminPage.locator('.admin-table article').filter({ hasText: email })
    await expect(adminRow).toBeVisible({ timeout: 30_000 })
    await expect(adminRow.getByText('PENDIENTE')).toBeVisible()

    // 3. Aprueba la reserva y el estado cambia a APROBADA.
    await adminRow.getByRole('button', { name: 'Aprobar' }).click()
    await expect(adminPage.getByText('Reserva aprobada')).toBeVisible()
    await expect(adminRow.getByText('APROBADA')).toBeVisible()

    // 4. El usuario ve su reserva aprobada.
    await userPage.goto('/reservas')
    const reservationCard = userPage.locator('.reservation-modern-card')
      .filter({ hasText: spaceName }).filter({ hasText: displayedDate })
    await expect(reservationCard.getByText('APROBADA')).toBeVisible({ timeout: 30_000 })
  } finally {
    // Limpieza: cancelar la reserva de prueba para no dejar el horario ocupado en staging.
    if (spaceName) {
      await userPage.goto('/reservas').catch(() => {})
      const cleanupCard = userPage.locator('.reservation-modern-card')
        .filter({ hasText: spaceName }).filter({ hasText: displayedDate }).first()
      await cleanupCard.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {})
      const cancelButton = cleanupCard.getByRole('button', { name: 'Cancelar' })
      if (await cancelButton.isVisible().catch(() => false)) {
        userPage.once('dialog', (dialog) => dialog.accept())
        await cancelButton.click().catch(() => {})
        await cleanupCard.getByText('CANCELADA').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {})
      }
    }
    await userContext.close()
    await adminContext.close()
  }
})
