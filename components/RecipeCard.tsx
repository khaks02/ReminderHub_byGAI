


import React from 'react';
import { Recipe } from '../types';
import { ShoppingBasket, Sandwich, ChefHat, Heart, Share2, Clock, Users, Globe, BarChart3, Thermometer } from 'lucide-react';

interface RecipeCardProps {
    recipe: Recipe;
    onSelect: (recipe: Recipe) => void;
    onShowVendors: (recipe: Recipe, action: 'Buy Ingredients' | 'Order Online' | 'Hire a Chef') => void;
    onToggleSave: (recipe: Recipe) => void;
    isSaved: boolean;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSelect, onShowVendors, onToggleSave, isSaved }) => {
    
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
        <div className="flex items-center gap-1.5" title={title}>
            {icon}
            <span className="text-xs font-medium">{text}</span>
        </div>
    );

    return (
        <div 
            className="group flex flex-col bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-transparent hover:border-primary"
            onClick={() => onSelect(recipe)}
        >
            <div className="p-4 flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors pr-2 flex-1">{recipe.name}</h3>
                    <div className="flex gap-2 flex-shrink-0">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onToggleSave(recipe); }}
                            className={`p-2 rounded-full transition-colors ${isSaved ? 'bg-red-100 text-red-500 dark:bg-red-900/50' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-red-500'}`}
                            title={isSaved ? "Unsave Recipe" : "Save Recipe"}
                        >
                            <Heart size={16} fill={isSaved ? 'currentColor' : 'none'} />
                        </button>
                         <button 
                            onClick={handleShare}
                            className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
                            title="Share Recipe"
                        >
                            <Share2 size={16} />
                        </button>
                    </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 h-10 overflow-hidden text-ellipsis">{recipe.description}</p>
                
                <div className="mt-auto grid grid-cols-2 gap-x-4 gap-y-2 text-gray-600 dark:text-gray-300">
                    <InfoItem icon={<BarChart3 size={14} />} text={recipe.difficulty} title="Difficulty" />
                    <InfoItem icon={<Thermometer size={14} />} text={`${recipe.calories} kcal`} title="Calories per serving" />
                    <InfoItem icon={<Clock size={14} />} text={`${recipe.cookTimeInMinutes} min`} title="Cook Time" />
                    <InfoItem icon={<Globe size={14} />} text={recipe.cuisine} title="Cuisine" />
                </div>
            </div>
            
            <div className="p-2 mt-auto border-t border-gray-100 dark:border-slate-700/50">
                <div className="flex justify-around text-center">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onShowVendors(recipe, 'Buy Ingredients'); }}
                        className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors w-1/3"
                        title="Buy Ingredients"
                    >
                        <ShoppingBasket size={20} className="text-green-500"/>
                        <span className="text-xs mt-1 font-medium text-gray-700 dark:text-gray-300">Ingredients</span>
                    </button>
                    <button 
                         onClick={(e) => { e.stopPropagation(); onShowVendors(recipe, 'Order Online'); }}
                        className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors w-1/3"
                        title="Order Online"
                    >
                        <Sandwich size={20} className="text-orange-500"/>
                        <span className="text-xs mt-1 font-medium text-gray-700 dark:text-gray-300">Order</span>
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onShowVendors(recipe, 'Hire a Chef'); }}
                        className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors w-1/3"
                        title="Hire a Chef"
                    >
                        <ChefHat size={20} className="text-indigo-500"/>
                        <span className="text-xs mt-1 font-medium text-gray-700 dark:text-gray-300">Hire Chef</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecipeCard;