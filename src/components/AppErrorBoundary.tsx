import React from "react";

import { Button } from "@/components/ui/button";

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  errorMessage?: string;
  errorStack?: string;
  componentStack?: string;
};

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    const message = error instanceof Error ? error.message : "Error inesperado";
    const stack = error instanceof Error ? error.stack : undefined;
    return { hasError: true, errorMessage: message, errorStack: stack };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    // Keep minimal: avoid leaking sensitive data; still useful for debugging.
    console.error("App crashed:", error);
    console.error("Component stack:", errorInfo?.componentStack);
    this.setState({ componentStack: errorInfo?.componentStack || undefined });
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-[100dvh] flex items-center justify-center p-4 relative z-10">
        <section className="gradient-card shadow-card rounded-2xl p-6 w-full max-w-md border border-border">
          <header className="mb-3">
            <h1 className="text-2xl font-bold text-gold">La app no pudo abrir</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ocurrió un error al cargar. Pulsa recargar para intentarlo.
            </p>
          </header>

          {this.state.errorMessage && (
            <div className="mb-3">
              <p className="text-xs font-bold text-destructive mb-1">Error:</p>
              <pre className="text-xs whitespace-pre-wrap bg-muted/40 rounded-lg p-3 border border-border break-all">
                {this.state.errorMessage}
              </pre>
            </div>
          )}

          {this.state.errorStack && (
            <details className="mb-3">
              <summary className="text-xs font-bold text-muted-foreground cursor-pointer">Stack trace (pulsa para ver)</summary>
              <pre className="text-[10px] whitespace-pre-wrap bg-muted/40 rounded-lg p-2 mt-1 border border-border break-all max-h-40 overflow-y-auto">
                {this.state.errorStack}
              </pre>
            </details>
          )}

          {this.state.componentStack && (
            <details className="mb-3">
              <summary className="text-xs font-bold text-muted-foreground cursor-pointer">Componente (pulsa para ver)</summary>
              <pre className="text-[10px] whitespace-pre-wrap bg-muted/40 rounded-lg p-2 mt-1 border border-border break-all max-h-40 overflow-y-auto">
                {this.state.componentStack}
              </pre>
            </details>
          )}

          <div className="flex gap-3">
            <Button onClick={this.handleReload} className="gradient-gold shadow-gold w-full">
              Recargar
            </Button>
          </div>
        </section>
      </main>
    );
  }
}
