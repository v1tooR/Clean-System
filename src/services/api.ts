import { sleep } from '@/lib/utils'

/**
 * Camada de acesso a dados.
 *
 * Hoje ela resolve tudo em memória com latência simulada. Quando existir um
 * backend (API própria, Supabase…), somente os arquivos desta pasta mudam:
 * as telas continuam consumindo as mesmas assinaturas assíncronas.
 */

export const API_LATENCY = { fast: 220, normal: 480, slow: 900 }

export async function request<T>(
  resolver: () => T | Promise<T>,
  latency: number = API_LATENCY.normal,
): Promise<T> {
  await sleep(latency)
  return resolver()
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
