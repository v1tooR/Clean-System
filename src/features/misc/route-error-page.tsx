import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/shared/states'
import { NotFoundPage } from './not-found-page'

/**
 * Fronteira de erro das rotas. Falhas inesperadas não derrubam a operação:
 * o atendente vê o que aconteceu e consegue voltar ao painel.
 */
export function RouteErrorPage() {
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />
  }

  const message =
    error instanceof Error
      ? error.message
      : 'Não foi possível carregar esta tela. Tente novamente ou volte ao painel.'

  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="w-full max-w-md space-y-3">
        <ErrorState
          title="Algo deu errado"
          description={message}
          onRetry={() => window.location.reload()}
        />
        <div className="flex justify-center">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">Voltar ao Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
