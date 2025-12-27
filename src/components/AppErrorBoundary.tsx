import React from "react";

import { Button } from "@/components/ui/button";

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  errorMessage?: string;
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
    return { hasError: true, errorMessage: message };
  }

  componentDidCatch(error: unknown) {
    // Keep minimal: avoid leaking sensitive data; still useful for debugging.
    console.error("App crashed:", error);
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
            <pre className="text-xs whitespace-pre-wrap bg-muted/40 rounded-lg p-3 mb-4 border border-border">
              {this.state.errorMessage}
            </pre>
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
