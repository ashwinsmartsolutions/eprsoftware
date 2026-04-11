import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Package, Eye, EyeOff, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { login, error, loading, clearError, dispatch } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) clearError();
  };

  const validateForm = () => {
    const { email, password } = formData;
    
    if (!email.trim()) {
      return 'Email is required';
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      return 'Email is invalid';
    }
    
    if (!password.trim()) {
      return 'Password is required';
    }
    
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: validationError,
      });
      return;
    }
    
    console.log('Attempting login with:', formData);
    
    try {
      const result = await login(formData);
      console.log('Login result:', result);
      
      if (result.success) {
        // Get user from the login response, not localStorage
        const response = await authAPI.getMe();
        const user = response.data.user;
        console.log('User from API after login:', user);
        
        if (!user) {
          console.error('User not found after login');
          dispatch({
            type: 'LOGIN_FAILURE',
            payload: 'Login failed: User data not retrieved',
          });
          return;
        }
        
        if (!user.role) {
          console.error('User role not found:', user);
          dispatch({
            type: 'LOGIN_FAILURE',
            payload: 'Login failed: User role not found',
          });
          return;
        }
        
        if (user.role === 'owner') {
          console.log('Navigating to /owner/dashboard');
          navigate('/owner/dashboard', { replace: true });
        } else if (user.role === 'franchise') {
          console.log('Navigating to /franchise/dashboard');
          navigate('/franchise/dashboard', { replace: true });
        } else if (user.role === 'super_admin') {
          console.log('Navigating to /admin/dashboard');
          navigate('/admin/dashboard', { replace: true });
        } else {
          console.error('Unknown user role:', user.role);
          dispatch({
            type: 'LOGIN_FAILURE',
            payload: `Unknown role: ${user.role}`,
          });
        }
      } else {
        console.log('Login failed:', result.error);
      }
    } catch (err) {
      console.error('Login exception:', err);
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: err.message || 'Login failed',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Animated Background Elements - Hidden on mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-secondary-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-accent-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-md w-full mx-4 sm:mx-6 relative z-10">
        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 animate-slide-up border border-white/20">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl sm:rounded-2xl blur-lg opacity-50 animate-pulse-slow" />
              <div className="relative bg-gradient-to-br from-primary-600 to-primary-700 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg shadow-primary-500/30">
                <Package className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                EPR System
              </h1>
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-2 text-center max-w-xs">
              Extended Producer Responsibility Platform for Sustainable Future
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 animate-slide-down">
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg flex items-center shadow-sm">
                <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 text-red-500" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className={`block text-sm font-medium transition-colors duration-200 ${
                  focusedField === 'email' ? 'text-primary-600' : 'text-gray-700'
                }`}
              >
                Email Address
              </label>
              <div className="relative group">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 focus:bg-white transition-all duration-300 placeholder:text-gray-400"
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
                <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-300 rounded-full ${
                  focusedField === 'email' ? 'w-full' : 'w-0'
                }`} />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label 
                htmlFor="password" 
                className={`block text-sm font-medium transition-colors duration-200 ${
                  focusedField === 'password' ? 'text-primary-600' : 'text-gray-700'
                }`}
              >
                Password
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 focus:bg-white transition-all duration-300 pr-12 placeholder:text-gray-400"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  minLength="6"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-600 transition-colors duration-200 p-1"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-300 rounded-full ${
                  focusedField === 'password' ? 'w-full' : 'w-0'
                }`} />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full group relative overflow-hidden bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold py-3.5 sm:py-4 rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none hover:-translate-y-0.5"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    <span className="text-sm sm:text-base">Signing in...</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm sm:text-base">Sign In</span>
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-primary-800 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-center text-gray-400">
              Secure, sustainable, and efficient waste management platform
            </p>
          </div>
        </div>

        {/* Version Badge */}
        <div className="absolute -bottom-8 sm:-bottom-12 left-1/2 transform -translate-x-1/2">
          <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white/60 text-xs">
            v1.0.0
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
