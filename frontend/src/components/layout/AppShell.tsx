import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Button } from '@heroui/react';
import gizmoLogo from '../../assets/gizmo-logo.png';
import { useAuth } from '../../auth/AuthContext';
import { APP_ROUTES } from '../../app-routes';
import { UserProfileMenu } from './UserProfileMenu';

const NAV_LINKS = APP_ROUTES.filter((route) => route.showInNav !== false);

function navLinkClasses(isActive: boolean, block = false) {
  return `${block ? 'block ' : ''}rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-white/15 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
  }`;
}

export function AppShell() {
  const { isAuthenticated, login, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* `dark` scopes HeroUI's own component colors (Button, Chip, ...) to its
          dark-theme values for legibility against this bar's forest-green background -
          see index.css for why the bar itself uses a literal hex rather than a
          token: it's gizmoshop's own brand green, not a semantic surface. */}
      <header className="dark sticky top-0 z-20 bg-[#0F6A44] text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-4 xl:gap-8">
            <div className="flex items-center gap-3">
              <img
                src={gizmoLogo}
                alt="gizmoshop"
                className="h-12 w-12 xl:h-20 xl:w-20"
              />
              {/* On phone widths the signed-in header can't fit wordmark + user menu +
                  sign-out + menu toggle; the logo alone carries the identity there. */}
              <span className="hidden whitespace-nowrap text-lg font-semibold tracking-tight sm:inline">
                BFF Kickstart
              </span>
            </div>
            {/* Inline nav only where all links genuinely fit; below lg it moves into
                the disclosure panel to stop links colliding with the title or
                overflowing off-screen. */}
            <nav className="hidden items-center gap-1 lg:flex">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end
                  className={({ isActive }) => navLinkClasses(isActive)}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
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
            <button
              type="button"
              className="rounded-lg p-2 text-white/85 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                {menuOpen ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="mx-auto max-w-6xl border-t border-white/15 px-4 pb-3 pt-2 sm:px-6 lg:hidden">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end
                className={({ isActive }) => navLinkClasses(isActive, true)}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <Outlet />
      </main>
      {/* The header's quieter sibling: same brand green, but as a translucent
          tint over the page background so it reads as chrome, not content. */}
      <footer className="border-t border-[#0F6A44]/20 bg-[#0F6A44]/10">
        <div className="mx-auto max-w-6xl px-6 py-3 text-sm text-foreground/70">
          Application Version: <span className="font-mono">{__APP_VERSION__}</span>
        </div>
      </footer>
    </div>
  );
}
