import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import RecipeCard from '../components/RecipeCard.jsx';
import { DIETS, MEAL_TYPES, useStore } from '../store/AppStore.jsx';
import { cap } from '../utils.js';

/*
 * PAGE 2 — Browse recipes
 * Purpose: find a recipe by searching, filtering and sorting.
 * Filters live in the URL, so Back and refresh keep them (memory load / user control).
 */
const TIME_OPTIONS = [
  { value: 'any', label: 'Any time' },
  { value: '15', label: '15 min or less' },
  { value: '30', label: '30 min or less' },
  { value: '45', label: '45 min or less' },
];
const SORTS = [
  { value: 'az', label: 'Name (A–Z)' },
  { value: 'quick', label: 'Quickest first' },
  { value: 'fav', label: 'Favorites first' },
];

export default function Browse() {
  const { recipes, state } = useStore();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const type = params.get('type') || 'all';
  const diets = (params.get('diet') || '').split(',').filter(Boolean);
  const max = params.get('max') || 'any';
  const sort = params.get('sort') || 'az';

  const set = (key, value) => {
    const next = new URLSearchParams(params);
    const isDefault = !value || value === 'all' || value === 'any' || (key === 'sort' && value === 'az');
    if (isDefault) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };
  const toggleDiet = (d) => set('diet', (diets.includes(d) ? diets.filter((x) => x !== d) : [...diets, d]).join(','));
  const filtersActive = q || type !== 'all' || diets.length || max !== 'any';

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = recipes.filter(
      (r) =>
        (!s || r.title.toLowerCase().includes(s) || r.ingredients.some((i) => i.name.toLowerCase().includes(s))) &&
        (type === 'all' || r.mealType === type) &&
        diets.every((d) => r.diet.includes(d)) &&
        (max === 'any' || r.time <= Number(max))
    );
    const favs = state.favorites;
    return list.sort((a, b) => {
      if (sort === 'quick') return a.time - b.time || a.title.localeCompare(b.title);
      if (sort === 'fav') return (favs.includes(b.id) - favs.includes(a.id)) || a.title.localeCompare(b.title);
      return a.title.localeCompare(b.title);
    });
  }, [recipes, q, type, diets.join(), max, sort, state.favorites]);

  return (
    <div className="page">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Recipes' }]} />
      <div className="page-head">
        <h1>Browse recipes</h1>
        <p className="muted">Search by name or ingredient — try “garlic” or “chicken”.</p>
      </div>

      <div className="filter-bar card">
        <div className="search-field">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={q}
            onChange={(e) => set('q', e.target.value)}
            placeholder="Search recipes or ingredients"
            aria-label="Search recipes"
          />
          {q && <button className="icon-btn small" onClick={() => set('q', '')} aria-label="Clear search">×</button>}
        </div>

        <div className="filter-row" role="group" aria-label="Meal type">
          {['all', ...MEAL_TYPES].map((t) => (
            <button key={t} className={'chip' + (type === t ? ' on' : '')} aria-pressed={type === t} onClick={() => set('type', t)}>
              {t === 'all' ? 'All meals' : cap(t)}
            </button>
          ))}
        </div>

        <div className="filter-row" role="group" aria-label="Diet">
          {DIETS.map((d) => (
            <button key={d} className={'chip chip-outline' + (diets.includes(d) ? ' on' : '')} aria-pressed={diets.includes(d)} onClick={() => toggleDiet(d)}>
              {diets.includes(d) ? '✓ ' : ''}{d}
            </button>
          ))}
        </div>

        <div className="filter-row filter-selects">
          <label>
            Cook time
            <select value={max} onChange={(e) => set('max', e.target.value)}>
              {TIME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label>
            Sort by
            <select value={sort} onChange={(e) => set('sort', e.target.value)}>
              {SORTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="result-bar" aria-live="polite">
        <span>
          Showing <strong>{results.length}</strong> of {recipes.length} recipes
        </span>
        {filtersActive && (
          <button className="text-link" onClick={() => setParams({}, { replace: true })}>
            Reset all filters
          </button>
        )}
      </div>

      {results.length ? (
        <div className="recipe-grid">
          {results.map((r) => <RecipeCard key={r.id} recipe={r} />)}
        </div>
      ) : (
        <div className="empty-state card">
          <div className="empty-emoji">🔍</div>
          <h2>No recipes match those filters</h2>
          <p className="muted">Try removing a diet filter or choosing a longer cook time.</p>
          <button className="btn btn-primary" onClick={() => setParams({}, { replace: true })}>Reset all filters</button>
        </div>
      )}
    </div>
  );
}
