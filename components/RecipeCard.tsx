import React, { useState, useEffect } from 'react';
import { Recipe } from '../types';
import { getDrinkPairing } from '../services/geminiService';
import { ShoppingBasket, Sandwich, ChefHat, Heart, Share2, Clock, BarChart3, Thermometer, Wine, BookOpen } from 'lucide-react';

interface RecipeCardProps {
    recipe: Recipe;
    onSelect: (recipe: Recipe) => void;
    onShowVendors: (recipe: Recipe, action: 'Buy Ingredients' | 'Order Online' | 'Hire a Chef') => void;
    onToggleSave: (recipe: Recipe) => void;
    isSaved: boolean;
    index?: number;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSelect, onShowVendors, onToggleSave, isSaved, index = 0 }) => {
    
    const [drinkPairing, setDrinkPairing] = useState({ loading: true, text: '' });

    useEffect(() => {
        let isMounted = true;
        getDrinkPairing(recipe.name, recipe.cuisine).then(pairingText => {
            if (isMounted) {
                setDrinkPairing({ loading: false, text: pairingText });
            }
        }).catch(err => {
            console.error("Failed to get drink pairing for card:", err);
            if(isMounted) {
                setDrinkPairing({ loading: false, text: 'Could not fetch pairing.' });
            }
        });
        return () => { isMounted = false; };
    }, [recipe.name, recipe.cuisine]);

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: recipe.name,
                    text: `Check out this recipe for ${recipe.name}!`,
                    url: window.location.origin,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            alert('Share feature is not supported in your browser.');
        }
    };

    const InfoItem = ({ icon, text, title }: { icon: React.ReactNode; text: string | number; title: string }) => (
        <div className="flex flex-col items-center text-center" title={title}>
            {icon}
            <span className="text-xs font-medium mt-1">{text}</span>
        </div>
    );

    return (
        <div 
            className="group flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-md transition-all duration-300 border border-gray-200 dark:border-slate-700 card-lift animate-pop-in"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className="p-4 flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex-grow pr-2">
                        <h3 className="text-lg font-bold group-hover:text-primary transition-colors cursor-pointer" onClick={() => onSelect(recipe)}>{recipe.name}</h3>
                         <div className="flex items-center gap-2 mt-1">
                             <span className={`w-2.5 h-2.5 rounded-full ${recipe.isVeg ? 'bg-green-500' : 'bg-red-500'}`} title={recipe.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}></span>
                             <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-primary/20 text-primary-dark dark:bg-primary/30 dark:text-primary-light">
                                {recipe.cuisine}
                            </span>
                        </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onToggleSave(recipe); }}
                            className={`p-2 rounded-full transition-all duration-200 ${isSaved ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                            title={isSaved ? "Unsave Recipe" : "Save Recipe"}
                        >
                            <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} />
                        </button>
                         <button 
                            onClick={handleShare}
                            className="p-2 rounded-full text-slate-400 hover:text-primary transition-colors"
                            title="Share Recipe"
                        >
                            <Share2 size={18} />
                        </button>
                    </div>
                </div>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 h-10 overflow-hidden text-ellipsis">{recipe.description}</p>
                
                <div className="grid grid-cols-3 gap-2 text-center text-gray-600 dark:text-gray-300 mt-4 border-t border-gray-100 dark:border-slate-700 pt-3">
                    <InfoItem icon={<Clock size={18} />} text={`${recipe.cookTimeInMinutes} min`} title="Cook Time" />
                    <InfoItem icon={<BarChart3 size={18} />} text={recipe.difficulty} title="Difficulty" />
                    <InfoItem icon={<Thermometer size={18} />} text={`${recipe.calories} kcal`} title="Calories" />
                </div>
                
                <div className="mt-auto pt-3 border-t border-gray-100 dark:border-slate-700 min-h-[50px]">
                    <div className="flex items-start gap-2 text-sm text-indigo-700 dark:text-indigo-300">
                        <Wine size={20} className="flex-shrink-0 mt-0.5 text-indigo-500" />
                        {drinkPairing.loading ? (
                             <div className="w-full space-y-1.5 pt-1">
                                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full w-5/6 animate-pulse"></div>
                                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full w-4/6 animate-pulse"></div>
                            </div>
                        ) : (
                            <p className="text-xs">{drinkPairing.text}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-2 mt-auto border-t border-gray-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex justify-around text-center">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onShowVendors(recipe, 'Buy Ingredients'); }}
                        className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors w-1/4"
                        title="Buy Ingredients"
                    >
                        <ShoppingBasket size={20} className="text-green-500"/>
                        <span className="text-xs mt-1 font-medium text-gray-700 dark:text-gray-300">Ingredients</span>
                    </button>
                    <button 
                         onClick={(e) => { e.stopPropagation(); onShowVendors(recipe, 'Order Online'); }}
                        className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors w-1/4"
                        title="Order Online"
                    >
                        <Sandwich size={20} className="text-orange-500"/>
                        <span className="text-xs mt-1 font-medium text-gray-700 dark:text-gray-300">Order</span>
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onShowVendors(recipe, 'Hire a Chef'); }}
                        className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors w-1/4"
                        title="Hire a Chef"
                    >
                        <ChefHat size={20} className="text-indigo-500"/>
                        <span className="text-xs mt-1 font-medium text-gray-700 dark:text-gray-300">Hire Chef</span>
                    </button>
                     <button 
                        onClick={(e) => { e.stopPropagation(); onSelect(recipe); }}
                        className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors w-1/4"
                        title="View Recipe"
                    >
                        <BookOpen size={20} className="text-primary"/>
                        <span className="text-xs mt-1 font-medium text-gray-700 dark:text-gray-300">View</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecipeCard;
