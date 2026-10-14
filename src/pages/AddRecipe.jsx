import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import { useConfirm } from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import { CATEGORIES, DIETS, MEAL_TYPES, UNITS, useStore } from '../store/AppStore.jsx';
import { cap, formatAmount, uid } from '../utils.js';

/*
 * PAGE 5 — Add a recipe (multi-step form)
 * Purpose: create your own recipe in four clear steps that end in a confirmation screen.
 */
const STEPS = ['Basics', 'Ingredients', 'Steps', 'Review'];
const EMOJIS = ['🍲', '🥗', '🍝', '🌮', '🥞', '🍳', '🥪', '🍛', '🍜', '🥘', '🍕', '🍰'];
const DRAFT_KEY = 'mise-recipe-draft';

const emptyIngredient = () => ({ qty: '', unit: '', name: '', category: 'Produce' });
const emptyDraft = () => ({
  title: '', emoji: '🍲', mealType: 'dinner', time: '', servings: 2, diet: [],
  ingredients: [emptyIngredient()], steps: [''],
});

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function AddRecipe() {
  const { recipes, addUserRecipe } = useStore();
  const { show } = useToast();
  const navigate = useNavigate();
  const [confirmEl, ask] = useConfirm();

  const [restored] = useState(() => !!loadDraft());
  const [draft, setDraft] = useState(() => loadDraft() || emptyDraft());
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState({});
  const [savedId, setSavedId] = useState(null);
  const [draftSavedAt, setDraftSavedAt] = useState(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(emptyDraft());

  // Auto-save the draft so leaving the page never loses work (memory load + feedback).
  useEffect(() => {
    if (savedId) return;
    const t = setTimeout(() => {
      try {
        if (dirty) {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
          setDraftSavedAt(new Date());
        } else localStorage.removeItem(DRAFT_KEY);
      } catch { /* ignore */ }
    }, 400);
    return () => clearTimeout(t);
  }, [draft, dirty, savedId]);

  const knownIngredients = useMemo(() => {
    const m = new Map();
    recipes.forEach((r) => r.ingredients.forEach((i) => m.set(i.name.toLowerCase(), i)));
    return m;
  }, [recipes]);

  /* ---------- Validation (Prevent errors) ---------- */
  const errors = useMemo(() => {
    const e = {};
    const title = draft.title.trim();
    if (title.length < 3) e.title = 'Give your recipe a name (at least 3 characters).';
    else if (recipes.some((r) => r.title.toLowerCase() === title.toLowerCase())) e.title = 'You already have a recipe with this name.';
    const t = Number(draft.time);
    if (draft.time === '' || !Number.isInteger(t) || t < 1 || t > 600) e.time = 'Enter a whole number of minutes between 1 and 600.';
    const filled = draft.ingredients.filter((i) => i.name.trim());
    if (!filled.length) e.ingredients = 'Add at least one ingredient.';
    const rowErr = {};
    draft.ingredients.forEach((i, idx) => {
      if (i.qty !== '' && !(Number(i.qty) > 0)) rowErr[idx] = 'Amount must be more than 0.';
      else if (i.qty !== '' && !i.name.trim()) rowErr[idx] = 'Add a name for this amount.';
    });
    if (Object.keys(rowErr).length) e.rows = rowErr;
    if (!draft.steps.some((s) => s.trim())) e.steps = 'Add at least one instruction.';
    return e;
  }, [draft, recipes]);

  const stepValid = [!errors.title && !errors.time, !errors.ingredients && !errors.rows, !errors.steps, true];
  const showErr = (f) => (touched[f] || touched[`step${step}`]) && errors[f];

  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const touch = (f) => setTouched((t) => ({ ...t, [f]: true }));

  const setIng = (idx, patch) =>
    setDraft((d) => {
      const ingredients = d.ingredients.map((row, i) => {
        if (i !== idx) return row;
        const next = { ...row, ...patch };
        // Autocomplete a known ingredient's category so users don't have to remember it.
        if (patch.name !== undefined) {
          const known = knownIngredients.get(patch.name.trim().toLowerCase());
          if (known) next.category = known.category;
        }
        return next;
      });
      return { ...d, ingredients };
    });

  const next = () => {
    if (!stepValid[step]) {
      touch(`step${step}`);
      return;
    }
    setStep((s) => s + 1);
  };

  const save = () => {
    const id = 'u' + uid();
    addUserRecipe({
      id,
      custom: true,
      title: draft.title.trim(),
      emoji: draft.emoji,
      mealType: draft.mealType,
      time: Number(draft.time),
      servings: Number(draft.servings),
      diet: draft.diet,
      ingredients: draft.ingredients
        .filter((i) => i.name.trim())
        .map((i) => ({ name: i.name.trim(), qty: i.qty === '' ? null : Number(i.qty), unit: i.unit, category: i.category })),
      steps: draft.steps.map((s) => s.trim()).filter(Boolean),
    });
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    setSavedId(id);
    show(`Saved “${draft.title.trim()}” to your recipes`);
  };

  const cancel = () => {
    if (!dirty) return navigate('/recipes');
    ask(
      { title: 'Discard this recipe?', message: 'Your draft will be deleted. This can’t be undone.', confirmLabel: 'Discard draft', force: true },
      () => {
        try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
        setDraft(emptyDraft());
        navigate('/recipes');
        show('Draft discarded', { type: 'info' });
      }
    );
  };

  const startOver = () => {
    setDraft(emptyDraft());
    setStep(0);
    setTouched({});
    setSavedId(null);
  };

  /* ---------- Closure screen ---------- */
  if (savedId) {
    return (
      <div className="page">
        <div className="done card">
          <div className="done-check" aria-hidden="true">✓</div>
          <h1>Recipe saved!</h1>
          <p className="muted">
            {draft.emoji} <strong>{draft.title.trim()}</strong> is now in your recipes. You can plan it, shop for it, or save it to favorites.
          </p>
          <div className="row-gap center">
            <Link to={`/recipes/${savedId}`} className="btn btn-primary">View recipe</Link>
            <button className="btn" onClick={startOver}>Add another</button>
            <Link to="/recipes" className="btn btn-ghost">Back to recipes</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Recipes', to: '/recipes' }, { label: 'New recipe' }]} />
      <div className="page-head row-between">
        <div>
          <h1>New recipe</h1>
          <p className="muted small">
            {restored && step === 0 && !touched.restoredSeen ? 'We restored your unfinished draft. ' : ''}
            {draftSavedAt ? `Draft saved automatically at ${draftSavedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.` : 'Your progress is saved as you type.'}
          </p>
        </div>
        <button className="btn btn-ghost" onClick={cancel}>Cancel</button>
      </div>

      {/* Step indicator — always shows where you are (closure + memory load). */}
      <ol className="wizard-steps">
        {STEPS.map((label, i) => (
          <li key={label} className={i === step ? 'current' : i < step ? 'done' : ''}>
            <button disabled={i > step} onClick={() => setStep(i)} aria-current={i === step ? 'step' : undefined}>
              <span className="wizard-num">{i < step ? '✓' : i + 1}</span>
              <span>{label}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className="muted small wizard-progress">Step {step + 1} of {STEPS.length}</p>

      <div className="card wizard-body">
        {step === 0 && (
          <div className="form-stack">
            <label className="field">
              <span>Recipe name <em>*</em></span>
              <input
                value={draft.title}
                onChange={(e) => update({ title: e.target.value })}
                onBlur={() => touch('title')}
                placeholder="e.g. Grandma's Chili"
                maxLength={60}
                aria-invalid={!!showErr('title')}
              />
              <span className="char-count">{draft.title.length}/60</span>
              {showErr('title') && <span className="field-error">{errors.title}</span>}
            </label>

            <div className="field">
              <span>Icon</span>
              <div className="emoji-pick" role="radiogroup" aria-label="Icon">
                {EMOJIS.map((em) => (
                  <button key={em} role="radio" aria-checked={draft.emoji === em} className={draft.emoji === em ? 'on' : ''} onClick={() => update({ emoji: em })}>
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-grid">
              <label className="field">
                <span>Meal type</span>
                <select value={draft.mealType} onChange={(e) => update({ mealType: e.target.value })}>
                  {MEAL_TYPES.map((m) => <option key={m} value={m}>{cap(m)}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Total time (minutes) <em>*</em></span>
                <input
                  type="number" min="1" max="600" step="1" inputMode="numeric"
                  value={draft.time}
                  onChange={(e) => update({ time: e.target.value })}
                  onBlur={() => touch('time')}
                  placeholder="30"
                  aria-invalid={!!showErr('time')}
                />
                {showErr('time') && <span className="field-error">{errors.time}</span>}
              </label>
              <div className="field">
                <span>Servings</span>
                <div className="stepper">
                  <button className="icon-btn" disabled={draft.servings <= 1} onClick={() => update({ servings: draft.servings - 1 })} aria-label="Fewer servings">−</button>
                  <strong>{draft.servings}</strong>
                  <button className="icon-btn" disabled={draft.servings >= 12} onClick={() => update({ servings: draft.servings + 1 })} aria-label="More servings">+</button>
                </div>
              </div>
            </div>

            <div className="field">
              <span>Diet tags <span className="muted">(optional)</span></span>
              <div className="filter-row">
                {DIETS.map((d) => {
                  const on = draft.diet.includes(d);
                  return (
                    <button key={d} className={'chip chip-outline' + (on ? ' on' : '')} aria-pressed={on}
                      onClick={() => update({ diet: on ? draft.diet.filter((x) => x !== d) : [...draft.diet, d] })}>
                      {on ? '✓ ' : ''}{d}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="form-stack">
            <p className="muted small">Start typing a name — known ingredients fill in their grocery aisle automatically.</p>
            <datalist id="ingredient-names">
              {[...knownIngredients.values()].map((i) => <option key={i.name} value={i.name} />)}
            </datalist>
            <div className="ing-head" aria-hidden="true">
              <span>Amount</span><span>Unit</span><span>Ingredient</span><span>Aisle</span><span />
            </div>
            {draft.ingredients.map((row, idx) => (
              <div key={idx}>
                <div className="ing-row">
                  <input type="number" min="0" step="0.25" placeholder="1" value={row.qty} aria-label={`Amount for ingredient ${idx + 1}`}
                    onChange={(e) => setIng(idx, { qty: e.target.value })} aria-invalid={!!errors.rows?.[idx]} />
                  <select value={row.unit} onChange={(e) => setIng(idx, { unit: e.target.value })} aria-label={`Unit for ingredient ${idx + 1}`}>
                    {UNITS.map((u) => <option key={u} value={u}>{u || '—'}</option>)}
                  </select>
                  <input list="ingredient-names" placeholder="e.g. Garlic" value={row.name} aria-label={`Name of ingredient ${idx + 1}`}
                    onChange={(e) => setIng(idx, { name: e.target.value })} />
                  <select value={row.category} onChange={(e) => setIng(idx, { category: e.target.value })} aria-label={`Aisle for ingredient ${idx + 1}`}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <button className="icon-btn" disabled={draft.ingredients.length === 1} aria-label={`Remove ingredient ${idx + 1}`}
                    onClick={() => update({ ingredients: draft.ingredients.filter((_, i) => i !== idx) })}>×</button>
                </div>
                {errors.rows?.[idx] && <span className="field-error">{errors.rows[idx]}</span>}
              </div>
            ))}
            <button className="btn btn-ghost align-start" onClick={() => update({ ingredients: [...draft.ingredients, emptyIngredient()] })}>+ Add ingredient</button>
            {showErr('ingredients') && <span className="field-error">{errors.ingredients}</span>}
          </div>
        )}

        {step === 2 && (
          <div className="form-stack">
            {draft.steps.map((s, idx) => (
              <div key={idx} className="step-row">
                <span className="wizard-num">{idx + 1}</span>
                <textarea rows={2} value={s} placeholder={idx === 0 ? 'e.g. Preheat the oven to 400°F.' : 'Next step…'} aria-label={`Step ${idx + 1}`}
                  onChange={(e) => update({ steps: draft.steps.map((x, i) => (i === idx ? e.target.value : x)) })} />
                <button className="icon-btn" disabled={draft.steps.length === 1} aria-label={`Remove step ${idx + 1}`}
                  onClick={() => update({ steps: draft.steps.filter((_, i) => i !== idx) })}>×</button>
              </div>
            ))}
            <button className="btn btn-ghost align-start" onClick={() => update({ steps: [...draft.steps, ''] })}>+ Add step</button>
            {showErr('steps') && <span className="field-error">{errors.steps}</span>}
          </div>
        )}

        {step === 3 && (
          <div className="review">
            <p className="muted">Check everything before saving. Use “Edit” to jump back to any step — nothing you entered is lost.</p>
            <ReviewBlock title="Basics" onEdit={() => setStep(0)}>
              <p className="review-title">{draft.emoji} <strong>{draft.title}</strong></p>
              <p className="meta">{cap(draft.mealType)} · {draft.time} min · Serves {draft.servings}{draft.diet.length ? ` · ${draft.diet.join(', ')}` : ''}</p>
            </ReviewBlock>
            <ReviewBlock title={`Ingredients (${draft.ingredients.filter((i) => i.name.trim()).length})`} onEdit={() => setStep(1)}>
              <ul className="ingredient-list compact">
                {draft.ingredients.filter((i) => i.name.trim()).map((i, idx) => (
                  <li key={idx}><span className="amt">{formatAmount(i.qty === '' ? null : Number(i.qty), i.unit)}</span><span>{i.name}</span></li>
                ))}
              </ul>
            </ReviewBlock>
            <ReviewBlock title={`Steps (${draft.steps.filter((s) => s.trim()).length})`} onEdit={() => setStep(2)}>
              <ol className="step-list compact">
                {draft.steps.filter((s) => s.trim()).map((s, idx) => <li key={idx}>{s}</li>)}
              </ol>
            </ReviewBlock>
          </div>
        )}
      </div>

      <div className="wizard-nav">
        <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>← Back</button>
        <div className="row-gap">
          {!stepValid[step] && <span className="muted small">Fill in the required fields to continue</span>}
          {step < 3 ? (
            <button className="btn btn-primary" onClick={next} aria-disabled={!stepValid[step]} data-disabled={!stepValid[step]}>
              Next: {STEPS[step + 1]} →
            </button>
          ) : (
            <button className="btn btn-primary" onClick={save}>✓ Save recipe</button>
          )}
        </div>
      </div>
      {confirmEl}
    </div>
  );
}

function ReviewBlock({ title, onEdit, children }) {
  return (
    <section className="review-block">
      <div className="section-head">
        <h3>{title}</h3>
        <button className="text-link" onClick={onEdit}>Edit</button>
      </div>
      {children}
    </section>
  );
}
