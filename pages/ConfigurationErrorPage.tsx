import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfigurationErrorPage: React.FC = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-bkg-light dark:bg-bkg-dark p-4">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl text-center">
                <AlertTriangle className="mx-auto w-16 h-16 text-red-500 mb-6" />
                <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">Configuration Required</h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
                    This application requires Supabase credentials to function correctly.
                </p>
                <div className="text-left bg-slate-100 dark:bg-slate-900 p-6 rounded-lg font-mono text-sm text-slate-700 dark:text-slate-200">
                    <p className="mb-4">Please edit the <strong className="text-primary dark:text-primary-light">`config.ts`</strong> file in the project root and replace the placeholder values with your actual Supabase URL and Anon Key.</p>
                    <pre className="whitespace-pre-wrap">
                        <code>
                            <span className="text-slate-500">// in config.ts</span><br />
                            export const SUPABASE_URL = <span className="text-orange-500">'YOUR_SUPABASE_URL'</span>;<br />
                            export const SUPABASE_ANON_KEY = <span className="text-orange-500">'YOUR_SUPABASE_ANON_KEY'</span>;
                        </code>
                    </pre>
                </div>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mt-6">
                    You can find these credentials in your Supabase project's API settings.
                </p>
            </div>
        </div>
    );
};

export default ConfigurationErrorPage;
