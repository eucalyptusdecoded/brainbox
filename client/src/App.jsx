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
  if (!token) return <Navigate to="/" replace />;
  return children;
}

function RootRoute() {
  const { token } = useAuth();
  return token ? <Dashboard /> : <Home />;
}

function decodeUser(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { id: payload.id, email: payload.email };
  } catch {
    return null;
  }
}

// Set the Authorization header synchronously on load so that
// child components' initial requests already include the token.
const savedToken = localStorage.getItem('bb_token');
if (savedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
}

export default function App() {
  const [token, setToken] = useState(savedToken);
  const [user, setUser] = useState(() => savedToken ? decodeUser(savedToken) : null);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const decoded = decodeUser(token);
      if (!decoded) logout();
      else setUser(decoded);
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
          <Route path="/" element={<RootRoute />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<Login />} />
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
