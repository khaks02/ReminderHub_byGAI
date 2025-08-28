
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAppContext } from '../hooks/useAppContext';
import { CartItemType } from '../types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19A3'];

const AnalyticsPage: React.FC = () => {
    const { reminders, orders } = useAppContext();

    const reminderData = React.useMemo(() => {
        if (!reminders || reminders.length === 0) return [];
        const typeCounts = reminders.reduce((acc, reminder) => {
            const type = reminder.type || 'General';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });

        return Object.entries(typeCounts).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
    }, [reminders]);

    const serviceData = React.useMemo(() => {
        if (!orders || orders.length === 0) return [];
        
        const categoryTotals = orders.flatMap(order => order.items).reduce((acc, item) => {
            let category: string | null = null;
            let value = 0;

            switch (item.type) {
                case CartItemType.SERVICE:
                    category = item.item.provider || 'General Service';
                    value = item.item.price * item.quantity;
                    break;
                case CartItemType.PREPARED_DISH:
                    category = item.vendor || 'Restaurant Order';
                    value = item.recipe.price * item.quantity;
                    break;
                case CartItemType.CHEF_SERVICE:
                    category = 'Chef Service';
                    value = item.price;
                    break;
                case CartItemType.VENDOR_PRODUCT:
                    category = item.vendor;
                    value = item.price * item.quantity;
                    break;
            }
            
            if (category) {
                 acc[category] = (acc[category] || 0) + value;
            }
            return acc;
        }, {} as { [key: string]: number });

        return Object.entries(categoryTotals).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    }, [orders]);

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-2">Analytics</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Insights into your reminders and service usage.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Reminder Types Breakdown</h2>
                     <div className="w-full h-[300px]">
                        {reminderData.length > 0 ? (
                            <ResponsiveContainer>
                                <BarChart data={reminderData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                            border: '1px solid #ccc',
                                            borderRadius: '0.5rem'
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="count" fill="hsl(210, 40%, 50%)" name="Total Reminders" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">No reminder data to display.</div>
                        )}
                    </div>
                </div>
                <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Spending by Service/Vendor</h2>
                    <div className="w-full h-[300px]">
                         {serviceData.length > 0 ? (
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={serviceData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                        nameKey="name"
                                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                    >
                                        {serviceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `₹${Number(value).toFixed(2)}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">No spending data to display.</div>
                        )}
                    </div>
                </div>
            </div>
             <div className="mt-8 p-10 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-300 dark:border-slate-700">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">More Advanced Analytics Coming Soon</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Future updates will include insights into AI recommendation effectiveness, spending patterns, and personal productivity metrics.</p>
            </div>
        </div>
    );
};

export default AnalyticsPage;
