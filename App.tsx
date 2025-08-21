
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { HashRouter, NavLink, Route, Routes, useLocation } = ReactRouterDOM;
import { AppProvider, useAppContext } from './hooks/useAppContext';
import { useTheme } from './hooks/useTheme';

import { Home, Utensils, BarChart2, Settings, ShoppingCart, Sun, Moon, ShoppingBag, User } from 'lucide-react';
import Breadcrumb from './components/Breadcrumb';

import DashboardPage from './pages/DashboardPage';
import RecipesPage from './pages/RecipesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const DesktopNavItem = ({ to, icon, children }: NavItemProps) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center p-3 my-1 rounded-lg transition-colors text-lg ${
        isActive
          ? 'bg-primary-dark/20 text-primary-light font-semibold'
          : 'hover:bg-gray-500/10 text-gray-500 dark:text-gray-400 hover:text-content-light dark:hover:text-content-dark'
      }`
    }
  >
    {icon}
    <span className="ml-4">{children}</span>
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
        dashboard: 'Dashboard',
        recipes: 'Recipes',
        analytics: 'Analytics',
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

  const ThemeToggle = () => (
    <button
      onClick={() => toggleTheme()}
      className="p-2 rounded-full hover:bg-gray-500/10 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="text-yellow-400" /> : <Moon className="text-gray-700" />}
    </button>
  );

  return (
      <HashRouter>
        {/* Desktop Sidebar */}
        <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-20 md:flex md:w-64 md:flex-col bg-white dark:bg-slate-900/70 dark:backdrop-blur-sm border-r border-gray-200 dark:border-slate-800">
             <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800">
               <h1 className="text-2xl font-bold text-primary">ReminderHub</h1>
             </div>
             <nav className="p-4 flex-1">
                <DesktopNavItem to="/" icon={<Home size={24}/>}>Dashboard</DesktopNavItem>
                <DesktopNavItem to="/orders" icon={<ShoppingBag size={24}/>}>My Orders</DesktopNavItem>
                <DesktopNavItem to="/recipes" icon={<Utensils size={24}/>}>Recipes</DesktopNavItem>
                <DesktopNavItem to="/analytics" icon={<BarChart2 size={24}/>}>Analytics</DesktopNavItem>
             </nav>
             <div className="p-4 border-t border-gray-200 dark:border-slate-800">
                 <DesktopNavItem to="/settings" icon={<Settings size={24}/>}>Settings</DesktopNavItem>
             </div>
        </aside>
          
        <div className="flex flex-col flex-1 md:ml-64">
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center justify-between p-4 h-16 border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <HeaderTitle/>
                <div className="flex items-center space-x-2">
                    <ThemeToggle />
                     <NavLink to="/profile" className="p-2 rounded-full hover:bg-gray-500/10 transition-colors">
                        <User />
                    </NavLink>
                    <NavLink to="/settings" className="p-2 rounded-full hover:bg-gray-500/10 transition-colors">
                        <Settings />
                    </NavLink>
                    <NavLink to="/cart" className="relative p-2 rounded-full hover:bg-gray-500/10 transition-colors">
                        <ShoppingCart />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                                {cartCount}
                            </span>
                        )}
                    </NavLink>
                </div>
            </header>
            
            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
              <Breadcrumb />
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/recipes" element={<RecipesPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Routes>
            </main>
        </div>
        
        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 h-16 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex justify-around items-center shadow-[-2px_0px_10px_rgba(0,0,0,0.1)]">
            <BottomNavItem to="/" icon={<Home size={24} />}>Dashboard</BottomNavItem>
            <BottomNavItem to="/recipes" icon={<Utensils size={24} />}>Recipes</BottomNavItem>
            <BottomNavItem to="/analytics" icon={<BarChart2 size={24} />}>Analytics</BottomNavItem>
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