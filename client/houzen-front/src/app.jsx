import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios'; 

import LandingPage from './pages/LandingPage';
import Login from './pages/login';
import ResetPassword from './pages/ResetPassword';

// Layout e Sub-páginas do Dashboard
import DashboardLayout from './components/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import HRModule from './pages/dashboard/HRModule';
import SuppliesModule from './pages/dashboard/SuppliesModule';
import FleetModule from './pages/dashboard/FleetModule';
import TimelineModule from './pages/dashboard/TimelineModule';
import AdminPanel from './pages/admin_dashboard/AdminPanel';
import EmpresasDataManagement from './pages/admin_dashboard/EmpresasDataManagement'; 

const RotaProtegida = ({ usuario, children }) => {
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Verifica se é admin
  const isUserAdmin = () => {
    return usuario?.nivel === 'admin';
  };

  useEffect(() => {
    const verificarSessao = async () => {
      const usuarioLogado = localStorage.getItem('@Houzen:user');
      if (usuarioLogado) {
        try {
          const user = JSON.parse(usuarioLogado);
          if (!user.token) throw new Error('SessÃ£o sem token.');
          axios.defaults.headers.common.Authorization = `Bearer ${user.token}`;
          const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
          const { data } = await axios.get(`${apiUrl}/api/auth/session`);
          const refreshedUser = { ...data, token: user.token };
          localStorage.setItem('@Houzen:user', JSON.stringify(refreshedUser));
          setUsuario(refreshedUser);
        } catch {
          localStorage.removeItem('@Houzen:user');
          delete axios.defaults.headers.common.Authorization;
          setUsuario(null);
        }
      } else {
        setUsuario(null);
        delete axios.defaults.headers.common.Authorization;
      }
      setCarregando(false);
    };

    verificarSessao();

    const escutarStorage = () => verificarSessao();
    window.addEventListener('storage', escutarStorage);
    return () => window.removeEventListener('storage', escutarStorage);
  }, []);

  const handleLoginSucesso = (dadosUsuario) => {
    setUsuario(dadosUsuario);
    axios.defaults.headers.common.Authorization = `Bearer ${dadosUsuario.token}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('@Houzen:user');
    setUsuario(null);
    delete axios.defaults.headers.common.Authorization;
  };

  if (carregando) {
    return (
      <div className="fixed inset-0 bg-[#09090B] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-zinc-700 border-t-[#F97316] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage usuario={usuario} />} />

        {/* ===== A CORREÇÃO ESTÁ AQUI ===== */}
        {/* Agora, se o usuário já estiver logado, o App.jsx manda ele pro lugar certo */}
        <Route 
          path="/login" 
          element={
            usuario 
              ? <Navigate to={isUserAdmin() ? "/dashboard/admin" : "/dashboard"} replace /> 
              : <Login onLoginSucesso={handleLoginSucesso} />
          } 
        />

        <Route path="/reset-password" element={<ResetPassword />} />

        <Route 
          element={
            <RotaProtegida usuario={usuario}>
              <DashboardLayout usuario={usuario} onLogout={handleLogout} />
            </RotaProtegida>
          }
        >
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/dashboard/rh" element={<HRModule />} />
          <Route path="/dashboard/suprimentos" element={<SuppliesModule />} />
          <Route path="/dashboard/frota" element={<FleetModule />} />
          <Route path="/dashboard/cronograma" element={<TimelineModule />} />
          
          <Route 
            path="/dashboard/admin" 
            element={isUserAdmin() ? <AdminPanel /> : <Navigate to="/dashboard" replace />} 
          />
          <Route 
            path="/dashboard/admin-datamanagement" 
            element={isUserAdmin() ? <EmpresasDataManagement /> : <Navigate to="/dashboard" replace />} 
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
