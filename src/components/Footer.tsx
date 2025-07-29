import React from 'react';
import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';

interface FooterProps {
  className?: string;
}

export function Footer({ className = "" }: FooterProps) {
  return (
    <footer className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12 border-t border-white/10 ${className}`}>
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <Crown className="h-6 w-6 text-white/40" />
          <span className="text-white/40 font-light tracking-wider">CROWN</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link 
            to="/terms" 
            className="text-white/60 hover:text-white transition-colors"
          >
            Terms of Service
          </Link>
          <span className="text-white/20">•</span>
          <Link 
            to="/privacy" 
            className="text-white/60 hover:text-white transition-colors"
          >
            Privacy Policy
          </Link>
        </div>
        <p className="text-white/40 text-xs text-center">
          © {new Date().getFullYear()} Crown. All rights reserved.
        </p>
      </div>
    </footer>
  );
}