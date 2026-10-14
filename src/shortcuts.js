import { modKey } from './utils.js';

/* Golden rule: Enable frequent users to use shortcuts. Shown in the ? dialog and on the Settings page. */
export const NAV_KEYS = {
  h: '/',
  r: '/recipes',
  p: '/planner',
  l: '/grocery',
  f: '/favorites',
  n: '/new',
  s: '/settings',
};

export const SHORTCUTS = [
  { keys: [modKey, 'K'], desc: 'Search recipes and pages' },
  { keys: ['/'], desc: 'Search recipes and pages' },
  { keys: ['H'], desc: 'Go to Home' },
  { keys: ['R'], desc: 'Go to Recipes' },
  { keys: ['P'], desc: 'Go to Planner' },
  { keys: ['L'], desc: 'Go to Grocery list' },
  { keys: ['F'], desc: 'Go to Favorites' },
  { keys: ['N'], desc: 'New recipe' },
  { keys: ['S'], desc: 'Settings' },
  { keys: [modKey, 'Z'], desc: 'Undo last action' },
  { keys: ['?'], desc: 'Show this list' },
  { keys: ['Esc'], desc: 'Close any dialog' },
];
