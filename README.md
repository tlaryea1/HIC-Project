# Mise — Weekly Meal Planner

CS 32301 Human Interface Computing · Project 1 (Fall 2026)

Mise is a browser-based meal planner for **busy college students and young adults who cook for themselves**.
It lets users find recipes, lay out a week of meals, and turn that plan into an organized grocery list,
so they spend less time deciding what to eat and fewer trips at the store.

## Running it

Requires **Node.js 18 or newer** (check with `node -v`).

```bash
npm install      # first time only
npm run dev      # starts the app and opens http://localhost:5173
```

To build a production version: `npm run build`, then `npm run preview` (http://localhost:4173).

All data is saved in the browser's localStorage. To start fresh, use **Settings → Reset all data**.

## Pages (8)

| # | Page | Route | Purpose |
|---|------|-------|---------|
| 1 | Home | `/` | Dashboard: today's meals, weekly progress, recently viewed, quick actions |
| 2 | Browse recipes | `/recipes` | Search, filter (meal / diet / time) and sort recipes |
| 3 | Recipe detail | `/recipes/:id` | Read a recipe, scale servings, add to planner / grocery list / favorites |
| 4 | Favorites | `/favorites` | Manage saved recipes and quick-plan them into the week |
| 5 | New recipe | `/new` | 4-step form (Basics → Ingredients → Steps → Review) ending in a confirmation |
| 6 | Weekly planner | `/planner` | Drag-and-drop 7×3 meal grid; build a grocery list from the plan |
| 7 | Grocery list | `/grocery` | Checklist grouped by aisle; add, check off, clear items |
| 8 | Settings | `/settings` | Theme, week start, servings, confirmations, shortcuts, data export/reset |

Shared on every page: the top navigation bar, search (Ctrl/⌘+K), toast notifications with Undo, and the footer.

## Project structure

```
src/
  App.jsx                 routes + global keyboard shortcuts
  styles.css              all styling (design tokens at the top)
  shortcuts.js            shortcut list (shown in the ? dialog and Settings)
  store/AppStore.jsx      app state + localStorage persistence + shared constants
  data/recipes.json       14 sample recipes
  components/             Navbar, Breadcrumbs, Toast (feedback + undo), Modal + useConfirm,
                          CommandPalette (search), RecipeCard, ShortcutList
  pages/                  one file per page (Home, Browse, RecipeDetail, Favorites,
                          AddRecipe, Planner, Grocery, Settings)
```

## Golden rules map

See **RULES.md** for the page-by-page breakdown of which interface features demonstrate each of the 8 golden rules.
