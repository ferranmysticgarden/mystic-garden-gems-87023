import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="min-h-[100dvh] flex items-center justify-center p-6">
      <section className="gradient-card shadow-card rounded-2xl p-8 max-w-md w-full border border-border text-center">
        <h1 className="text-4xl font-bold text-gold mb-3">404</h1>
        <p className="text-muted-foreground mb-6">Oops! Page not found</p>
        <Link className="text-gold hover:underline" to="/">
          Volver al inicio
        </Link>
      </section>
    </main>
  );
};

export default NotFound;
