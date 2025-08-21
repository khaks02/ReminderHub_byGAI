
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { VendorProductCartItem, VendorSuggestion } from '../types';

const inputStyle = "w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-content-light dark:text-content-dark placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-colors";
const btnPrimary = "inline-flex items-center justify-center w-full px-6 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-dark font-semibold transition-colors";


const VendorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    vendorSuggestion: VendorSuggestion | null;
    onAddToCart: (item: Omit<VendorProductCartItem, 'id' | 'type' | 'customerCare'>) => void;
}> = ({ isOpen, onClose, vendorSuggestion, onAddToCart }) => {
    const [productName, setProductName] = useState('');
    const [price, setPrice] = useState('');

    const vendorName = vendorSuggestion?.name || '';
    const productQuery = vendorSuggestion?.productQuery || '';

    useEffect(() => {
        if (!isOpen) {
            setProductName('');
            setPrice('');
        }
    }, [isOpen]);

    const vendorUrlMap: { [key: string]: (query: string) => string } = {
        'Zomato': (q) => `https://www.zomato.com/search?q=${encodeURIComponent(q)}`,
        'Swiggy': (q) => `https://www.swiggy.com/search?query=${encodeURIComponent(q)}`,
        'Amazon': (q) => `https://www.amazon.in/s?k=${encodeURIComponent(q)}`,
        'Flipkart': (q) => `https://www.flipkart.com/search?q=${encodeURIComponent(q)}`,
        'Myntra': (q) => `https://www.myntra.com/${encodeURIComponent(q)}`,
        'BigBasket': (q) => `https://www.bigbasket.com/ps/?q=${encodeURIComponent(q)}`,
        'Zepto': (q) => `https://www.zeptonow.com/search?q=${encodeURIComponent(q)}`,
        'Instamart': (q) => `https://www.swiggy.com/instamart/search?query=${encodeURIComponent(q)}`,
        'Urban Company': (q) => `https://www.urbancompany.com/search?q=${encodeURIComponent(q)}`,
        'Acko': (q) => `https://www.acko.com/search/?q=${encodeURIComponent(q)}`,
        'JioMart': (q) => `https://www.jiomart.com/search/${encodeURIComponent(q)}`,
        'PolicyBazaar': (q) => `https://www.policybazaar.com/search?q=${encodeURIComponent(q)}`,
        'Practo': (q) => `https://www.practo.com/search?q=${encodeURIComponent(q)}`,
        'Apollo 24/7': (q) => `https://www.apollo247.com/search-medicines/${encodeURIComponent(q)}`,
        'Ferns N Petals': (q) => `https://www.fnp.com/search?q=${encodeURIComponent(q)}`,
    };
    
    const getVendorUrl = () => {
        const urlBuilder = vendorUrlMap[vendorName];
        if (urlBuilder) {
            return urlBuilder(productQuery);
        }
        return `https://www.google.com/search?q=${encodeURIComponent(vendorName + ' ' + productQuery)}`;
    };

    const handleAddToCart = () => {
        if (!productName || !price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
            alert('Please enter a valid product name and a positive price.');
            return;
        }
        const newItem = {
            productName,
            vendor: vendorName,
            price: parseFloat(price),
            quantity: 1,
            imageUrl: `https://picsum.photos/seed/${productName.replace(/\W/g, '')}/100/100`
        };
        onAddToCart(newItem);
        setProductName('');
        setPrice('');
        onClose();
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Shop on ${vendorName}`} maxWidth="4xl">
            <div className="flex flex-col h-[75vh]">
                 <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded-md text-xs mb-4">
                    <strong>Demo Notice:</strong> Many sites block being embedded. This is a simulation. Use the form below to add items to your cart.
                </div>
                <iframe src={getVendorUrl()} title={vendorName} className="flex-grow w-full border border-slate-300 dark:border-slate-600 rounded-md"></iframe>
                <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <h3 className="font-bold mb-2">Add item to ReminderHub Cart</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                        <div className="md:col-span-2">
                             <label htmlFor="productName" className="text-sm font-medium">Product / Service Name</label>
                            <input id="productName" type="text" value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g., 'Red Velvet Cake' or 'AC Service'" className={`mt-1 ${inputStyle}`}/>
                        </div>
                        <div>
                             <label htmlFor="price" className="text-sm font-medium">Price (₹)</label>
                            <input id="price" type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g., 850.00" className={`mt-1 ${inputStyle}`}/>
                        </div>
                    </div>
                    <button onClick={handleAddToCart} className={`mt-3 ${btnPrimary}`}>
                        Add to Cart
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default VendorModal;