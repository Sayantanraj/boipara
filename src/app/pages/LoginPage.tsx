import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, User, Mail, Lock, Store, Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { OTPVerification } from '../components/OTPVerification';
import { apiService } from '../../services/api';
import { initGoogleAuth, signInWithGooglePopup } from '../../services/googleAuth';
import { toast } from 'sonner';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'customer' | 'seller' | 'admin'>('customer');
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [pendingUserId, setPendingUserId] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailOTP, setEmailOTP] = useState('');
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  
  // Registration fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [location, setLocation] = useState('');

  const { login, setUserFromToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadGoogleAuth = async () => {
      try {
        await initGoogleAuth();
        console.log('Google Auth initialized');
      } catch (error) {
        console.error('Failed to initialize Google Auth:', error);
      }
    };
    
    loadGoogleAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isRegistering) {
        const userData = {
          name,
          email,
          password,
          role: userType,
          phone,
          ...(userType === 'seller' && { storeName, location }),
          ...(userType === 'customer' && { location }),
        };
        
        const response = await apiService.register(userData);
        setPendingUserId(response.userId);
        setShowOTPVerification(true);
        toast.success('Registration successful! Please check your email for OTP.');
      } else {
        try {
          const response = await login(email, password);
          
          // Redirect based on user role
          if (response.user.role === 'seller') {
            navigate('/seller/dashboard');
          } else if (response.user.role === 'admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/');
          }
        } catch (err: any) {
          if (err.message.includes('verify your email') && err.requiresVerification) {
            setPendingUserId(err.userId);
            setShowOTPVerification(true);
            setError('Please verify your email first');
          } else {
            throw err;
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailOTP = async () => {
    if (!email || !name) {
      toast.error('Please enter name and email first');
      return;
    }

    setSendingOTP(true);
    try {
      await apiService.sendEmailOTP(email, name);
      toast.success('OTP sent to your email!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setSendingOTP(false);
    }
  };

  const handleVerifyEmailOTP = async () => {
    if (!emailOTP || emailOTP.length !== 6) {
      toast.error('Please enter 6-digit OTP');
      return;
    }

    setVerifyingOTP(true);
    try {
      await apiService.verifyEmailOTP(email, emailOTP);
      setEmailVerified(true);
      toast.success('Email verified successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Invalid OTP');
    } finally {
      setVerifyingOTP(false);
    }
  };

  const handleVerificationComplete = (token: string, user: any) => {
    setUserFromToken(token, user);
    toast.success('Email verified successfully!');
    
    if (user.role === 'seller') {
      navigate('/seller/dashboard');
    } else {
      navigate('/');
    }
  };

  if (showOTPVerification) {
    return (
      <OTPVerification
        userId={pendingUserId}
        email={email}
        onVerificationComplete={handleVerificationComplete}
      />
    );
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      
      const isLoaded = await initGoogleAuth();
      if (!isLoaded) {
        throw new Error('Failed to load Google SDK');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const googleUser = await signInWithGooglePopup();
      
      const authData = {
        googleId: googleUser.id,
        name: googleUser.name,
        email: googleUser.email,
        picture: googleUser.picture,
        role: userType
      };
      
      const response = await apiService.googleAuth(authData);
      setUserFromToken(response.token, response.user);
      
      toast.success(`Welcome ${response.user.name}!`);
      
      if (response.user.role === 'seller') {
        navigate('/seller/dashboard');
      } else {
        navigate('/');
      }
      
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      if (error === 'popup_closed_by_user') {
        toast.error('Sign-in cancelled');
      } else {
        toast.error('Authentication failed: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestContinue = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#F5E6D3] flex items-center justify-center p-4" style={{
      backgroundImage: 'url("https://images.unsplash.com/photo-1689710214746-c0094c4bac56?w=1920")',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      <div className="absolute inset-0 bg-[#2C1810]/85"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-[#3D2817] rounded-lg shadow-2xl border-2 border-[#8B6F47] p-3 sm:p-4">
          {/* Vintage Corner Ornaments */}
          <div className="absolute top-1.5 left-1.5 w-6 h-6 border-t border-l border-[#D4AF37] opacity-50"></div>
          <div className="absolute top-1.5 right-1.5 w-6 h-6 border-t border-r border-[#D4AF37] opacity-50"></div>
          <div className="absolute bottom-1.5 left-1.5 w-6 h-6 border-b border-l border-[#D4AF37] opacity-50"></div>
          <div className="absolute bottom-1.5 right-1.5 w-6 h-6 border-b border-r border-[#D4AF37] opacity-50"></div>

          {/* Logo */}
          <div className="flex justify-center mb-2">
            <div className="bg-gradient-to-br from-[#8B6F47] to-[#6B5537] p-2 rounded-lg shadow-lg">
              <BookOpen className="size-6 text-[#F5E6D3]" />
            </div>
          </div>

          <div className="text-center mb-3">
            <h2 className="text-xl sm:text-2xl font-bold text-[#F5E6D3] mb-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>
              BOI PARA
            </h2>
            <p className="text-[#D4AF37] text-xs font-medium">From College Street to Your Doorstep</p>
          </div>

          {/* User Type Selection */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-[#D4AF37] mb-1.5">I am a:</label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setUserType('customer')}
                className={`p-1.5 rounded-lg border-2 transition-all ${
                  userType === 'customer'
                    ? 'border-[#D4AF37] bg-[#2C1810]'
                    : 'border-[#8B6F47] hover:border-[#D4AF37]'
                }`}
              >
                <User className={`size-3.5 mx-auto mb-0.5 ${userType === 'customer' ? 'text-[#D4AF37]' : 'text-[#A08968]'}`} />
                <p className={`text-xs font-semibold ${userType === 'customer' ? 'text-[#D4AF37]' : 'text-[#D4C5AA]'}`}>
                  Customer
                </p>
              </button>
              <button
                type="button"
                onClick={() => setUserType('seller')}
                className={`p-1.5 rounded-lg border-2 transition-all ${
                  userType === 'seller'
                    ? 'border-[#D4AF37] bg-[#2C1810]'
                    : 'border-[#8B6F47] hover:border-[#D4AF37]'
                }`}
              >
                <Store className={`size-3.5 mx-auto mb-0.5 ${userType === 'seller' ? 'text-[#D4AF37]' : 'text-[#A08968]'}`} />
                <p className={`text-xs font-semibold ${userType === 'seller' ? 'text-[#D4AF37]' : 'text-[#D4C5AA]'}`}>
                  Seller
                </p>
              </button>
              <button
                type="button"
                onClick={() => setUserType('admin')}
                className={`p-1.5 rounded-lg border-2 transition-all ${
                  userType === 'admin'
                    ? 'border-[#D4AF37] bg-[#2C1810]'
                    : 'border-[#8B6F47] hover:border-[#D4AF37]'
                }`}
              >
                <Shield className={`size-3.5 mx-auto mb-0.5 ${userType === 'admin' ? 'text-[#D4AF37]' : 'text-[#A08968]'}`} />
                <p className={`text-xs font-semibold ${userType === 'admin' ? 'text-[#D4AF37]' : 'text-[#D4C5AA]'}`}>
                  Admin
                </p>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2.5 mb-3">
            {/* Registration-only fields */}
            {isRegistering && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#D4AF37] mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#8B6F47]" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-[#F5E6D3] placeholder-[#A08968] text-sm"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                {userType === 'seller' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#D4AF37] mb-1">Store Name</label>
                    <div className="relative">
                      <Store className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#8B6F47]" />
                      <input
                        type="text"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-[#F5E6D3] placeholder-[#A08968] text-sm"
                        placeholder="Your bookstore name"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#D4AF37] mb-1">Phone Number</label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#8B6F47]" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-[#F5E6D3] placeholder-[#A08968] text-sm"
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D4AF37] mb-1">Location</label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#8B6F47]" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-[#F5E6D3] placeholder-[#A08968] text-sm"
                      placeholder={userType === 'seller' ? 'College Street, Kolkata' : 'Your city, area'}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#D4AF37] mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#8B6F47]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-[#F5E6D3] placeholder-[#A08968] text-sm"
                  placeholder={isRegistering ? 'your.email@example.com' : `${userType}@test.com`}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#D4AF37] mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#8B6F47]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-[#F5E6D3] placeholder-[#A08968] text-sm"
                  placeholder={isRegistering ? 'Create a strong password' : 'Enter password'}
                  required={isRegistering}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-xs text-center p-2 bg-red-900/20 rounded border border-red-500/30">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#8B6F47] to-[#6B5537] hover:from-[#D4AF37] hover:to-[#B8941F] text-[#F5E6D3] font-bold py-2 rounded-md transition-all shadow-lg hover:shadow-xl border border-[#D4AF37]/30 text-sm disabled:opacity-50"
            >
              {loading ? 'Please wait...' : (isRegistering ? 'Create Account' : 'Sign In')}
            </button>

            {/* Google Sign In */}
            {!isRegistering && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#8B6F47]"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-[#3D2817] text-[#D4C5AA]">or</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded-md shadow-sm flex items-center justify-center gap-2 transition-all text-sm disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {loading ? 'Signing in...' : 'Continue with Google'}
                </button>
                
                {/* Hidden div for Google button fallback */}
                <div id="google-signin-button" className="hidden"></div>
              </>
            )}

            {/* Toggle between Sign In / Sign Up */}
            {userType !== 'admin' && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-[#D4AF37] hover:text-[#FFD700] text-xs font-semibold transition-colors"
                >
                  {isRegistering ? '← Back to Sign In' : "Don't have an account? Sign Up →"}
                </button>
              </div>
            )}
          </form>

          {/* Guest Browse Option */}
          <div className="relative mb-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#8B6F47]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-[#3D2817] text-[#D4C5AA]">or</span>
            </div>
          </div>

          <button
            onClick={handleGuestContinue}
            className="w-full bg-[#2C1810] hover:bg-[#3D2817] border-2 border-[#8B6F47] text-[#F5E6D3] font-semibold py-2 rounded-md transition-all mb-3 text-sm"
          >
            Continue as Guest
          </button>

          <div className="p-2.5 bg-[#2C1810] rounded-md border border-[#8B6F47]">
            <p className="text-xs text-[#D4AF37] font-semibold mb-1">Demo Accounts:</p>
            <div className="space-y-0 text-xs text-[#D4C5AA] leading-tight">
              <p>• Customer: customer@test.com</p>
              <p>• Seller: seller@test.com</p>
              <p>• Admin: admin@test.com</p>
              <p className="text-[#A08968] mt-1">Any password works</p>
            </div>
          </div>

          <div className="mt-3 text-center">
            <Link to="/" className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#3D2817] border border-[#8B6F47] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-white transition-all shadow-sm hover:shadow-md">
              <ArrowLeft className="size-5" />
            </Link>
            <span className="text-[#8B6F47] mx-2">|</span>
            <Link to="/verify-email" className="text-[#D4AF37] hover:text-[#FFD700] text-xs font-semibold transition-colors">
              Verify Email
            </Link>
            {!isRegistering && (
              <>
                <span className="text-[#8B6F47] mx-2">|</span>
                <Link to="/forgot-password" className="text-[#D4AF37] hover:text-[#FFD700] text-xs font-semibold transition-colors">
                  Forgot Password?
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Trust Message */}
        <div className="mt-6 text-center text-[#F5E6D3] text-sm bg-[#3D2817]/80 backdrop-blur-sm rounded-lg p-4 border border-[#8B6F47]">
          <p className="mb-1">🔒 Your data is secure with us</p>
          <p className="text-[#D4C5AA] text-xs">Browse freely, buy with confidence</p>
        </div>
      </div>
    </div>
  );
}