import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Representação visual do QR Code Pix.
 *
 * O payload EMV real é gerado em `fiscal.service`; aqui ele é convertido em uma
 * matriz determinística apenas para a demonstração — quando houver integração
 * com o PSP, este componente passa a renderizar a imagem retornada pela API.
 */
function hashString(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function buildMatrix(payload: string, size = 29) {
  let seed = hashString(payload)
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }

  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => random() > 0.52),
  )

  const drawFinder = (row: number, col: number) => {
    for (let y = -1; y <= 7; y += 1) {
      for (let x = -1; x <= 7; x += 1) {
        const targetY = row + y
        const targetX = col + x
        if (targetY < 0 || targetX < 0 || targetY >= size || targetX >= size) continue
        const border = x === 0 || x === 6 || y === 0 || y === 6
        const center = x >= 2 && x <= 4 && y >= 2 && y <= 4
        const outside = x === -1 || x === 7 || y === -1 || y === 7
        matrix[targetY][targetX] = outside ? false : border || center
      }
    }
  }

  drawFinder(0, 0)
  drawFinder(0, size - 7)
  drawFinder(size - 7, 0)

  return matrix
}

export function PixQrCode({ payload, className }: { payload: string; className?: string }) {
  const matrix = React.useMemo(() => buildMatrix(payload), [payload])
  const size = matrix.length

  return (
    <svg
      viewBox={`0 0 ${size + 4} ${size + 4}`}
      className={cn('size-44 rounded-lg bg-white p-1', className)}
      role="img"
      aria-label="QR Code para pagamento via Pix"
    >
      {matrix.map((row, y) =>
        row.map((filled, x) =>
          filled ? (
            <rect key={`${x}-${y}`} x={x + 2} y={y + 2} width={1} height={1} fill="#000" />
          ) : null,
        ),
      )}
    </svg>
  )
}
