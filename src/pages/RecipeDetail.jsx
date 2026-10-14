import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import Modal, { useConfirm } from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import { DAY_FULL, MEALS, orderedDays, slotKey, slotLabel, useStore } from '../store/AppStore.jsx';
import { cap, formatAmount, todayKey } from '../utils.js';

/*
 * PAGE 3 — Recipe detail
 * Purpose: read a recipe, scale it, and act on it (favorite, plan it, shop for it).
 */
export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const store = useStore();
  const { state, getRecipe, addRecent, toggleFavorite, setSlot, addGroceryItems, restore, deleteUserRecipe, replaceState } = store;
  const { show } = useToast();
  const [confirmEl, ask] = useConfirm();
  const recipe = getRecipe(id);

  const [servings, setServings] = useState(recipe?.servings || 2);
  const [planOpen, setPlanOpen] = useState(false);
  const [day, setDay] = useState(todayKey());
  const [meal, setMeal] = useState('dinner');

  useEffect(() => {
    if (!recipe) return;
    addRecent(recipe.id);
    setServings(recipe.servings);
    setMeal(MEALS.includes(recipe.mealType) ? recipe.mealType : 'dinner');
  }, [recipe?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!recipe) {
    return (
      <div className="page empty-state">
        <div className="empty-emoji">🥄</div>
        <h1>Recipe not found</h1>
        <p className="muted">It may have been deleted.</p>
        <Link to="/recipes" className="btn btn-primary">Back to recipes</Link>
      </div>
    );
  }

  const factor = servings / recipe.servings;
  const fav = state.favorites.includes(recipe.id);
  const slot = slotKey(day, meal);
  const occupant = getRecipe(state.plan[slot]);

  const onFav = () => {
    toggleFavorite(recipe.id);
    show(fav ? 'Removed from favorites' : 'Saved to favorites', { undo: () => toggleFavorite(recipe.id), type: fav ? 'info' : 'success' });
  };

  const onAddToGrocery = () => {
    const prev = state.grocery;
    addGroceryItems(recipe.ingredients.map((i) => ({ ...i, qty: typeof i.qty === 'number' ? i.qty * factor : i.qty })));
    show(`Added ${recipe.ingredients.length} ingredients (for ${servings}) to your grocery list`, {
      undo: () => restore('grocery', prev),
      action: { label: 'View list', to: '/grocery' },
    });
  };

  const onPlan = () => {
    const prev = state.plan;
    setSlot(slot, recipe.id);
    setPlanOpen(false);
    show(
      occupant && occupant.id !== recipe.id
        ? `Replaced ${occupant.title} on ${slotLabel(slot)}`
        : `Planned for ${slotLabel(slot)}`,
      { undo: () => restore('plan', prev), action: { label: 'View planner', to: '/planner' } }
    );
  };

  const onDelete = () =>
    ask(
      {
        title: 'Delete this recipe?',
        message: `“${recipe.title}” will be removed from your recipes, favorites and planner. You can undo right after.`,
        confirmLabel: 'Delete recipe',
      },
      () => {
        const snapshot = state;
        deleteUserRecipe(recipe.id);
        navigate('/recipes');
        show(`Deleted “${recipe.title}”`, { undo: () => replaceState(snapshot), type: 'info' });
      }
    );

  return (
    <div className="page">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Recipes', to: '/recipes' }, { label: recipe.title }]} />

      <section className="detail-hero card">
        <div className="detail-art" aria-hidden="true">{recipe.emoji}</div>
        <div className="detail-info">
          <h1>{recipe.title}</h1>
          <p className="meta">
            {cap(recipe.mealType)} · {recipe.time} min · Serves {recipe.servings}
          </p>
          <div className="tags">
            {recipe.diet.map((d) => <span key={d} className="tag">{d}</span>)}
            {recipe.custom && <span className="tag tag-accent">your recipe</span>}
          </div>
          <div className="detail-actions">
            <button className="btn btn-primary" onClick={() => setPlanOpen(true)}>🗓 Add to planner</button>
            <button className="btn" onClick={onAddToGrocery}>🛒 Add to grocery list</button>
            <button className={'btn' + (fav ? ' btn-fav-on' : '')} onClick={onFav} aria-pressed={fav}>
              {fav ? '♥ Saved' : '♡ Save'}
            </button>
            {recipe.custom && <button className="btn btn-danger-ghost" onClick={onDelete}>Delete</button>}
          </div>
        </div>
      </section>

      <div className="detail-cols">
        <section className="card">
          <div className="section-head">
            <h2>Ingredients</h2>
            <div className="stepper" aria-label="Servings">
              <button className="icon-btn" onClick={() => setServings((s) => s - 1)} disabled={servings <= 1} aria-label="Fewer servings">−</button>
              <span><strong>{servings}</strong> {servings === 1 ? 'serving' : 'servings'}</span>
              <button className="icon-btn" onClick={() => setServings((s) => s + 1)} disabled={servings >= 12} aria-label="More servings">+</button>
            </div>
          </div>
          {servings !== recipe.servings && (
            <p className="note">
              Scaled from {recipe.servings} servings.{' '}
              <button className="text-link" onClick={() => setServings(recipe.servings)}>Reset</button>
            </p>
          )}
          <ul className="ingredient-list">
            {recipe.ingredients.map((i) => (
              <li key={i.name}>
                <span className="amt">{formatAmount(typeof i.qty === 'number' ? i.qty * factor : i.qty, i.unit)}</span>
                <span>{i.name}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2>Steps</h2>
          <ol className="step-list">
            {recipe.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </section>
      </div>

      <Modal
        open={planOpen}
        title={`Add “${recipe.title}” to your planner`}
        onClose={() => setPlanOpen(false)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setPlanOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={onPlan}>{occupant && occupant.id !== recipe.id ? 'Replace meal' : 'Add to planner'}</button>
          </>
        }
      >
        <div className="form-grid">
          <label className="field">
            <span>Day</span>
            <select value={day} onChange={(e) => setDay(e.target.value)}>
              {orderedDays(state.settings.weekStart).map((d) => (
                <option key={d} value={d}>{DAY_FULL[d]}{d === todayKey() ? ' (today)' : ''}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Meal</span>
            <select value={meal} onChange={(e) => setMeal(e.target.value)}>
              {MEALS.map((m) => <option key={m} value={m}>{cap(m)}</option>)}
            </select>
          </label>
        </div>
        {occupant && occupant.id !== recipe.id && (
          <p className="warning-box">⚠ {DAY_FULL[day]} {meal} already has <strong>{occupant.title}</strong>. Adding this will replace it.</p>
        )}
        {occupant && occupant.id === recipe.id && <p className="note">This recipe is already planned for that slot.</p>}
      </Modal>
      {confirmEl}
    </div>
  );
}
