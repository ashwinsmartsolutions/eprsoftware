import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const RoutePersistor = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Save current route whenever it changes (except login page)
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Don't save login page or root redirect
    if (currentPath !== '/login' && currentPath !== '/') {
      localStorage.setItem('lastRoute', currentPath);
    }
  }, [location]);

  // Restore route on initial load
  useEffect(() => {
    const savedRoute = localStorage.getItem('lastRoute');
    const currentPath = location.pathname;
    
    // If we're on login page but have a saved route, we'll restore it after login
    // If we're on root but have a saved route, restore it
    if (savedRoute && (currentPath === '/' || currentPath === '/login')) {
      // Only restore if user is already authenticated
      const token = localStorage.getItem('token');
      if (token) {
        // Small delay to ensure auth check completes
        setTimeout(() => {
          navigate(savedRoute, { replace: true });
        }, 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export default RoutePersistor;
