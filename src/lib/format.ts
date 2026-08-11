import { format, formatDistanceToNowStrict, isToday, isTomorrow, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { onlyDigits } from './utils'

/* -------------------------------------------------------------------------- */
/* Moeda                                                                       */
/* -------------------------------------------------------------------------- */

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
})

const BRL_COMPACT = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function currency(value: number) {
  return BRL.format(value ?? 0)
}

export function currencyCompact(value: number) {
  return value >= 10_000 ? BRL_COMPACT.format(value) : BRL.format(value ?? 0)
}

/** "1.234,50" — sem símbolo, para inputs. */
export function currencyRaw(value: number) {
  return (value ?? 0).toFixed(2).replace('.', ',')
}

export function parseCurrency(input: string) {
  const clean = input.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
  const parsed = Number.parseFloat(clean)
  return Number.isFinite(parsed) ? parsed : 0
}

export function percent(value: number, digits = 0) {
  return `${value.toFixed(digits).replace('.', ',')}%`
}

export function number(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value ?? 0)
}

/* -------------------------------------------------------------------------- */
/* Datas                                                                       */
/* -------------------------------------------------------------------------- */

export function toDate(value: string | Date) {
  return typeof value === 'string' ? new Date(value) : value
}

export function dateShort(value: string | Date) {
  return format(toDate(value), 'dd/MM/yyyy', { locale: ptBR })
}

export function dateTime(value: string | Date) {
  return format(toDate(value), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function timeShort(value: string | Date) {
  return format(toDate(value), 'HH:mm', { locale: ptBR })
}

export function dateLong(value: string | Date) {
  return format(toDate(value), "EEEE, d 'de' MMMM", { locale: ptBR })
}

export function monthLabel(value: string | Date) {
  return format(toDate(value), "MMMM 'de' yyyy", { locale: ptBR })
}

/** "Hoje 14:30", "Amanhã 09:00", "12/03 18:00" — para prazos no balcão. */
export function dueLabel(value: string | Date) {
  const date = toDate(value)
  const time = format(date, 'HH:mm', { locale: ptBR })
  if (isToday(date)) return `Hoje ${time}`
  if (isTomorrow(date)) return `Amanhã ${time}`
  if (isYesterday(date)) return `Ontem ${time}`
  return `${format(date, 'dd/MM', { locale: ptBR })} ${time}`
}

export function relative(value: string | Date) {
  return `há ${formatDistanceToNowStrict(toDate(value), { locale: ptBR })}`
}

/* -------------------------------------------------------------------------- */
/* Documentos e contatos brasileiros                                           */
/* -------------------------------------------------------------------------- */

export function formatCPF(value: string) {
  const digits = onlyDigits(value).slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function formatCNPJ(value: string) {
  const digits = onlyDigits(value).slice(0, 14)
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export function formatDocument(value: string) {
  const digits = onlyDigits(value)
  return digits.length > 11 ? formatCNPJ(digits) : formatCPF(digits)
}

export function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
  }
  return digits.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
}

export function formatCEP(value: string) {
  return onlyDigits(value).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2')
}

/** Nome curto para listas densas: "Maria Aparecida Souza" -> "Maria A. Souza" */
export function shortName(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length <= 2) return name
  return [parts[0], `${parts[1][0]}.`, parts[parts.length - 1]].join(' ')
}

/**
 * Empresas mantêm o nome fantasia completo — abreviar razões sociais gera
 * rótulos confusos no balcão ("Fio d. Ateliê").
 */
export function customerShort(name: string, kind: 'PF' | 'PJ') {
  return kind === 'PJ' ? name : shortName(name)
}

export function pluralize(count: number, singular: string, plural: string) {
  return `${number(count)} ${count === 1 ? singular : plural}`
}
