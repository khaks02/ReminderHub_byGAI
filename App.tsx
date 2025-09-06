

import React, { useState, useRef, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { AppProvider, useAppContext } from './hooks/useAppContext';
import { useTheme } from './hooks/useTheme';
import { AuthProvider, useAuth } from './hooks/useAuthContext';
import { isSupabaseConfigured } from './config';
import ConfigurationErrorPage from './pages/ConfigurationErrorPage';

import { Home, Utensils, Settings, ShoppingCart, Sun, Moon, ShoppingBag, User, LogOut, BarChart2, Calendar } from 'lucide-react';
import Breadcrumb from './components/Breadcrumb';
import ProtectedRoute from './components/ProtectedRoute';

import DashboardPage from './pages/DashboardPage';
import RecipesPage from './pages/RecipesPage';
import SettingsPage from './pages/SettingsPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import AnalyticsPage from './pages/AnalyticsPage';
import Spinner from './components/Spinner';
import OnboardingModal from './components/OnboardingModal';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const HeaderNavItem = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <ReactRouterDOM.NavLink
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
  </ReactRouterDOM.NavLink>
);

const BottomNavItem = ({ to, icon, children }: NavItemProps) => (
  <ReactRouterDOM.NavLink
    to={to}
    end
    className={({ isActive }) =>
      `flex flex-col items-center justify-center w-full pt-2 pb-1 text-xs transition-all duration-200 rounded-md ${
        isActive
          ? 'text-primary bg-primary/10'
          : 'text-gray-500 dark:text-gray-400 hover:text-primary'
      }`
    }
  >
    {icon}
    <span className="mt-1 truncate">{children}</span>
  </ReactRouterDOM.NavLink>
);

const HeaderTitle = () => {
    const location = ReactRouterDOM.useLocation();
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const mainPathSegment = pathSegments[0] || 'dashboard';
    
    const titleMapping: { [key: string]: string } = {
        dashboard: "Dashboard",
        recipes: "Today's Recipes",
        settings: 'Settings',
        cart: 'Shopping Cart',
        orders: 'My Orders',
        profile: 'User Profile',
        analytics: 'Analytics',
    };

    const title = titleMapping[mainPathSegment] || 'myreminder';
    
    return <h1 className="text-xl font-semibold text-content-light dark:text-content-dark">{title}</h1>;
};


