import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAppContext } from '../hooks/useAppContext';
import { CartItemType } from '../types';
import { getAnalyticsInsights } from '../services/geminiService';
import Spinner from '../components/Spinner';
import { Bot, Zap } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19A3'];

const AiInsightRenderer = ({ content }: { content: string }) => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let listItems: string[] = [];

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`ul-${elements.length}`} className="list-disc pl-5 space-y-1">
                    {listItems.map((item, idx) => <li key={idx}>{item}</li>)}
                </ul>
            );
            listItems = [];
        }
    };

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('#')) {
            flushList();
            const level = trimmedLine.match(/^#+/)?.[0].length || 1;
            const text = trimmedLine.replace(/^#+\s*/, '');
            const Tag = `h${Math.min(level + 2, 6)}` as keyof JSX.IntrinsicElements;
            elements.push(<Tag key={index} className="font-bold my-3 flex items-center gap-2"><Bot size={18} className="text-primary"/>{text}</Tag>);
        } else if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
            listItems.push(trimmedLine.substring(2));
        } else {
            flushList();
            if (trimmedLine) {
                elements.push(<p key={index}>{trimmedLine}</p>);
            }
        }
    });

    flushList(); // Add any remaining list items

    return <div className="space-y-2">{elements}</div>;
};


const AnalyticsPage: React.FC = () => {
    const { reminders, orders } = useAppContext();
    const [insights, setInsights] = React.useState<string | null>(null);
    const [isInsightsLoading, setIsInsightsLoading] = React.useState(false);
    const [insightsError, setInsightsError] = React.useState<string | null>(null);

    const handleGenerateInsights = async () => {
        setIsInsightsLoading(true);
        setInsightsError(null);
        setInsights(null);
        try {
            const result = await getAnalyticsInsights(reminders, orders);
            setInsights(result);
        } catch (err) {
            console.error('[AnalyticsPage] Failed to generate AI insights:', err);
            setInsightsError(err instanceof Error ? err.message : 'Failed to get AI insights. Please try again later.');
        } finally {
            setIsInsightsLoading(false);
        }
    };

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
        <div className="container mx-auto p-4 md:p-8 pb-24 md:pb-8">
            <h1 className="text-3xl font-bold mb-2">Analytics</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Insights into your reminders and service usage.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm card-lift">
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
                                    <Bar dataKey="count" fill="hsl(210, 80%, 55%)" name="Total Reminders" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">No reminder data to display.</div>
                        )}
                    </div>
                </div>
                <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm card-lift">
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
             <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900 rounded-lg shadow-sm card-lift">
                <div className="flex justify-between items-start">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Zap className="text-yellow-500"/>AI-Powered Insights</h2>
                    {!insights && !isInsightsLoading && (
                         <button 
                            onClick={handleGenerateInsights}
                            className="flex items-center gap-2 bg-primary text-white font-bold py-2 px-4 rounded-md hover:bg-primary-dark transition-colors text-sm"
                            disabled={isInsightsLoading}
                        >
                            <Zap size={16}/> Generate Analysis
                        </button>
                    )}
                </div>

                {isInsightsLoading && (
                    <div className="flex flex-col items-center justify-center p-8">
                        <Spinner size="8" />
                        <p className="mt-4 text-gray-500 dark:text-gray-400">AI is analyzing your data...</p>
                    </div>
                )}
                 {insightsError && <p className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg">{insightsError}</p>}
                 {insights && (
                     <div className="p-4 bg-slate-50/50 dark:bg-slate-700/30 rounded-lg prose dark:prose-invert prose-sm max-w-none animate-fade-in">
                        <AiInsightRenderer content={insights} />
                     </div>
                 )}
            </div>
        </div>
    );
};

export default AnalyticsPage;
