import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { Button, Input, Alert, Card } from '../components/ui';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
      setEmail('');
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 sm:p-6">

      {/* Card — polished entrance with blur + scale + slide */}
      <Card
        variant="glass"
        className="max-w-md w-full animate-authCardIn shadow-2xl border-white/20 dark:border-gray-700/50"
      >
        {/* Lock/key icon */}
        <div className="flex justify-center mb-4 sm:mb-5 animate-fadeUp delay-75">
          <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 bg-primary dark:bg-primary-light rounded-2xl flex items-center justify-center shadow-lg">
            <svg
              className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
        </div>

        {/* Title & subtitle */}
        <div className="animate-fadeUp delay-100 text-center mb-5 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary dark:text-primary-light mb-1.5">
            Reset Password
          </h1>
          <p className="text-xs xs:text-sm sm:text-base text-text-secondary dark:text-gray-400">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="animate-fadeUp">
              <Alert variant="error">{error}</Alert>
            </div>
          )}

          {success && (
            <div className="animate-fadeUp">
              <Alert variant="success">
                Password reset email sent! Check your inbox for instructions.
              </Alert>
            </div>
          )}

          <div className="animate-fadeUp delay-150">
            <Input
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="pt-1 animate-fadeUp delay-200">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full text-sm sm:text-base"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </div>

          <div className="text-center animate-fadeUp delay-250">
            <Link
              to="/login"
              className="text-xs xs:text-sm sm:text-base text-primary dark:text-primary-light hover:text-accent dark:hover:text-primary-light/80 font-medium transition-colors duration-200 hover:underline underline-offset-2"
            >
              ← Back to Sign In
            </Link>
          </div>
        </form>

        <div className="mt-5 sm:mt-6 text-center animate-fadeUp delay-300">
          <p className="text-[10px] xs:text-xs sm:text-sm text-text-secondary dark:text-gray-500">
            Protected by Firebase Authentication
          </p>
        </div>
      </Card>
    </div>
  );
}