const MainAppLayout = () => {
  const [theme, toggleTheme] = useTheme();
  const { cartCount, preferences, completeOnboarding } = useAppContext();
  const { logout, currentUser } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = ReactRouterDOM.useNavigate();
  
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Helper component for user menu items
  const UserMenuItem = ({ to, icon, children, onClick }: { to: string; icon: React.ReactNode; children: React.ReactNode; onClick?: () => void }) => (
    <ReactRouterDOM.NavLink
      to={to}
      onClick={onClick ? () => { setIsUserMenuOpen(false); onClick(); } : () => setIsUserMenuOpen(false)}
      className="flex items-center gap-2 px-4 py-2 text-sm text-content-light dark:text-content-dark hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
    >
      {icon} {children}
    </ReactRouterDOM.NavLink>
  );

  useEffect(() => {
    // Show onboarding if preferences are loaded and the tutorial hasn't been completed.
    if (preferences && !preferences.has_completed_tutorial) {
      setShowOnboarding(true);
    }
  }, [preferences]);


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

  const handleLogout = async () => {
      await logout();
      navigate('/login');
  };

  const handleFinishOnboarding = () => {
      completeOnboarding();
      setShowOnboarding(false);
  };

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
    <>
        <div className="flex flex-col flex-1 h-screen">
            <OnboardingModal isOpen={showOnboarding} onFinish={handleFinishOnboarding} />
            {/* Header */}
            <header className="sticky top-0 z-20 flex items-center justify-between p-4 h-16 border-b border-gray-200 dark:border-accent-dark bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm">
                <div className="flex items-center gap-6">
                    {/* Desktop View: Logo + Nav */}
                    <div className="hidden md:flex items-center gap-6">
                        <h1 className="text-2xl font-bold text-primary">myreminder</h1>
                        <nav className="flex items-center gap-2">
                            <HeaderNavItem to="/">Dashboard</HeaderNavItem>
                            <HeaderNavItem to="/recipes">Today's Recipes</HeaderNavItem>
                            <HeaderNavItem to="/orders">My Orders</HeaderNavItem>
                        </nav>
                    </div>
                     {/* Mobile View: Page Title */}
                    <div className="md:hidden">
                        <HeaderTitle/>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <ReactRouterDOM.NavLink to="/cart" className="relative p-2 rounded-full hover:bg-gray-500/10 transition-colors">
                        <ShoppingCart />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                                {cartCount}
                            </span>
                        )}
                    </ReactRouterDOM.NavLink>

                     {/* User Menu Dropdown */}
                    <div className="relative" ref={userMenuRef}>
                         <button 
                            onClick={() => setIsUserMenuOpen(o => !o)} 
                            className="p-2 rounded-full hover:bg-gray-500/10 transition-colors"
                            aria-label="Open user menu"
                         >
                            <img src={currentUser?.avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(currentUser?.name || 'User')}`} alt="User Avatar" className="w-8 h-8 rounded-full" />
                        </button>
                        {isUserMenuOpen && (
                             <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-md shadow-lg z-20 border border-gray-200 dark:border-slate-700 py-1">
                                <UserMenuItem to="/profile" icon={<User size={16}/>}>My Profile</UserMenuItem>
                                <UserMenuItem to="/analytics" icon={<BarChart2 size={16}/>}>Analytics</UserMenuItem>
                                <UserMenuItem to="/settings" icon={<Settings size={16}/>}>Settings</UserMenuItem>
                                <div className="border-t border-gray-100 dark:border-slate-700 my-1"></div>
                                <ThemeToggle inMenu={true} />
                                <div className="border-t border-gray-100 dark:border-slate-700 my-1"></div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <LogOut size={16}/>
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            
            {/* Breadcrumb Bar */}
            <div className="md:block sticky top-16 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-accent-dark px-4 md:px-8 py-3">
              <Breadcrumb />
            </div>
            
            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-subtle-light/50 dark:bg-subtle-dark/50">
              <ReactRouterDOM.Routes>
                <ReactRouterDOM.Route path="/" element={<DashboardPage />} />
                <ReactRouterDOM.Route path="/recipes" element={<RecipesPage />} />
                <ReactRouterDOM.Route path="/settings" element={<SettingsPage />} />
                <ReactRouterDOM.Route path="/cart" element={<CartPage />} />
                <ReactRouterDOM.Route path="/orders" element={<OrdersPage />} />
                <ReactRouterDOM.Route path="/profile" element={<ProfilePage />} />
                <ReactRouterDOM.Route path="/analytics" element={<AnalyticsPage />} />
                <ReactRouterDOM.Route path="*" element={<ReactRouterDOM.Navigate to="/" replace />} />
              </ReactRouterDOM.Routes>
            </main>
        </div>
        
        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 h-16 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-accent-dark flex justify-around items-center shadow-[-2px_0px_10px_rgba(0,0,0,0.1)] p-1 gap-1">
            <BottomNavItem to="/" icon={<Home size={24} />}>Dashboard</BottomNavItem>
            <BottomNavItem to="/recipes" icon={<Utensils size={24} />}>Recipes</BottomNavItem>
        </nav>
      </>
  );
};

const AppRoutes = () => {
    const { loading } = useAuth();
    
    if (loading) {
        return (
            <div className="w-screen h-screen flex justify-center items-center bg-bkg-light dark:bg-bkg-dark">
                <Spinner size="12" />
            </div>
        );
    }
    
    return (
        <ReactRouterDOM.Routes>
            <ReactRouterDOM.Route path="/login" element={<LoginPage />} />
            <ReactRouterDOM.Route 
                path="/*"
                element={
                    <ProtectedRoute>
                        <AppProvider>
                            <MainAppLayout />
                        </AppProvider>
                    </ProtectedRoute>
                }
            />
        </ReactRouterDOM.Routes>
    );
};


const App = () => {
    if (!isSupabaseConfigured()) {
        return <ConfigurationErrorPage />;
    }

    return (
        <ReactRouterDOM.HashRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </ReactRouterDOM.HashRouter>
    );
};


export default App;