import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BrainEditor from './pages/BrainEditor';
import APIKeys from './pages/APIKeys';
import Integration from './pages/Integration';
import Guide from './pages/Guide';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/home" replace />;
  return children;
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('bb_token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Decode user from JWT payload
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: payload.id, email: payload.email });
      } catch {
        logout();
      }
    }
  }, [token]);

  function login(newToken, userData) {
    localStorage.setItem('bb_token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('bb_token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/brain/:id" element={<ProtectedRoute><BrainEditor /></ProtectedRoute>} />
          <Route path="/keys" element={<ProtectedRoute><APIKeys /></ProtectedRoute>} />
          <Route path="/integration" element={<ProtectedRoute><Integration /></ProtectedRoute>} />
          <Route path="/guide" element={<ProtectedRoute><Guide /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
