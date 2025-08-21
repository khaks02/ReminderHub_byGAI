import React from 'react';
// import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const reminderData = [
    { name: 'Birthday', count: 4 },
    { name: 'Meeting', count: 8 },
    { name: 'Renewal', count: 2 },
    { name: 'Appointment', count: 5 },
    { name: 'General', count: 12 },
];

const serviceData = [
    { name: 'Catering', value: 400 },
    { name: 'Decorations', value: 300 },
    { name: 'Venues', value: 500 },
    { name: 'Cabs', value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AnalyticsPage: React.FC = () => {
    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-2">Analytics</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Insights into your reminders and service usage.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Reminder Types Breakdown</h2>
                     <div className="w-full h-[300px] flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-md">
                        <p className="text-gray-500">Chart rendering is temporarily disabled due to library incompatibility.</p>
                    </div>
                </div>
                <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Recommended Service Usage</h2>
                    <div className="w-full h-[300px] flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-md">
                        <p className="text-gray-500">Chart rendering is temporarily disabled due to library incompatibility.</p>
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