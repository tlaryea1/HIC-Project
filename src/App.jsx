import { useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import Modal from './components/Modal.jsx';
import ShortcutList from './components/ShortcutList.jsx';
import { useToast } from './components/Toast.jsx';
import { NAV_KEYS } from './shortcuts.js';

import Home from './pages/Home.jsx';
import Browse from './pages/Browse.jsx';
import RecipeDetail from './pages/RecipeDetail.jsx';
import Favorites from './pages/Favorites.jsx';
import AddRecipe from './pages/AddRecipe.jsx';
import Planner from './pages/Planner.jsx';
import Grocery from './pages/Grocery.jsx';
import Settings from './pages/Settings.jsx';

const isTyping = (el) =>
  el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);

export default function App() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { undoLast } = useToast();

  // Global keyboard shortcuts.
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (isTyping(e.target)) return;
      if (mod && e.key.toLowerCase() === 'z') {
        if (undoLast()) e.preventDefault();
        return;
      }
      if (mod || e.altKey) return;
      if (document.querySelector('.modal-backdrop')) return; // a dialog is open
      if (e.key === '/') {
        e.preventDefault();
        setPaletteOpen(true);
      } else if (e.key === '?') {
        setHelpOpen(true);
      } else if (NAV_KEYS[e.key.toLowerCase()] && !e.shiftKey) {
        navigate(NAV_KEYS[e.key.toLowerCase()]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, undoLast]);

  useEffect(() => {
  window.scrollTo(0, 0);
}, [location.pathname]);

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Navbar onSearch={() => setPaletteOpen(true)} />
      <main id="main" className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recipes" element={<Browse />} />
          <Route path="/recipes/:id" element={<RecipeDetail />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/new" element={<AddRecipe />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/grocery" element={<Grocery />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="footer">
        <span>Mise · CS 32301 Project 1</span>
        <button className="link-btn" onClick={() => setHelpOpen(true)}>
          Press <kbd>?</kbd> for keyboard shortcuts
        </button>
      </footer>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <Modal open={helpOpen} title="Keyboard shortcuts" onClose={() => setHelpOpen(false)}>
        <ShortcutList />
      </Modal>
    </>
  );
}

function NotFound() {
  return (
    <div className="page empty-state">
      <div className="empty-emoji">🍽</div>
      <h1>We couldn't find that page</h1>
      <p className="muted">The link may be broken or the page was removed.</p>
      <Link to="/" className="btn btn-primary">Back to Home</Link>
    </div>
  );
}
