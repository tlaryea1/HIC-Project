import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import Modal, { useConfirm } from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import { DAY_FULL, DAY_SHORT, MEALS, orderedDays, slotKey, slotLabel, useStore } from '../store/AppStore.jsx';
import { cap, todayKey } from '../utils.js';

/*
 * PAGE 6 — Weekly planner
 * Purpose: lay out the week's meals by dragging (or clicking) recipes into a 7×3 grid,
 * then turn the plan into a grocery list in one click.
 */
export default function Planner() {
  const { state, recipes, getRecipe, setSlot, restore, addGroceryItems } = useStore();
  const { show } = useToast();
  const [confirmEl, ask] = useConfirm();
  const [trayQ, setTrayQ] = useState('');
  const [picker, setPicker] = useState(null); // slot being filled by click
  const [pickerQ, setPickerQ] = useState('');
  const [dragOver, setDragOver] = useState(null);

  const days = orderedDays(state.settings.weekStart);
  const today = todayKey();
  const planned = Object.keys(state.plan).length;

  const tray = useMemo(() => {
    const s = trayQ.trim().toLowerCase();
    return recipes
      .filter((r) => r.mealType !== 'snack' && (!s || r.title.toLowerCase().includes(s)))
      .sort((a, b) => state.favorites.includes(b.id) - state.favorites.includes(a.id) || a.title.localeCompare(b.title));
  }, [recipes, trayQ, state.favorites]);

  /** Place a recipe in a slot. If dragged from another slot, move it (swapping if the target is full). */
  const place = (slot, recipeId, fromSlot) => {
    if (fromSlot === slot) return;
    const prev = state.plan;
    const recipe = getRecipe(recipeId);
    const existing = getRecipe(prev[slot]);
    const next = { ...prev, [slot]: recipeId };
    let msg;
    if (fromSlot) {
      if (existing) {
        next[fromSlot] = existing.id;
        msg = `Swapped ${slotLabel(fromSlot)} and ${slotLabel(slot)}`;
      } else {
        delete next[fromSlot];
        msg = `Moved ${recipe.title} to ${slotLabel(slot)}`;
      }
    } else {
      msg = existing && existing.id !== recipeId ? `Replaced ${existing.title} with ${recipe.title}` : `Added ${recipe.title} to ${slotLabel(slot)}`;
    }
    restore('plan', next);
    show(msg, { undo: () => restore('plan', prev) });
  };

  const removeSlot = (slot) => {
    const prev = state.plan;
    const r = getRecipe(prev[slot]);
    setSlot(slot, null);
    show(`Removed ${r?.title ?? 'meal'} from ${slotLabel(slot)}`, { undo: () => restore('plan', prev), type: 'info' });
  };

  const clearWeek = () =>
    ask(
      { title: 'Clear the whole week?', message: `All ${planned} planned meals will be removed. You can undo right after.`, confirmLabel: 'Clear week' },
      () => {
        const prev = state.plan;
        restore('plan', {});
        show('Cleared this week’s plan', { undo: () => restore('plan', prev), type: 'info' });
      }
    );

  const buildGrocery = () => {
    const target = state.settings.defaultServings;
    const items = [];
    Object.values(state.plan).forEach((id) => {
      const r = getRecipe(id);
      if (!r) return;
      const f = target / r.servings;
      r.ingredients.forEach((i) => items.push({ ...i, qty: typeof i.qty === 'number' ? i.qty * f : i.qty }));
    });
    const prev = state.grocery;
    addGroceryItems(items);
    show(`Added ingredients for ${planned} meals (${target} servings each)`, {
      undo: () => restore('grocery', prev),
      action: { label: 'View list', to: '/grocery' },
    });
  };

  const onDragStart = (e, recipeId, fromSlot) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ recipeId, fromSlot }));
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDrop = (e, slot) => {
    e.preventDefault();
    setDragOver(null);
    try {
      const { recipeId, fromSlot } = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (recipeId) place(slot, recipeId, fromSlot);
    } catch { /* not ours */ }
  };

  const pickerList = recipes.filter((r) => !pickerQ || r.title.toLowerCase().includes(pickerQ.toLowerCase()));
  const pickerMeal = picker?.split('-')[1];

  return (
    <div className="page page-wide">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Planner' }]} />
      <div className="page-head row-between">
        <div>
          <h1>Weekly planner</h1>
          <p className="muted">Drag a recipe onto a slot, or click <strong>+</strong> to pick one. Drag between slots to move or swap.</p>
        </div>
        <div className="row-gap">
          <span className="pill">{planned} / 21 meals planned</span>
          <button className="btn" onClick={buildGrocery} disabled={!planned} title={planned ? '' : 'Plan at least one meal first'}>🛒 Build grocery list</button>
          <button className="btn btn-danger-ghost" onClick={clearWeek} disabled={!planned}>Clear week</button>
        </div>
      </div>

      <div className="planner-layout">
        <aside className="tray card" aria-label="Recipe tray">
          <h2 className="small-heading">Recipes</h2>
          <input type="search" placeholder="Filter…" value={trayQ} onChange={(e) => setTrayQ(e.target.value)} aria-label="Filter recipe tray" />
          <p className="muted tiny">♥ favorites are listed first</p>
          <ul className="tray-list">
            {tray.map((r) => (
              <li key={r.id} draggable onDragStart={(e) => onDragStart(e, r.id, null)} className="tray-item" title="Drag onto the planner">
                <span>{r.emoji}</span>
                <span className="tray-title">{r.title}</span>
                {state.favorites.includes(r.id) && <span className="fav-dot" aria-label="favorite">♥</span>}
              </li>
            ))}
            {!tray.length && <li className="muted small">No matches</li>}
          </ul>
        </aside>

        <div className="planner-scroll">
          <div className="planner-grid" style={{ '--cols': days.length }}>
            <div className="pg-corner" />
            {days.map((d) => (
              <div key={d} className={'pg-day' + (d === today ? ' today' : '')}>
                {DAY_SHORT[d]}
                {d === today && <span className="today-tag">Today</span>}
              </div>
            ))}
            {MEALS.map((m) => (
              <PlannerRow key={m} meal={m} days={days} today={today}
                plan={state.plan} getRecipe={getRecipe} dragOver={dragOver} setDragOver={setDragOver}
                onDrop={onDrop} onDragStart={onDragStart} onRemove={removeSlot}
                onPick={(slot) => { setPicker(slot); setPickerQ(''); }} />
            ))}
          </div>
        </div>
      </div>

      <Modal open={!!picker} title={picker ? `Choose a recipe for ${slotLabel(picker)}` : ''} onClose={() => setPicker(null)} wide>
        <input type="search" placeholder="Search recipes…" value={pickerQ} onChange={(e) => setPickerQ(e.target.value)} aria-label="Search recipes" />
        <ul className="picker-list">
          {pickerList
            .sort((a, b) => (b.mealType === pickerMeal) - (a.mealType === pickerMeal))
            .map((r) => (
              <li key={r.id}>
                <button onClick={() => { place(picker, r.id, null); setPicker(null); }}>
                  <span>{r.emoji}</span>
                  <span className="picker-title">{r.title}</span>
                  <span className="muted small">{cap(r.mealType)} · {r.time} min</span>
                  {r.mealType === pickerMeal && <span className="tag">suggested</span>}
                </button>
              </li>
            ))}
        </ul>
      </Modal>
      {confirmEl}
    </div>
  );
}

