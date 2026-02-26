import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '../../services/api';

interface OTPVerificationProps {
  userId: string;
  email: string;
  onVerificationComplete: (token: string, user: any) => void;
}

export function OTPVerification({ userId, email, onVerificationComplete }: OTPVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const navigate = useNavigate();

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
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
      setMessage('Please enter complete OTP');
      setMessageType('error');
      return;
    }

    if (timeLeft <= 0) {
      setMessage('OTP has expired. Please request a new one.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const response = await apiService.verifyOTP(userId, otpString);
      setMessage('Email verified successfully!');
      setMessageType('success');
      setTimeout(() => {
        onVerificationComplete(response.token, response.user);
      }, 1500);
    } catch (error: any) {
      setMessage('Invalid OTP. Please try again.');
      setMessageType('error');
      setOtp(['', '', '', '', '', '']);
      // Focus first input
      document.getElementById('otp-0')?.focus();
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
      toast.error(error.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5E6D3] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#3D2817] rounded-lg shadow-2xl border-2 border-[#8B6F47] p-8">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-[#D4AF37] hover:text-[#FFD700] mb-6 transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span className="text-sm">Back to Login</span>
        </button>

        <div className="text-center mb-8">
          <div className="bg-[#8B6F47] p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Mail className="size-8 text-[#F5E6D3]" />
          </div>
          <h1 className="text-2xl font-bold text-[#F5E6D3] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Verify Your Email
          </h1>
          <p className="text-[#D4C5AA] text-sm">
            We've sent a 6-digit code to<br />
            <span className="font-semibold text-[#D4AF37]">{email}</span>
          </p>
          
          {/* Countdown Timer */}
          <div className="mt-3">
            <p className="text-[#D4AF37] text-sm font-semibold">
              {timeLeft > 0 ? (
                <>Time remaining: {formatTime(timeLeft)}</>
              ) : (
                <span className="text-red-400">OTP Expired</span>
              )}
            </p>
          </div>
        </div>

        <form onSubmit={handleVerifyOTP} className="space-y-6">
          {/* Message Display */}
          {message && (
            <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${
              messageType === 'success' 
                ? 'bg-green-900/20 border border-green-500/30 text-green-400' 
                : 'bg-red-900/20 border border-red-500/30 text-red-400'
            }`}>
              {messageType === 'success' ? (
                <CheckCircle className="size-4" />
              ) : (
                <XCircle className="size-4" />
              )}
              {message}
            </div>
          )}
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
            disabled={loading || timeLeft <= 0}
            className="w-full bg-gradient-to-r from-[#8B6F47] to-[#6B5537] hover:from-[#D4AF37] hover:to-[#B8941F] text-[#F5E6D3] font-bold py-3 rounded-md transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? 'Verifying...' : timeLeft <= 0 ? 'OTP Expired' : 'Verify Email'}
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
        </div>
      </div>
    </div>
  );
}