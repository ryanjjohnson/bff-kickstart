import { NavLink, Outlet } from 'react-router-dom';
import { Button } from '@heroui/react';
import gizmoLogo from '../../assets/gizmo-logo.png';
import { useAuth } from '../../auth/AuthContext';
import { APP_ROUTES } from '../../app-routes';
import { UserProfileMenu } from './UserProfileMenu';

const NAV_LINKS = APP_ROUTES.filter((route) => route.showInNav !== false);

export function AppShell() {
  const { isAuthenticated, login, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* `dark` scopes HeroUI's own component colors (Button, Chip, ...) to its
          dark-theme values for legibility against this bar's forest-green background -
          see index.css for why the bar itself uses a literal hex rather than a
          token: it's gizmoshop's own brand green, not a semantic surface. */}
      <header className="dark sticky top-0 z-20 bg-[#0F6A44] text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <img
                src={gizmoLogo}
                alt="gizmoshop"
                className="h-20 w-20"
              />
              <span className="text-lg font-semibold tracking-tight">BFF Kickstart</span>
            </div>
            <nav className="flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'text-white/75 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <UserProfileMenu />
                <Button size="sm" variant="outline" onPress={logout}>
                  Sign out
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onPress={login}>
                Sign in
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
