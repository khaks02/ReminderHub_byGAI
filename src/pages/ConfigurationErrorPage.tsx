import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfigurationErrorPage: React.FC = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-bkg-light dark:bg-bkg-dark p-4">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl text-center">
                <AlertTriangle className="mx-auto w-16 h-16 text-red-500 mb-6" />
                <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">Configuration Required</h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
                    This application requires Supabase credentials to be set as environment variables.
                </p>
                <div className="text-left bg-slate-100 dark:bg-slate-900 p-6 rounded-lg font-mono text-sm text-slate-700 dark:text-slate-200">
                    <p className="mb-4">Please ensure the following environment variables are set in your deployment environment:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><code className="text-orange-500">SUPABASE_URL</code></li>
                        <li><code className="text-orange-500">SUPABASE_ANON_KEY</code></li>
                    </ul>
                </div>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mt-6">
                    Alternatively, you can enable demo mode by setting <code className="text-primary dark:text-primary-light">USE_MOCK_DATA = true</code> in the <strong>`src/config.ts`</strong> file.
                </p>
            </div>
        </div>
    );
};

export default ConfigurationErrorPage;
