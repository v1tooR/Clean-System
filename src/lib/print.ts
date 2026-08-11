/**
 * Impressão.
 *
 * O app imprime dois artefatos com páginas bem diferentes: o comprovante
 * térmico de 80mm e documentos em A4 (NFS-e, fechamentos). A regra `@page`
 * precisa mudar conforme o caso, por isso ela é injetada no momento da
 * impressão e removida logo depois.
 */
export type PrintMode = 'thermal' | 'document'

const PAGE_RULES: Record<PrintMode, string> = {
  thermal: '@page { size: 80mm auto; margin: 3mm; }',
  document: '@page { size: A4; margin: 12mm; }',
}

export function printArea(mode: PrintMode) {
  const style = document.createElement('style')
  style.id = 'print-page-rule'
  style.textContent = PAGE_RULES[mode]
  document.head.appendChild(style)
  document.body.classList.add(`printing-${mode}`)

  const cleanup = () => {
    document.body.classList.remove(`printing-${mode}`)
    document.getElementById('print-page-rule')?.remove()
    window.removeEventListener('afterprint', cleanup)
  }

  window.addEventListener('afterprint', cleanup)
  window.print()
  // Navegadores que não disparam afterprint (ou o cancelam) ainda são limpos.
  setTimeout(cleanup, 1500)
}
