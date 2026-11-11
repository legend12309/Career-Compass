import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { CompyMascot } from '../components/mascot/CompyMascot';
import { sounds } from '../utils/soundEffects';
import { ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bento-outer-backdrop flex flex-col text-slate-900 dark:text-slate-100">
      <Navbar showSidebarToggle={false} />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 duo-card p-8 text-center space-y-4 shadow-md">
          <CompyMascot mood="thinking" size="lg" className="mx-auto" />
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Page Not Found (404)
          </h1>
          <p className="text-xs font-semibold text-slate-500 leading-relaxed">
            Compy couldn't find this trail! Return to your dashboard to keep your learning streak alive.
          </p>
          <Link
            to="/dashboard"
            onClick={() => sounds.playPopSound()}
            className="w-full py-3 duo-btn-green text-xs flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO DASHBOARD</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
