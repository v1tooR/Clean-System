import * as React from 'react'
import { Building2, Clock, Printer, Save, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, Separator, Switch } from '@/components/ui/misc'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePageHeader } from '@/components/layout/header-slot'
import { useDataStore } from '@/store/data-store'
import { useUIStore } from '@/store/ui-store'
import { teamMembers } from '@/data/system'
import { formatCNPJ, formatPhone } from '@/lib/format'
import type { CompanyProfile } from '@/types'

function Section({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex items-start gap-3 border-b border-border px-4 py-3.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </span>
        <div>
          <h2 className="text-[13px] font-semibold">{title}</h2>
          <p className="text-[12px] text-muted-foreground">{description}</p>
        </div>
      </header>
      <div className="p-4">{children}</div>
    </section>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (value: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md px-1 py-2.5 transition-colors hover:bg-accent/40">
      <span className="min-w-0">
        <span className="block text-[13px] font-medium">{label}</span>
        <span className="block text-[12px] text-muted-foreground">{description}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  )
}

export function SettingsPage() {
  const company = useDataStore((state) => state.company)
  const settings = useDataStore((state) => state.settings)
  const updateCompany = useDataStore((state) => state.updateCompany)
  const updateSettings = useDataStore((state) => state.updateSettings)
  const setSidebarCollapsed = useUIStore((state) => state.setSidebarCollapsed)

  const [draft, setDraft] = React.useState<CompanyProfile>(company)
  const dirty = JSON.stringify(draft) !== JSON.stringify(company)

  usePageHeader(
    {
      title: 'Configurações',
      description: 'Dados da empresa, equipe e operação',
      actions: dirty ? (
        <Button
          className="gap-2"
          onClick={() => {
            updateCompany(draft)
            toast.success('Configurações salvas', {
              description: 'Os dados aparecem nos comprovantes e notas fiscais.',
            })
          }}
        >
          <Save className="size-4" />
          Salvar alterações
        </Button>
      ) : null,
    },
    [dirty, draft],
  )

  return (
    <div className="mx-auto max-w-4xl">
      <Tabs defaultValue="empresa">
        <TabsList>
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="operacao">Operação</TabsTrigger>
          <TabsTrigger value="equipe">Equipe</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="space-y-3">
          <Section
            title="Dados da empresa"
            description="Utilizados no comprovante térmico e na emissão da NFS-e"
            icon={Building2}
          >
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nome fantasia</Label>
                <Input
                  value={draft.tradeName}
                  onChange={(event) => setDraft({ ...draft, tradeName: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Razão social</Label>
                <Input
                  value={draft.legalName}
                  onChange={(event) => setDraft({ ...draft, legalName: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>CNPJ</Label>
                <Input
                  value={draft.cnpj}
                  onChange={(event) =>
                    setDraft({ ...draft, cnpj: formatCNPJ(event.target.value) })
                  }
                  className="tabular"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Inscrição municipal</Label>
                <Input
                  value={draft.municipalRegistration}
                  onChange={(event) =>
                    setDraft({ ...draft, municipalRegistration: event.target.value })
                  }
                  className="tabular"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input
                  value={draft.phone}
                  onChange={(event) =>
                    setDraft({ ...draft, phone: formatPhone(event.target.value) })
                  }
                  className="tabular"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cidade / UF</Label>
                <Input
                  value={draft.city}
                  onChange={(event) => setDraft({ ...draft, city: event.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Endereço</Label>
                <Input
                  value={draft.address}
                  onChange={(event) => setDraft({ ...draft, address: event.target.value })}
                />
              </div>
            </div>
          </Section>

          <Section
            title="Configuração fiscal"
            description="Parâmetros usados na NFS-e de serviços de lavanderia"
            icon={Printer}
          >
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Regime tributário</Label>
                <Input
                  value={draft.taxRegime}
                  onChange={(event) => setDraft({ ...draft, taxRegime: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Alíquota de ISS (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={draft.issRate}
                  onChange={(event) =>
                    setDraft({ ...draft, issRate: Number(event.target.value) || 0 })
                  }
                  className="tabular"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Código de serviço</Label>
                <Input
                  value={draft.serviceCode}
                  onChange={(event) => setDraft({ ...draft, serviceCode: event.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Chave Pix para cobranças</Label>
                <Input
                  value={settings.pixKey}
                  onChange={(event) => updateSettings({ pixKey: event.target.value })}
                  className="tabular"
                />
              </div>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="operacao" className="space-y-3">
          <Section
            title="Rotina do balcão"
            description="Prazos e automações aplicados a cada atendimento"
            icon={Clock}
          >
            <div className="grid gap-3.5 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Prazo padrão (dias)</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={settings.defaultLeadTimeDays}
                  onChange={(event) =>
                    updateSettings({ defaultLeadTimeDays: Number(event.target.value) || 1 })
                  }
                  className="tabular"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Abertura</Label>
                <Input
                  type="time"
                  value={settings.openingHour}
                  onChange={(event) => updateSettings({ openingHour: event.target.value })}
                  className="tabular"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fechamento</Label>
                <Input
                  type="time"
                  value={settings.closingHour}
                  onChange={(event) => updateSettings({ closingHour: event.target.value })}
                  className="tabular"
                />
              </div>
            </div>

            <Separator className="my-3" />

            <div className="space-y-0.5">
              <ToggleRow
                label="Destacar impressão do comprovante"
                description="Coloca a via térmica em evidência ao concluir o atendimento"
                checked={settings.autoPrintReceipt}
                onCheckedChange={(value) => updateSettings({ autoPrintReceipt: value })}
              />
              <ToggleRow
                label="Emitir NFS-e automaticamente"
                description="Transmite a nota assim que o pagamento é confirmado"
                checked={settings.autoIssueInvoice}
                onCheckedChange={(value) => updateSettings({ autoIssueInvoice: value })}
              />
              <ToggleRow
                label="Menu lateral recolhido"
                description="Inicia o sistema com a barra lateral compacta"
                checked={settings.sidebarCollapsedByDefault}
                onCheckedChange={(value) => {
                  updateSettings({ sidebarCollapsedByDefault: value })
                  setSidebarCollapsed(value)
                }}
              />
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="equipe">
          <Section
            title="Equipe"
            description="Quem opera o sistema na lavanderia"
            icon={Users}
          >
            <ul className="divide-y divide-border/70">
              {teamMembers.map((member) => (
                <li key={member.id} className="flex items-center gap-3 py-3">
                  <Avatar>
                    <AvatarFallback>{member.initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium">{member.name}</p>
                    <p className="truncate text-[12px] text-muted-foreground">{member.email}</p>
                  </div>
                  <Badge variant={member.role === 'Proprietária' ? 'default' : 'neutral'} size="sm">
                    {member.role}
                  </Badge>
                </li>
              ))}
            </ul>
            <p className="mt-3 rounded-md border border-border bg-muted/40 p-3 text-[12px] text-muted-foreground">
              O controle de acesso por usuário será liberado quando o sistema estiver conectado ao
              backend. Nesta versão todos os perfis compartilham as mesmas permissões.
            </p>
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  )
}
