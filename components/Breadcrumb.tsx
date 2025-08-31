import React from 'react';
// FIX: Switched to a namespace import for react-router-dom to resolve module resolution errors.
import * as ReactRouterDOM from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumb: React.FC = () => {
    const location = ReactRouterDOM.useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    return (
        <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-2">
                <li className="inline-flex items-center">
                    <ReactRouterDOM.Link to="/" className="inline-flex items-center hover:text-primary dark:hover:text-primary-light transition-colors">
                        <Home className="w-4 h-4 mr-2" />
                        Dashboard
                    </ReactRouterDOM.Link>
                </li>
                {pathnames.map((value, index) => {
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathnames.length - 1;
                    
                    const nameMapping: { [key: string]: string } = {
                        calendar: "Calendar",
                        recipes: "Today's Recipes",
                        settings: "Settings",
                        cart: "Shopping Cart",
                        orders: "My Orders",
                        profile: "User Profile",
                        analytics: "Analytics"
                    };

                    const name = nameMapping[value as keyof typeof nameMapping] || value.charAt(0).toUpperCase() + value.slice(1);

                    return (
                        <li key={to}>
                            <div className="flex items-center">
                                <ChevronRight className="w-4 h-4" />
                                {isLast ? (
                                    <span className="ml-1 md:ml-2 font-medium text-content-light dark:text-content-dark">{name}</span>
                                ) : (
                                    <ReactRouterDOM.Link to={to} className="ml-1 md:ml-2 hover:text-primary dark:hover:text-primary-light transition-colors">
                                        {name}
                                    </ReactRouterDOM.Link>
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