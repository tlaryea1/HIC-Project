import { Link } from 'react-router-dom';
import { useStore } from '../store/AppStore.jsx';
import { useToast } from './Toast.jsx';
import { cap } from '../utils.js';

/* Shared card — identical look and behavior on Browse, Favorites and Home (Consistency). */
export default function RecipeCard({ recipe }) {
  const { state, toggleFavorite } = useStore();
  const { show } = useToast();
  const fav = state.favorites.includes(recipe.id);

  const onFav = (e) => {
    e.preventDefault();
    toggleFavorite(recipe.id);
    show(fav ? `Removed “${recipe.title}” from favorites` : `Saved “${recipe.title}” to favorites`, {
      undo: () => toggleFavorite(recipe.id),
      type: fav ? 'info' : 'success',
    });
  };

  return (
    <Link to={`/recipes/${recipe.id}`} className="recipe-card">
      <div className="recipe-card-art" aria-hidden="true">{recipe.emoji}</div>
      <div className="recipe-card-body">
        <h3>{recipe.title}</h3>
        <p className="meta">
          <span>{cap(recipe.mealType)}</span> · <span>{recipe.time} min</span> · <span>Serves {recipe.servings}</span>
        </p>
        <div className="tags">
          {recipe.diet.map((d) => <span key={d} className="tag">{d}</span>)}
          {recipe.custom && <span className="tag tag-accent">your recipe</span>}
        </div>
      </div>
      <button
        className={'fav-btn' + (fav ? ' on' : '')}
        onClick={onFav}
        aria-pressed={fav}
        aria-label={fav ? `Remove ${recipe.title} from favorites` : `Save ${recipe.title} to favorites`}
        title={fav ? 'Remove from favorites' : 'Save to favorites'}
      >
        {fav ? '♥' : '♡'}
      </button>
    </Link>
  );
}
