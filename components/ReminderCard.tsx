import React, { useState, useCallback } from 'react';
import { Reminder, ActivityRecommendation, VendorSuggestion, Recipe } from '../types';
import { getServiceRecommendations, searchForServices, getRecipesForReminder } from '../services/geminiService';
import { ChevronDown, Zap, Clock, MoreVertical, Edit, Trash2, Repeat, CheckSquare, Star, ExternalLink, ShoppingCart, Search, Loader, Share2, Utensils, ShoppingBasket } from 'lucide-react';
import Spinner from './Spinner';

interface ReminderCardProps {
    reminder: Reminder;
    onVendorSelect: (vendor: VendorSuggestion, reminder: Reminder) => void;
    onEdit: (reminder: Reminder) => void;
    onDelete: (id: string) => void;
    onSnooze: (id: string, days: number) => void;
    onComplete: (reminder: Reminder) => void;
    onShowToast: (message: string, type: 'success' | 'error') => void;
    onAddIngredients: (recipe: Recipe) => void;
}

const ReminderCard: React.FC<ReminderCardProps> = ({ reminder, onVendorSelect, onEdit, onDelete, onSnooze, onComplete, onShowToast, onAddIngredients }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recommendations, setRecommendations] = useState<ActivityRecommendation[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const [recipeIdeas, setRecipeIdeas] = useState<Recipe[]>([]);
    const [isRecipeLoading, setIsRecipeLoading] = useState(false);
    const [recipeError, setRecipeError] = useState<string | null>(null);

    const fetchRecommendations = useCallback(async () => {
        if (recommendations.length > 0) return;
        setIsLoading(true);
        setError(null);
        try {
            const recommendedServices = await getServiceRecommendations(reminder);
            setRecommendations(recommendedServices);
        } catch (err) {
            console.error('[ReminderCard] Failed to fetch AI service recommendations:', err);
            setError('Could not fetch AI recommendations.');
        } finally {
            setIsLoading(false);
        }
    }, [reminder, recommendations.length]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setError(null);
        try {
            const searchResults = await searchForServices(reminder, searchQuery);
            setRecommendations(prev => [...searchResults, ...prev]);
        } catch (err) {
            console.error('[ReminderCard] AI service search failed:', err);
            setError('Search failed. Please try again.');
        } finally {
            setIsSearching(false);
            setSearchQuery('');
        }
    };

    const handleFindRecipes = async () => {
        if (recipeIdeas.length > 0) return;
        setIsRecipeLoading(true);
        setRecipeError(null);
        try {
            const recipes = await getRecipesForReminder(reminder);
            setRecipeIdeas(recipes);
        } catch (err) {
            console.error('[ReminderCard] Failed to fetch AI recipe ideas:', err);
            setRecipeError('Could not fetch AI recipe ideas.');
        } finally {
            setIsRecipeLoading(false);
        }
    };


    const handleToggleExpansion = () => {
        const newExpandedState = !isExpanded;
        setIsExpanded(newExpandedState);
        if (newExpandedState) {
            fetchRecommendations();
        }
    };
    
    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat(undefined, {
            year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit'
        }).format(date);
    };

    const handleShare = async () => {
        setIsMenuOpen(false);
        const shareText = `Reminder: ${reminder.title} on ${formatDate(reminder.date)}. Details: ${reminder.description || 'No description.'}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Reminder: ${reminder.title}`,
                    text: shareText,
                    url: window.location.origin,
                });
            } catch (err) {
                console.error("[ReminderCard] Web Share API failed:", err);
                onShowToast("Could not share reminder.", 'error');
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareText);
                onShowToast("Invitation copied to clipboard!", 'success');
            } catch (err) {
                console.error("[ReminderCard] Clipboard copy failed:", err);
                onShowToast("Could not copy invitation.", 'error');
            }
        }
    };

    const formatRecurrence = (rule: Reminder['recurrence_rule']) => {
        if (!rule) return '';
        const { frequency, interval } = rule;
        const freqStr = frequency.toLowerCase().replace(/ly$/, '');
        if (interval === 1) {
            return `Repeats ${frequency.toLowerCase()}`;
        }
        return `Repeats every ${interval} ${freqStr}s`;
    }
    
    const getSearchUrl = (vendor: string, query: string) => {
         const searchUrlMap: { [key: string]: string } = {
            'Zomato': `https://www.zomato.com/search?q=${encodeURIComponent(query)}`,
            'Swiggy': `https://www.swiggy.com/search?query=${encodeURIComponent(query)}`,
            'Amazon': `https://www.amazon.in/s?k=${encodeURIComponent(query)}`,
            'Flipkart': `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`,
            'Myntra': `https://www.myntra.com/${encodeURIComponent(query)}`,
            'Practo': `https://www.practo.com/search?q=${encodeURIComponent(query)}`,
            'Apollo 24/7': `https://www.apollo247.com/search-medicines/${encodeURIComponent(query)}`,
            'Urban Company': `https://www.urbancompany.com/search?q=${encodeURIComponent(query)}`,
        };
        return searchUrlMap[vendor] || `https://www.google.com/search?q=${encodeURIComponent(vendor + ' ' + query)}`;
    };

    const getPlaceholderForReminder = (reminderType: string): string => {
        const lowerType = reminderType.toLowerCase();
        switch (lowerType) {
            case 'birthday':
                return "Need a 'magician' or a 'giant cake'?";
            case 'anniversary':
                return "Search for 'romantic getaways' or 'couple spas'... ";
            case 'meeting':
                return "Look for 'coffee delivery' or 'a good excuse'... ";
            case 'appointment':
                return "Find 'nearby pharmacies' or 'a place to relax'... ";
            case 'renewal':
                return "Search for 'better deals' or 'competitors'... ";
            case 'bill payment':
                return "Find 'ways to save money' for next time...";
            case 'general':
                 return "What else do you need? 'House cleaning'?";
            default:
                return "Find other services, e.g., 'decorators'... ";
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 shadow-md rounded-xl overflow-hidden transition-all duration-300">
            <div className="p-5">
                <div className="flex justify-between items-start">
                    <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary-dark bg-primary/20">
                            {reminder.type}
                        </span>
                        <h3 className="text-xl font-bold mt-2">{reminder.title}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{reminder.description}</p>
                    </div>
                    <div className="relative">
                        <button onClick={() => setIsMenuOpen(v => !v)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition">
                            <MoreVertical size={20} />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-md shadow-lg z-10 border border-gray-200 dark:border-slate-700">
                                <button onClick={() => { onComplete(reminder); setIsMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-slate-800"><CheckSquare size={14} className="mr-2"/> Mark as Complete</button>
                                <button onClick={() => { onEdit(reminder); setIsMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"><Edit size={14} className="mr-2"/> Edit</button>
                                <button onClick={() => { onSnooze(reminder.id, 1); setIsMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"><Clock size={14} className="mr-2"/> Snooze 1 Day</button>
                                <button onClick={handleShare} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"><Share2 size={14} className="mr-2"/> Share / Invite</button>
                                <div className="border-t border-gray-100 dark:border-slate-800 my-1"></div>
                                <button onClick={() => { onDelete(reminder.id); setIsMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-slate-800"><Trash2 size={14} className="mr-2"/> Delete</button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-4 gap-4">
                    <div className="flex items-center"><Clock size={16} className="mr-2"/>
                    <span>{formatDate(reminder.date)}</span></div>
                    {reminder.recurrence_rule && (
                        <div className="flex items-center"><Repeat size={16} className="mr-2 text-blue-500"/>
                        <span>{formatRecurrence(reminder.recurrence_rule)}</span></div>
                    )}
                </div>
                 <button onClick={handleToggleExpansion} className="w-full flex justify-center p-2 mt-4 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md">
                        <ChevronDown className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                 </button>
            </div>
            {isExpanded && (
                <div className="px-5 pb-5 bg-gray-50 dark:bg-slate-800/50">
                    <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                        <h4 className="flex items-center font-semibold mb-3">
                            <Zap size={18} className="mr-2 text-yellow-500" />
                            AI-Powered Actions
                        </h4>

                        <div className="flex flex-col sm:flex-row gap-2 mb-4">
                            <form onSubmit={handleSearch} className="relative flex-grow">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={getPlaceholderForReminder(reminder.type)}
                                    className="w-full pl-4 pr-10 py-2 text-sm rounded-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 focus:ring-1 focus:ring-primary focus:outline-none"
                                    disabled={isSearching}
                                />
                                <button type="submit" className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-gray-500 hover:text-primary disabled:text-gray-400" disabled={isSearching || !searchQuery.trim()}>
                                    {isSearching ? <Loader size={16} className="animate-spin"/> : <Search size={16} />}
                                </button>
                            </form>
                             <button onClick={handleFindRecipes} className="flex-shrink-0 flex items-center justify-center gap-2 text-sm font-semibold bg-white dark:bg-slate-700 px-4 py-2 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors border border-gray-300 dark:border-slate-600" disabled={isRecipeLoading}>
                                {isRecipeLoading ? <Loader size={16} className="animate-spin"/> : <Utensils size={16} />}
                                <span>Find Recipe Ideas</span>
                            </button>
                        </div>


                        {isLoading && <div className="flex justify-center p-4"><Spinner /></div>}
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        {!isLoading && !error && recommendations.length > 0 && (
                            <div className="space-y-4">
                                {recommendations.map((rec, index) => (
                                    <div key={`${rec.activity}-${index}`}>
                                        <h5 className="font-semibold text-sm mb-2 text-gray-600 dark:text-gray-400">{rec.activity}</h5>
                                        <div className="space-y-2">
                                            {rec.vendors.map(vendor => (
                                                <div key={vendor.name} className="p-3 bg-slate-200 dark:bg-slate-700 rounded-lg space-y-2">
                                                    <div className="flex justify-between items-start">
                                                        <h6 className="font-bold">{vendor.name}</h6>
                                                        <div className="flex items-center gap-2 text-sm font-bold shrink-0">
                                                             <span className="text-gray-700 dark:text-gray-300">{vendor.priceRange}</span>
                                                             <Star size={16} className="text-yellow-500" />
                                                            <span>{vendor.rating.toFixed(1)}</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">{vendor.description}</p>
                                                    <div className="flex justify-end items-center gap-2 pt-1">
                                                        <a href={getSearchUrl(vendor.name, vendor.productQuery)} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" title="Open in new tab">
                                                            <ExternalLink size={16} />
                                                        </a>
                                                        <button 
                                                            onClick={() => onVendorSelect(vendor, reminder)}
                                                            className="flex items-center gap-2 text-sm font-semibold bg-white dark:bg-slate-800 px-3 py-1.5 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
                                                        >
                                                            <ShoppingCart size={16} />
                                                            <span>Add</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!isLoading && !error && recommendations.length === 0 && (
                           <p className="text-sm text-gray-500">No service recommendations available. Try searching above.</p>
                        )}
                        
                        {(isRecipeLoading || recipeError || recipeIdeas.length > 0) && <div className="border-t border-gray-200 dark:border-slate-700 my-4"></div>}

                        {isRecipeLoading && <div className="flex justify-center p-4"><Spinner /></div>}
                        {recipeError && <p className="text-red-500 text-sm">{recipeError}</p>}
                        {recipeIdeas.length > 0 && (
                            <div>
                                <h5 className="font-semibold text-sm mb-2 text-gray-600 dark:text-gray-400">Recipe Ideas</h5>
                                <div className="space-y-2">
                                    {recipeIdeas.map(recipe => (
                                        <div key={recipe.id} className="p-3 bg-slate-200 dark:bg-slate-700 rounded-lg flex justify-between items-center">
                                            <div>
                                                <h6 className="font-bold text-sm">{recipe.name}</h6>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">{recipe.cuisine}</p>
                                            </div>
                                            <button 
                                                onClick={() => onAddIngredients(recipe)}
                                                className="flex items-center gap-2 text-sm font-semibold bg-white dark:bg-slate-800 px-3 py-1.5 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
                                            >
                                                <ShoppingBasket size={16} className="text-green-500" />
                                                <span>Add Ingredients</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReminderCard;