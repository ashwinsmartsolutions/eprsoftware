import React from 'react';
import { useAuth } from '../context/AuthContext';

const LoginStatus = () => {
  const { isAuthenticated, user, token, loading, error } = useAuth();

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span>Loading authentication status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-lg mb-4 text-sm">
      <h4 className="font-semibold mb-2">Authentication Status:</h4>
      <div className="space-y-1">
        <div><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</div>
        {error && <div><strong>Error:</strong> <span className="text-red-600">{error}</span></div>}
        {user && (
          <>
            <div><strong>User ID:</strong> {user.id}</div>
            <div><strong>Username:</strong> {user.username}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Role:</strong> {user.role}</div>
            {user.franchiseId && <div><strong>Franchise ID:</strong> {user.franchiseId}</div>}
          </>
        )}
        {token && (
          <div>
            <strong>Token:</strong> 
            <span className="text-xs ml-1 font-mono">
              {token.substring(0, 20)}...{token.substring(token.length - 10)}
            </span>
          </div>
        )}
      </div>
      
      {/* Debug buttons */}
      <div className="mt-3 space-x-2">
        <button
          onClick={() => console.log('Auth context:', { isAuthenticated, user, token, error })}
          className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
        >
          Log to Console
        </button>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          className="text-xs bg-red-200 hover:bg-red-300 px-2 py-1 rounded text-red-700"
        >
          Clear Storage
        </button>
      </div>
    </div>
  );
};

export default LoginStatus;
