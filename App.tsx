
import React, { useState, useRef, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { HashRouter, NavLink, Route, Routes, useLocation } = ReactRouterDOM;
import { AppProvider, useAppContext } from './hooks/useAppContext';
import { useTheme } from './hooks/useTheme';

import { Home, Utensils, Settings, ShoppingCart, Sun, Moon, ShoppingBag, User, Shuffle } from 'lucide-react';
import Breadcrumb from './components/Breadcrumb';

import DashboardPage from './pages/DashboardPage';
import RecipesPage from './pages/RecipesPage';
import SettingsPage from './pages/SettingsPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const HeaderNavItem = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-500/10 hover:text-content-light dark:hover:text-content-dark'
      }`
    }
  >
    {children}
  </NavLink>
);

const BottomNavItem = ({ to, icon, children }: NavItemProps) => (
  <NavLink
    to={to}
    end
    className={({ isActive }) =>
      `flex flex-col items-center justify-center w-full pt-2 pb-1 text-xs transition-colors ${
        isActive
          ? 'text-primary'
          : 'text-gray-500 dark:text-gray-400 hover:text-primary'
      }`
    }
  >
    {icon}
    <span className="mt-1 truncate">{children}</span>
  </NavLink>
);

const HeaderTitle = () => {
    const location = useLocation();
    const path = location.pathname.split('/')[1] || 'dashboard';
    
    const titleMapping: { [key: string]: string } = {
        dashboard: 'Reminders',
        recipes: 'Recipes',
        settings: 'Settings',
        cart: 'Shopping Cart',
        orders: 'My Orders',
        profile: 'User Profile',
    };

    const title = titleMapping[path] || 'ReminderHub AI';
    
    return <h1 className="text-xl font-semibold text-content-light dark:text-content-dark">{title}</h1>;
};


const AppContent = () => {
  const [theme, toggleTheme] = useTheme();
  const { cartCount } = useAppContext();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const ThemeToggle = ({ inMenu = false }: { inMenu?: boolean }) => (
    <button
      onClick={() => toggleTheme()}
      className={inMenu 
        ? 'w-full flex items-center justify-between px-4 py-2 text-sm text-left text-content-light dark:text-content-dark hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors' 
        : 'p-2 rounded-full hover:bg-gray-500/10 transition-colors'}
      aria-label="Toggle theme"
    >
      <span>Toggle Theme</span>
      {theme === 'dark' ? <Sun className="text-yellow-400" /> : <Moon className="text-gray-700" />}
    </button>
  );


  return (
      <HashRouter>
        <div className="flex flex-col flex-1">
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center justify-between p-4 h-16 border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <div className="flex items-center gap-6">
                    {/* Desktop View: Logo + Nav */}
                    <div className="hidden md:flex items-center gap-6">
                        <h1 className="text-2xl font-bold text-primary">ReminderHub</h1>
                        <nav className="flex items-center gap-2">
                            <HeaderNavItem to="/">Reminders</HeaderNavItem>
                            <HeaderNavItem to="/recipes">Recipes</HeaderNavItem>
                            <HeaderNavItem to="/orders">My Orders</HeaderNavItem>
                        </nav>
                    </div>
                     {/* Mobile View: Page Title */}
                    <div className="md:hidden">
                        <HeaderTitle/>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <NavLink to="/cart" className="relative p-2 rounded-full hover:bg-gray-500/10 transition-colors">
                        <ShoppingCart />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                                {cartCount}
                            </span>
                        )}
                    </NavLink>

                     {/* User Menu Dropdown */}
                    <div className="relative" ref={userMenuRef}>
                         <button 
                            onClick={() => setIsUserMenuOpen(o => !o)} 
                            className="p-2 rounded-full hover:bg-gray-500/10 transition-colors"
                            aria-label="Open user menu"
                         >
                            <User />
                        </button>
                        {isUserMenuOpen && (
                             <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-md shadow-lg z-20 border border-gray-200 dark:border-slate-700 py-1">
                                <NavLink 
                                    to="/profile" 
                                    onClick={() => setIsUserMenuOpen(false)}
                                    className="block px-4 py-2 text-sm text-content-light dark:text-content-dark hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    My Profile & Saved Recipes
                                </NavLink>
                                 <NavLink 
                                    to="/settings" 
                                    onClick={() => setIsUserMenuOpen(false)}
                                    className="block px-4 py-2 text-sm text-content-light dark:text-content-dark hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Settings
                                </NavLink>
                                <div className="border-t border-gray-100 dark:border-slate-700 my-1"></div>
                                <ThemeToggle inMenu={true} />
                            </div>
                        )}
                    </div>
                </div>
            </header>
            
            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
              <Breadcrumb />
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/recipes" element={<RecipesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Routes>
            </main>
        </div>
        
        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 h-16 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex justify-around items-center shadow-[-2px_0px_10px_rgba(0,0,0,0.1)]">
            <BottomNavItem to="/" icon={<Home size={24} />}>Reminders</BottomNavItem>
            <BottomNavItem to="/recipes" icon={<Utensils size={24} />}>Recipes</BottomNavItem>
            <BottomNavItem to="/orders" icon={<ShoppingBag size={24} />}>My Orders</BottomNavItem>
        </nav>
      </HashRouter>
  );
};

const App = () => (
    <AppProvider>
        <AppContent />
    </AppProvider>
);


export default App;
