
import React, { useState, useCallback, useEffect } from 'react';
import { getRecipes, getDailyRecommendations, shuffleRecipeCategory, getVendorsForRecipeAction, getAiKitchenTip, getDrinkPairing } from '../services/geminiService';
import { DailyRecommendationResponse, Recipe, VendorSuggestion } from '../types';
import RecipeCard from '../components/RecipeCard';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import { Search, Star, Clock, Users, ChefHat, ShoppingBasket, BookOpen, ArrowLeft, Sandwich, Shuffle, Heart, Share2, Lightbulb, Wine, BarChart3, Thermometer } from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';
import Toast from '../components/Toast';
import RecipeVendorModal from '../components/RecipeVendorModal';
import VendorModal from '../components/VendorModal';

const btnPrimary = "inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors md:col-span-1";
const btnSecondary = "inline-flex items-center justify-center gap-2 w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition";

const RECIPE_HISTORY_KEY = 'recipeHistory';
const MAX_HISTORY_SIZE = 200;

// Enforce display order
const MEAL_CATEGORIES_ORDER = ['breakfast', 'lunch', 'hitea', 'dinner', 'all_time_snacks'];

const categoryTitles: { [key: string]: string } = {
    breakfast: "Breakfast",
    lunch: "Lunch",
    hitea: "Hi-Tea",
    dinner: "Dinner",
    all_time_snacks: "All-Time Snacks"
};

