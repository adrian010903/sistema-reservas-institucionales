import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import process from 'node:process'

test('registro, inicio de sesión y consulta de mis reservas', async ({ page }) => {
  const name = 'Usuario E2E'
  const email = `e2e-${randomUUID()}@example.test`
  const password = 'PruebaE2E2026'

  await page.goto('/')
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()

  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.getByRole('heading', { name: 'Registrarse' })).toBeVisible()
  await page.getByLabel('Nombre').fill(name)
  await page.getByLabel('Correo').fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByLabel('Confirmar contraseña').fill(password)
  await page.getByRole('button', { name: 'Crear cuenta' }).click()

  await expect(page.getByText('Registro exitoso. Ya puedes iniciar sesión.')).toBeVisible({ timeout: 30_000 })
  await page.getByLabel('Correo').fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { name: `Hola, ${name}` })).toBeVisible()

  await page.getByRole('button', { name: 'Menú' }).click()
  await page.getByRole('menuitem', { name: 'Mis reservas' }).click()
  await expect(page).toHaveURL(/\/reservas$/)
  await expect(page.getByRole('heading', { name: 'Mis reservas' })).toBeVisible()
  await expect(page.getByText('Aún no tienes reservas')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Mis reservas' })).toBeVisible()
})

test('staging: crear y cancelar una reserva libera el horario', async ({ page }) => {
  test.skip(!process.env.E2E_BASE_URL, 'Requiere un catálogo de espacios publicado en staging')

  const name = 'Usuario E2E Reservas'
  const email = `e2e-reserva-${randomUUID()}@example.test`
  const password = 'PruebaE2E2026'
  const reservationDate = new Date()
  reservationDate.setDate(reservationDate.getDate() + 120)
  const dateValue = `${reservationDate.getFullYear()}-${String(reservationDate.getMonth() + 1).padStart(2, '0')}-${String(reservationDate.getDate()).padStart(2, '0')}`
  const displayedDate = new Intl.DateTimeFormat('es-CR', { day: '2-digit', month: 'short', year: 'numeric' }).format(reservationDate).replace('.', '')

  await page.goto('/')
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await page.getByLabel('Nombre').fill(name)
  await page.getByLabel('Correo').fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByLabel('Confirmar contraseña').fill(password)
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.getByText('Registro exitoso. Ya puedes iniciar sesión.')).toBeVisible({ timeout: 30_000 })
  await page.getByLabel('Correo').fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)

  await page.getByRole('button', { name: 'Espacios', exact: true }).click()
  await page.locator('.availability-bar input[type="date"]').fill(dateValue)
  await page.getByRole('button', { name: 'Consultar disponibilidad' }).click()
  const availableSpace = page.locator('.space-card').first()
  await expect(availableSpace).toBeVisible({ timeout: 30_000 })
  const spaceName = await availableSpace.locator('h3').innerText()
  await availableSpace.getByRole('button', { name: 'Reservar' }).click()
  await expect(page.getByRole('heading', { name: 'Configura tu visita' })).toBeVisible()

  await page.locator('.custom-picker-trigger').click()
  await page.locator('.custom-calendar-grid button:not(.outside):not([disabled])')
    .filter({ hasText: new RegExp(`^${reservationDate.getDate()}$`) }).click()
  await page.getByRole('button', { name: 'Comprobar y revisar reserva' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar y continuar al pago' }).click()
  try {
    await expect(page).toHaveURL(/\/pagos$/)
    await page.goto('/reservas')
    await expect(page.getByRole('heading', { name: 'Mis reservas' })).toBeVisible()
    const reservationCard = page.locator('.reservation-modern-card')
      .filter({ hasText: spaceName }).filter({ hasText: displayedDate })
    await expect(reservationCard).toBeVisible()
    page.once('dialog', (dialog) => dialog.accept())
    await reservationCard.getByRole('button', { name: 'Cancelar' }).click()
    await expect(page.getByText('Reserva cancelada. El horario quedó disponible nuevamente.')).toBeVisible()
    await expect(reservationCard.getByText('CANCELADA')).toBeVisible()

    await page.goto('/espacios')
    await page.locator('.availability-bar input[type="date"]').fill(dateValue)
    await page.getByRole('button', { name: 'Consultar disponibilidad' }).click()
    await expect(page.locator('.space-card').first()).toBeVisible()
  } finally {
    // Si una aserción posterior al alta falla, no dejes una reserva E2E ocupando el horario.
    await page.goto('/reservas').catch(() => {})
    const cleanupCards = page.locator('.reservation-modern-card')
      .filter({ hasText: spaceName }).filter({ hasText: displayedDate })
    if (await cleanupCards.count() === 1 && await cleanupCards.first().isVisible().catch(() => false)) {
      const cleanupCard = cleanupCards.first()
      const cancelButton = cleanupCard.getByRole('button', { name: 'Cancelar' })
      if (await cancelButton.isVisible().catch(() => false)) {
        page.once('dialog', (dialog) => dialog.accept())
        await cancelButton.click().catch(() => {})
        await cleanupCard.getByText('CANCELADA').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {})
      }
    }
  }
})
