import React, { useState, useCallback } from 'react';
import { getRecipes } from '../services/geminiService';
import { Recipe, CartItemType, PreparedDishCartItem, IngredientsCartItem, ChefServiceCartItem } from '../types';
import RecipeCard from '../components/RecipeCard';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import { Search, Star, Clock, Users, ChefHat, ShoppingBasket, BookOpen, ArrowLeft, Utensils, Sandwich } from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';
import Toast from '../components/Toast';


const RecipesPage: React.FC = () => {
    const { addToCart } = useAppContext();
    const [query, setQuery] = useState('popular lunch');
    const [isVeg, setIsVeg] = useState(false);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [showInstructions, setShowInstructions] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);


    const fetchRecipes = useCallback(async (searchQuery: string, vegetarian: boolean) => {
        setIsLoading(true);
        setError(null);
        try {
            const results = await getRecipes(searchQuery, vegetarian);
            setRecipes(results);
        } catch (err) {
            setError('Failed to fetch recipes. The AI might be busy, please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchRecipes(query, isVeg);
    };
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useEffect(() => {
        fetchRecipes(query, isVeg);
    }, []);

    const handleCloseModal = () => {
        setSelectedRecipe(null);
        setShowInstructions(false);
    };

    const handleBuyIngredients = (recipe: Recipe) => {
        const cartItem: IngredientsCartItem = {
            id: `ing-${recipe.id}-${Date.now()}`,
            type: CartItemType.INGREDIENTS_LIST,
            recipe,
        };
        addToCart(cartItem);
        setToast({ message: `Ingredients for ${recipe.name} added to cart!`, type: 'success' });
    };

    const handleOrderOnline = (recipe: Recipe) => {
        const cartItem: PreparedDishCartItem = {
            id: `dish-${recipe.id}-${Date.now()}`,
            type: CartItemType.PREPARED_DISH,
            recipe,
            quantity: 1,
        };
        addToCart(cartItem);
        setToast({ message: `${recipe.name} added to cart!`, type: 'success' });
    };

    const handleHireChef = (recipe: Recipe) => {
        const cartItem: ChefServiceCartItem = {
            id: `chef-${recipe.id}-${Date.now()}`,
            type: CartItemType.CHEF_SERVICE,
            recipe,
            price: 150.00, // Fictional price for chef service
        };
        addToCart(cartItem);
        setToast({ message: `Chef for ${recipe.name} added to cart!`, type: 'success' });
    };


    return (
        <div className="container mx-auto">
             {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <h1 className="text-3xl font-bold mb-2">What to Eat Today?</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Discover thousands of Indian recipes, powered by AI.</p>

            <form onSubmit={handleSearch} className="mb-8 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-grow w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for dishes, e.g., 'chicken curry', 'paneer snack'"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 rounded-md focus:ring-primary focus:border-primary dark:bg-slate-900"
                    />
                </div>
                <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isVeg}
                            onChange={() => setIsVeg(v => !v)}
                            className="sr-only peer"
                        />
                        <div className="relative w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Veg Only</span>
                    </label>
                </div>
                <button type="submit" className="w-full md:w-auto bg-primary text-white font-bold py-2 px-6 rounded-md hover:bg-primary-dark transition-colors">
                    Search
                </button>
            </form>

            {isLoading && (
                <div className="flex justify-center items-center h-64">
                    <Spinner size="12" />
                </div>
            )}
            {error && <p className="text-center text-red-500">{error}</p>}
            {!isLoading && !error && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {recipes.map(recipe => (
                        <RecipeCard 
                            key={recipe.id} 
                            recipe={recipe} 
                            onSelect={setSelectedRecipe}
                            onBuyIngredients={() => handleBuyIngredients(recipe)}
                            onOrderOnline={() => handleOrderOnline(recipe)}
                            onHireChef={() => handleHireChef(recipe)}
                        />
                    ))}
                </div>
            )}

            <Modal isOpen={!!selectedRecipe} onClose={handleCloseModal} title={!showInstructions ? selectedRecipe?.name || '' : `How to make ${selectedRecipe?.name}`}>
                {selectedRecipe && (
                    !showInstructions ? (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                <img src={selectedRecipe.imageUrl} alt={selectedRecipe.name} className="w-full md:w-1/3 h-auto object-cover rounded-lg shadow-md"/>
                                <div className="flex-1 space-y-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${selectedRecipe.isVeg ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                            {selectedRecipe.isVeg ? 'Veg' : 'Non-Veg'}
                                        </span>
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                            {selectedRecipe.cuisine}
                                        </span>
                                    </div>
                                     <p className="text-sm text-gray-600 dark:text-gray-400">{selectedRecipe.description}</p>
                                    <div className="flex items-center gap-6 text-sm text-content-light dark:text-content-dark pt-2">
                                        <div className="flex items-center gap-1" title="Rating">
                                            <Star className="text-yellow-500" size={18}/>
                                            <span className="font-bold">{selectedRecipe.rating.toFixed(1)}</span>
                                            <span className="text-gray-500 dark:text-gray-400">/ 5</span>
                                        </div>
                                        <div className="flex items-center gap-1" title="Cooking Time">
                                            <Clock size={18}/>
                                            <span>{selectedRecipe.cookTimeInMinutes} mins</span>
                                        </div>
                                        <div className="flex items-center gap-1" title="Servings">
                                            <Users size={18}/>
                                            <span>Serves {selectedRecipe.servings}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-lg mb-2">Ingredients</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedRecipe.ingredients.map((ing, i) => (
                                        <span key={i} className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 rounded-full">{ing}</span>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                                <button onClick={() => handleBuyIngredients(selectedRecipe)} className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition">
                                    <ShoppingBasket size={18}/>
                                    <span>Buy Ingredients</span>
                                </button>
                                 <button onClick={() => setShowInstructions(true)} className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition">
                                    <BookOpen size={18}/>
                                    <span>View Recipe</span>
                                </button>
                                <button onClick={() => handleOrderOnline(selectedRecipe)} className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors md:col-span-1">
                                     <Sandwich size={18} />
                                     <span>Order Online</span>
                                </button>
                                <button onClick={() => handleHireChef(selectedRecipe)} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-slate-200 dark:bg-slate-600 text-content-light dark:text-content-dark rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition">
                                    <ChefHat size={18}/>
                                    <span>Hire a Chef</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                             <button onClick={() => setShowInstructions(false)} className="flex items-center gap-2 mb-4 text-sm font-semibold text-primary hover:underline">
                                <ArrowLeft size={16} />
                                Back to Details
                            </button>
                            <h4 className="font-bold text-lg mb-2">Instructions</h4>
                            <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none">
                                {selectedRecipe.instructions.map((step, i) => <li key={i}>{step}</li>)}
                            </ol>
                        </div>
                    )
                )}
            </Modal>
        </div>
    );
};

export default RecipesPage;