import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/AppStore.jsx';

/* Golden rule: Shortcuts for frequent users — jump to any recipe or page from the keyboard. */
const PAGES = [
  { label: 'Home', to: '/', emoji: '🏠' },
  { label: 'Browse recipes', to: '/recipes', emoji: '📖' },
  { label: 'Weekly planner', to: '/planner', emoji: '🗓' },
  { label: 'Grocery list', to: '/grocery', emoji: '🛒' },
  { label: 'Favorites', to: '/favorites', emoji: '♥' },
  { label: 'New recipe', to: '/new', emoji: '＋' },
  { label: 'Settings', to: '/settings', emoji: '⚙' },
];

export default function CommandPalette({ open, onClose }) {
  const { recipes } = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
    }
  }, [open]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const pages = PAGES.filter((p) => p.label.toLowerCase().includes(s)).map((p) => ({ ...p, kind: 'Page' }));
    const recs = recipes
      .filter((r) => !s || r.title.toLowerCase().includes(s) || r.ingredients.some((i) => i.name.toLowerCase().includes(s)))
      .slice(0, 8)
      .map((r) => ({ label: r.title, to: `/recipes/${r.id}`, emoji: r.emoji, kind: `${r.time} min` }));
    return s ? [...recs, ...pages] : [...pages, ...recs.slice(0, 4)];
  }, [q, recipes]);

  useEffect(() => setActive(0), [q]);

  if (!open) return null;

  const go = (r) => {
    if (!r) return;
    navigate(r.to);
    onClose();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      go(results[active]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop palette-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Search">
        <input
          autoFocus
          className="palette-input"
          placeholder="Search recipes, ingredients or pages…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="Search"
        />
        <ul className="palette-list" role="listbox">
          {results.length === 0 && <li className="palette-empty">No matches for “{q}”. Try an ingredient like “garlic”.</li>}
          {results.map((r, i) => (
            <li
              key={r.to}
              role="option"
              aria-selected={i === active}
              className={'palette-item' + (i === active ? ' active' : '')}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(r)}
            >
              <span className="palette-emoji">{r.emoji}</span>
              <span className="palette-label">{r.label}</span>
              <span className="palette-kind">{r.kind}</span>
            </li>
          ))}
        </ul>
        <div className="palette-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
          <span><kbd>Enter</kbd> open</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
