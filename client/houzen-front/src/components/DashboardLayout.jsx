import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Package, Truck, Calendar, 
  LogOut, ChevronLeft, ChevronRight, HardHat, Shield, Settings, UserRound
} from 'lucide-react';

export default function DashboardLayout({ usuario, onLogout, onUserUpdated }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [recolhido, setRecolhido] = React.useState(false);
  const isAdmin = ['admin', 'administrador', 'superadmin'].includes(usuario?.nivel);

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
    if (isAdmin) return false;
    
    // Verifica se o ID do módulo está na lista de permissões da empresa
    const permissoes = Array.isArray(usuario.permissoes) ? usuario.permissoes : [];
    return permissoes.includes(idModulo);
  };

  const handleSair = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="houzen-shell d-flex vh-100 overflow-hidden" data-theme={usuario?.theme || 'dark'}>
      <aside className="houzen-sidebar d-flex flex-column justify-content-between p-3 border-end" style={{ width: recolhido ? '80px' : '260px' }}>
        <div>
          <div className="d-flex align-items-center gap-2 mb-4 px-2" style={{ height: '50px' }}>
            <div className="d-flex align-items-center justify-content-center rounded" style={{ backgroundColor: '#F97316', width: '36px', height: '36px' }}>
              <HardHat size={22} color="#000000" strokeWidth={2.5} />
            </div>
            {!recolhido && <span className="fw-bold fs-5 tracking-tight">Houzen</span>}
          </div>

          <nav className="nav flex-column gap-1" aria-label="Navegação principal">
            {isAdmin ? (
              <>
                {/* LINKS EXCLUSIVOS DO ADMIN */}
                <Link to="/dashboard/admin" className={`houzen-nav-link ${location.pathname === '/dashboard/admin' ? 'is-active' : ''}`}>
                  <Shield size={20} /> {!recolhido && <span>Painel Admin</span>}
                </Link>
                <Link to="/dashboard/admin-datamanagement" className={`houzen-nav-link ${location.pathname === '/dashboard/admin-datamanagement' ? 'is-active' : ''}`}>
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
                    <Link key={item.path} to={item.path} className={`houzen-nav-link ${Ativo ? 'is-active' : ''}`}>
                      <item.icone size={20} /> {!recolhido && <span>{item.nome}</span>}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
        </div>

        <div className="d-flex flex-column gap-2">
            {!recolhido && <div className="houzen-user-summary"><UserRound size={18} /><div><strong>{usuario?.nome}</strong><small>{usuario?.email}</small></div></div>}
            <Link to="/dashboard/settings" className={`houzen-nav-link ${location.pathname === '/dashboard/settings' ? 'is-active' : ''}`}>
              <Settings size={20} /> {!recolhido && <span>Configurações</span>}
            </Link>
            <button onClick={() => setRecolhido(!recolhido)} className="houzen-sidebar-button">
                {recolhido ? <ChevronRight size={20} /> : <><ChevronLeft size={20} /> <span>Recolher</span></>}
            </button>
            <button onClick={handleSair} className="houzen-sidebar-button is-danger">
                <LogOut size={20} /> {!recolhido && <span>Sair</span>}
            </button>
        </div>
      </aside>

      <main className="houzen-main flex-grow-1 overflow-auto p-3 p-md-5">
        <Outlet context={{ usuario, onLogout: handleSair, onUserUpdated }} />
      </main>
    </div>
  );
}
