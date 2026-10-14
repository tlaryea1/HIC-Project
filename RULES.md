# Golden rules → features (notes for the report)

Use these as a starting checklist. Rewrite them in your own words and pair each one with a screenshot.

## App-wide (shared shell)

| Rule | Feature |
|---|---|
| 1. Consistency | The same top nav on every page, with the active page highlighted. One set of color and spacing tokens (`styles.css`). The same button styles everywhere: orange = primary, red outline = destructive. The same `RecipeCard` on Browse and Favorites. Every page has a breadcrumb trail and an H1 in the same place. |
| 2. Shortcuts | Ctrl/⌘+K or `/` opens a search palette over recipes, ingredients and pages, navigable with arrow keys and Enter. Single-key navigation: H, R, P, L, F, N, S. Ctrl/⌘+Z undoes the last action. `?` lists every shortcut. Nav tooltips show each page's key. |
| 3. Feedback | Every action shows a toast describing exactly what happened ("Replaced Beef Tacos with Salmon…"). Nav badges show live counts for grocery items and favorites. Buttons respond on hover and press. |
| 6. Reversal | Every add, remove, move, or clear toast has an **Undo** button, also reachable with Ctrl/⌘+Z. |
| 7. User control | The user starts every action: nothing auto-plays and nothing moves on its own. Esc or a backdrop click closes any dialog. Theme, week start and confirmations are user settings. |
| 8. Memory load | Breadcrumbs show where you are. Icons always have text labels. Keyboard hints appear in tooltips. |

## Per page

**1. Home**
- *Memory load:* "Recently viewed" lists the recipes you opened. "Today's menu" shows today's planned meals so you don't have to open the planner.
- *Shortcuts:* stat cards jump straight to the planner, grocery list, and favorites. A tip strip teaches the keyboard shortcuts.
- *Feedback:* a progress bar shows meals planned out of 21, and the grocery count updates live.
- *User control:* the tip strip can be hidden in Settings.

**2. Browse recipes**
- *Feedback:* "Showing 4 of 14 recipes" updates as you type or filter. Active filter chips are visibly filled and show a ✓.
- *Memory load:* filters are stored in the URL, so Back, refresh, or returning from a recipe keeps your search. Search matches ingredients as well as titles.
- *Prevent errors / reversal:* the no-results state explains why there are no matches and offers "Reset all filters".
- *User control:* the user chooses the sort order (A–Z, quickest first, or favorites first).

**3. Recipe detail**
- *Prevent errors:* the "Add to planner" dialog warns when the chosen slot already has a meal ("Adding this will replace it") and relabels the button "Replace meal". The servings stepper is disabled at 1 and 12.
- *Feedback:* ingredient amounts rescale live as servings change, with a "Scaled from 4 servings — Reset" note.
- *Reversal:* adding to the planner or grocery list and favoriting are all undoable from the toast. Deleting your own recipe asks for confirmation first and can still be undone.
- *Memory load:* the dialog defaults to today and to the recipe's meal type.

**4. Favorites**
- *Reversal:* removing a favorite, or removing all of them, can be undone. "Remove all" asks first.
- *Shortcuts:* "+ Plan next open dinner" puts the recipe into the first free slot in one click.
- *Feedback:* each row shows a "Planned ×2" or "Not planned" pill.
- *Feedback / closure:* the empty state explains how to add favorites and links to Browse.

**5. New recipe (best page for rules 4 and 5)**
- *Closure:* a 4-step indicator ("Step 2 of 4"), a Review step summarizing everything, and a dedicated "Recipe saved!" confirmation screen with next actions.
- *Prevent errors:* required fields are marked with *, and inline messages say what's wrong ("Enter a whole number of minutes between 1 and 600"). Duplicate recipe names are blocked. Next stays dimmed until the step is valid. Number inputs have min and max limits, and you can't delete the last ingredient or step row.
- *Memory load:* the draft autosaves and is restored if you leave and come back. Ingredient names autocomplete, and known ingredients fill in their grocery aisle automatically. The Review step has "Edit" links back to each step.
- *Reversal / control:* Back keeps everything you entered. Cancel asks before discarding a draft.

**6. Weekly planner**
- *User control:* recipes can be dragged into any slot, between slots to move them, or onto a full slot to swap. Clicking **+** opens a picker for users who don't drag.
- *Reversal:* every placement, removal, swap, and "Clear week" can be undone. Clear week asks first.
- *Feedback:* the slot under your cursor highlights while dragging, today's column is tinted, and a "4 / 21 meals planned" counter updates.
- *Prevent errors:* "Build grocery list" and "Clear week" are disabled when the week is empty.
- *Shortcuts:* favorites are listed first in the tray, the picker suggests recipes matching the meal type, and one click turns the whole week into a grocery list.

**7. Grocery list**
- *Prevent errors:* an empty item name or a quantity of 0 or less shows an inline error. A duplicate warning reads "“Lemon” is already on your list… adding will increase its quantity."
- *Memory load:* items are grouped by aisle, names autocomplete, and known items fill in their aisle automatically.
- *Feedback:* an overall progress bar ("2 of 15 collected"), a per-aisle "5 of 7 left" count, and strikethrough on checked items.
- *Reversal:* removing an item, "Clear checked", and "Clear all" can all be undone.
- *User control:* the "Hide checked" toggle.
- *Shortcuts:* pressing Enter adds an item and returns focus to the name field for fast entry.

**8. Settings**
- *User control:* theme (light, dark, or follow system), week start day, servings per meal, and toggles for confirmation dialogs and tips.
- *Feedback:* a "✓ Saved" indicator appears after each change, and the theme switches instantly.
- *Prevent errors:* resetting requires typing RESET, and the button stays disabled until you do. Even then, the reset can be undone.
- *Shortcuts:* a full keyboard shortcut reference.
