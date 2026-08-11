import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/states'

export function NotFoundPage() {
  return (
    <div className="grid min-h-[70vh] place-items-center">
      <EmptyState
        icon={Compass}
        title="Página não encontrada"
        description="O endereço acessado não existe no sistema. Volte para o painel e continue a operação."
        action={
          <Button asChild>
            <Link to="/">Ir para o Dashboard</Link>
          </Button>
        }
      />
    </div>
  )
}
