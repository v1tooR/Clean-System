# Clean System · Gestão de Lavanderia

Front-end completo de um sistema interno de gestão para lavanderia. Substitui o
controle em talões de papel e cobre todo o fluxo do balcão:

> Cliente → Peças → Serviços → Valor → Pagamento → NFS-e → Comprovante → Acompanhamento → Entrega

Não existe área do cliente: a operação inteira é feita pela equipe da lavanderia.

## Rodando

```bash
npm install
```

```bash
npm run dev
```

A aplicação sobe em `http://localhost:5173`. Não há backend: todos os dados são
simulados em memória com latência artificial.

Outros scripts:

| Script | O que faz |
| --- | --- |
| `npm run build` | Typecheck + build de produção |
| `npm run preview` | Serve o build gerado |
| `npm run lint` | Apenas o typecheck (`tsc --noEmit`) |

## Stack

Vite · React 18 · TypeScript · Tailwind CSS · shadcn/ui (Radix UI) · Lucide ·
React Router · React Hook Form · Zod · Zustand · TanStack Table · Recharts ·
date-fns · Framer Motion (microinterações) · Sonner · dnd-kit (Kanban).

## Arquitetura

```
src/
  components/
    ui/          primitivas (button, dialog, sheet, select, command…)
    shared/      blocos reutilizáveis (DataTable, MetricCard, Stepper…)
    layout/      AppShell, sidebar, header, command menu
  features/      uma pasta por domínio de tela
    dashboard/ new-order/ orders/ customers/ catalog/
    payments/ billing/ invoices/ reports/ settings/
  store/         estado (Zustand) + seletores derivados
  services/      camada de acesso a dados — o único ponto que muda com backend
  data/          dados simulados (catálogo, clientes, seed de OS)
  types/         modelo de domínio
  lib/           formatação pt-BR, validadores, impressão, ícones
  styles/        tokens de design + base Tailwind
```

**Separação de responsabilidades**

- `types/` é o contrato entre tudo. Nada de tipos soltos nas telas.
- `data/` gera a base inicial com um PRNG determinístico — a cada carregamento
  os dados são os mesmos, sempre relativos à data de hoje.
- `store/data-store.ts` guarda o estado e as mutações (criar OS, mudar situação,
  registrar pagamento, fechar ciclo…). `store/selectors.ts` concentra os
  cálculos derivados (métricas, Kanban, faturamento, ranking).
- `services/` simula o que hoje seria rede: cobrança Pix, emissão de NFS-e,
  exportações. **Ao plugar uma API real (própria ou Supabase), somente esta
  pasta muda** — as telas continuam consumindo as mesmas assinaturas assíncronas.
- `components/` não conhece regra de negócio; recebe dados prontos.

## Design system

Toda a identidade vive em tokens CSS (`src/styles/globals.css`) e é exposta ao
Tailwind em `tailwind.config.js`. Nenhum componente usa cor hexadecimal direta.

Tokens: `background`, `foreground`, `card` / `card-elevated`, `popover`,
`primary` (vinho/rose), `secondary`, `muted`, `accent`, `border`, `input`,
`ring`, `success`, `warning`, `destructive`, `info`, `sidebar*`, `chart-1..5`,
`radius`, `shadow-xs..lg` e `shadow-glow`.

Trocar a cor da marca é alterar `--primary` e `--ring`.

## O que está implementado

- **Dashboard** — indicadores com comparativo, Kanban operacional (arrastar entre
  colunas **ou** menu de ações, com confirmação ao entregar com pendência) e
  painéis de atenção, retiradas, pendências financeiras e atividade recente.
- **Novo atendimento** — stepper de 8 etapas: cliente (busca instantânea por
  nome/CPF/CNPJ/telefone e cadastro sem sair do fluxo), peças (`+/-` e
  observações como mancha ou botão faltando), serviços por peça com preço,
  resumo com desconto/acréscimo/prazo, pagamento (Pix com QR Code e confirmação
  automática, débito/crédito registrados da maquininha, dinheiro com troco,
  deixar em aberto, faturar para PJ), NFS-e com estados de emissão, comprovante
  térmico 80 mm e conclusão.
- **Atendimentos** — TanStack Table com busca, período, filtros de situação,
  pagamento e método, ordenação, paginação, visibilidade de colunas e Detail
  Drawer com dados, itens, financeiro, nota e timeline completa.
- **Clientes** — PF e PJ separados, drawer com histórico, total gasto,
  pendências e condições de faturamento. Formulários validados com Zod,
  incluindo dígito verificador de CPF/CNPJ.
- **Peças e serviços** — tabela de preços editável direto na lista, cadastro de
  peças com ícone/categoria/prazo e ativação de serviços.
- **Pagamentos** — visão financeira com recebido hoje/período, pendências e
  registro de recebimento a partir da própria tabela.
- **Faturamento PJ** — acúmulo por empresa, resumo consolidado antes de
  confirmar, geração de fechamento e baixa de pagamento.
- **Notas fiscais** — acompanhamento das NFS-e, visualização do documento,
  download real do XML, reenvio de rejeição e cancelamento.
- **Relatórios** — faturamento diário, formas de pagamento, ranking de peças e
  serviços, com exportação CSV para a contadora.
- **Configurações** — dados da empresa (usados no comprovante e na nota),
  parâmetros fiscais, rotina do balcão e equipe.

Atalhos: `Ctrl/⌘ K` busca global · `N` novo atendimento · `B` recolher a sidebar.

## Impressão

O comprovante térmico e os documentos A4 compartilham a classe `.print-area`.
A regra `@page` correta (80 mm ou A4) é injetada em tempo de execução por
`src/lib/print.ts` antes de chamar `window.print()`.

## Fora do escopo

Área do cliente, WhatsApp automatizado, conciliação bancária, sistema contábil,
múltiplos CNPJs ou unidades, integração direta com a Moderninha, app nativo,
backend e banco de dados. O front-end apenas está preparado arquiteturalmente
para essas integrações.
