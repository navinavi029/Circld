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
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card variant="glass" className="max-w-md w-full animate-fadeIn shadow-2xl border-white/20 dark:border-gray-700/50">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary dark:bg-primary-light rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-primary dark:text-primary-light mb-2 text-center">
          Reset Password
        </h1>
        <p className="text-text-secondary dark:text-gray-400 text-center mb-8">
          Enter your email address and we'll send you a link to reset your password
        </p>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <Alert variant="error">
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success">
              Password reset email sent! Check your inbox for instructions.
            </Alert>
          )}

          <Input
            type="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="text-sm text-primary dark:text-primary-light hover:text-accent dark:hover:text-primary hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-text-secondary dark:text-gray-500">
          Protected by Firebase Authentication
        </div>
      </Card>
    </div>
  );
}
