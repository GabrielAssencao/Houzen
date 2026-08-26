import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Shield, UserX, UserCheck, Edit2, X, Save, Key, Trash2, List, PlusCircle, Building } from 'lucide-react';
import PasswordResetRequestsPanel from './PasswordResetRequestsPanel';

const API_URL = import.meta.env.VITE_API_URL || 'https://houzen-back.onrender.com';

function getAuthHeader() {
  const userStorage = localStorage.getItem('@Houzen:user');
  if (!userStorage) return {};
  const user = JSON.parse(userStorage);
  return { headers: { Authorization: `Bearer ${user.token}` } };
}

export default function AdminPanel({ usuario }) {
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('listagem');
  
  // Controle do Modal de Edição
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEdit, setUsuarioEdit] = useState(null);

  // Estado para novo cadastro
  const [novoUser, setNovoUser] = useState({ nome: '', email: '', senha: '', nivel: 'empresa' });
  const isSuperAdmin = usuario?.nivel === 'superadmin';

  // Lista mestre de módulos do sistema
  const modulosDisponiveis = [
    { id: 'dashboard', nome: 'Dashboard & Fluxo de Caixa' },
    { id: 'obras', nome: 'Gestão de Obras' },
    { id: 'rh', nome: 'Recursos Humanos' },
    { id: 'suprimentos', nome: 'Suprimentos & Almoxarifado' },
    { id: 'frota', nome: 'Frota & Equipamentos' },
    { id: 'cronograma', nome: 'Cronograma Físico' }
  ];

  const carregarUsuarios = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/admin/usuarios`, getAuthHeader());
      // Garante que se o banco estiver limpo ou retornar vazio, o estado não quebre
      setUsuarios(Array.isArray(res.data) ? res.data : []);
      setCarregando(false);
    } catch (err) {
      console.error('Erro ao buscar usuários', err);
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregarUsuarios(); }, [carregarUsuarios]);

  const abrirModalEdicao = (user) => {
    let permissoesArray;
    try {
      permissoesArray = typeof user.permissoes === 'string' ? JSON.parse(user.permissoes) : user.permissoes;
    } catch (e) { permissoesArray = []; }

    setUsuarioEdit({ ...user, permissoes: permissoesArray || [] });
    setModalAberto(true);
  };

  const deletarUsuario = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.")) {
      try {
        await axios.delete(`${API_URL}/api/auth/admin/usuarios/${id}`, getAuthHeader());
        carregarUsuarios();
      } catch (err) { alert('Erro ao excluir usuário'); }
    }
  };

  const salvarAcessos = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/api/auth/admin/usuarios/${usuarioEdit.id}`, {
        nivel: usuarioEdit.nivel,
        status: usuarioEdit.status,
        permissoes: usuarioEdit.permissoes
      }, getAuthHeader());
      setModalAberto(false);
      carregarUsuarios();
    } catch (err) { alert('Erro ao atualizar permissões'); }
  };

  const cadastrarEmpresa = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/auth/admin/usuarios`, { 
        ...novoUser, status: 'ativo', permissoes: ["dashboard", "obras"] 
      }, getAuthHeader());
      alert("Empresa cadastrada com sucesso!");
      setNovoUser({ nome: '', email: '', senha: '', nivel: 'empresa' });
      setAbaAtiva('listagem');
      carregarUsuarios();
    } catch (err) { alert('Erro ao cadastrar empresa'); }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold fs-3 mb-1 text-white d-flex align-items-center gap-2">
            <Shield size={28} className="text-warning" /> Painel de Administração
          </h1>
          <p className="text-secondary small">Gerencie as empresas (inquilinos), status de contas e permissões de módulos.</p>
        </div>

        <div className="d-flex gap-2 p-1 rounded-3" style={{ backgroundColor: '#151518' }}>
          <button onClick={() => setAbaAtiva('listagem')} className={`btn btn-sm px-3 py-2 border-0 ${abaAtiva === 'listagem' ? 'text-black fw-bold' : 'text-secondary'}`} style={{ backgroundColor: abaAtiva === 'listagem' ? '#F97316' : 'transparent', borderRadius: '6px' }}><List size={16} className="me-1"/> Listagem</button>
          <button onClick={() => setAbaAtiva('cadastro')} className={`btn btn-sm px-3 py-2 border-0 ${abaAtiva === 'cadastro' ? 'text-black fw-bold' : 'text-secondary'}`} style={{ backgroundColor: abaAtiva === 'cadastro' ? '#F97316' : 'transparent', borderRadius: '6px' }}><PlusCircle size={16} className="me-1"/> Nova Empresa</button>
          {isSuperAdmin && <button onClick={() => setAbaAtiva('recuperacao')} className={`btn btn-sm px-3 py-2 border-0 ${abaAtiva === 'recuperacao' ? 'text-black fw-bold' : 'text-secondary'}`} style={{ backgroundColor: abaAtiva === 'recuperacao' ? '#F97316' : 'transparent', borderRadius: '6px' }}><Key size={16} className="me-1"/> Recuperações</button>}
        </div>
      </div>

      {abaAtiva === 'listagem' ? (
        <div className="card p-4 border-0 rounded-4" style={{ backgroundColor: '#151518' }}>
          {carregando ? <div className="text-center py-5 text-secondary">Carregando base de clientes...</div> : (
            <div className="table-responsive">
              <table className="table table-dark table-hover m-0" style={{ '--bs-table-bg': 'transparent' }}>
                <thead>
                  <tr className="text-secondary small border-bottom" style={{ borderColor: 'rgba(38, 38, 41, 0.6)' }}>
                    <th className="py-3">ID</th>
                    <th className="py-3">Empresa / Usuário</th>
                    <th className="py-3">Status</th>
                    <th className="py-3 text-center">Configurar Acesso</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(user => (
                    <tr key={user.id} className="align-middle border-bottom" style={{ borderColor: 'rgba(38, 38, 41, 0.2)' }}>
                      <td className="text-secondary small">#{user.id}</td>
                      <td>
                        <div className="fw-medium text-white">{user.nome}</div>
                        <div className="d-flex align-items-center gap-2">
                            <span className="text-secondary" style={{ fontSize: '12px' }}>{user.email}</span>
                            {/* TAG DE TIPO */}
                            <span className="badge text-uppercase" style={{ backgroundColor: 'rgba(255,255,255,0.05)', fontSize: '9px' }}>
                                {user.nivel === 'empresa' ? 'Empresa' : 'Usuário'}
                            </span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {user.status === 'ativo' ? (
                            <span className="badge px-2 py-1 bg-success bg-opacity-10 text-success small fw-normal"><UserCheck size={12} className="me-1"/> Ativa</span>
                          ) : (
                            <span className="badge px-2 py-1 bg-danger bg-opacity-10 text-danger small fw-normal"><UserX size={12} className="me-1"/> Bloqueada</span>
                          )}
                          {['admin', 'superadmin'].includes(user.nivel) && (
                             <span className="badge px-2 py-1 bg-warning text-black small fw-bold">{user.nivel === 'superadmin' ? 'SUPERADMIN' : 'ADMINISTRADOR'}</span>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        {/* PROTEÇÃO: Botões não aparecem para o Admin Houzen */}
                        {(isSuperAdmin || !['admin', 'superadmin'].includes(user.nivel)) && (
                          <>
                            <button onClick={() => abrirModalEdicao(user)} className="btn p-1 border-0 bg-transparent text-secondary shadow-none" title="Editar Permissões"><Key size={18} /></button>
                            <button onClick={() => deletarUsuario(user.id)} className="btn p-1 border-0 bg-transparent text-danger shadow-none" title="Excluir"><Trash2 size={18} /></button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : abaAtiva === 'cadastro' ? (
        /* ABA DE CADASTRO */
        <div className="card p-4 border-0 rounded-4" style={{ backgroundColor: '#151518', maxWidth: '500px' }}>
          <h5 className="text-white mb-4"><Building className="text-warning me-2" size={20}/> Dados da Nova Empresa</h5>
          <form onSubmit={cadastrarEmpresa} className="d-flex flex-column gap-3">
            
            <div>
              <label className="form-label small text-secondary mb-1">Nome da Empresa</label>
              <input 
                className="form-control text-white border-0 py-2 shadow-none" 
                style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} 
                placeholder="Ex: Construtora Atlas" 
                onChange={e => setNovoUser({...novoUser, nome: e.target.value})} 
                required
              />
            </div>

            <div>
              <label className="form-label small text-secondary mb-1">E-mail de Acesso</label>
              <input 
                className="form-control text-white border-0 py-2 shadow-none" 
                style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} 
                type="email" 
                placeholder="contato@empresa.com" 
                onChange={e => setNovoUser({...novoUser, email: e.target.value})} 
                required
              />
            </div>

            <div>
              <label className="form-label small text-secondary mb-1">Senha Inicial</label>
              <input 
                className="form-control text-white border-0 py-2 shadow-none" 
                style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} 
                type="password" 
                placeholder="Defina uma senha segura" 
                onChange={e => setNovoUser({...novoUser, senha: e.target.value})} 
                required
              />
            </div>

            <button type="submit" className="btn mt-3 fw-bold py-2 text-black" style={{ backgroundColor: '#F97316', borderRadius: '8px' }}>
              Salvar Empresa no Sistema
            </button>
          </form>
        </div>
      ) : (
        <PasswordResetRequestsPanel />
      )}

      {/* MODAL DE EDIÇÃO */}
      {modalAberto && usuarioEdit && (
        <div className="d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 2000 }}>
          <div className="card p-4 border w-100 mx-3" style={{ backgroundColor: '#151518', maxWidth: '450px', borderRadius: '16px', color: '#FFFFFF', borderColor: 'rgba(38, 38, 41, 0.6)' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0 d-flex align-items-center gap-2"><Edit2 size={18}/> Editar Acessos</h5>
              <button onClick={() => setModalAberto(false)} className="btn p-0 text-secondary border-0 bg-transparent shadow-none"><X size={20} /></button>
            </div>
            
            <form onSubmit={salvarAcessos} className="d-flex flex-column gap-3">
              <div className="p-3 rounded-3 mb-2" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }}>
                <p className="m-0 fw-semibold text-white">{usuarioEdit.nome}</p>
                <p className="m-0 small text-secondary">{usuarioEdit.email}</p>
              </div>

              <div>
                <label className="form-label small text-secondary mb-1">Status da Conta</label>
                <select className="form-select text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={usuarioEdit.status} onChange={e => setUsuarioEdit({...usuarioEdit, status: e.target.value})}>
                  <option value="ativo">Ativo (Permitir Login)</option>
                  <option value="bloqueado">Bloqueado (Inadimplente / Suspenso)</option>
                </select>
              </div>

              {isSuperAdmin && (
                <div>
                  <label className="form-label small text-secondary mb-1">Perfil de acesso</label>
                  <select className="form-select text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={usuarioEdit.nivel} onChange={e => setUsuarioEdit({...usuarioEdit, nivel: e.target.value})}>
                    <option value="comum">Usuário comum</option>
                    <option value="empresa">Empresa</option>
                    <option value="operador">Operador</option>
                    <option value="admin">Administrador</option>
                    <option value="superadmin">SuperAdmin</option>
                  </select>
                </div>
              )}

              <div>
                <label className="form-label small text-secondary mb-2 mt-2">Módulos Contratados (Liberados)</label>
                <div className="d-flex flex-column gap-2 p-3 rounded-3" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }}>
                  {modulosDisponiveis.map(mod => (
                    <label key={mod.id} className="d-flex align-items-center gap-2 cursor-pointer small text-white">
                      <input 
                        type="checkbox" 
                        className="form-check-input mt-0" 
                        style={{ borderColor: '#F97316', backgroundColor: usuarioEdit.permissoes.includes(mod.id) ? '#F97316' : 'transparent' }}
                        checked={usuarioEdit.permissoes.includes(mod.id)} 
                        onChange={() => {
                          const novas = usuarioEdit.permissoes.includes(mod.id) ? usuarioEdit.permissoes.filter(m => m !== mod.id) : [...usuarioEdit.permissoes, mod.id];
                          setUsuarioEdit({...usuarioEdit, permissoes: novas});
                        }}
                      />
                      {mod.nome}
                    </label>
                  ))}
                </div>
              </div>

              <div className="d-flex gap-2 justify-content-end mt-3">
                <button type="button" onClick={() => setModalAberto(false)} className="btn btn-sm px-3 py-2 text-white border-0" style={{ backgroundColor: 'rgba(38, 38, 41, 0.6)' }}>Cancelar</button>
                <button type="submit" className="btn btn-sm px-3 py-2 text-black border-0 fw-semibold d-flex align-items-center gap-1" style={{ backgroundColor: '#F97316' }}><Save size={16}/> Salvar Configurações</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
