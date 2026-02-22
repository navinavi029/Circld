import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { getTotalUnreadCount } from '../services/messagingService';

export function Navigation() {
  const { logout, user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread message count
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const total = await getTotalUnreadCount(user.uid);
        setUnreadCount(total);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();

    // Refresh unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

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
    <div className="sticky top-0 z-50 pt-3 px-4 sm:px-6 lg:px-8 w-full max-w-6xl mx-auto pointer-events-none">
      <nav className="pointer-events-auto bg-white/75 dark:bg-gray-900/75 backdrop-blur-2xl border border-white/50 dark:border-gray-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl sm:rounded-full transition-all duration-300 group/nav">
        <div className="px-3 sm:px-6 h-16 flex justify-between items-center">
          {/* Logo Section */}
          <button
            onClick={() => navigate('/listings')}
            className="flex items-center space-x-2 sm:space-x-3 group outline-none"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-dark dark:from-primary-light dark:to-primary rounded-full blur-md opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative w-10 h-10 bg-gradient-to-br from-primary to-primary-dark dark:from-primary-light dark:to-primary rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-300">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <div className="text-left">
              <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-primary via-primary-dark to-accent dark:from-primary-light dark:via-primary dark:to-accent bg-clip-text text-transparent transform group-hover:scale-105 transition-transform duration-300 origin-left">
                Circl'd
              </h1>
              <p className="hidden sm:block text-[10px] font-medium text-text-secondary dark:text-gray-400 -mt-1 tracking-wide">Circular Economy</p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Listings Button */}
            <button
              onClick={() => navigate('/listings')}
              className={`px-4 py-2 rounded-full font-medium transition-all duration-300 outline-none flex items-center space-x-2 w-32 justify-center group ${isActive('/listings')
                ? 'bg-primary/20 dark:bg-primary/30 text-primary-dark dark:text-primary-light font-bold'
                : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                }`}
            >
              <svg className={`w-5 h-5 transition-transform duration-300 ${!isActive('/listings') && 'group-hover:scale-110'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('/listings') ? 2.5 : 2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="tracking-wide">Listings</span>
            </button>

            {/* Swipe Trading Button */}
            <button
              onClick={() => navigate('/swipe-trading')}
              className={`px-4 py-2 rounded-full font-medium transition-all duration-300 outline-none flex items-center space-x-2 w-40 justify-center group ${isActive('/swipe-trading')
                ? 'bg-primary/20 dark:bg-primary/30 text-primary-dark dark:text-primary-light font-bold'
                : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                }`}
            >
              <svg className={`w-5 h-5 transition-transform duration-300 ${!isActive('/swipe-trading') && 'group-hover:scale-110'}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span className="tracking-wide">Swipe</span>
            </button>

            {/* Messages Button */}
            <button
              onClick={() => navigate('/messages')}
              className={`px-4 py-2 rounded-full font-medium transition-all duration-300 outline-none flex items-center space-x-2 w-36 justify-center group ${isActive('/messages') || location.pathname.startsWith('/messages/')
                ? 'bg-primary/20 dark:bg-primary/30 text-primary-dark dark:text-primary-light font-bold'
                : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                }`}
            >
              <div className="relative">
                <svg className={`w-5 h-5 transition-transform duration-300 ${!(isActive('/messages') || location.pathname.startsWith('/messages/')) && 'group-hover:scale-110'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={(isActive('/messages') || location.pathname.startsWith('/messages/')) ? 2.5 : 2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-sm transition-transform duration-300 scale-100 group-hover:scale-110">
                    <span className="text-[9px] font-bold text-white leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </div>
                )}
              </div>
              <span className="tracking-wide">Messages</span>
            </button>

            {/* Trade Offers Button */}
            <button
              onClick={() => navigate('/trade-offers')}
              className={`px-4 py-2 rounded-full font-medium transition-all duration-300 outline-none flex items-center space-x-2 w-32 justify-center group ${isActive('/trade-offers')
                ? 'bg-primary/20 dark:bg-primary/30 text-primary-dark dark:text-primary-light font-bold'
                : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                }`}
            >
              <svg className={`w-5 h-5 transition-transform duration-300 ${!isActive('/trade-offers') && 'group-hover:scale-110'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('/trade-offers') ? 2.5 : 2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <span className="tracking-wide">Offers</span>
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-2" />

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-3 px-3 py-1.5 rounded-full hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 group outline-none"
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

                  <div className="absolute right-0 mt-4 w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/60 dark:border-gray-700/60 z-20 overflow-hidden transition-all animate-in fade-in slide-in-from-top-2">
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

                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          navigate('/swipe-history');
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-primary/5 dark:hover:bg-primary-light/10 transition-colors flex items-center space-x-3 group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary/10 dark:bg-primary-light/20 flex items-center justify-center group-hover:bg-primary/20 dark:group-hover:bg-primary-light/30 transition-colors">
                          <svg className="w-5 h-5 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-text dark:text-gray-100 font-medium">Swipe History</p>
                          <p className="text-xs text-text-secondary dark:text-gray-400">View your past swipes</p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          navigate('/trade-history');
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-primary/5 dark:hover:bg-primary-light/10 transition-colors flex items-center space-x-3 group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary/10 dark:bg-primary-light/20 flex items-center justify-center group-hover:bg-primary/20 dark:group-hover:bg-primary-light/30 transition-colors">
                          <svg className="w-5 h-5 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-text dark:text-gray-100 font-medium">Trade History</p>
                          <p className="text-xs text-text-secondary dark:text-gray-400">View your trade history</p>
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

          {/* Mobile Menu Button - Animated Hamburger */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all z-50 relative outline-none"
            aria-label="Toggle menu"
          >
            <div className="relative w-6 h-5 flex flex-col justify-between items-center">
              <span className={`block w-6 h-0.5 bg-current transform transition duration-300 ease-in-out ${isMobileMenuOpen ? 'rotate-45 translate-y-2.5' : ''}`} />
              <span className={`block w-6 h-0.5 bg-current transition duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-6 h-0.5 bg-current transform transition duration-300 ease-in-out ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>
      </nav>

      {/* Full-Screen Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex flex-col pointer-events-auto">
          {/* Blur Backdrop */}
          <div
            className="absolute inset-0 bg-white/60 dark:bg-gray-950/80 backdrop-blur-xl transition-opacity animate-in fade-in duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="relative flex flex-col h-full pt-20 px-4 sm:px-6 pb-6 animate-in slide-in-from-top-4 fade-in duration-300 delay-75">
            {/* Close Button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-6 right-4 sm:right-6 p-2.5 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-700/80 text-gray-800 dark:text-gray-200 backdrop-blur-md transition-all shadow-sm border border-white/40 dark:border-white/10 z-50 outline-none hover:scale-105 active:scale-95"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* User Info Card */}
            <div className="mb-6 p-4 sm:p-5 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-3xl border border-white/40 dark:border-gray-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] transform transition-all hover:scale-[1.02]">
              <div className="flex items-center space-x-4">
                <button onClick={handleProfileClick} className="relative outline-none shrink-0">
                  {profile?.photoUrl ? (
                    <img
                      src={profile.photoUrl}
                      alt={`${profile.firstName} ${profile.lastName}`}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-4 ring-primary/20 dark:ring-primary-light/20 shadow-md"
                    />
                  ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ring-4 ring-primary/20 shadow-md">
                      <svg className="w-7 h-7 sm:w-8 sm:h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 sm:bottom-1 sm:right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 shadow-sm" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent truncate">
                    {profile ? (
                      profile.firstName && profile.lastName
                        ? `${profile.firstName} ${profile.lastName}`
                        : (profile as any).name || 'User'
                    ) : 'User'}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-primary dark:text-primary-light truncate mt-0.5">{profile?.location || 'Set your location'}</p>
                </div>
              </div>
            </div>

            {/* Navigation Items (Staggered) */}
            <div className="flex flex-col space-y-2.5 flex-1 overflow-y-auto hide-scrollbar px-1">
              <button
                onClick={handleListingsClick}
                className={`w-full p-3.5 sm:p-4 rounded-2xl flex items-center space-x-3.5 sm:space-x-4 transition-all duration-300 outline-none animate-in slide-in-from-left-4 fade-in delay-[100ms] ${isActive('/listings')
                  ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/25 scale-[1.02]'
                  : 'bg-white/40 dark:bg-gray-800/40 hover:bg-white/60 dark:hover:bg-gray-700/50 text-gray-800 dark:text-gray-100 border border-white/20 dark:border-white/5'
                  }`}
              >
                <div className={`p-2.5 rounded-xl ${isActive('/listings') ? 'bg-white/20' : 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <span className="text-base sm:text-lg font-bold tracking-wide">Listings</span>
              </button>

              <button
                onClick={handleSwipeTradingClick}
                className={`w-full p-3.5 sm:p-4 rounded-2xl flex items-center space-x-3.5 sm:space-x-4 transition-all duration-300 outline-none animate-in slide-in-from-left-4 fade-in delay-[150ms] ${isActive('/swipe-trading')
                  ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/25 scale-[1.02]'
                  : 'bg-white/40 dark:bg-gray-800/40 hover:bg-white/60 dark:hover:bg-gray-700/50 text-gray-800 dark:text-gray-100 border border-white/20 dark:border-white/5'
                  }`}
              >
                <div className={`p-2.5 rounded-xl ${isActive('/swipe-trading') ? 'bg-white/20' : 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light'}`}>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
                <span className="text-base sm:text-lg font-bold tracking-wide">Swipe</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/messages');
                }}
                className={`w-full p-3.5 sm:p-4 rounded-2xl flex items-center space-x-3.5 sm:space-x-4 transition-all duration-300 outline-none animate-in slide-in-from-left-4 fade-in delay-[200ms] ${isActive('/messages') || location.pathname.startsWith('/messages/')
                  ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/25 scale-[1.02]'
                  : 'bg-white/40 dark:bg-gray-800/40 hover:bg-white/60 dark:hover:bg-gray-700/50 text-gray-800 dark:text-gray-100 border border-white/20 dark:border-white/5'
                  }`}
              >
                <div className="relative">
                  <div className={`p-2.5 rounded-xl ${isActive('/messages') || location.pathname.startsWith('/messages/') ? 'bg-white/20' : 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-base sm:text-lg font-bold tracking-wide">Messages</span>
                {unreadCount > 0 && (
                  <span className="ml-auto text-xs sm:text-sm font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 bg-red-500 text-white rounded-full shadow-sm">
                    {unreadCount} New
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/trade-offers');
                }}
                className={`w-full p-3.5 sm:p-4 rounded-2xl flex items-center space-x-3.5 sm:space-x-4 transition-all duration-300 outline-none animate-in slide-in-from-left-4 fade-in delay-[225ms] ${isActive('/trade-offers')
                  ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/25 scale-[1.02]'
                  : 'bg-white/40 dark:bg-gray-800/40 hover:bg-white/60 dark:hover:bg-gray-700/50 text-gray-800 dark:text-gray-100 border border-white/20 dark:border-white/5'
                  }`}
              >
                <div className={`p-2.5 rounded-xl ${isActive('/trade-offers') ? 'bg-white/20' : 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
                <span className="text-base sm:text-lg font-bold tracking-wide">Trade Offers</span>
              </button>

              <button
                onClick={handleProfileClick}
                className={`w-full p-3.5 sm:p-4 rounded-2xl flex items-center space-x-3.5 sm:space-x-4 transition-all duration-300 outline-none animate-in slide-in-from-left-4 fade-in delay-[250ms] ${isActive('/profile')
                  ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/25 scale-[1.02]'
                  : 'bg-white/40 dark:bg-gray-800/40 hover:bg-white/60 dark:hover:bg-gray-700/50 text-gray-800 dark:text-gray-100 border border-white/20 dark:border-white/5'
                  }`}
              >
                <div className={`p-2.5 rounded-xl ${isActive('/profile') ? 'bg-white/20' : 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-base sm:text-lg font-bold tracking-wide">My Profile</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/swipe-history');
                }}
                className={`w-full p-3.5 sm:p-4 rounded-2xl flex items-center space-x-3.5 sm:space-x-4 transition-all duration-300 outline-none animate-in slide-in-from-left-4 fade-in delay-[300ms] ${isActive('/swipe-history')
                  ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/25 scale-[1.02]'
                  : 'bg-white/40 dark:bg-gray-800/40 hover:bg-white/60 dark:hover:bg-gray-700/50 text-gray-800 dark:text-gray-100 border border-white/20 dark:border-white/5'
                  }`}
              >
                <div className={`p-2.5 rounded-xl ${isActive('/swipe-history') ? 'bg-white/20' : 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-base sm:text-lg font-bold tracking-wide">Swipe History</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/trade-history');
                }}
                className={`w-full p-3.5 sm:p-4 rounded-2xl flex items-center space-x-3.5 sm:space-x-4 transition-all duration-300 outline-none animate-in slide-in-from-left-4 fade-in delay-[325ms] ${isActive('/trade-history')
                  ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/25 scale-[1.02]'
                  : 'bg-white/40 dark:bg-gray-800/40 hover:bg-white/60 dark:hover:bg-gray-700/50 text-gray-800 dark:text-gray-100 border border-white/20 dark:border-white/5'
                  }`}
              >
                <div className={`p-2.5 rounded-xl ${isActive('/trade-history') ? 'bg-white/20' : 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-base sm:text-lg font-bold tracking-wide">Trade History</span>
              </button>
            </div>

            {/* Logout Button Pinned to Bottom */}
            <div className="mt-6 pt-5 border-t border-gray-200/50 dark:border-gray-700/50 animate-in fade-in delay-[300ms]">
              <button
                onClick={handleLogoutClick}
                className="w-full p-3.5 sm:p-4 rounded-2xl flex items-center justify-center space-x-3 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100/50 dark:hover:bg-red-900/20 border border-red-100 dark:border-red-900/30 transition-all font-bold tracking-wide outline-none text-base sm:text-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
