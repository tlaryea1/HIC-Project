import { Link } from 'react-router-dom';
import { DAY_FULL, MEALS, slotKey, useStore } from '../store/AppStore.jsx';
import { cap, greeting, modKey, todayKey } from '../utils.js';

/*
 * PAGE 1 — Home / dashboard
 * Purpose: a one-glance summary of the week and a launch pad to everything else.
 */
export default function Home() {
  const { state, getRecipe } = useStore();
  const today = todayKey();
  const planned = Object.keys(state.plan).length;
  const groceryLeft = state.grocery.filter((i) => !i.checked).length;
  const recent = state.recent.map(getRecipe).filter(Boolean);

  return (
    <div className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">{DAY_FULL[today]}</p>
          <h1>{greeting()}! What's cooking?</h1>
          <p className="muted">Plan your week, keep your grocery list in sync, and save the recipes you love.</p>
        </div>
        <div className="hero-actions">
          <Link to="/planner" className="btn btn-primary">Open planner</Link>
          <Link to="/recipes" className="btn">Browse recipes</Link>
        </div>
      </section>

      <section className="stats">
        <StatCard to="/planner" label="Meals planned this week" value={`${planned} / 21`} progress={planned / 21} />
        <StatCard to="/grocery" label="Grocery items left" value={groceryLeft} hint={groceryLeft ? 'Tap to shop' : 'List is clear'} />
        <StatCard to="/favorites" label="Favorite recipes" value={state.favorites.length} hint="Your go-tos" />
      </section>

      <section className="card">
        <div className="section-head">
          <h2>Today's menu</h2>
          <Link to="/planner" className="text-link">Edit plan →</Link>
        </div>
        <div className="today-grid">
          {MEALS.map((m) => {
            const r = getRecipe(state.plan[slotKey(today, m)]);
            return (
              <div key={m} className="today-slot">
                <span className="slot-label">{cap(m)}</span>
                {r ? (
                  <Link to={`/recipes/${r.id}`} className="today-recipe">
                    <span className="today-emoji">{r.emoji}</span>
                    <span>
                      <strong>{r.title}</strong>
                      <span className="muted small"> · {r.time} min</span>
                    </span>
                  </Link>
                ) : (
                  <Link to="/planner" className="today-empty">+ Plan {m}</Link>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <div className="section-head">
          <h2>Recently viewed</h2>
          {recent.length > 0 && <span className="muted small">Pick up where you left off</span>}
        </div>
        {recent.length ? (
          <div className="recent-row">
            {recent.map((r) => (
              <Link key={r.id} to={`/recipes/${r.id}`} className="mini-card">
                <span className="mini-emoji">{r.emoji}</span>
                <span className="mini-title">{r.title}</span>
                <span className="muted small">{r.time} min</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="muted">Recipes you open will appear here, so you don't have to search for them again.</p>
        )}
      </section>

      {state.settings.showShortcutHints && (
        <section className="hint-strip">
          <strong>Tip:</strong> Press <kbd>{modKey}</kbd> <kbd>K</kbd> to search anything, <kbd>P</kbd> for the planner,
          <kbd>L</kbd> for your grocery list, or <kbd>?</kbd> for every shortcut.
          <Link to="/settings" className="text-link small">Hide tips</Link>
        </section>
      )}
    </div>
  );
}

function StatCard({ to, label, value, progress, hint }) {
  return (
    <Link to={to} className="stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {progress !== undefined ? (
        <span className="progress" aria-hidden="true"><span style={{ width: `${Math.min(progress, 1) * 100}%` }} /></span>
      ) : (
        <span className="muted small">{hint}</span>
      )}
    </Link>
  );
}
