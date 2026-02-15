import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';

export function Navigation() {
  const { logout } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  
  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/profile');
  };
  
  const handleLogoutClick = async () => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    await handleLogout();
  };
  
  const handleListingsClick = () => {
    setIsMobileMenuOpen(false);
    navigate('/listings');
  };

  const handleSwipeTradingClick = () => {
    setIsMobileMenuOpen(false);
    navigate('/swipe-trading');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <button
            onClick={() => navigate('/listings')}
            className="flex items-center space-x-2 sm:space-x-3 group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-dark dark:from-primary-light dark:to-primary rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-primary-dark dark:from-primary-light dark:to-primary rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-primary-dark to-accent dark:from-primary-light dark:via-primary dark:to-accent bg-clip-text text-transparent">
                Circl'd
              </h1>
              <p className="hidden sm:block text-[10px] text-text-secondary dark:text-gray-500 -mt-1">Circular Economy</p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Listings Button */}
            <button
              onClick={() => navigate('/listings')}
              className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive('/listings')
                  ? 'text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {isActive('/listings') && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-dark dark:from-primary-light dark:to-primary rounded-lg shadow-md" />
              )}
              <div className="relative flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>Listings</span>
              </div>
            </button>

            {/* Swipe Trading Button */}
            <button
              onClick={() => navigate('/swipe-trading')}
              className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive('/swipe-trading')
                  ? 'text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {isActive('/swipe-trading') && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-dark dark:from-primary-light dark:to-primary rounded-lg shadow-md" />
              )}
              <div className="relative flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span>Swipe Trading</span>
              </div>
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-2" />

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
              >
                {/* Profile Photo with status indicator */}
                <div className="relative">
                  {profile?.photoUrl ? (
                    <img 
                      src={profile.photoUrl} 
                      alt={`${profile.firstName} ${profile.lastName}`} 
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-primary dark:ring-primary-light ring-offset-2 ring-offset-white dark:ring-offset-gray-900 transition-all group-hover:ring-offset-4"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 dark:from-primary-light/20 dark:to-accent/20 flex items-center justify-center ring-2 ring-primary dark:ring-primary-light ring-offset-2 ring-offset-white dark:ring-offset-gray-900 transition-all group-hover:ring-offset-4">
                      <svg className="w-5 h-5 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  {/* Online status indicator */}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                </div>
                
                {/* User Info */}
                <div className="text-left">
                  <p className="font-semibold text-sm text-text dark:text-gray-100 max-w-[120px] truncate">
                    {profile ? (
                      profile.firstName && profile.lastName 
                        ? `${profile.firstName} ${profile.lastName}`
                        : (profile as any).name || 'User'
                    ) : 'User'}
                  </p>
                  <p className="text-xs text-text-secondary dark:text-gray-400">
                    {profile?.location || 'No location'}
                  </p>
                </div>
                
                {/* Dropdown Arrow */}
                <svg 
                  className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-20 overflow-hidden animate-fadeInFast">
                    {/* User Info Header */}
                    <div className="px-4 py-4 bg-gradient-to-r from-primary/5 to-accent/5 dark:from-primary-light/10 dark:to-accent/10 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-3">
                        {profile?.photoUrl ? (
                          <img 
                            src={profile.photoUrl} 
                            alt={`${profile.firstName} ${profile.lastName}`} 
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-primary dark:ring-primary-light"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 dark:from-primary-light/20 dark:to-accent/20 flex items-center justify-center ring-2 ring-primary dark:ring-primary-light">
                            <svg className="w-6 h-6 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-text dark:text-gray-100 truncate">
                            {profile ? (
                              profile.firstName && profile.lastName 
                                ? `${profile.firstName} ${profile.lastName}`
                                : (profile as any).name || 'User'
                            ) : 'User'}
                          </p>
                          <p className="text-xs text-text-secondary dark:text-gray-400 truncate">{profile?.location || 'No location'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button
                        onClick={handleProfileClick}
                        className="w-full px-4 py-3 text-left hover:bg-primary/5 dark:hover:bg-primary-light/10 transition-colors flex items-center space-x-3 group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary/10 dark:bg-primary-light/20 flex items-center justify-center group-hover:bg-primary/20 dark:group-hover:bg-primary-light/30 transition-colors">
                          <svg className="w-5 h-5 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-text dark:text-gray-100 font-medium">My Profile</p>
                          <p className="text-xs text-text-secondary dark:text-gray-400">View and edit profile</p>
                        </div>
                      </button>
                      
                      <div className="h-px bg-gray-200 dark:bg-gray-700 my-2 mx-4" />
                      
                      <button
                        onClick={handleLogoutClick}
                        className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center space-x-3 group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-red-600 dark:text-red-400 font-medium">Logout</p>
                          <p className="text-xs text-red-500 dark:text-red-400/70">Sign out of your account</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            aria-label="Toggle menu"
          >
            <div className="relative w-6 h-6">
              <span className={`absolute left-0 top-1 w-6 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 top-2.5' : ''}`} />
              <span className={`absolute left-0 top-2.5 w-6 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`absolute left-0 top-4 w-6 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 top-2.5' : ''}`} />
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200 dark:border-gray-800 animate-fadeInFast">
            {/* User Info Card */}
            <div className="mt-4 mx-4 p-4 bg-gradient-to-r from-primary/5 to-accent/5 dark:from-primary-light/10 dark:to-accent/10 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  {profile?.photoUrl ? (
                    <img 
                      src={profile.photoUrl} 
                      alt={`${profile.firstName} ${profile.lastName}`} 
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-primary dark:ring-primary-light"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 dark:from-primary-light/20 dark:to-accent/20 flex items-center justify-center ring-2 ring-primary dark:ring-primary-light">
                      <svg className="w-6 h-6 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text dark:text-gray-100 truncate">
                    {profile ? (
                      profile.firstName && profile.lastName 
                        ? `${profile.firstName} ${profile.lastName}`
                        : (profile as any).name || 'User'
                    ) : 'User'}
                  </p>
                  <p className="text-sm text-text-secondary dark:text-gray-400 truncate">{profile?.location || 'No location'}</p>
                </div>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="mt-4 space-y-1 px-2">
              <button
                onClick={handleListingsClick}
                className={`w-full px-4 py-3 rounded-lg text-left flex items-center space-x-3 transition-all ${
                  isActive('/listings')
                    ? 'bg-gradient-to-r from-primary to-primary-dark dark:from-primary-light dark:to-primary text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="font-medium">Listings</span>
              </button>

              <button
                onClick={handleSwipeTradingClick}
                className={`w-full px-4 py-3 rounded-lg text-left flex items-center space-x-3 transition-all ${
                  isActive('/swipe-trading')
                    ? 'bg-gradient-to-r from-primary to-primary-dark dark:from-primary-light dark:to-primary text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span className="font-medium">Swipe Trading</span>
              </button>

              <button
                onClick={handleProfileClick}
                className={`w-full px-4 py-3 rounded-lg text-left flex items-center space-x-3 transition-all ${
                  isActive('/profile')
                    ? 'bg-gradient-to-r from-primary to-primary-dark dark:from-primary-light dark:to-primary text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium">My Profile</span>
              </button>

              <div className="h-px bg-gray-200 dark:bg-gray-700 my-3" />

              <button
                onClick={handleLogoutClick}
                className="w-full px-4 py-3 rounded-lg text-left flex items-center space-x-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
