
import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ShoppingBag, ChefHat, Sandwich, ShoppingBasket, ConciergeBell, Package, Link } from 'lucide-react';
import { CartItem, CartItemType } from '../types';

const OrdersPage: React.FC = () => {
    const { orders } = useAppContext();

    const getItemIcon = (item: CartItem) => {
        switch (item.type) {
            case CartItemType.SERVICE:
                return <ConciergeBell className="w-5 h-5 text-primary"/>;
            case CartItemType.PREPARED_DISH:
                return <Sandwich className="w-5 h-5 text-orange-500"/>;
            case CartItemType.INGREDIENTS_LIST:
                return <ShoppingBasket className="w-5 h-5 text-green-500"/>;
            case CartItemType.CHEF_SERVICE:
                return <ChefHat className="w-5 h-5 text-indigo-500"/>;
            case CartItemType.VENDOR_PRODUCT:
                return <Package className="w-5 h-5 text-gray-500"/>;
            default:
                return null;
        }
    };

    const getItemName = (item: CartItem) => {
        switch (item.type) {
            case CartItemType.SERVICE:
                return item.item.name;
            case CartItemType.PREPARED_DISH:
                return item.recipe.name;
            case CartItemType.INGREDIENTS_LIST:
                return `Ingredients for ${item.recipe.name}`;
            case CartItemType.CHEF_SERVICE:
                 return `Chef for ${item.recipe.name}`;
            case CartItemType.VENDOR_PRODUCT:
                return item.productName;
            default:
                return "Unknown Item";
        }
    }

    return (
        <div className="container mx-auto max-w-4xl">
            <h1 className="text-3xl font-bold mb-2">My Orders</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Here is a history of all your purchases.</p>
            
            {orders.length > 0 ? (
                <div className="space-y-6">
                    {orders.map(order => (
                        <div key={order.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
                            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-2">
                                <div>
                                    <h2 className="font-bold text-lg">Order #{order.id.slice(-6)}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(order.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                                    <p className="font-bold text-lg">₹{order.total.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="p-4">
                                {order.reminderTitle && (
                                    <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-md text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                                        <Link size={16} />
                                        <span>For reminder: <strong>{order.reminderTitle}</strong></span>
                                    </div>
                                )}
                                <h3 className="font-semibold mb-3">Items</h3>
                                <ul className="space-y-3">
                                    {order.items.map(item => (
                                        <li key={item.id} className="flex items-center gap-3 text-sm">
                                            {getItemIcon(item)}
                                            <span className="flex-grow">{getItemName(item)}</span>
                                            {'quantity' in item && <span className="text-gray-500 dark:text-gray-400">Qty: {item.quantity}</span>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="text-center py-20 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <ShoppingBag size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No orders yet</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Once you complete a checkout, your orders will appear here.</p>
                </div>
            )}
        </div>
    );
};

export default OrdersPage;
