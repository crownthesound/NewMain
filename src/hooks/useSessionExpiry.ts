import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const SESSION_WARNING_TIME = 6 * 24 * 60 * 60 * 1000; // 6 days (warn 1 day before expiry)

export const useSessionExpiry = () => {
  const { session, checkSessionExpiry } = useAuth();

  useEffect(() => {
    if (!session) return;

    const checkForWarning = () => {
      const loginTime = localStorage.getItem('admin_login_time') || localStorage.getItem('user_login_time');
      
      if (!loginTime) return;

      const loginTimestamp = parseInt(loginTime);
      const currentTime = Date.now();
      const timeDiff = currentTime - loginTimestamp;

      // Show warning when 6 days have passed (1 day before expiry)
      if (timeDiff > SESSION_WARNING_TIME) {
        const timeLeft = Math.ceil((7 * 24 * 60 * 60 * 1000 - timeDiff) / (60 * 60 * 1000)); // Hours left
        
        if (timeLeft > 0 && timeLeft <= 24) {
          // Only show warning once per session
          const warningShown = localStorage.getItem('session_warning_shown');
          if (!warningShown) {
            import('react-hot-toast').then(({ default: toast }) => {
              toast(`Your session will expire in ${timeLeft} hours. Please save your work.`, {
                duration: 10000,
                icon: '⚠️',
                style: {
                  background: '#FEF3C7',
                  color: '#92400E',
                  border: '1px solid #FBBF24',
                },
              });
            });
            localStorage.setItem('session_warning_shown', 'true');
          }
        }
      }
    };

    // Check immediately and then every hour
    checkForWarning();
    const interval = setInterval(checkForWarning, 60 * 60 * 1000); // Every hour

    return () => clearInterval(interval);
  }, [session]);

  return { checkSessionExpiry };
};