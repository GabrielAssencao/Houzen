import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Package, Truck, Calendar, 
  LogOut, ChevronLeft, ChevronRight, HardHat, Shield, Settings 
} from 'lucide-react';

export default function DashboardLayout({ usuario, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [recolhido, setRecolhido] = React.useState(false);

  // Mapeamento: ID (igual ao do banco) vs Nome (visível)
  const todosModulos = [
    { id: 'dashboard', nome: 'Dashboard', path: '/dashboard', icone: LayoutDashboard },
    { id: 'rh', nome: 'RH', path: '/dashboard/rh', icone: Users },
    { id: 'suprimentos', nome: 'Suprimentos', path: '/dashboard/suprimentos', icone: Package },
    { id: 'frota', nome: 'Frota', path: '/dashboard/frota', icone: Truck },
    { id: 'cronograma', nome: 'Cronograma', path: '/dashboard/cronograma', icone: Calendar },
  ];

  const temPermissao = (idModulo) => {
    if (!usuario) return false;
    
    // Admin não precisa renderizar os módulos operacionais no menu principal dele
    if (usuario.nivel === 'admin') return false; 
    
    // Verifica se o ID do módulo está na lista de permissões da empresa
    const permissoes = Array.isArray(usuario.permissoes) ? usuario.permissoes : [];
    return permissoes.includes(idModulo);
  };

  const handleSair = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="d-flex vh-100 overflow-hidden" style={{ backgroundColor: '#09090B', color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}>
      <div className="d-flex flex-column justify-content-between p-3 border-end" style={{ width: recolhido ? '80px' : '260px', backgroundColor: '#09090B', borderColor: 'rgba(38, 38, 41, 0.6)', transition: 'width 0.3s ease', zIndex: 1020 }}>
        <div>
          <div className="d-flex align-items-center gap-2 mb-4 px-2" style={{ height: '50px' }}>
            <div className="d-flex align-items-center justify-content-center rounded" style={{ backgroundColor: '#F97316', width: '36px', height: '36px' }}>
              <HardHat size={22} color="#000000" strokeWidth={2.5} />
            </div>
            {!recolhido && <span className="fw-bold fs-5 tracking-tight">Houzen</span>}
          </div>

          <nav className="nav flex-column gap-1">
            {usuario?.nivel === 'admin' ? (
              <>
                {/* LINKS EXCLUSIVOS DO ADMIN */}
                <Link to="/dashboard/admin" className="nav-link d-flex align-items-center gap-3 rounded-3 px-3 py-2.5 transition-all text-decoration-none" style={{ backgroundColor: location.pathname === '/dashboard/admin' ? '#F97316' : 'transparent', color: location.pathname === '/dashboard/admin' ? '#000000' : '#F97316', fontWeight: '600' }}>
                  <Shield size={20} /> {!recolhido && <span>Painel Admin</span>}
                </Link>
                <Link to="/dashboard/admin-datamanagement" className="nav-link d-flex align-items-center gap-3 rounded-3 px-3 py-2.5 transition-all text-decoration-none mb-3" style={{ backgroundColor: location.pathname === '/dashboard/admin-datamanagement' ? '#F97316' : 'transparent', color: location.pathname === '/dashboard/admin-datamanagement' ? '#000000' : '#A1A1AA', fontWeight: '600' }}>
                  <Settings size={20} /> {!recolhido && <span>Popular Empresa</span>}
                </Link>
              </>
            ) : (
              <>
                {/* LINKS EXCLUSIVOS DA EMPRESA (Ocultos para o Admin) */}
                {todosModulos.map((item) => {
                  if (!temPermissao(item.id)) return null; 

                  const Ativo = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path} className="nav-link d-flex align-items-center gap-3 rounded-3 px-3 py-2.5 transition-all text-decoration-none" 
                      style={{ backgroundColor: Ativo ? '#F97316' : 'transparent', color: Ativo ? '#000000' : '#A1A1AA', fontWeight: Ativo ? '600' : '500' }}>
                      <item.icone size={20} /> {!recolhido && <span>{item.nome}</span>}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
        </div>

        <div className="d-flex flex-column gap-2">
            <button onClick={() => setRecolhido(!recolhido)} className="btn border-0 d-flex align-items-center gap-3 px-3 py-2 text-secondary w-100" style={{ textAlign: 'left', background: 'none' }}>
                {recolhido ? <ChevronRight size={20} /> : <><ChevronLeft size={20} /> <span>Recolher</span></>}
            </button>
            <button onClick={handleSair} className="btn border-0 d-flex align-items-center gap-3 px-3 py-2 text-danger w-100" style={{ textAlign: 'left', background: 'none' }}>
                <LogOut size={20} /> {!recolhido && <span>Sair</span>}
            </button>
        </div>
      </div>

      <div className="flex-grow-1 overflow-auto p-4 p-md-5">
        <Outlet /> 
      </div>
    </div>
  );
}