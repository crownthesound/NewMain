import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import { Footer } from '../components/Footer';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useAuthRedirect } from '../hooks/useAuthRedirect';

// Custom styles for phone input
const phoneInputStyles = `
  .phone-input .PhoneInputCountrySelect {
    background-color: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 0.5rem !important;
    color: white !important;
  }
  .phone-input .PhoneInputCountrySelect:focus {
    border-color: rgba(255, 255, 255, 0.2) !important;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2) !important;
    outline: none !important;
  }
  .phone-input .PhoneInputCountrySelectArrow {
    color: white !important;
    opacity: 0.8 !important;
  }
`;

export function SignIn() {
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>();
  const navigate = useNavigate();
  const location = useLocation();
  const { setRedirectUrl } = useAuthRedirect();


  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!phoneNumber) {
        throw new Error('Phone number is required');
      }

      // Check if user exists in profiles table
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('phone_number', phoneNumber);

      if (profileError) {
        throw profileError;
      }

      if (!profiles || profiles.length === 0) {
        // User doesn't exist, redirect to signup
        toast.error('Phone number not found. Please sign up first.');
        
        // Preserve redirect URL for signup flow
        const redirectUrl = localStorage.getItem('auth_return_url');
        if (redirectUrl) {
          setRedirectUrl(redirectUrl);
        }
        
        navigate('/signup');
        return;
      }

      // User exists, proceed with OTP
      const profile = profiles[0];
      
      // Generate a temporary password for Supabase auth
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

      // Send OTP for sign in
      const { error: signInError } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });

      if (signInError) {
        throw signInError;
      }

      toast.success('Verification code sent to your phone!');

      // Navigate to OTP verification page with user data
      navigate('/verify-otp', {
        state: {
          phoneNumber,
          email: profile.email,
          password: tempPassword,
          fullName: profile.full_name,
          isSignIn: true,
        },
      });
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: phoneInputStyles }} />
      <div className="min-h-screen bg-[#0A0A0A] bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2A2A2A] flex flex-col">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 w-full">
          <Link to="/" className="flex items-center gap-3">
            <Crown className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">Crown</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-white/60 mb-8">Sign in with your phone number</p>

            <form onSubmit={handleSignIn} className="space-y-6">
              <div>
                <PhoneInput
                  placeholder="Phone Number"
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  defaultCountry="US"
                  className="phone-input"
                  style={{
                    '--PhoneInputCountryFlag-borderColor': 'transparent',
                    '--PhoneInput-color--focus': '#ffffff',
                    '--PhoneInputCountrySelectArrow-color': '#ffffff',
                    '--PhoneInputCountrySelectArrow-opacity': '0.8',
                    '--PhoneInputCountrySelect-backgroundColor': 'rgba(255, 255, 255, 0.05)',
                    '--PhoneInputCountrySelect-borderColor': 'rgba(255, 255, 255, 0.1)',
                    '--PhoneInputCountrySelect-borderRadius': '0.5rem',
                    '--PhoneInputCountrySelect-borderWidth': '1px',
                    '--PhoneInputCountrySelect--focus-borderColor': 'rgba(255, 255, 255, 0.2)',
                    '--PhoneInputCountrySelect--focus-boxShadow': '0 0 0 2px rgba(255, 255, 255, 0.2)',
                  }}
                  numberInputProps={{
                    className: 'w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black py-3 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5 mx-auto" />
                ) : (
                  'Send Verification Code'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 text-sm text-white/40 bg-[#0A0A0A]">OR</span>
                </div>
              </div>

              <Link
                to="/signup"
                className="mt-6 w-full inline-block py-3 border border-white/10 rounded-lg text-white hover:bg-white/5 transition-colors"
                onClick={() => {
                  // Preserve redirect URL for signup flow
                  const redirectUrl = localStorage.getItem('auth_return_url');
                  if (redirectUrl) {
                    setRedirectUrl(redirectUrl);
                  }
                }}
              >
                Create an Account
              </Link>
              
              <div className="mt-4 text-center">
                <Link
                  to="/admin-login"
                  className="text-sm text-white/40 hover:text-white/60 transition-colors"
                >
                  Admin/Organizer Login
                </Link>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}