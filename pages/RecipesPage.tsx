
import React, { useState, useCallback, useEffect } from 'react';
import { getRecipes, getDailyRecommendations, shuffleRecipeCategory, getVendorsForRecipeAction, getAiKitchenTip, getDrinkPairing } from '../services/geminiService';
import { DailyRecommendationResponse, Recipe, ActivityRecommendation, VendorSuggestion, CartItemType, PreparedDishCartItem, IngredientsCartItem, ChefServiceCartItem } from '../types';
import RecipeCard from '../components/RecipeCard';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import { Search, Star, Clock, Users, ChefHat, ShoppingBasket, BookOpen, Sandwich, Shuffle, Heart, Lightbulb, Wine, BarChart3, Thermometer, ExternalLink, X, Utensils } from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';
import Toast from '../components/Toast';
import VendorModal from '../components/VendorModal';

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

type RecipeDetailTab = 'ingredients' | 'instructions' | 'services';
type RecipeServiceAction = 'Buy Ingredients' | 'Order Online' | 'Hire a Chef';

const TabButton = ({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${isActive ? 'bg-primary text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
    >
        {label}
    </button>
);


const RecipesPage: React.FC = () => {
    const { addToCart, saveRecipe, unsaveRecipe, savedRecipes } = useAppContext();
    const [query, setQuery] = useState('');
    const [isVeg, setIsVeg] = useState(false);
    const [dailyRecommendations, setDailyRecommendations] = useState<Omit<DailyRecommendationResponse, 'theme'>>({
        breakfast: [], lunch: [], hitea: [], dinner: [], all_time_snacks: [],
    });
    const [dailyTheme, setDailyTheme] = useState<string | null>(null);
    const [kitchenTip, setKitchenTip] = useState<string>('');
    const [searchResults, setSearchResults] = useState<Recipe[] | null>(null);
    const [loadingState, setLoadingState] = useState<{global: boolean, [key: string]: boolean}>({ global: true });
    const [error, setError] = useState<string | null>(null);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    // State for the new integrated modal
    const [activeDetailTab, setActiveDetailTab] = useState<RecipeDetailTab>('ingredients');
    const [serviceAction, setServiceAction] = useState<RecipeServiceAction | null>(null);
    const [serviceRecommendations, setServiceRecommendations] = useState<ActivityRecommendation[]>([]);
    const [isServiceLoading, setIsServiceLoading] = useState(false);
    const [serviceError, setServiceError] = useState<string|null>(null);

    const [drinkPairing, setDrinkPairing] = useState<{ loading: boolean, text: string }>({ loading: false, text: '' });
    const [vendorModal, setVendorModal] = useState<{ isOpen: boolean; vendorSuggestion: VendorSuggestion | null; }>({ isOpen: false, vendorSuggestion: null });


    const fetchDailyRecipes = useCallback(async (vegetarian: boolean) => {
        setLoadingState(prev => ({ ...prev, global: true }));
        setError(null);
        setSearchResults(null);
        setQuery('');

        try {
            getAiKitchenTip().then(setKitchenTip).catch(console.error);

            const history = JSON.parse(localStorage.getItem(RECIPE_HISTORY_KEY) || '[]');
            const results = await getDailyRecommendations(vegetarian, history);
            const { theme, ...meals } = results;
            setDailyTheme(theme);
            setDailyRecommendations(meals);
            
            const allNewRecipes = Object.values(meals).flat();
            const newHistory = [...history, ...allNewRecipes.map(r => r.name)];
            if (newHistory.length > MAX_HISTORY_SIZE) {
                newHistory.splice(0, newHistory.length - MAX_HISTORY_SIZE);
            }
            localStorage.setItem(RECIPE_HISTORY_KEY, JSON.stringify(newHistory));

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch daily recipes. The AI might be busy, please try again.');
        } finally {
            setLoadingState(prev => ({ ...prev, global: false }));
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
            setError(err instanceof Error ? err.message : 'Failed to fetch search results. Please try again.');
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
             setError(err instanceof Error ? err.message : `Failed to shuffle ${category}. Please try again.`);
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

    const handleSelectRecipe = (recipe: Recipe) => {
        setSelectedRecipe(recipe);
        setDrinkPairing({ loading: true, text: '' });
        getDrinkPairing(recipe.name, recipe.cuisine)
            .then(pairingText => setDrinkPairing({ loading: false, text: pairingText }));
    }
    
    const handleShowServices = async (action: RecipeServiceAction) => {
        if (!selectedRecipe) return;
        setActiveDetailTab('services');
        setServiceAction(action);
        setIsServiceLoading(true);
        setServiceError(null);
        try {
            const results = await getVendorsForRecipeAction(selectedRecipe, action);
            setServiceRecommendations(results);
        } catch (err) {
            setServiceError(err instanceof Error ? err.message : 'Could not fetch AI recommendations.');
        } finally {
            setIsServiceLoading(false);
        }
    };

    const handleCloseModal = () => {
        setSelectedRecipe(null);
        setActiveDetailTab('ingredients');
        setServiceAction(null);
        setServiceRecommendations([]);
    };
    
    const handleVendorSelect = (vendor: VendorSuggestion) => {
        setVendorModal({ isOpen: true, vendorSuggestion: vendor });
    };

    const handleAddToCartFromVendor = (item: any) => {
        addToCart(item);
        setToast({ message: `${item.productName} added to cart!`, type: 'success' });
    };

    const handleQuickAddToCart = (recipe: Recipe, action: 'Order Online' | 'Buy Ingredients' | 'Hire a Chef') => {
        let cartItem: PreparedDishCartItem | IngredientsCartItem | ChefServiceCartItem;
        let message = '';
        switch(action) {
            case 'Order Online':
                cartItem = { id: `cart-${Date.now()}`, type: CartItemType.PREPARED_DISH, recipe, quantity: 1 };
                message = `${recipe.name} added to cart for ordering!`;
                break;
            case 'Buy Ingredients':
                cartItem = { id: `cart-${Date.now()}`, type: CartItemType.INGREDIENTS_LIST, recipe };
                message = `Ingredients for ${recipe.name} added to cart!`;
                break;
            case 'Hire a Chef':
                cartItem = { id: `cart-${Date.now()}`, type: CartItemType.CHEF_SERVICE, recipe, price: 5000 }; // Example price
                message = `Chef service for ${recipe.name} added to cart!`;
                break;
        }
        addToCart(cartItem);
        setToast({ message, type: 'success' });
    };

    const getSearchUrl = (vendor: string, query: string) => {
        const searchUrlMap: { [key: string]: string } = {
           'Zomato': `https://www.zomato.com/search?q=${encodeURIComponent(query)}`,
           'Swiggy': `https://www.swiggy.com/search?query=${encodeURIComponent(query)}`,
           'BigBasket': `https://www.bigbasket.com/ps/?q=${encodeURIComponent(query)}`,
           'Zepto': `https://www.zeptonow.com/search?q=${encodeURIComponent(query)}`,
           'Instamart': `https://www.swiggy.com/instamart/search?query=${encodeURIComponent(query)}`,
           'Urban Company': `https://www.urbancompany.com/search?q=${encodeURIComponent(query)}`,
       };
       return searchUrlMap[vendor] || `https://www.google.com/search?q=${encodeURIComponent(vendor + ' ' + query)}`;
   };

    return (
        <div className="container mx-auto">
             {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
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
                                        onSelect={handleSelectRecipe}
                                        onShowVendors={(recipe, action) => handleQuickAddToCart(recipe, action)}
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
                                                onSelect={handleSelectRecipe}
                                                onShowVendors={(recipe, action) => handleQuickAddToCart(recipe, action)}
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

            {selectedRecipe && (
                <Modal isOpen={!!selectedRecipe} onClose={handleCloseModal} title={selectedRecipe.name} maxWidth="4xl">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[80vh]">
                        {/* Left Panel: Info and Actions */}
                        <div className="flex flex-col space-y-4">
                            <div>
                                <h2 className="text-2xl font-bold">{selectedRecipe.name}</h2>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${selectedRecipe.isVeg ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                        {selectedRecipe.isVeg ? 'Veg' : 'Non-Veg'}
                                    </span>
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        {selectedRecipe.cuisine}
                                    </span>
                                    <div className="flex items-center gap-1" title="Rating"><Star className="text-yellow-500" size={16}/><span className="font-bold text-sm">{selectedRecipe.rating.toFixed(1)}</span></div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">{selectedRecipe.description}</p>
                            </div>

                             <div className="grid grid-cols-2 gap-4 text-sm p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                    <div className="flex items-center gap-2" title="Difficulty"><BarChart3 size={18}/><span className="font-semibold">{selectedRecipe.difficulty}</span></div>
                                    <div className="flex items-center gap-2" title="Calories"><Thermometer size={18}/><span>{selectedRecipe.calories} kcal</span></div>
                                    <div className="flex items-center gap-2" title="Cooking Time"><Clock size={18}/><span>{selectedRecipe.cookTimeInMinutes} mins</span></div>
                                    <div className="flex items-center gap-2" title="Servings"><Users size={18}/><span>Serves {selectedRecipe.servings}</span></div>
                            </div>
                            
                            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg flex items-start gap-4">
                                <Wine className="text-indigo-500 w-6 h-6 flex-shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-indigo-800 dark:text-indigo-200">AI Drink Pairing</h4>
                                    {drinkPairing.loading ? <Spinner size="4"/> : <p className="text-sm text-indigo-700 dark:text-indigo-300">{drinkPairing.text}</p>}
                                </div>
                            </div>

                             <div className="pt-4 mt-auto space-y-3">
                                <h3 className="font-bold">Get This Dish</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <button onClick={() => handleShowServices('Buy Ingredients')} className="flex items-center justify-center gap-2 w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"><ShoppingBasket size={16}/><span>Buy Ingredients</span></button>
                                    <button onClick={() => handleShowServices('Order Online')} className="flex items-center justify-center gap-2 w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"><Sandwich size={16}/><span>Order Online</span></button>
                                    <button onClick={() => handleShowServices('Hire a Chef')} className="flex items-center justify-center gap-2 w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"><ChefHat size={16}/><span>Hire a Chef</span></button>
                                </div>
                            </div>
                        </div>

                        {/* Right Panel: Tabs */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg flex flex-col overflow-y-auto">
                            <div className="flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-700 pb-3">
                                <TabButton label="Ingredients" isActive={activeDetailTab === 'ingredients'} onClick={() => setActiveDetailTab('ingredients')} />
                                <TabButton label="Instructions" isActive={activeDetailTab === 'instructions'} onClick={() => setActiveDetailTab('instructions')} />
                                <TabButton label="AI Services" isActive={activeDetailTab === 'services'} onClick={() => setActiveDetailTab('services')} />
                            </div>
                            <div className="flex-grow overflow-y-auto pr-2">
                                {activeDetailTab === 'ingredients' && (
                                    <div className="flex flex-wrap gap-2 animate-fade-in">
                                        {selectedRecipe.ingredients.map((ing, i) => <span key={i} className="px-3 py-1 text-sm bg-slate-200 dark:bg-slate-700 rounded-full">{ing}</span>)}
                                    </div>
                                )}
                                {activeDetailTab === 'instructions' && (
                                     <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none animate-fade-in">
                                        {selectedRecipe.instructions.map((step, i) => <li key={i}>{step}</li>)}
                                    </ol>
                                )}
                                {activeDetailTab === 'services' && (
                                     <div className="animate-fade-in">
                                         <h3 className="font-bold mb-2 text-lg">AI Suggestions for: <span className="text-primary">{serviceAction}</span></h3>
                                         {isServiceLoading && <div className="flex justify-center p-8"><Spinner/></div>}
                                         {serviceError && <p className="text-red-500 text-sm p-4 text-center">{serviceError}</p>}
                                         {!isServiceLoading && !serviceError && serviceRecommendations.length > 0 && (
                                             <div className="space-y-4">
                                                {serviceRecommendations.map((rec, index) => (
                                                    <div key={`${rec.activity}-${index}`}>
                                                        <div className="space-y-2">
                                                            {rec.vendors.map(vendor => (
                                                                <div key={vendor.name} className="p-3 bg-white dark:bg-slate-700/50 rounded-lg space-y-2">
                                                                    <div className="flex justify-between items-start">
                                                                        <h6 className="font-bold">{vendor.name}</h6>
                                                                        <div className="flex items-center gap-2 text-sm font-bold shrink-0">
                                                                             <Star size={16} className="text-yellow-500" />
                                                                            <span>{vendor.rating.toFixed(1)}</span>
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400">{vendor.description}</p>
                                                                    <div className="flex justify-end items-center gap-2 pt-1">
                                                                        <a href={getSearchUrl(vendor.name, vendor.productQuery)} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" title="Open in new tab">
                                                                            <ExternalLink size={16} />
                                                                        </a>
                                                                        <button 
                                                                            onClick={() => handleVendorSelect(vendor)}
                                                                            className="flex items-center gap-2 text-sm font-semibold bg-slate-200 dark:bg-slate-800 px-3 py-1.5 rounded-md shadow-sm hover:bg-gray-200 dark:hover:bg-slate-900 transition-colors"
                                                                        >
                                                                            <Utensils size={16} />
                                                                            <span>Explore</span>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                         )}
                                         {!isServiceLoading && !serviceError && serviceRecommendations.length === 0 && !serviceAction && (
                                            <p className="text-sm text-gray-500 text-center p-4">Select an action on the left to see AI-powered service recommendations.</p>
                                         )}
                                     </div>
                                )}
                            </div>
                        </div>
                   </div>
                </Modal>
            )}
        </div>
    );
};

export default RecipesPage;
