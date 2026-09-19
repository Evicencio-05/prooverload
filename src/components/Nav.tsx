import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../state/AppState';

const items = [
  { to: '/', label: 'Log', match: (p: string) => p === '/' },
  { to: '/history', label: 'History', match: (p: string) => p.startsWith('/history') },
  { to: '/body', label: 'Body', match: (p: string) => p.startsWith('/body') },
  { to: '/goals', label: 'Goals', match: (p: string) => p.startsWith('/goals') },
  { to: '/you', label: 'You', match: (p: string) => p.startsWith('/you') || p.startsWith('/library') },
];

export function Nav() {
  const { pending, online } = useApp();
  const { pathname } = useLocation();
  return (
    <nav className="tabbar" aria-label="Primary">
      {!online || pending > 0 ? (
        <div className="sync-pill" role="status">
          {!online ? 'Offline — sets queue locally' : `${pending} waiting to sync`}
        </div>
      ) : null}
      <div className="tabbar-row">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={() => (item.match(pathname) ? 'tab on' : 'tab')}
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
