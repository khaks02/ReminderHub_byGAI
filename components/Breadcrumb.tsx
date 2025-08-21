


import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { useLocation, Link } = ReactRouterDOM;
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumb: React.FC = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    return (
        <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-6" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-2">
                <li className="inline-flex items-center">
                    <Link to="/" className="inline-flex items-center hover:text-primary dark:hover:text-primary-light transition-colors">
                        <Home className="w-4 h-4 mr-2" />
                        Reminders
                    </Link>
                </li>
                {pathnames.map((value, index) => {
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathnames.length - 1;
                    const name = value.charAt(0).toUpperCase() + value.slice(1);

                    return (
                        <li key={to}>
                            <div className="flex items-center">
                                <ChevronRight className="w-4 h-4" />
                                {isLast ? (
                                    <span className="ml-1 md:ml-2 font-medium text-content-light dark:text-content-dark">{name}</span>
                                ) : (
                                    <Link to={to} className="ml-1 md:ml-2 hover:text-primary dark:hover:text-primary-light transition-colors">
                                        {name}
                                    </Link>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumb;