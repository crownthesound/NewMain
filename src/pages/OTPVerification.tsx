import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Loader2, Crown, ArrowLeft, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { Footer } from "../components/Footer";
import { useAuthRedirect } from "../hooks/useAuthRedirect";

interface LocationState {
  phoneNumber: string;
  email: string;
  password: string;
  fullName: string;
  isSignIn?: boolean;
}

export function OTPVerification() {
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { executeRedirect } = useAuthRedirect();

  const state = location.state as LocationState;

  useEffect(() => {
    if (!state?.phoneNumber) {
      navigate("/signup");
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state, navigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedValue = value.slice(0, 6);
      const newOtp = [...otp];
      for (let i = 0; i < pastedValue.length && i < 6; i++) {
        newOtp[i] = pastedValue[i];
      }
      setOtp(newOtp);

      // Focus on the next empty input or the last input
      const nextIndex = Math.min(pastedValue.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const checkTikTokConnectionAndRedirect = async () => {
    try {
      // Check if user has TikTok profile in our database
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: tikTokProfile } = await supabase
          .from("tiktok_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!tikTokProfile) {
          // User not connected to TikTok, get the redirect URL
          const redirectUrl = localStorage.getItem('auth_return_url');
          if (redirectUrl) {
            // Check if redirect URL is a contest page
            const isContestPage = redirectUrl.includes('/l/') || redirectUrl.includes('/contest');
            
            if (isContestPage) {
              // For contest pages, let the ContestJoinModal handle TikTok connection
              navigate(redirectUrl);
            } else {
              // For non-contest pages, add TikTok modal parameter
              const separator = redirectUrl.includes('?') ? '&' : '?';
              navigate(`${redirectUrl}${separator}showTikTokModal=true`);
            }
          } else {
            // No redirect URL, show modal on home page
            navigate("/?showTikTokModal=true");
          }
        } else {
          // User connected, use the redirect system
          executeRedirect({ fallbackPath: "/" });
        }
      }
    } catch (error) {
      console.error("Error checking TikTok connection:", error);
      // Use the redirect system for error cases too
      executeRedirect({ fallbackPath: "/" });
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      if (state.isSignIn) {
        // For sign in, use signInWithOtp
        const { error } = await supabase.auth.signInWithOtp({
          phone: state.phoneNumber,
        });
        if (error) throw error;
      } else {
        // For sign up, use signUp
        const { error } = await supabase.auth.signUp({
          phone: state.phoneNumber,
          password: state.password,
          options: {
            data: {
              full_name: state.fullName,
              email: state.email,
            },
          },
        });
        if (error) throw error;
      }

      toast.success("OTP sent successfully!");
      setTimeLeft(120);
      setCanResend(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      toast.error("Please enter a complete 6-digit code");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.verifyOtp({
        phone: state.phoneNumber,
        token: otpCode,
        type: "sms",
      });

      if (error) throw error;

      if (user) {
        if (state.isSignIn) {
          // For sign in, set login timestamp and show success
          localStorage.setItem("user_login_time", Date.now().toString());

          toast.success("Signed in successfully!", {
            duration: 2000,
            icon: "✅",
          });

          // Check if user is connected to TikTok and redirect accordingly
          setTimeout(() => {
            checkTikTokConnectionAndRedirect();
          }, 1000);
        } else {
          // For sign up, check if profile already exists
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();

          if (!existingProfile) {
            // Create user profile only if it doesn't exist
            const { error: profileError } = await supabase
              .from("profiles")
              .insert([
                {
                  id: user.id,
                  email: state.email,
                  full_name: state.fullName,
                  phone_number: state.phoneNumber,
                  role: "user",
                },
              ]);

            if (profileError) {
              console.error("Profile creation error:", profileError);
              // Don't throw error here as user is already created
            }
          }

          // For sign up, set login timestamp and show success
          localStorage.setItem("user_login_time", Date.now().toString());

          // Show success message and redirect
          toast.success("Account verified successfully! Welcome to Crown!", {
            duration: 3000,
            icon: "🎉",
          });

          // Check if user is connected to TikTok and redirect accordingly
          setTimeout(() => {
            checkTikTokConnectionAndRedirect();
          }, 1500);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const maskedPhoneNumber = state?.phoneNumber
    ? `${state.phoneNumber
        .slice(0, -4)
        .replace(/\d/g, "*")}${state.phoneNumber.slice(-4)}`
    : "";

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0A] bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2A2A2A] flex flex-col">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 w-full">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <Crown className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Crown
              </span>
            </Link>
            <Link
              to="/signup"
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Sign Up</span>
            </Link>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Verify Your Phone
              </h2>
              <p className="text-white/60 mb-4">
                {state?.isSignIn
                  ? "We've sent a verification code to"
                  : "We've sent a 6-digit code to"}
              </p>
              <p className="text-white font-medium text-lg">
                {maskedPhoneNumber}
              </p>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-3">
                  Enter verification code
                </label>
                <div className="flex gap-2 sm:gap-3 justify-center">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all"
                      autoComplete="off"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.some((digit) => !digit)}
                className="w-full bg-white text-black py-3 sm:py-4 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5 mx-auto" />
                ) : (
                  "Verify Code"
                )}
              </button>
            </form>

            <div className="mt-8 text-center space-y-4">
              <div className="text-white/60">
                {timeLeft > 0 ? (
                  <p>Resend code in {formatTime(timeLeft)}</p>
                ) : (
                  <p>Didn't receive the code?</p>
                )}
              </div>

              {canResend && (
                <button
                  onClick={handleResendOTP}
                  disabled={resendLoading}
                  className="flex items-center gap-2 mx-auto text-white hover:text-white/80 transition-colors disabled:opacity-50"
                >
                  {resendLoading ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Resend Code
                </button>
              )}
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-white/40">
                By verifying your phone number, you agree to our{" "}
                <Link
                  to="/terms"
                  className="text-white/60 hover:text-white underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="text-white/60 hover:text-white underline"
                >
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