function PlannerRow({ meal, days, today, plan, getRecipe, dragOver, setDragOver, onDrop, onDragStart, onRemove, onPick }) {
  return (
    <>
      <div className="pg-meal">{cap(meal)}</div>
      {days.map((d) => {
        const slot = slotKey(d, meal);
        const r = getRecipe(plan[slot]);
        const cls = 'pg-slot' + (d === today ? ' today' : '') + (dragOver === slot ? ' drag-over' : '') + (r ? ' filled' : '');
        return (
          <div key={slot} className={cls}
            onDragOver={(e) => { e.preventDefault(); setDragOver(slot); }}
            onDragLeave={() => setDragOver((s) => (s === slot ? null : s))}
            onDrop={(e) => onDrop(e, slot)}>
            {r ? (
              <div className="slot-card" draggable onDragStart={(e) => onDragStart(e, r.id, slot)} title="Drag to move">
                <Link to={`/recipes/${r.id}`} className="slot-link">
                  <span className="slot-emoji">{r.emoji}</span>
                  <span className="slot-title">{r.title}</span>
                </Link>
                <button className="slot-remove" onClick={() => onRemove(slot)} aria-label={`Remove ${r.title} from ${DAY_FULL[d]} ${meal}`}>×</button>
              </div>
            ) : (
              <button className="slot-add" onClick={() => onPick(slot)} aria-label={`Add a recipe to ${DAY_FULL[d]} ${meal}`}>+</button>
            )}
          </div>
        );
      })}
    </>
  );
}
