import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui';
import { PageTransition } from '../components/PageTransition';

export function Profile() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <PageTransition variant="page">
      <div className="flex-1 w-full">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-accent via-accent-dark to-primary bg-clip-text text-transparent dark:from-primary-light dark:via-primary dark:to-accent-dark leading-tight pb-0.5">
              My Profile
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary dark:text-gray-400 mt-1">
              Manage your account information and preferences
            </p>
          </div>

          {/* Profile Card */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6 mb-6">
            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                {profile?.photoUrl ? (
                  <img
                    src={profile.photoUrl}
                    alt="Profile"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-primary/20 dark:border-primary-light/20 shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 dark:from-primary-light/20 dark:to-accent/20 flex items-center justify-center border-4 border-primary/20 dark:border-primary-light/20 shadow-md">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-text dark:text-gray-100">
                    {profile ? (
                      profile.firstName && profile.lastName
                        ? `${profile.firstName} ${profile.lastName}`
                        : (profile as any).name || 'User'
                    ) : 'User'}
                  </h2>
                  <p className="text-xs sm:text-sm text-text-secondary dark:text-gray-400 mt-0.5">{user?.email}</p>
                </div>
              </div>

              <Button
                onClick={() => navigate('/edit-profile')}
                className="!bg-gradient-to-r !from-accent !to-accent-dark dark:!from-primary-light dark:!to-primary hover:shadow-lg hover:shadow-accent/30 dark:hover:shadow-primary/30 transition-shadow"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </Button>
            </div>

            {/* Profile Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Info Section */}
              <div className="space-y-4">
                <div className="p-4 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl">
                  <label className="text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wide flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Location
                  </label>
                  <p className="text-sm sm:text-base text-text dark:text-gray-100 font-medium">{profile?.location || 'Not set'}</p>
                </div>
                <div className="p-4 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl">
                  <label className="text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wide flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Eligible to Match
                  </label>
                  <p className="text-sm sm:text-base text-text dark:text-gray-100 font-medium">
                    {profile?.eligible_to_match ? (
                      <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Yes
                      </span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">No</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Theme Preference Card */}
              <div className="p-6 bg-gradient-to-br from-gray-50/80 to-white/80 dark:from-gray-700/30 dark:to-gray-800/30 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
                <h3 className="text-base sm:text-lg font-bold text-text dark:text-gray-100 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-accent dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Preferences
                </h3>
                <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary-light/20 flex items-center justify-center">
                      {theme === 'dark' ? (
                        <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-text dark:text-gray-100">Theme</h4>
                      <p className="text-xs text-text-secondary dark:text-gray-400">
                        {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={toggleTheme}
                    className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800 bg-gray-300 dark:bg-primary"
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
