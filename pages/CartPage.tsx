


import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Trash2, ShoppingBag, Minus, Plus, ChefHat, Sandwich, ShoppingBasket, ConciergeBell } from 'lucide-react';
import { CartItem, CartItemType, ServiceCartItem, PreparedDishCartItem, VendorProductCartItem } from '../types';
// FIX: Using a namespace import and re-destructuring to work around potential module resolution issues.
import * as ReactRouterDOM from 'react-router-dom';
const { NavLink } = ReactRouterDOM;

const VendorSelector: React.FC<{ vendors: string[]; selectedVendor?: string; onSelect: (vendor: string) => void; }> = ({ vendors, selectedVendor, onSelect }) => {
    if (!vendors || vendors.length === 0) return <p className="text-xs text-gray-500 mt-1">No vendors available.</p>;

    return (
        <div className="mt-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Select Vendor:</label>
            <select 
                value={selectedVendor || ''} 
                onChange={(e) => onSelect(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-1.5 text-base border-gray-300 dark:border-slate-600 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            >
                <option value="" disabled>Choose one...</option>
                {vendors.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
        </div>
    );
};


const CartPage: React.FC = () => {
    const { cart, removeFromCart, clearCart, updateCartItem, checkout } = useAppContext();
    const [isCheckoutComplete, setIsCheckoutComplete] = useState(false);

    const subtotal = cart.reduce((acc, item) => {
        switch (item.type) {
            case CartItemType.SERVICE:
                return acc + item.item.price * item.quantity;
            case CartItemType.PREPARED_DISH:
                return acc + item.recipe.price * item.quantity;
            case CartItemType.CHEF_SERVICE:
                return acc + item.price;
            case CartItemType.VENDOR_PRODUCT:
                return acc + item.price * item.quantity;
            case CartItemType.INGREDIENTS_LIST:
                 // Price determined by vendor, not included in subtotal
                return acc;
            default:
                return acc;
        }
    }, 0);

    const taxes = subtotal * 0.1;
    const total = subtotal + taxes;
    
    const updateQuantity = (item: ServiceCartItem | PreparedDishCartItem | VendorProductCartItem, delta: number) => {
        const newQuantity = item.quantity + delta;
        if (newQuantity > 0) {
            updateCartItem(item.id, { ...item, quantity: newQuantity });
        } else {
            removeFromCart(item.id);
        }
    };

    const handleCheckout = () => {
        checkout();
        setIsCheckoutComplete(true);
    };

    const renderCartItem = (item: CartItem) => {
        let icon, title, description, price, quantityControls;

        switch (item.type) {
            case CartItemType.SERVICE:
                icon = <ConciergeBell className="w-10 h-10 text-primary flex-shrink-0"/>;
                title = item.item.name;
                description = <p className="text-sm text-gray-500 dark:text-gray-400">{item.item.provider}</p>;
                price = item.item.price;
                quantityControls = true;
                break;
            case CartItemType.PREPARED_DISH:
                icon = <Sandwich className="w-10 h-10 text-orange-500 flex-shrink-0"/>;
                title = item.recipe.name;
                description = <VendorSelector 
                                vendors={item.recipe.deliveryVendors} 
                                selectedVendor={item.vendor}
                                onSelect={(vendor) => updateCartItem(item.id, { vendor })}
                            />;
                price = item.recipe.price;
                quantityControls = true;
                break;
            case CartItemType.INGREDIENTS_LIST:
                icon = <ShoppingBasket className="w-10 h-10 text-green-500 flex-shrink-0"/>;
                title = `Ingredients for ${item.recipe.name}`;
                description = <VendorSelector 
                                vendors={item.recipe.groceryVendors} 
                                selectedVendor={item.vendor}
                                onSelect={(vendor) => updateCartItem(item.id, { vendor })}
                             />;
                price = null;
                break;
            case CartItemType.CHEF_SERVICE:
                icon = <ChefHat className="w-10 h-10 text-indigo-500 flex-shrink-0"/>;
                title = `Hire a Chef for ${item.recipe.name}`;
                description = <p className="text-sm text-gray-500">Professional chef service</p>;
                price = item.price;
                break;
            case CartItemType.VENDOR_PRODUCT:
                icon = <img src={item.imageUrl} alt={item.productName} className="w-10 h-10 rounded-md object-cover flex-shrink-0"/>;
                title = item.productName;
                description = <p className="text-sm text-gray-500 dark:text-gray-400">From: {item.vendor}</p>;
                price = item.price;
                quantityControls = true;
                break;
            default:
                return null;
        }
        
        const itemWithQuantity = (item.type === CartItemType.SERVICE || item.type === CartItemType.PREPARED_DISH || item.type === CartItemType.VENDOR_PRODUCT) ? item : null;

        return (
             <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-grow">
                    {icon}
                    <div className="flex-grow">
                        <h3 className="font-semibold">{title}</h3>
                        {description}
                    </div>
                </div>
                <div className="flex flex-col items-end ml-4">
                     {price !== null && <p className="font-bold whitespace-nowrap">₹{price.toFixed(2)}</p>}
                     {price === null && <p className="text-sm text-gray-500 whitespace-nowrap">Price varies</p>}
                     {quantityControls && itemWithQuantity && (
                         <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => updateQuantity(itemWithQuantity, -1)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600"><Minus size={16}/></button>
                            <span className="font-bold w-5 text-center">{itemWithQuantity.quantity}</span>
                            <button onClick={() => updateQuantity(itemWithQuantity, 1)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600"><Plus size={16}/></button>
                        </div>
                     )}
                </div>
            </div>
        );
    };

    if (isCheckoutComplete) {
        return (
             <div className="text-center py-20 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                <ShoppingBag size={48} className="mx-auto text-green-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Thank you for your order!</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Your purchase has been completed and you can view the details in your order history.</p>
                <div className="mt-6">
                    <NavLink to="/orders" className="bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-dark transition-colors">
                        View My Orders
                    </NavLink>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-4xl">
            <h1 className="text-3xl font-bold mb-2">Your Service Cart</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Review and checkout the services you've selected.</p>
            
            {cart.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 space-y-6">
                       {cart.map(item => (
                           <div key={item.id} className="flex items-start justify-between border-b border-gray-200 dark:border-slate-700 pb-6 last:border-b-0 last:pb-0">
                               <div className="flex-grow">
                                   {renderCartItem(item)}
                               </div>
                               <button onClick={() => removeFromCart(item.id)} className="p-2 ml-4 text-red-500 hover:bg-red-500/10 rounded-full transition">
                                   <Trash2 size={20} />
                               </button>
                           </div>
                       ))}
                    </div>
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 sticky top-24">
                            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                            <div className="flex justify-between mb-2 text-gray-600 dark:text-gray-400">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between mb-4 text-gray-600 dark:text-gray-400">
                                <span>Taxes & Fees (est.)</span>
                                <span>₹{taxes.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-gray-200 dark:border-slate-700 my-4"></div>
                             <div className="flex justify-between font-bold text-lg mb-6">
                                <span>Total</span>
                                <span>₹{total.toFixed(2)}</span>
                            </div>
                            <button onClick={handleCheckout} className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-dark transition-colors">
                                Proceed to Checkout
                            </button>
                             <button onClick={clearCart} className="w-full mt-2 text-sm text-red-500 hover:text-red-700 transition">
                                Clear Cart
                            </button>
                            <p className="text-xs text-gray-400 mt-4">Note: Ingredient prices are determined by the selected vendor at checkout.</p>
                        </div>
                    </div>
                </div>
            ) : (
                 <div className="text-center py-20 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <ShoppingBag size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Your cart is empty</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Explore recommendations in your dashboard or recipes to add services.</p>
                </div>
            )}
        </div>
    );
};

export default CartPage;