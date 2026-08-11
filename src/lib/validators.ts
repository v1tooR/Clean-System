import { onlyDigits } from './utils'

/** Validação real de CPF (dígitos verificadores). */
export function isValidCPF(value: string) {
  const cpf = onlyDigits(value)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

  const digit = (slice: number) => {
    let total = 0
    for (let index = 0; index < slice; index += 1) {
      total += Number(cpf[index]) * (slice + 1 - index)
    }
    const rest = (total * 10) % 11
    return rest === 10 ? 0 : rest
  }

  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10])
}

/** Validação real de CNPJ (dígitos verificadores). */
export function isValidCNPJ(value: string) {
  const cnpj = onlyDigits(value)
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false

  const calc = (length: number) => {
    let total = 0
    let position = length - 7
    for (let index = 0; index < length; index += 1) {
      total += Number(cnpj[index]) * position
      position -= 1
      if (position < 2) position = 9
    }
    const rest = total % 11
    return rest < 2 ? 0 : 11 - rest
  }

  return calc(12) === Number(cnpj[12]) && calc(13) === Number(cnpj[13])
}

/**
 * Recalcula os dígitos verificadores mantendo a base do documento.
 * Usado para que os dados de demonstração sejam consistentes com a validação
 * aplicada nos formulários.
 */
export function fixCPF(value: string) {
  const base = onlyDigits(value).slice(0, 9).padEnd(9, '0')
  const digit = (slice: number, source: string) => {
    let total = 0
    for (let index = 0; index < slice; index += 1) {
      total += Number(source[index]) * (slice + 1 - index)
    }
    const rest = (total * 10) % 11
    return rest === 10 ? 0 : rest
  }
  const first = digit(9, base)
  const second = digit(10, `${base}${first}`)
  return `${base}${first}${second}`
}

export function fixCNPJ(value: string) {
  const base = onlyDigits(value).slice(0, 12).padEnd(12, '0')
  const calc = (length: number, source: string) => {
    let total = 0
    let position = length - 7
    for (let index = 0; index < length; index += 1) {
      total += Number(source[index]) * position
      position -= 1
      if (position < 2) position = 9
    }
    const rest = total % 11
    return rest < 2 ? 0 : 11 - rest
  }
  const first = calc(12, base)
  const second = calc(13, `${base}${first}`)
  return `${base}${first}${second}`
}

export function isValidPhone(value: string) {
  const digits = onlyDigits(value)
  return digits.length === 10 || digits.length === 11
}
