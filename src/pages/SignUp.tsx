import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Loader2, Crown } from "lucide-react";
import toast from "react-hot-toast";
import { Footer } from "../components/Footer";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useAuthRedirect } from "../hooks/useAuthRedirect";

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

export function SignUp() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>();
  const [smsConsent, setSmsConsent] = useState(false);
  const navigate = useNavigate();
  const { setRedirectUrl } = useAuthRedirect();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!phoneNumber) {
        throw new Error("Phone number is required");
      }

      if (!smsConsent) {
        throw new Error(
          "You must agree to receive text messages to create an account"
        );
      }

      // Generate a temporary password for Supabase auth
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

      // Sign up with phone number
      const { error: signUpError } = await supabase.auth.signUp({
        phone: phoneNumber,
        password: tempPassword,
        options: {
          data: {
            full_name: fullName,
            email: email,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          // Preserve redirect URL for signin flow
          const redirectUrl = localStorage.getItem('auth_return_url');
          if (redirectUrl) {
            setRedirectUrl(redirectUrl);
          }
          
          throw new Error(
            "This phone number is already registered. Please sign in instead."
          );
        }
        throw signUpError;
      }

      toast.success("Verification code sent to your phone!");

      // Navigate to OTP verification page with user data
      navigate("/verify-otp", {
        state: {
          phoneNumber,
          email,
          password: tempPassword,
          fullName,
        },
      });
    } catch (error: any) {
      toast.error(error.message || "An error occurred during sign up");
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
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Crown
            </span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-2">
              Create Account
            </h2>
            <p className="text-white/60 mb-8">
              Join our community and start competing
            </p>

            <form onSubmit={handleSignUp} className="space-y-6">
              <div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                  required
                />
              </div>

              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                  required
                />
              </div>

              <div>
                <PhoneInput
                  placeholder="Phone Number (Required)"
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  defaultCountry="US"
                  className="phone-input"
                  style={{
                    "--PhoneInputCountryFlag-borderColor": "transparent",
                    "--PhoneInput-color--focus": "#ffffff",
                    "--PhoneInputCountrySelectArrow-color": "#ffffff",
                    "--PhoneInputCountrySelectArrow-opacity": "0.8",
                    "--PhoneInputCountrySelect-backgroundColor":
                      "rgba(255, 255, 255, 0.05)",
                    "--PhoneInputCountrySelect-borderColor":
                      "rgba(255, 255, 255, 0.1)",
                    "--PhoneInputCountrySelect-borderRadius": "0.5rem",
                    "--PhoneInputCountrySelect-borderWidth": "1px",
                    "--PhoneInputCountrySelect--focus-borderColor":
                      "rgba(255, 255, 255, 0.2)",
                    "--PhoneInputCountrySelect--focus-boxShadow":
                      "0 0 0 2px rgba(255, 255, 255, 0.2)",
                  }}
                  numberInputProps={{
                    className:
                      "w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20",
                  }}
                />
              </div>


              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="smsConsent"
                  checked={smsConsent}
                  onChange={(e) => setSmsConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-white/20 focus:ring-offset-0"
                  required
                />
                <label
                  htmlFor="smsConsent"
                  className="text-xs text-white/60 leading-relaxed"
                >
                  By checking this box you agree to receive text messages from
                  Crown. Reply STOP to opt out; Reply HELP for help; Message
                  frequency varies; Message and data rates may apply.{" "}
                  <Link to="/privacy" className="text-white hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black py-3 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5 mx-auto" />
                ) : (
                  "Create Account"
                )}
              </button>

              <p className="text-sm text-white/60 text-center">
                By signing up, you agree to our{" "}
                <Link to="/terms" className="text-white hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-white hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </form>

            <div className="mt-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 text-sm text-white/40 bg-[#0A0A0A]">
                    OR
                  </span>
                </div>
              </div>

              <Link
                to="/signin"
                className="mt-6 w-full inline-block py-3 border border-white/10 rounded-lg text-white hover:bg-white/5 transition-colors"
                onClick={() => {
                  // Preserve redirect URL for signin flow
                  const redirectUrl = localStorage.getItem('auth_return_url');
                  if (redirectUrl) {
                    setRedirectUrl(redirectUrl);
                  }
                }}
              >
                Sign In Instead
              </Link>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
