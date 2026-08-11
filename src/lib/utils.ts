import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g')

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Aguarda `ms` — usado para simular latência de rede na camada de services. */
export function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

/** Remove acentos e normaliza para buscas tolerantes ("jose" encontra "José"). */
export function normalize(value: string) {
  return value.normalize('NFD').replace(DIACRITICS, '').toLowerCase().trim()
}

/** Apenas dígitos — usado em CPF/CNPJ/telefone. */
export function onlyDigits(value: string) {
  return value.replace(/\D+/g, '')
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Gera ids estáveis o suficiente para dados locais/mock. */
export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function sum(values: number[]) {
  return values.reduce((acc, value) => acc + value, 0)
}

export function groupBy<T, K extends string | number>(items: T[], key: (item: T) => K) {
  return items.reduce<Record<K, T[]>>(
    (acc, item) => {
      const k = key(item)
      ;(acc[k] ??= []).push(item)
      return acc
    },
    {} as Record<K, T[]>,
  )
}