const RecipesPage: React.FC = () => {
    const { addToCart, saveRecipe, unsaveRecipe, savedRecipes } = useAppContext();
    const [query, setQuery] = useState('');
    const [isVeg, setIsVeg] = useState(false);
    const [dailyRecommendations, setDailyRecommendations] = useState<Omit<DailyRecommendationResponse, 'theme'>>({
        breakfast: [],
        lunch: [],
        hitea: [],
        dinner: [],
        all_time_snacks: [],
    });
    const [dailyTheme, setDailyTheme] = useState<string | null>(null);
    const [kitchenTip, setKitchenTip] = useState<string>('');
    const [searchResults, setSearchResults] = useState<Recipe[] | null>(null);
    const [loadingState, setLoadingState] = useState<{global: boolean, [key: string]: boolean}>({ global: true });
    const [error, setError] = useState<string | null>(null);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [showInstructions, setShowInstructions] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [vendorActionState, setVendorActionState] = useState<{isOpen: boolean; recipe: Recipe | null; action: 'Buy Ingredients' | 'Order Online' | 'Hire a Chef' | null}>({isOpen: false, recipe: null, action: null});
    const [vendorModal, setVendorModal] = useState<{ isOpen: boolean; vendorSuggestion: VendorSuggestion | null; }>({ isOpen: false, vendorSuggestion: null });
    const [drinkPairing, setDrinkPairing] = useState<{ loading: boolean, text: string }>({ loading: false, text: '' });


    const fetchDailyRecipes = useCallback(async (vegetarian: boolean) => {
        setLoadingState({ global: true });
        setError(null);
        setSearchResults(null);
        setQuery('');

        try {
            // Fetch kitchen tip concurrently
            getAiKitchenTip().then(setKitchenTip);

            const history = JSON.parse(localStorage.getItem(RECIPE_HISTORY_KEY) || '[]');
            const results = await getDailyRecommendations(vegetarian, history);
            const { theme, ...meals } = results;
            setDailyTheme(theme);
            setDailyRecommendations(meals);
            
            const allNewRecipes = Object.values(meals).flat();
            const newHistory = [...history, ...allNewRecipes.map(r => r.name)];
            // Prune history to prevent it from growing too large
            if (newHistory.length > MAX_HISTORY_SIZE) {
                newHistory.splice(0, newHistory.length - MAX_HISTORY_SIZE);
            }
            localStorage.setItem(RECIPE_HISTORY_KEY, JSON.stringify(newHistory));

        } catch (err) {
            setError('Failed to fetch daily recipes. The AI might be busy, please try again.');
        } finally {
            setLoadingState({ global: false });
        }
    }, []);
    
    useEffect(() => {
        fetchDailyRecipes(isVeg);
    }, [fetchDailyRecipes, isVeg]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setLoadingState({ global: true });
        setError(null);
        setSearchResults(null);
        try {
            const results = await getRecipes(query, isVeg);
            setSearchResults(results);
        } catch(err) {
            setError('Failed to fetch search results. Please try again.');
        } finally {
            setLoadingState({ global: false });
        }
    };
    
    const handleShuffle = async (category: string) => {
        setLoadingState(prev => ({ ...prev, [category]: true }));
        setError(null);
        try {
            const history = JSON.parse(localStorage.getItem(RECIPE_HISTORY_KEY) || '[]');
            const newRecipes = await shuffleRecipeCategory(category, isVeg, history);
            setDailyRecommendations(prev => ({ ...prev, [category]: newRecipes }));

            const newHistory = [...history, ...newRecipes.map(r => r.name)];
             if (newHistory.length > MAX_HISTORY_SIZE) {
                newHistory.splice(0, newHistory.length - MAX_HISTORY_SIZE);
            }
            localStorage.setItem(RECIPE_HISTORY_KEY, JSON.stringify(newHistory));

        } catch (err) {
            setError(`Failed to shuffle ${category}. Please try again.`);
        } finally {
            setLoadingState(prev => ({ ...prev, [category]: false }));
        }
    };
    
    const handleToggleSave = (recipe: Recipe) => {
        const isCurrentlySaved = savedRecipes.some(r => r.id === recipe.id);
        if (isCurrentlySaved) {
            unsaveRecipe(recipe.id);
            setToast({ message: `${recipe.name} removed from saved!`, type: 'success' });
        } else {
            saveRecipe(recipe);
            setToast({ message: `${recipe.name} saved!`, type: 'success' });
        }
    };

    useEffect(() => {
        if (selectedRecipe) {
            setDrinkPairing({ loading: true, text: '' });
            getDrinkPairing(selectedRecipe.name, selectedRecipe.cuisine)
                .then(pairingText => setDrinkPairing({ loading: false, text: pairingText }));
        }
    }, [selectedRecipe]);


    const handleCloseModal = () => {
        setSelectedRecipe(null);
        setShowInstructions(false);
        setDrinkPairing({ loading: false, text: '' });
    };
    
     const handleShowVendors = (recipe: Recipe, action: 'Buy Ingredients' | 'Order Online' | 'Hire a Chef') => {
        setVendorActionState({ isOpen: true, recipe, action });
    };
    
    const handleVendorSelect = (vendor: VendorSuggestion) => {
        setVendorModal({ isOpen: true, vendorSuggestion: vendor });
    };

    const handleAddToCartFromVendor = (item: any) => {
        addToCart(item);
        setToast({ message: `${item.productName} added to cart!`, type: 'success' });
    };

    return (
        <div className="container mx-auto">
             {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
             {vendorActionState.isOpen && vendorActionState.recipe && vendorActionState.action && (
                <RecipeVendorModal
                    isOpen={vendorActionState.isOpen}
                    onClose={() => setVendorActionState({ isOpen: false, recipe: null, action: null })}
                    recipe={vendorActionState.recipe}
                    action={vendorActionState.action}
                    onVendorSelect={handleVendorSelect}
                />
             )}
             {vendorModal.isOpen && (
                <VendorModal
                    isOpen={vendorModal.isOpen}
                    onClose={() => setVendorModal({isOpen: false, vendorSuggestion: null})}
                    vendorSuggestion={vendorModal.vendorSuggestion}
                    onAddToCart={handleAddToCartFromVendor}
                />
            )}

            <h1 className="text-3xl font-bold mb-2">What to Eat Today?</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">AI-powered daily recommendations and world cuisine search.</p>

            <form onSubmit={handleSearch} className="mb-8 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex flex-col md:flex-row items-center gap-4 sticky top-16 z-10">
                <div className="relative flex-grow w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for any dish, e.g., 'sushi', 'pasta', 'chicken curry'"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 rounded-md focus:ring-primary focus:border-primary dark:bg-slate-900"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={isVeg} onChange={() => setIsVeg(v => !v)} className="sr-only peer" />
                        <div className="relative w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Veg Only</span>
                    </label>
                    <button type="submit" className="w-full md:w-auto bg-primary text-white font-bold py-2 px-6 rounded-md hover:bg-primary-dark transition-colors" disabled={loadingState.global || !query}>
                        Search
                    </button>
                </div>
            </form>

            {kitchenTip && !loadingState.global && !searchResults && (
                <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/40 rounded-lg shadow-sm border border-yellow-200 dark:border-yellow-800/60 flex items-start gap-4">
                    <Lightbulb className="text-yellow-500 w-6 h-6 flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="font-bold text-yellow-800 dark:text-yellow-200">AI Pro Kitchen Tip</h3>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">{kitchenTip}</p>
                    </div>
                </div>
            )}

            {loadingState.global && (
                <div className="flex justify-center items-center h-64">
                    <Spinner size="12" />
                    <p className="ml-4 text-lg">AI is preparing your culinary journey...</p>
                </div>
            )}
            {error && <p className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg">{error}</p>}
            
            {!loadingState.global && !error && (
                <>
                    {searchResults ? (
                        <div>
                            <h2 className="text-2xl font-bold mb-4">Search Results for "{query}"</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {searchResults.map(recipe => (
                                    <RecipeCard 
                                        key={recipe.id} 
                                        recipe={recipe} 
                                        onSelect={setSelectedRecipe}
                                        onShowVendors={handleShowVendors}
                                        onToggleSave={handleToggleSave}
                                        isSaved={savedRecipes.some(r => r.id === recipe.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-10">
                           {dailyTheme && <h2 className="text-2xl font-bold text-center italic text-primary dark:text-primary-light">Today's Theme: {dailyTheme}</h2>}
                           {MEAL_CATEGORIES_ORDER.map(category => {
                                const recipes = dailyRecommendations[category as keyof typeof dailyRecommendations];
                                if (!recipes || recipes.length === 0) return null;
                                
                                return (
                                <div key={category}>
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-2xl font-bold">{categoryTitles[category]}</h2>
                                        <button onClick={() => handleShuffle(category)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" disabled={loadingState[category]}>
                                            {loadingState[category] ? <Spinner size="4" /> : <Shuffle size={16}/>}
                                            <span>Shuffle</span>
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {recipes.map(recipe => (
                                            <RecipeCard 
                                                key={recipe.id} 
                                                recipe={recipe} 
                                                onSelect={setSelectedRecipe}
                                                onShowVendors={handleShowVendors}
                                                onToggleSave={handleToggleSave}
                                                isSaved={savedRecipes.some(r => r.id === recipe.id)}
                                            />
                                        ))}
                                    </div>
                                </div>
                           )})}
                        </div>
                    )}
                </>
            )}

            <Modal isOpen={!!selectedRecipe} onClose={handleCloseModal} title={!showInstructions ? selectedRecipe?.name || '' : `How to make ${selectedRecipe?.name}`} maxWidth="2xl">
                {selectedRecipe && (
                    !showInstructions ? (
                        <div className="space-y-6">
                             <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${selectedRecipe.isVeg ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                                {selectedRecipe.isVeg ? 'Veg' : 'Non-Veg'}
                                            </span>
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                {selectedRecipe.cuisine}
                                            </span>
                                        </div>
                                         <p className="text-sm text-gray-600 dark:text-gray-400">{selectedRecipe.description}</p>
                                    </div>
                                     <div className="flex flex-col items-end gap-2 pl-4">
                                         <button onClick={() => handleToggleSave(selectedRecipe)} className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors">
                                            <Heart size={16} className={savedRecipes.some(r => r.id === selectedRecipe.id) ? 'text-red-500' : ''} fill={savedRecipes.some(r => r.id === selectedRecipe.id) ? 'currentColor' : 'none'}/>
                                            {savedRecipes.some(r => r.id === selectedRecipe.id) ? 'Saved' : 'Save'}
                                        </button>
                                         <div className="flex items-center gap-1" title="Rating"><Star className="text-yellow-500" size={18}/><span className="font-bold">{selectedRecipe.rating.toFixed(1)}</span></div>
                                     </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                    <div title="Difficulty"><BarChart3 className="mx-auto mb-1" size={20}/><span className="font-bold">{selectedRecipe.difficulty}</span></div>
                                    <div title="Calories"><Thermometer className="mx-auto mb-1" size={20}/><span className="font-bold">{selectedRecipe.calories} kcal</span></div>
                                    <div title="Cooking Time"><Clock className="mx-auto mb-1" size={20}/><span>{selectedRecipe.cookTimeInMinutes} mins</span></div>
                                    <div title="Servings"><Users className="mx-auto mb-1" size={20}/><span>Serves {selectedRecipe.servings}</span></div>
                                </div>
                            </div>

                            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg flex items-start gap-4">
                                <Wine className="text-indigo-500 w-6 h-6 flex-shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-indigo-800 dark:text-indigo-200">AI Drink Pairing</h4>
                                    {drinkPairing.loading ? <Spinner size="4"/> : <p className="text-sm text-indigo-700 dark:text-indigo-300">{drinkPairing.text}</p>}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-lg mb-2">Ingredients</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedRecipe.ingredients.map((ing, i) => <span key={i} className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 rounded-full">{ing}</span>)}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                                <button onClick={() => handleShowVendors(selectedRecipe, 'Buy Ingredients')} className={btnSecondary}><ShoppingBasket size={18}/><span>Buy Ingredients</span></button>
                                <button onClick={() => setShowInstructions(true)} className={btnSecondary}><BookOpen size={18}/><span>View Instructions</span></button>
                                <button onClick={() => handleShowVendors(selectedRecipe, 'Order Online')} className={btnPrimary}><Sandwich size={18} /><span>Order Online</span></button>
                                <button onClick={() => handleShowVendors(selectedRecipe, 'Hire a Chef')} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-slate-200 dark:bg-slate-600 text-content-light dark:text-content-dark rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition"><ChefHat size={18}/><span>Hire a Chef</span></button>
                            </div>
                        </div>
                    ) : (
                        <div>
                             <button onClick={() => setShowInstructions(false)} className="flex items-center gap-2 mb-4 text-sm font-semibold text-primary hover:underline"><ArrowLeft size={16} />Back to Details</button>
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
