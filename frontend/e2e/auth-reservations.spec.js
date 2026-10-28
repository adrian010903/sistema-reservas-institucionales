import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'

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

  await expect(page.getByText('Registro exitoso. Ya puedes iniciar sesión.')).toBeVisible()
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
