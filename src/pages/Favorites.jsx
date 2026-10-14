import { useState } from 'react';
import { Link } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import { useConfirm } from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import { useStore } from '../store/AppStore.jsx';
import { cap } from '../utils.js';

/*
 * PAGE 4 — Favorites
 * Purpose: manage your saved collection — review, remove, and send favorites into the week.
 */
export default function Favorites() {
  const { state, getRecipe, toggleFavorite, restore, setSlot } = useStore();
  const { show } = useToast();
  const [confirmEl, ask] = useConfirm();
  const [sort, setSort] = useState('recent');

  const list = state.favorites.map(getRecipe).filter(Boolean);
  if (sort === 'recent') list.reverse();
  if (sort === 'az') list.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === 'quick') list.sort((a, b) => a.time - b.time);

  const plannedCount = (id) => Object.values(state.plan).filter((v) => v === id).length;

  const remove = (r) => {
    const prev = state.favorites;
    toggleFavorite(r.id);
    show(`Removed “${r.title}” from favorites`, { undo: () => restore('favorites', prev), type: 'info' });
  };

  const clearAll = () =>
    ask(
      { title: 'Remove all favorites?', message: `This removes all ${list.length} saved recipes from Favorites. The recipes themselves aren't deleted.`, confirmLabel: 'Remove all' },
      () => {
        const prev = state.favorites;
        restore('favorites', []);
        show('Cleared your favorites', { undo: () => restore('favorites', prev), type: 'info' });
      }
    );

  // Fill the first open dinner slot of the week with this favorite.
  const quickPlan = (r) => {
    const days = state.settings.weekStart === 'sun' ? ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const meal = ['breakfast', 'lunch', 'dinner'].includes(r.mealType) ? r.mealType : 'dinner';
    const day = days.find((d) => !state.plan[`${d}-${meal}`]);
    if (!day) {
      show(`Every ${meal} this week is already planned.`, { type: 'warning', action: { label: 'Open planner', to: '/planner' } });
      return;
    }
    const prev = state.plan;
    setSlot(`${day}-${meal}`, r.id);
    show(`Planned “${r.title}” for ${cap(day)} ${meal}`, { undo: () => restore('plan', prev), action: { label: 'View planner', to: '/planner' } });
  };

  return (
    <div className="page">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Favorites' }]} />
      <div className="page-head row-between">
        <div>
          <h1>Favorites</h1>
          <p className="muted">{list.length ? `${list.length} saved ${list.length === 1 ? 'recipe' : 'recipes'}` : 'Your saved recipes live here.'}</p>
        </div>
        {list.length > 0 && (
          <div className="row-gap">
            <label className="inline-select">
              Sort
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="recent">Recently saved</option>
                <option value="az">Name (A–Z)</option>
                <option value="quick">Quickest first</option>
              </select>
            </label>
            <button className="btn btn-danger-ghost" onClick={clearAll}>Remove all</button>
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-emoji">♡</div>
          <h2>No favorites yet</h2>
          <p className="muted">Tap the ♡ on any recipe to save it here for quick access.</p>
          <Link to="/recipes" className="btn btn-primary">Browse recipes</Link>
        </div>
      ) : (
        <ul className="fav-list">
          {list.map((r) => {
            const n = plannedCount(r.id);
            return (
              <li key={r.id} className="fav-row card">
                <Link to={`/recipes/${r.id}`} className="fav-main">
                  <span className="fav-emoji">{r.emoji}</span>
                  <span>
                    <strong>{r.title}</strong>
                    <span className="meta">{cap(r.mealType)} · {r.time} min</span>
                  </span>
                </Link>
                <span className={'pill' + (n ? ' pill-ok' : '')}>{n ? `Planned ×${n}` : 'Not planned'}</span>
                <div className="row-gap">
                  <button className="btn btn-sm" onClick={() => quickPlan(r)} title="Put it in the next open slot">+ Plan next open {['breakfast', 'lunch', 'dinner'].includes(r.mealType) ? r.mealType : 'dinner'}</button>
                  <button className="icon-btn" onClick={() => remove(r)} aria-label={`Remove ${r.title} from favorites`} title="Remove from favorites">♥</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {confirmEl}
    </div>
  );
}
