import React, { Component, ErrorInfo, ReactNode } from 'react';
import Button from './ui/Button';
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg-main p-4">
          <Card className="text-center max-w-lg w-full">
            <CardHeader>
              <CardTitle>
                <span className="text-4xl mr-4" role="img" aria-label="Warning">⚠️</span>
                Oups ! Une erreur est survenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary mb-6">
                Quelque chose s'est mal passé. Recharger la page résout généralement le problème.
                Si l'erreur persiste, vous pouvez envisager de réinitialiser l'application.
              </p>
              <Button onClick={this.handleReload} size="lg">
                Rafraîchir la page
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;