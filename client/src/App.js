import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RoutePersistor from './components/RoutePersistor';
import Login from './pages/Login';
import OwnerPanel from './pages/OwnerPanel';
import FranchisePanel from './pages/FranchisePanel';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <RoutePersistor />
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/owner/*" 
              element={
                <ProtectedRoute requiredRole="owner">
                  <OwnerPanel />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/franchise/*" 
              element={
                <ProtectedRoute requiredRole="franchise">
                  <FranchisePanel />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
