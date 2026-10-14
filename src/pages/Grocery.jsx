import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import { useConfirm } from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import { CATEGORIES, useStore } from '../store/AppStore.jsx';
import { formatAmount, norm } from '../utils.js';

/*
 * PAGE 7 — Grocery list
 * Purpose: a shopping checklist grouped by store aisle. Add items, check them off, clear them.
 */
export default function Grocery() {
  const { state, recipes, addGroceryItems, toggleGrocery, removeGrocery, restore } = useStore();
  const { show } = useToast();
  const [confirmEl, ask] = useConfirm();
  const nameRef = useRef(null);

  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [category, setCategory] = useState('Produce');
  const [catTouched, setCatTouched] = useState(false);
  const [tried, setTried] = useState(false);
  const [hideChecked, setHideChecked] = useState(false);

  const items = state.grocery;
  const done = items.filter((i) => i.checked).length;

  const known = useMemo(() => {
    const m = new Map();
    recipes.forEach((r) => r.ingredients.forEach((i) => m.set(norm(i.name), i.category)));
    return m;
  }, [recipes]);

  /* ---------- Validation & duplicate warning (Prevent errors) ---------- */
  const nameErr = tried && !name.trim() ? 'Enter an item name.' : '';
  const qtyErr = qty !== '' && !(Number(qty) > 0) ? 'Quantity must be more than 0.' : '';
  const duplicate = name.trim() && items.find((i) => !i.checked && norm(i.name) === norm(name));

  const onNameChange = (v) => {
    setName(v);
    const cat = known.get(norm(v));
    if (cat && !catTouched) setCategory(cat); // auto-sort into the right aisle
  };

  const submit = (e) => {
    e.preventDefault();
    setTried(true);
    if (!name.trim() || qtyErr) return;
    const prev = items;
    addGroceryItems([{ name: name.trim(), qty: qty === '' ? null : Number(qty), unit: '', category }]);
    show(duplicate && duplicate.unit === '' ? `Updated “${duplicate.name}” quantity` : `Added “${name.trim()}” to ${category}`, {
      undo: () => restore('grocery', prev),
    });
    setName('');
    setQty('');
    setCatTouched(false);
    setTried(false);
    nameRef.current?.focus();
  };

  const remove = (item) => {
    const prev = items;
    removeGrocery(item.id);
    show(`Removed “${item.name}”`, { undo: () => restore('grocery', prev), type: 'info' });
  };

  const clearChecked = () => {
    const prev = items;
    restore('grocery', items.filter((i) => !i.checked));
    show(`Cleared ${done} checked ${done === 1 ? 'item' : 'items'}`, { undo: () => restore('grocery', prev), type: 'info' });
  };

  const clearAll = () =>
    ask({ title: 'Clear the entire list?', message: `All ${items.length} items will be removed. You can undo right after.`, confirmLabel: 'Clear list' }, () => {
      const prev = items;
      restore('grocery', []);
      show('Grocery list cleared', { undo: () => restore('grocery', prev), type: 'info' });
    });

  const groups = CATEGORIES.map((c) => ({
    name: c,
    items: items
      .filter((i) => i.category === c && !(hideChecked && i.checked))
      .sort((a, b) => a.checked - b.checked || a.name.localeCompare(b.name)),
    total: items.filter((i) => i.category === c).length,
    left: items.filter((i) => i.category === c && !i.checked).length,
  })).filter((g) => g.items.length);

  return (
    <div className="page">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Grocery list' }]} />
      <div className="page-head row-between">
        <div>
          <h1>Grocery list</h1>
          <p className="muted">Grouped by aisle so you can shop in one pass.</p>
        </div>
        {items.length > 0 && (
          <div className="row-gap">
            <label className="toggle">
              <input type="checkbox" checked={hideChecked} onChange={(e) => setHideChecked(e.target.checked)} />
              <span>Hide checked</span>
            </label>
            <button className="btn" onClick={clearChecked} disabled={!done}>Clear checked ({done})</button>
            <button className="btn btn-danger-ghost" onClick={clearAll}>Clear all</button>
          </div>
        )}
      </div>

      <form className="card add-item" onSubmit={submit} noValidate>
        <label className="field grow">
          <span>Item</span>
          <input ref={nameRef} list="grocery-known" value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="e.g. Eggs" aria-invalid={!!nameErr} />
        </label>
        <datalist id="grocery-known">
          {[...known.keys()].map((k) => <option key={k} value={k.replace(/^\w/, (c) => c.toUpperCase())} />)}
        </datalist>
        <label className="field qty">
          <span>Qty</span>
          <input type="number" min="0" step="1" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="1" aria-invalid={!!qtyErr} />
        </label>
        <label className="field">
          <span>Aisle</span>
          <select value={category} onChange={(e) => { setCategory(e.target.value); setCatTouched(true); }}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <button type="submit" className="btn btn-primary">Add</button>
        <div className="add-item-msgs">
          {nameErr && <span className="field-error">{nameErr}</span>}
          {qtyErr && <span className="field-error">{qtyErr}</span>}
          {duplicate && !nameErr && (
            <span className="field-hint">“{duplicate.name}” is already on your list ({formatAmount(duplicate.qty, duplicate.unit) || 'no qty'}). {duplicate.unit === '' ? 'Adding will increase its quantity.' : 'This will be added as a separate line.'}</span>
          )}
        </div>
      </form>

      {items.length > 0 && (
        <div className="progress-row">
          <span className="progress big" aria-hidden="true"><span style={{ width: `${(done / items.length) * 100}%` }} /></span>
          <span className="small"><strong>{done}</strong> of {items.length} collected{done === items.length ? ' — all done! 🎉' : ''}</span>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-emoji">🛒</div>
          <h2>Your list is empty</h2>
          <p className="muted">Add items above, or build a list from your weekly plan in one click.</p>
          <Link to="/planner" className="btn btn-primary">Go to planner</Link>
        </div>
      ) : (
        <div className="aisles">
          {groups.map((g) => (
            <section key={g.name} className="card aisle">
              <div className="section-head">
                <h2>{g.name}</h2>
                <span className="muted small">{g.left} of {g.total} left</span>
              </div>
              <ul className="grocery-items">
                {g.items.map((i) => (
                  <li key={i.id} className={i.checked ? 'checked' : ''}>
                    <label>
                      <input type="checkbox" checked={i.checked} onChange={() => toggleGrocery(i.id)} />
                      <span className="g-name">{i.name}</span>
                      {(i.qty || i.unit) && <span className="g-qty">{formatAmount(i.qty, i.unit)}</span>}
                    </label>
                    <button className="icon-btn small" onClick={() => remove(i)} aria-label={`Remove ${i.name}`}>×</button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {hideChecked && done > 0 && <p className="muted small">{done} checked {done === 1 ? 'item is' : 'items are'} hidden.</p>}
        </div>
      )}
      {confirmEl}
    </div>
  );
}
