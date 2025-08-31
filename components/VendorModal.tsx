
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { VendorProductCartItem, VendorSuggestion } from '../types';
import { getMockProductsForVendor } from '../services/geminiService';
import Spinner from './Spinner';
import { ShoppingCart, AlertTriangle, Search } from 'lucide-react';

interface MockProduct {
    productName: string;
    price: number;
    imageUrl: string;
}

const VendorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    vendorSuggestion: VendorSuggestion | null;
    onAddToCart: (item: Omit<VendorProductCartItem, 'id' | 'type' | 'customerCare'>) => void;
}> = ({ isOpen, onClose, vendorSuggestion, onAddToCart }) => {
    
    const [products, setProducts] = useState<MockProduct[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const vendorName = vendorSuggestion?.name || '';
    const productQuery = vendorSuggestion?.productQuery || '';

    useEffect(() => {
        if (isOpen && vendorSuggestion) {
            const fetchProducts = async () => {
                setIsLoading(true);
                setError(null);
                setProducts([]);
                try {
                    const mockProducts = await getMockProductsForVendor(vendorSuggestion.name, vendorSuggestion.productQuery);
                    setProducts(mockProducts);
                } catch (err) {
                    console.error("[VendorModal] Failed to fetch mock products:", err);
                    setError(err instanceof Error ? err.message : "Could not simulate this shopping experience. Please try another vendor.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchProducts();
        }
    }, [isOpen, vendorSuggestion]);

    const handleAddToCart = (product: MockProduct) => {
        const newItem = {
            productName: product.productName,
            vendor: vendorName,
            price: product.price,
            quantity: 1,
            imageUrl: product.imageUrl,
        };
        onAddToCart(newItem);
        onClose();
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Shop on ${vendorName}`} maxWidth="4xl">
            <div className="flex flex-col h-[75vh]">
                 <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded-md text-xs mb-4 text-center">
                    <strong>Demo Notice:</strong> This is a simulated shopping experience powered by AI.
                </div>
                
                {/* Simulated Header */}
                <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                         <div className="w-10 h-10 bg-primary text-white flex items-center justify-center rounded-full font-bold text-xl">
                            {vendorName.charAt(0)}
                        </div>
                        <h2 className="text-xl font-bold">{vendorName}</h2>
                    </div>
                     <div className="mt-4 relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                        <input
                            type="text"
                            value={productQuery}
                            readOnly
                            className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full pl-10 pr-4 py-2 text-sm"
                         />
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-grow overflow-y-auto p-4">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full">
                            <Spinner size="10"/>
                            <p className="mt-4 text-slate-500 dark:text-slate-400">AI is creating your shopping experience...</p>
                        </div>
                    )}
                    {error && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <AlertTriangle size={48} className="text-red-500 mb-4"/>
                            <h3 className="text-lg font-semibold">Simulation Failed</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm">{error}</p>
                        </div>
                    )}
                    {!isLoading && !error && products.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {products.map((product, index) => (
                                <div key={index} className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden flex flex-col group">
                                    <img src={product.imageUrl} alt={product.productName} className="w-full h-40 object-cover" />
                                    <div className="p-4 flex flex-col flex-grow">
                                        <h4 className="font-semibold text-sm flex-grow">{product.productName}</h4>
                                        <p className="font-bold text-lg mt-2">₹{product.price.toFixed(2)}</p>
                                        <button
                                            onClick={() => handleAddToCart(product)}
                                            className="mt-3 w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-2 rounded-md hover:bg-primary-dark transition-colors"
                                        >
                                            <ShoppingCart size={16}/>
                                            Add to Cart
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default VendorModal;
