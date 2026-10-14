import { useEffect, useState } from 'react';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import Modal from '../components/Modal.jsx';
import ShortcutList from '../components/ShortcutList.jsx';
import { useToast } from '../components/Toast.jsx';
import { useStore } from '../store/AppStore.jsx';

/*
 * PAGE 8 — Settings
 * Purpose: let users decide how the app looks and behaves, and manage their data.
 */
export default function Settings() {
  const { state, updateSettings, resetAll, replaceState } = useStore();
  const { show } = useToast();
  const s = state.settings;
  const [savedFlash, setSavedFlash] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetText, setResetText] = useState('');

  useEffect(() => {
    if (!savedFlash) return;
    const t = setTimeout(() => setSavedFlash(false), 1800);
    return () => clearTimeout(t);
  }, [savedFlash]);

  const change = (patch) => {
    updateSettings(patch);
    setSavedFlash(true);
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mise-data.json';
    a.click();
    URL.revokeObjectURL(url);
    show('Downloaded mise-data.json');
  };

  const doReset = () => {
    const snapshot = state;
    resetAll();
    setResetOpen(false);
    setResetText('');
    show('All data reset', { undo: () => replaceState(snapshot), type: 'info' });
  };

  return (
    <div className="page page-narrow">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Settings' }]} />
      <div className="page-head row-between">
        <h1>Settings</h1>
        <span className={'saved-pill' + (savedFlash ? ' show' : '')} role="status">✓ Saved</span>
      </div>

      <section className="card settings-section">
        <h2>Appearance</h2>
        <div className="setting">
          <div>
            <strong>Theme</strong>
            <p className="muted small">“System” follows your device's light/dark setting.</p>
          </div>
          <div className="segmented" role="radiogroup" aria-label="Theme">
            {['light', 'dark', 'system'].map((t) => (
              <button key={t} role="radio" aria-checked={s.theme === t} className={s.theme === t ? 'on' : ''} onClick={() => change({ theme: t })}>
                {t === 'light' ? '☀ Light' : t === 'dark' ? '☾ Dark' : '◐ System'}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card settings-section">
        <h2>Planner</h2>
        <div className="setting">
          <div>
            <strong>Week starts on</strong>
            <p className="muted small">Changes the column order on the planner.</p>
          </div>
          <div className="segmented" role="radiogroup" aria-label="Week starts on">
            {[['mon', 'Monday'], ['sun', 'Sunday']].map(([v, l]) => (
              <button key={v} role="radio" aria-checked={s.weekStart === v} className={s.weekStart === v ? 'on' : ''} onClick={() => change({ weekStart: v })}>{l}</button>
            ))}
          </div>
        </div>
        <div className="setting">
          <div>
            <strong>Servings per meal</strong>
            <p className="muted small">Used when building a grocery list from your plan.</p>
          </div>
          <div className="stepper">
            <button className="icon-btn" disabled={s.defaultServings <= 1} onClick={() => change({ defaultServings: s.defaultServings - 1 })} aria-label="Fewer servings">−</button>
            <strong>{s.defaultServings}</strong>
            <button className="icon-btn" disabled={s.defaultServings >= 12} onClick={() => change({ defaultServings: s.defaultServings + 1 })} aria-label="More servings">+</button>
          </div>
        </div>
      </section>

      <section className="card settings-section">
        <h2>Behavior</h2>
        <Toggle label="Ask before deleting" desc="Show a confirmation before removing or clearing things. Undo is always available either way."
          checked={s.confirmDeletes} onChange={(v) => change({ confirmDeletes: v })} />
        <Toggle label="Show shortcut tips" desc="Display keyboard tips on the Home page."
          checked={s.showShortcutHints} onChange={(v) => change({ showShortcutHints: v })} />
      </section>

      <section className="card settings-section">
        <h2>Keyboard shortcuts</h2>
        <ShortcutList />
      </section>

      <section className="card settings-section">
        <h2>Your data</h2>
        <p className="muted small">Everything is stored in this browser only.</p>
        <div className="row-gap">
          <button className="btn" onClick={exportData}>⤓ Export data (JSON)</button>
          <button className="btn btn-danger-ghost" onClick={() => setResetOpen(true)}>Reset all data…</button>
        </div>
      </section>

      <Modal
        open={resetOpen}
        title="Reset all data?"
        onClose={() => { setResetOpen(false); setResetText(''); }}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setResetOpen(false); setResetText(''); }}>Cancel</button>
            <button className="btn btn-danger" disabled={resetText !== 'RESET'} onClick={doReset}>Reset everything</button>
          </>
        }
      >
        <p>This removes your recipes, favorites, planner, grocery list and settings.</p>
        <label className="field">
          <span>Type <strong>RESET</strong> to confirm</span>
          <input value={resetText} onChange={(e) => setResetText(e.target.value)} autoComplete="off" />
        </label>
      </Modal>
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }) {
  return (
    <label className="setting toggle-setting">
      <div>
        <strong>{label}</strong>
        <p className="muted small">{desc}</p>
      </div>
      <span className="switch">
        <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="switch-track" aria-hidden="true" />
      </span>
    </label>
  );
}
