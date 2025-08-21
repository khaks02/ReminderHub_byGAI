import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Spinner from './Spinner';
import { Recipe, ActivityRecommendation, VendorSuggestion } from '../types';
import { getVendorsForRecipeAction } from '../services/geminiService';
import { Zap, Star, ExternalLink, ShoppingCart } from 'lucide-react';

interface RecipeVendorModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipe: Recipe;
    action: 'Buy Ingredients' | 'Order Online' | 'Hire a Chef';
    onVendorSelect: (vendor: VendorSuggestion) => void;
}

const RecipeVendorModal: React.FC<RecipeVendorModalProps> = ({ isOpen, onClose, recipe, action, onVendorSelect }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [recommendations, setRecommendations] = useState<ActivityRecommendation[]>([]);

    useEffect(() => {
        if (isOpen) {
            const fetchVendors = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const results = await getVendorsForRecipeAction(recipe, action);
                    setRecommendations(results);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Could not fetch AI recommendations for this action.');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchVendors();
        }
    }, [isOpen, recipe, action]);
    
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
        <Modal isOpen={isOpen} onClose={onClose} title={`AI Suggestions for ${action}`} maxWidth="2xl">
            <div className="min-h-[300px]">
                 <h4 className="flex items-center font-semibold mb-3 text-lg">
                    <Zap size={20} className="mr-2 text-yellow-500" />
                    Vendors for "{recipe.name}"
                </h4>
                
                {isLoading && <div className="flex justify-center p-8"><Spinner /></div>}
                {error && <p className="text-red-500 text-sm p-4 text-center">{error}</p>}

                {!isLoading && !error && recommendations.length > 0 && (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {recommendations.map((rec, index) => (
                            <div key={`${rec.activity}-${index}`}>
                                <h5 className="font-semibold text-md mb-2 text-gray-600 dark:text-gray-400">{rec.activity}</h5>
                                <div className="space-y-2">
                                    {rec.vendors.map(vendor => (
                                        <div key={vendor.name} className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg space-y-2">
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
                                                <a href={getSearchUrl(vendor.name, vendor.productQuery)} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" title="Open in new tab">
                                                    <ExternalLink size={16} />
                                                </a>
                                                <button 
                                                    onClick={() => {
                                                        onVendorSelect(vendor);
                                                        onClose();
                                                    }}
                                                    className="flex items-center gap-2 text-sm font-semibold bg-white dark:bg-slate-800 px-3 py-1.5 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
                                                >
                                                    <ShoppingCart size={16} />
                                                    <span>Add to Cart</span>
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
                   <p className="text-sm text-gray-500 text-center p-4">No specific vendors found for this action.</p>
                )}
            </div>
        </Modal>
    );
};

export default RecipeVendorModal;