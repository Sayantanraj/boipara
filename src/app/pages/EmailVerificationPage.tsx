import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, RefreshCw, Send } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '../../services/api';

export function EmailVerificationPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await apiService.sendVerificationOTP(email);
      setUserId(response.userId);
      setStep('otp');
      toast.success('OTP sent to your email!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      toast.error('Please enter complete OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.verifyOTP(userId, otpString);
      toast.success('Email verified successfully!');
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    try {
      await apiService.resendOTP(userId);
      toast.success('OTP sent successfully!');
      setOtp(['', '', '', '', '', '']);
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5E6D3] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#3D2817] rounded-lg shadow-2xl border-2 border-[#8B6F47] p-8">
        <Link
          to="/login"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#3D2817] border border-[#8B6F47] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-white transition-all shadow-sm hover:shadow-md mb-6"
        >
          <ArrowLeft className="size-5" />
        </Link>

        <div className="text-center mb-8">
          <div className="bg-[#8B6F47] p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Mail className="size-8 text-[#F5E6D3]" />
          </div>
          <h1 className="text-2xl font-bold text-[#F5E6D3] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Email Verification
          </h1>
          <p className="text-[#D4C5AA] text-sm">
            {step === 'email' ? 'Enter your email to receive OTP' : 'Enter the 6-digit code sent to your email'}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[#D4AF37] mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#F5E6D3] placeholder-[#A08968]"
                placeholder="your.email@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#8B6F47] to-[#6B5537] hover:from-[#D4AF37] hover:to-[#B8941F] text-[#F5E6D3] font-bold py-3 rounded-md transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="size-5" />
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <>
            <div className="text-center mb-6">
              <p className="text-[#D4C5AA] text-sm">
                Code sent to: <span className="font-semibold text-[#D4AF37]">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-xl font-bold bg-[#2C1810] border-2 border-[#8B6F47] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-[#F5E6D3]"
                    maxLength={1}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#8B6F47] to-[#6B5537] hover:from-[#D4AF37] hover:to-[#B8941F] text-[#F5E6D3] font-bold py-3 rounded-md transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-[#D4C5AA] text-sm mb-2">Didn't receive the code?</p>
              <button
                onClick={handleResendOTP}
                disabled={resending}
                className="flex items-center gap-2 text-[#D4AF37] hover:text-[#FFD700] font-semibold text-sm mx-auto transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`size-4 ${resending ? 'animate-spin' : ''}`} />
                {resending ? 'Sending...' : 'Resend OTP'}
              </button>
              <button
                onClick={() => setStep('email')}
                className="block text-[#D4AF37] hover:text-[#FFD700] text-sm mt-2 mx-auto transition-colors"
              >
                Change Email
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}