import { ReactNode } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRole?: Role;
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-stone-600 dark:text-slate-400">Checking session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect first-time users to /onboarding unless they are already on /onboarding or are an admin
  if (
    user.role === 'user' &&
    !user.onboarded &&
    location.pathname !== '/onboarding'
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 bg-stone-50 dark:bg-slate-950">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Restricted Access
          </h2>
          <p className="text-sm text-stone-600 dark:text-slate-300 mb-6 leading-relaxed">
            Your account has the <span className="font-semibold">{user.role}</span> role. This page is reserved for <span className="font-semibold">{allowedRole}</span> accounts.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <Link
              to="/profile"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-stone-700 dark:text-slate-200 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Profile & Privacy
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
