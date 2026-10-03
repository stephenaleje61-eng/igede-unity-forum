import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
}) => {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('Oju, Benue State');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [operationNotAllowed, setOperationNotAllowed] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setOperationNotAllowed(false);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setErrorMsg(err.message || 'Google sign-in was cancelled or encountered an error.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setOperationNotAllowed(false);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!email || !password) throw new Error('Please enter both email and password.');
        await signIn(email, password);
        onClose();
      } else if (mode === 'signup') {
        if (!fullName.trim()) throw new Error('Please enter your full name.');
        if (!email.trim()) throw new Error('Please enter your email.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');
        await signUp(email, password, fullName, location);
        onClose();
      } else if (mode === 'forgot') {
        if (!email.trim()) throw new Error('Please enter your email address.');
        await resetPassword(email);
        setSuccessMsg('A password reset link has been dispatched to your email address.');
      }
    } catch (err: any) {
      console.error('Auth action failed:', err);
      const code = err.code || '';
      if (code === 'auth/operation-not-allowed') {
        setOperationNotAllowed(true);
        setErrorMsg('Email/Password provider is not yet toggled on in your Firebase Console.');
      } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setErrorMsg('Invalid email or password. Please verify your details.');
      } else if (code === 'auth/email-already-in-use') {
        setErrorMsg('This email is already registered. Please log in instead.');
      } else if (code === 'auth/weak-password') {
        setErrorMsg('Password should be at least 6 characters long.');
      } else if (code === 'auth/invalid-email') {
        setErrorMsg('Please enter a valid email address.');
      } else {
        setErrorMsg(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200">
        
        {/* Top Header Graphic */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/app-icon.jpg"
                alt="lgede unity forum icon"
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/30 shadow-md shrink-0 bg-stone-900"
              />
              <div>
                <h2 className="text-lg font-bold tracking-tight">lgede unity forum</h2>
                <p className="text-xs text-emerald-200 mt-0.5">
                  {mode === 'login' && 'Welcome back! Sign in to your account'}
                  {mode === 'signup' && 'Join your community network with immediate access'}
                  {mode === 'forgot' && 'Reset your forum account password'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          {mode !== 'forgot' && (
            <div className="flex bg-white/10 p-1 rounded-xl mt-4">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setOperationNotAllowed(false);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'login' ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-100 hover:text-white'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setOperationNotAllowed(false);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'signup' ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-100 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          )}
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">

          {/* 1-Click Google Sign-In Button */}
          {mode !== 'forgot' && (
            <div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer hover:border-emerald-600 group"
              >
                {googleLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-stone-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google (Instant Access)</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-stone-200" />
                <span className="text-[11px] text-stone-400 font-medium uppercase tracking-wider">
                  or with email & password
                </span>
                <div className="flex-1 h-px bg-stone-200" />
              </div>
            </div>
          )}

          {/* Operation Not Allowed Detailed Solution Box */}
          {operationNotAllowed && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-950">Enable Email/Password in Firebase:</h4>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    Firebase requires the Email/Password sign-in method to be switched on in your console settings:
                  </p>
                </div>
              </div>
              <ol className="list-decimal list-inside text-[11px] text-amber-900 space-y-1 pl-1">
                <li>Open <strong>Firebase Console &gt; Authentication &gt; Sign-in method</strong></li>
                <li>Click <strong>Email/Password</strong> and toggle <strong>Enable</strong> to ON</li>
                <li>Click <strong>Save</strong></li>
              </ol>
              <div className="pt-1 flex items-center justify-between">
                <a
                  href="https://console.firebase.google.com/project/lofty-emitter-blcf1/authentication/providers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:text-emerald-950 underline"
                >
                  <span>Open Firebase Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-[10px] text-stone-500">Or use Google login above</span>
              </div>
            </div>
          )}

          {errorMsg && !operationNotAllowed && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Signup Specific Fields */}
            {mode === 'signup' && (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Stephen Aleje"
                      className="w-full pl-10 pr-4 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Home Base / Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
                    >
                      <option value="Oju, Benue State">Oju LGA, Benue State</option>
                      <option value="Obi, Benue State">Obi LGA, Benue State</option>
                      <option value="Makurdi, Benue State">Makurdi, Benue</option>
                      <option value="Abuja, FCT">Abuja, FCT</option>
                      <option value="Lagos, Nigeria">Lagos, Nigeria</option>
                      <option value="Port Harcourt, Rivers">Port Harcourt, Rivers</option>
                      <option value="Kaduna / North">Kaduna / Northern States</option>
                      <option value="Diaspora (UK, US, Canada, etc.)">Diaspora (International)</option>
                      <option value="Other Location">Other</option>
                    </select>
                  </div>
                </div>

                {/* Clean, Fast Registration Note */}
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-800 text-[11px] flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>An official community avatar will be generated for you. You can customize your profile anytime later.</span>
                </div>
              </>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Password */}
            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMsg(null);
                        setOperationNotAllowed(false);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] font-semibold text-emerald-700 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    className="w-full pl-10 pr-4 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Direct Access Guarantee Notice for Registration */}
            {mode === 'signup' && (
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-900 leading-tight">
                  <strong>Instant Full Access:</strong> Direct privileges across all spaces, discussions, friend requests, and private chat upon registration.
                </p>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'login' && 'Sign In with Email & Password'}
                    {mode === 'signup' && 'Create Account with Email'}
                    {mode === 'forgot' && 'Send Password Reset Email'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Back to login option from forgot mode */}
            {mode === 'forgot' && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                    setOperationNotAllowed(false);
                    setSuccessMsg(null);
                  }}
                  className="text-xs font-semibold text-stone-600 hover:text-emerald-800"
                >
                  ← Back to Log In
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
