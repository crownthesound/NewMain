import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";

interface AuthProps {
  isSignUp: boolean;
  setIsSignUp: (value: boolean) => void;
}

export function Auth({ isSignUp, setIsSignUp }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isResetPassword, setIsResetPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) throw error;

      toast.success("Password reset instructions sent to your email");
      setIsResetPassword(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send password reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (!validatePassword(password)) {
          throw new Error("Password must be at least 6 characters long");
        }

        const {
          data: { user },
          error: signUpError,
        } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (signUpError) {
          if (signUpError.message.includes("already registered")) {
            throw new Error(
              "This email is already registered. Please sign in instead."
            );
          }
          throw signUpError;
        }

        if (user) {
          const { error: profileError } = await supabase
            .from("profiles")
            .insert([
              {
                id: user.id,
                email: user.email,
                full_name: fullName,
                role: "user",
              },
            ]);

          if (profileError) {
            throw new Error("Failed to create user profile. Please try again.");
          }
        }

        toast.success("Sign up successful! You can now sign in.");
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Email not confirmed")) {
            throw new Error(
              "Please check your email to confirm your account before signing in."
            );
          } else if (error.message.includes("Invalid login credentials")) {
            throw new Error(
              "Invalid email or password. Please try again or reset your password."
            );
          }
          throw error;
        }

        toast.success("Signed in successfully!");

        // Check if user came from a contest page
        const returnUrl = localStorage.getItem("auth_return_url");
        if (returnUrl) {
          localStorage.removeItem("auth_return_url");
          navigate(returnUrl);
        } else {
          const currentPath = location.pathname;
          if (currentPath.startsWith("/l/")) {
            window.location.reload();
          } else {
            navigate("/");
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during authentication");
    } finally {
      setLoading(false);
    }
  };

  if (isResetPassword) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-center mb-2">
            Reset Password
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Enter your email address and we'll send you instructions to reset
            your password.
          </p>

          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5 mx-auto" />
              ) : (
                "Send Reset Instructions"
              )}
            </button>
          </form>

          <button
            onClick={() => setIsResetPassword(false)}
            className="mt-6 w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-semibold text-center mb-2">
          {isSignUp ? "Create Account" : "Login"}
        </h2>
        <p className="text-gray-600 text-center mb-8">
          {isSignUp
            ? "Enter your details to create your account"
            : "Enter your email and password to access your account"}
        </p>

        <form onSubmit={handleAuth} className="space-y-6">
          {isSignUp && (
            <div>
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                required
              />
            </div>
          )}

          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
              minLength={6}
            />
            {isSignUp && (
              <p className="text-xs text-gray-500 mt-2">
                Password must be at least 6 characters long
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5 mx-auto" />
            ) : isSignUp ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {!isSignUp && (
          <button
            onClick={() => setIsResetPassword(true)}
            className="mt-6 w-full text-sm text-gray-600 hover:text-gray-900 hover:underline"
          >
            Forgot your password?
          </button>
        )}

        <div className="mt-8 text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 text-sm text-gray-500 bg-white">OR</span>
            </div>
          </div>

          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {isSignUp ? "Back to Sign In" : "Create an Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
