import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ShoppingBag, ChefHat, Sandwich, ShoppingBasket, Package, Link, Headset, CalendarPlus } from 'lucide-react';
import { CartItem, CartItemType } from '../types';

const OrdersPage: React.FC = () => {
    const { orders } = useAppContext();

    const getItemIcon = (item: CartItem) => {
        switch (item.type) {
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
        <div className="container mx-auto max-w-4xl p-4 md:p-8 pb-24 md:pb-8">
            <h1 className="text-3xl font-bold mb-2">My Orders</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Here is a history of all your purchases.</p>
            
            {orders.length > 0 ? (
                <div className="space-y-6">
                    {orders.map(order => (
                        <div key={order.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden card-lift">
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
                            <div className="p-6">
                                {order.reminderTitle && (
                                    <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-md text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                                        <Link size={16} />
                                        <span>For reminder: <strong>{order.reminderTitle}</strong></span>
                                    </div>
                                )}
                                <h3 className="font-semibold mb-3">Items</h3>
                                <ul className="space-y-3">
                                    {order.items.map(item => (
                                        <li key={item.id} className="flex flex-col">
                                            <div className="flex items-center gap-3 text-sm w-full">
                                                {getItemIcon(item)}
                                                <span className="flex-grow">{getItemName(item)}</span>
                                                {'quantity' in item && <span className="text-gray-500 dark:text-gray-400">Qty: {item.quantity}</span>}
                                            </div>
                                            {item.type === CartItemType.VENDOR_PRODUCT && item.customerCare && (
                                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1 pl-8 self-start">
                                                    <Headset size={14} />
                                                    <span>Customer Care: {item.customerCare}</span>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                                {order.followUpReminders && order.followUpReminders.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                                        <h4 className="font-semibold text-sm mb-2">Associated Reminders</h4>
                                        <div className="space-y-2">
                                        {order.followUpReminders.map((followUp, index) => (
                                            <div key={index} className="flex items-center gap-2 text-xs p-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md">
                                                <CalendarPlus size={16} />
                                                <span>Added to reminders: <strong>{followUp.title}</strong> on {new Date(followUp.date).toLocaleDateString()}</span>
                                            </div>
                                        ))}
                                        </div>
                                    </div>
                                )}
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