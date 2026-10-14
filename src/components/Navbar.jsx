import { Link, NavLink } from 'react-router-dom';
import { useStore } from '../store/AppStore.jsx';
import { modKey } from '../utils.js';

/* Golden rule: Consistency — the same nav, in the same place, with the same labels on every page. */
const LINKS = [
  { to: '/', label: 'Home', key: 'H', end: true },
  { to: '/recipes', label: 'Recipes', key: 'R' },
  { to: '/planner', label: 'Planner', key: 'P' },
  { to: '/grocery', label: 'Grocery', key: 'L' },
  { to: '/favorites', label: 'Favorites', key: 'F' },
];

export default function Navbar({ onSearch }) {
  const { state } = useStore();
  const groceryLeft = state.grocery.filter((i) => !i.checked).length;
  const badges = { '/grocery': groceryLeft, '/favorites': state.favorites.length };

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand" aria-label="Mise home">
          <span aria-hidden="true">🍳</span> Mise
        </Link>
        <nav className="nav-links" aria-label="Main">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              title={`${l.label} (${l.key})`}
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
            >
              {l.label}
              {badges[l.to] > 0 && <span className="badge">{badges[l.to]}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="nav-actions">
          <button className="search-btn" onClick={onSearch} title="Search (/)">
            <span aria-hidden="true">⌕</span> Search <kbd>{modKey} K</kbd>
          </button>
          <Link to="/new" className="btn btn-primary btn-sm" title="New recipe (N)">+ New recipe</Link>
          <NavLink
            to="/settings"
            title="Settings (S)"
            aria-label="Settings"
            className={({ isActive }) => 'icon-btn nav-settings' + (isActive ? ' active' : '')}
          >
            ⚙
          </NavLink>
        </div>
      </div>
    </header>
  );
}
