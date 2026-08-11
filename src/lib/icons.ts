import {
  Bed,
  BedDouble,
  Blinds,
  Crown,
  Grid2x2,
  HardHat,
  Layers,
  Package,
  Shirt,
  Sofa,
  Sparkles,
  Stethoscope,
  UserRound,
  Utensils,
  Waves,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Ícones disponíveis para as peças do catálogo.
 * Mapa explícito (em vez de import dinâmico) para manter o bundle enxuto e
 * permitir que a equipe escolha o ícone ao cadastrar uma peça nova.
 */
export const garmentIcons: Record<string, LucideIcon> = {
  Shirt,
  Layers,
  UserRound,
  Sparkles,
  Package,
  BedDouble,
  Bed,
  Waves,
  Blinds,
  Grid2x2,
  Sofa,
  Stethoscope,
  HardHat,
  Utensils,
  Crown,
}

export const garmentIconNames = Object.keys(garmentIcons)

export function garmentIcon(name: string): LucideIcon {
  return garmentIcons[name] ?? Package
}
