import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import seedRecipes from '../data/recipes.json';
import { norm, round, uid } from '../utils.js';

/* ---------- Shared constants (one source of truth = consistent wording everywhere) ---------- */
export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const DAY_SHORT = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
export const DAY_FULL = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
export const MEALS = ['breakfast', 'lunch', 'dinner'];
export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
export const DIETS = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free'];
export const CATEGORIES = ['Produce', 'Dairy & Eggs', 'Meat & Seafood', 'Bakery', 'Pantry', 'Spices', 'Frozen', 'Other'];
export const UNITS = ['', 'cup', 'tbsp', 'tsp', 'oz', 'lb', 'g', 'ml', 'clove', 'can', 'slice'];

export const orderedDays = (weekStart) =>
  weekStart === 'sun' ? ['sun', ...DAYS.slice(0, 6)] : DAYS;

export const slotKey = (day, meal) => `${day}-${meal}`;
export const slotLabel = (slot) => {
  const [day, meal] = slot.split('-');
  return `${DAY_FULL[day]} ${meal}`;
};

export const DEFAULT_SETTINGS = {
  theme: 'system',
  weekStart: 'mon',
  defaultServings: 2,
  confirmDeletes: true,
  showShortcutHints: true,
};

export const DEFAULT_STATE = {
  userRecipes: [],
  favorites: ['r8', 'r5'],
  plan: { 'mon-dinner': 'r8', 'tue-lunch': 'r5', 'wed-breakfast': 'r1' },
  grocery: [],
  recent: [],
  settings: DEFAULT_SETTINGS,
};

const STORAGE_KEY = 'mise-state-v1';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed, settings: { ...DEFAULT_SETTINGS, ...parsed.settings } };
  } catch {
    return DEFAULT_STATE;
  }
}

/** Adds items to the grocery list, merging quantities when the same item+unit is already on it. */
export function mergeGrocery(list, items) {
  const next = list.map((i) => ({ ...i }));
  for (const it of items) {
    const existing = next.find(
      (i) => !i.checked && norm(i.name) === norm(it.name) && (i.unit || '') === (it.unit || '')
    );
    if (existing) {
      if (typeof existing.qty === 'number' && typeof it.qty === 'number') existing.qty = round(existing.qty + it.qty);
    } else {
      next.push({
        id: uid(),
        name: it.name.trim(),
        qty: typeof it.qty === 'number' ? round(it.qty) : null,
        unit: it.unit || '',
        category: it.category || 'Other',
        checked: false,
      });
    }
  }
  return next;
}

const StoreContext = createContext(null);

export function AppStoreProvider({ children }) {
  const [state, setState] = useState(loadState);

  // Persist everything so nothing is lost on refresh.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — app still works in memory */
    }
  }, [state]);

  // Apply theme (light / dark / follow system).
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const t = state.settings.theme === 'system' ? (mq.matches ? 'dark' : 'light') : state.settings.theme;
      document.documentElement.dataset.theme = t;
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [state.settings.theme]);

  const recipes = useMemo(() => [...seedRecipes, ...state.userRecipes], [state.userRecipes]);
  const getRecipe = useCallback((id) => recipes.find((r) => r.id === id), [recipes]);

  const patch = useCallback(
    (key, value) => setState((s) => ({ ...s, [key]: typeof value === 'function' ? value(s[key]) : value })),
    []
  );

  const actions = useMemo(
    () => ({
      /** Put a slice of state back exactly as it was — used by every Undo. */
      restore: (key, value) => patch(key, value),
      replaceState: (next) => setState(next),
      resetAll: () => setState({ ...DEFAULT_STATE, favorites: [], plan: {} }),

      toggleFavorite: (id) => patch('favorites', (f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])),
      addRecent: (id) => patch('recent', (r) => [id, ...r.filter((x) => x !== id)].slice(0, 6)),

      setSlot: (slot, recipeId) =>
        patch('plan', (p) => {
          const n = { ...p };
          if (recipeId) n[slot] = recipeId;
          else delete n[slot];
          return n;
        }),

      addGroceryItems: (items) => patch('grocery', (g) => mergeGrocery(g, items)),
      toggleGrocery: (id) => patch('grocery', (g) => g.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i))),
      removeGrocery: (id) => patch('grocery', (g) => g.filter((i) => i.id !== id)),

      addUserRecipe: (recipe) => patch('userRecipes', (u) => [...u, recipe]),
      deleteUserRecipe: (id) =>
        setState((s) => ({
          ...s,
          userRecipes: s.userRecipes.filter((r) => r.id !== id),
          favorites: s.favorites.filter((f) => f !== id),
          recent: s.recent.filter((r) => r !== id),
          plan: Object.fromEntries(Object.entries(s.plan).filter(([, v]) => v !== id)),
        })),

      updateSettings: (p) => patch('settings', (s) => ({ ...s, ...p })),
    }),
    [patch]
  );

  const value = useMemo(() => ({ state, recipes, getRecipe, ...actions }), [state, recipes, getRecipe, actions]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
