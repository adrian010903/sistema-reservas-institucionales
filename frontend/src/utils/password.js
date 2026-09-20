export const PASSWORD_MESSAGE = 'La contraseña debe tener entre 8 y 72 caracteres e incluir mayúscula, minúscula y número'

export function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/.test(password)
}
