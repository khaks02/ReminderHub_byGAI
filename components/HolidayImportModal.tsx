import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Spinner from './Spinner';
import { Globe, Calendar } from 'lucide-react';

const inputStyle = "w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-content-light dark:text-content-dark placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-colors";
const btnPrimary = "inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-dark font-semibold transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed";
const btnSecondary = "inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-600 text-content-light dark:text-content-dark hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold transition-colors disabled:opacity-50";

interface HolidayImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (year: number, country: string, region: string) => Promise<void>;
}

const HolidayImportModal: React.FC<HolidayImportModalProps> = ({ isOpen, onClose, onImport }) => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [country, setCountry] = useState('India');
    const [region, setRegion] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await onImport(year, country, region);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if(isOpen) {
            setYear(new Date().getFullYear());
            setCountry('India');
            setRegion('');
            setIsLoading(false);
            setError(null);
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Import Public Holidays" maxWidth="2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Automatically add national, regional, and festival holidays to your reminders for a specific year and location.
                </p>
                {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-md text-sm">{error}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="year" className="block text-sm font-medium mb-1">Year</label>
                        <div className="relative">
                            <Calendar size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                id="year"
                                type="number"
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                                className={`${inputStyle} pl-10`}
                                required
                            />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="country" className="block text-sm font-medium mb-1">Country</label>
                         <div className="relative">
                            <Globe size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                id="country"
                                type="text"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                className={`${inputStyle} pl-10`}
                                placeholder="e.g., India"
                                required
                            />
                        </div>
                    </div>
                </div>
                 <div>
                    <label htmlFor="region" className="block text-sm font-medium mb-1">Region / State (Optional)</label>
                    <input
                        id="region"
                        type="text"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className={inputStyle}
                        placeholder="e.g., Maharashtra"
                    />
                </div>
                 <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={onClose} className={btnSecondary} disabled={isLoading}>Cancel</button>
                    <button type="submit" className={`${btnPrimary} w-44`} disabled={isLoading}>
                        {isLoading ? <Spinner size="5" /> : 'Import Holidays'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default HolidayImportModal;