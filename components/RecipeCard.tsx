
import React from 'react';
import { Recipe } from '../types';
import { ShoppingBasket, Sandwich, ChefHat, BookOpen } from 'lucide-react';

interface RecipeCardProps {
    recipe: Recipe;
    onSelect: (recipe: Recipe) => void;
    onBuyIngredients: () => void;
    onOrderOnline: () => void;
    onHireChef: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSelect, onBuyIngredients, onOrderOnline, onHireChef }) => {
    
    const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    return (
        <div 
            className="group flex flex-col bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-all duration-300"
        >
            <div className="cursor-pointer" onClick={() => onSelect(recipe)}>
                <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-48 object-cover"/>
                <div className="p-4">
                    <h3 className="text-lg font-bold truncate group-hover:text-primary transition-colors">{recipe.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 h-10 overflow-hidden">{recipe.description}</p>
                </div>
            </div>

            <div className="p-4 pt-2 mt-auto border-t border-gray-100 dark:border-slate-700/50">
                <div className="grid grid-cols-4 gap-1 text-center">
                    <button 
                        onClick={(e) => handleButtonClick(e, () => onSelect(recipe))} 
                        className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        title="View Recipe"
                    >
                        <BookOpen size={20} className="text-blue-500"/>
                        <span className="text-xs mt-1 font-medium text-gray-700 dark:text-gray-300">View Recipe</span>
                    </button>
                    <button 
                        onClick={(e) => handleButtonClick(e, onBuyIngredients)} 
                        className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        title="Buy Ingredients"
                    >
                        <ShoppingBasket size={20} className="text-green-500"/>
                        <span className="text-xs mt-1 font-medium text-gray-700 dark:text-gray-300">Buy Ingredients</span>
                    </button>
                    <button 
                        onClick={(e) => handleButtonClick(e, onOrderOnline)} 
                        className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        title="Order Online"
                    >
                        <Sandwich size={20} className="text-orange-500"/>
                        <span className="text-xs mt-1 font-medium text-gray-700 dark:text-gray-300">Order Online</span>
                    </button>
                    <button 
                        onClick={(e) => handleButtonClick(e, onHireChef)} 
                        className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        title="Hire a Chef"
                    >
                        <ChefHat size={20} className="text-indigo-500"/>
                        <span className="text-xs mt-1 font-medium text-gray-700 dark:text-gray-300">Hire a Chef</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecipeCard;
