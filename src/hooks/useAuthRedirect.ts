import { useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const REDIRECT_URL_KEY = 'auth_return_url';
const REDIRECT_PARAMS_KEY = 'auth_return_params';
const REDIRECT_ACTION_KEY = 'auth_return_action';

export interface AuthRedirectOptions {
  preserveParams?: boolean;
  fallbackPath?: string;
  action?: string;
}

export function useAuthRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();

  const setRedirectUrl = useCallback((url: string, options: AuthRedirectOptions = {}) => {
    try {
      localStorage.setItem(REDIRECT_URL_KEY, url);
      
      if (options.preserveParams) {
        const currentParams = new URLSearchParams(location.search);
        if (currentParams.toString()) {
          localStorage.setItem(REDIRECT_PARAMS_KEY, currentParams.toString());
        }
      }
      
      if (options.action) {
        localStorage.setItem(REDIRECT_ACTION_KEY, options.action);
      }
    } catch (error) {
      console.warn('Failed to store redirect URL:', error);
    }
  }, [location.search]);

  const setRedirectFromCurrent = useCallback((options: AuthRedirectOptions = {}) => {
    const currentUrl = location.pathname + location.search;
    setRedirectUrl(currentUrl, options);
  }, [location.pathname, location.search, setRedirectUrl]);

  const getRedirectUrl = useCallback((): string | null => {
    try {
      const url = localStorage.getItem(REDIRECT_URL_KEY);
      const params = localStorage.getItem(REDIRECT_PARAMS_KEY);
      
      if (url && params) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}${params}`;
      }
      
      return url;
    } catch (error) {
      console.warn('Failed to retrieve redirect URL:', error);
      return null;
    }
  }, []);

  const getRedirectAction = useCallback((): string | null => {
    try {
      return localStorage.getItem(REDIRECT_ACTION_KEY);
    } catch (error) {
      console.warn('Failed to retrieve redirect action:', error);
      return null;
    }
  }, []);

  const clearRedirectUrl = useCallback(() => {
    try {
      localStorage.removeItem(REDIRECT_URL_KEY);
      localStorage.removeItem(REDIRECT_PARAMS_KEY);
      localStorage.removeItem(REDIRECT_ACTION_KEY);
    } catch (error) {
      console.warn('Failed to clear redirect URL:', error);
    }
  }, []);

  const getRoleBasedFallback = useCallback((userRole?: string): string => {
    switch (userRole) {
      case 'admin':
        return '/admin/dashboard';
      case 'organizer':
        return '/organizer/dashboard';
      case 'user':
      default:
        return '/contests';
    }
  }, []);

  const executeRedirect = useCallback((options: AuthRedirectOptions = {}) => {
    const redirectUrl = getRedirectUrl();
    
    if (redirectUrl) {
      // Validate the redirect URL to prevent open redirects
      const isValidRedirect = redirectUrl.startsWith('/') && 
                            !redirectUrl.startsWith('//') && 
                            !redirectUrl.includes('://');
      
      if (isValidRedirect) {
        clearRedirectUrl();
        navigate(redirectUrl, { replace: true });
        return;
      }
    }

    // Fallback to role-based redirect or provided fallback
    const fallbackPath = options.fallbackPath || getRoleBasedFallback(profile?.role);
    clearRedirectUrl();
    navigate(fallbackPath, { replace: true });
  }, [getRedirectUrl, clearRedirectUrl, navigate, getRoleBasedFallback, profile?.role]);

  const redirectToAuth = useCallback((
    authPath: '/signin' | '/signup' | '/admin/login' = '/signin',
    options: AuthRedirectOptions = {}
  ) => {
    // Store current location as redirect URL
    setRedirectFromCurrent(options);
    
    // Navigate to auth page
    navigate(authPath);
  }, [setRedirectFromCurrent, navigate]);

  // Auto-redirect if user is authenticated and there's a pending redirect
  useEffect(() => {
    if (user && profile) {
      const redirectUrl = getRedirectUrl();
      if (redirectUrl) {
        // Small delay to ensure the auth context is fully loaded
        const timer = setTimeout(() => {
          executeRedirect();
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }
  }, [user, profile, getRedirectUrl, executeRedirect]);

  return {
    setRedirectUrl,
    setRedirectFromCurrent,
    getRedirectUrl,
    getRedirectAction,
    clearRedirectUrl,
    executeRedirect,
    redirectToAuth,
    hasRedirectUrl: !!getRedirectUrl(),
    hasRedirectAction: !!getRedirectAction(),
  };
}