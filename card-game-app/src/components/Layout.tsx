import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-icon">🃏</span>
            <span className="logo-text">CardForge</span>
          </Link>
          {!isHome && (
            <Link to="/" className="back-link">
              ← Mes jeux
            </Link>
          )}
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
