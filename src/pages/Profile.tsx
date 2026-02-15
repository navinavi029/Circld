import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { useTheme } from '../contexts/ThemeContext';
import { Navigation } from '../components/Navigation';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui';

export function Profile() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      <Navigation />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card variant="elevated" className="animate-fadeIn">
          {/* Welcome Section */}
          <CardHeader>
            <CardTitle className="text-3xl text-primary dark:text-primary-light">
              My Profile
            </CardTitle>
            <CardDescription>Manage your account information</CardDescription>
          </CardHeader>

          <CardContent>
            {/* Profile Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                {profile?.photoUrl ? (
                  <img 
                    src={profile.photoUrl} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 dark:border-primary-light/20"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-4 border-primary/20 dark:border-primary-light/20">
                    <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-text dark:text-gray-100">
                    {profile ? (
                      profile.firstName && profile.lastName 
                        ? `${profile.firstName} ${profile.lastName}`
                        : (profile as any).name || 'User'
                    ) : 'User'}
                  </h2>
                  <p className="text-text-secondary dark:text-gray-400">{user?.email}</p>
                </div>
              </div>
              
              <Button
                onClick={() => navigate('/edit-profile')}
                variant="primary"
                size="md"
                className="flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit Profile</span>
              </Button>
            </div>

            {/* Profile Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-text-secondary dark:text-gray-400">Location</label>
                  <p className="text-lg text-text dark:text-gray-100">{profile?.location || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary dark:text-gray-400">Eligible to Match</label>
                  <p className="text-lg text-text dark:text-gray-100">{profile?.eligible_to_match ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {/* Theme Preference */}
              <Card variant="outlined">
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-text dark:text-gray-100 mb-4">Preferences</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
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
                        <h4 className="font-medium text-text dark:text-gray-100">Theme</h4>
                        <p className="text-sm text-text-secondary dark:text-gray-400">
                          {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={toggleTheme}
                      className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800 bg-gray-300 dark:bg-primary"
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                          theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
