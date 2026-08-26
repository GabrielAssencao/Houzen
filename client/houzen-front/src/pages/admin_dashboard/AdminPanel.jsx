import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2, Check, CircleDollarSign, KeyRound, List, LockKeyhole,
  Plus, Save, Search, Shield, Trash2, UserCheck, UsersRound
} from 'lucide-react';
import ModalDialog from '../../components/ModalDialog';
import { useNotifications } from '../../components/notificationContext';
import { MODULES } from '../../config/modules';
import api, { getApiError } from '../../services/api';
import PasswordResetRequestsPanel from './PasswordResetRequestsPanel';

const initialCompany = { nome: '', email: '', senha: '', nivel: 'empresa' };

function normalizePermissions(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function AdminPanel({ usuario }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('accounts');
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [newCompany, setNewCompany] = useState(initialCompany);
  const { notify } = useNotifications();
  const isSuperAdmin = usuario?.nivel === 'superadmin';

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/auth/admin/usuarios');
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      notify({ type: 'error', title: 'Usuários não carregados', message: getApiError(error) });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const metrics = useMemo(() => ({
    total: users.filter((item) => !['admin', 'superadmin'].includes(item.nivel)).length,
    active: users.filter((item) => item.status === 'ativo' && !['admin', 'superadmin'].includes(item.nivel)).length,
    suspended: users.filter((item) => item.status !== 'ativo').length
  }), [users]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((item) => `${item.nome} ${item.email} ${item.nivel}`.toLowerCase().includes(term));
  }, [search, users]);

  const openAccessEditor = (target) => {
    setEditingUser({
      ...target,
      permissoes: normalizePermissions(target.permissoes),
      statusReason: target.accountStatusReason || ''
    });
  };

  const togglePermission = (moduleId) => {
    setEditingUser((current) => ({
      ...current,
      permissoes: current.permissoes.includes(moduleId)
        ? current.permissoes.filter((permission) => permission !== moduleId)
        : [...current.permissoes, moduleId]
    }));
  };

  const saveAccess = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nivel: editingUser.nivel,
        status: editingUser.status,
        statusReason: editingUser.status === 'ativo' ? null : editingUser.statusReason,
        permissoes: editingUser.permissoes
      };
      const { data } = await api.put(`/api/auth/admin/usuarios/${editingUser.id}`, payload);
      setUsers((current) => current.map((item) => item.id === data.user.id ? data.user : item));
      setEditingUser(null);
      notify({
        type: 'success',
        title: 'Acesso atualizado',
        message: data.user.status === 'ativo'
          ? 'Os módulos foram aplicados. O usuário deverá entrar novamente.'
          : 'A conta foi suspensa e as sessões anteriores foram encerradas.'
      });
    } catch (error) {
      notify({ type: 'error', title: 'Acesso não atualizado', message: getApiError(error) });
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async () => {
    if (!deleteCandidate) return;
    setSaving(true);
    try {
      await api.delete(`/api/auth/admin/usuarios/${deleteCandidate.id}`);
      setUsers((current) => current.filter((item) => item.id !== deleteCandidate.id));
      notify({ type: 'success', title: 'Conta removida', message: `${deleteCandidate.nome} foi removido do sistema.` });
      setDeleteCandidate(null);
    } catch (error) {
      notify({ type: 'error', title: 'Conta não removida', message: getApiError(error) });
    } finally {
      setSaving(false);
    }
  };

  const createCompany = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/auth/admin/usuarios', {
        ...newCompany,
        status: 'ativo',
        permissoes: ['dashboard', 'obras']
      });
      setNewCompany(initialCompany);
      setActiveTab('accounts');
      await loadUsers();
      notify({ type: 'success', title: 'Empresa cadastrada', message: 'A conta foi criada com Dashboard e Gestão de Obras liberados.' });
    } catch (error) {
      notify({ type: 'error', title: 'Empresa não cadastrada', message: getApiError(error) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="houzen-page admin-access-page">
      <header className="houzen-page-header admin-access-header">
        <div>
          <span className="houzen-eyebrow"><Shield size={15} /> Administração da plataforma</span>
          <h1>Empresas e acessos</h1>
          <p>Controle contratos, módulos liberados e suspensões sem alterar dados operacionais.</p>
        </div>
        <div className="houzen-segmented-control" aria-label="Seções administrativas">
          <button type="button" className={activeTab === 'accounts' ? 'is-active' : ''} onClick={() => setActiveTab('accounts')}><List size={16} /> Contas</button>
          <button type="button" className={activeTab === 'new' ? 'is-active' : ''} onClick={() => setActiveTab('new')}><Plus size={16} /> Nova empresa</button>
          {isSuperAdmin && <button type="button" className={activeTab === 'recovery' ? 'is-active' : ''} onClick={() => setActiveTab('recovery')}><KeyRound size={16} /> Recuperações</button>}
        </div>
      </header>

      {activeTab === 'accounts' && (
        <>
          <section className="houzen-metrics-grid" aria-label="Resumo de contas">
            <article className="houzen-metric"><span><Building2 size={19} /></span><div><strong>{metrics.total}</strong><small>Empresas e usuários</small></div></article>
            <article className="houzen-metric"><span className="is-success"><UserCheck size={19} /></span><div><strong>{metrics.active}</strong><small>Contas ativas</small></div></article>
            <article className="houzen-metric"><span className="is-danger"><LockKeyhole size={19} /></span><div><strong>{metrics.suspended}</strong><small>Contas suspensas</small></div></article>
          </section>

          <section className="houzen-panel">
            <div className="houzen-panel-toolbar">
              <div><h2>Base de clientes</h2><p>Alterações de acesso encerram as sessões anteriores do usuário.</p></div>
              <label className="houzen-search"><Search size={17} /><span className="visually-hidden">Buscar conta</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nome ou e-mail" /></label>
            </div>

            {loading ? (
              <div className="houzen-loading-state"><span className="spinner-border spinner-border-sm" /> Carregando contas...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="houzen-empty-inline"><UsersRound size={24} /><p>Nenhuma conta encontrada para esta busca.</p></div>
            ) : (
              <div className="table-responsive">
                <table className="houzen-table">
                  <thead><tr><th>Conta</th><th>Plano de acesso</th><th>Status</th><th><span className="visually-hidden">Ações</span></th></tr></thead>
                  <tbody>
                    {filteredUsers.map((target) => {
                      const protectedAccount = target.id === usuario.id || target.nivel === 'superadmin';
                      return (
                        <tr key={target.id}>
                          <td><strong>{target.nome}</strong><small>{target.email}</small></td>
                          <td><span className="houzen-role-badge">{target.nivel}</span><small>{normalizePermissions(target.permissoes).length} módulos</small></td>
                          <td>
                            <span className={`houzen-status ${target.status === 'ativo' ? 'is-active' : 'is-suspended'}`}><span />{target.status === 'ativo' ? 'Ativa' : 'Suspensa'}</span>
                            {target.status !== 'ativo' && target.accountStatusReason && <small className="houzen-status-reason">{target.accountStatusReason}</small>}
                          </td>
                          <td className="text-end">
                            {isSuperAdmin && !protectedAccount ? (
                              <div className="d-inline-flex gap-1">
                                <button type="button" onClick={() => openAccessEditor(target)} className="houzen-table-action"><KeyRound size={16} /> Gerenciar</button>
                                <button type="button" onClick={() => setDeleteCandidate(target)} className="houzen-icon-button is-danger" aria-label={`Excluir ${target.nome}`}><Trash2 size={17} /></button>
                              </div>
                            ) : <span className="houzen-protected-label">Protegida</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {activeTab === 'new' && (
        <section className="houzen-panel houzen-form-panel">
          <div className="houzen-section-heading"><div><h2>Cadastrar nova empresa</h2><p>O acesso inicial inclui Dashboard e Gestão de Obras. Você pode ajustar o plano depois.</p></div></div>
          <form onSubmit={createCompany} className="houzen-form-grid">
            <label className="houzen-field"><span>Nome da empresa</span><input value={newCompany.nome} onChange={(event) => setNewCompany({ ...newCompany, nome: event.target.value })} minLength={2} maxLength={100} required placeholder="Construtora Atlas" /></label>
            <label className="houzen-field"><span>E-mail de acesso</span><input type="email" value={newCompany.email} onChange={(event) => setNewCompany({ ...newCompany, email: event.target.value })} required placeholder="contato@empresa.com" /></label>
            <label className="houzen-field houzen-field--full"><span>Senha inicial</span><input type="password" value={newCompany.senha} onChange={(event) => setNewCompany({ ...newCompany, senha: event.target.value })} minLength={8} maxLength={72} autoComplete="new-password" required placeholder="Mínimo de 8 caracteres" /></label>
            <div className="houzen-form-actions"><button type="submit" disabled={saving} className="houzen-button-primary">{saving ? <span className="spinner-border spinner-border-sm" /> : <Plus size={17} />} Criar empresa</button></div>
          </form>
        </section>
      )}

      {activeTab === 'recovery' && isSuperAdmin && <PasswordResetRequestsPanel />}

      <ModalDialog
        open={Boolean(editingUser)}
        onClose={() => !saving && setEditingUser(null)}
        title="Plano e acesso da conta"
        description={editingUser ? `${editingUser.nome} • ${editingUser.email}` : ''}
        size="lg"
        actions={editingUser && <><button type="button" onClick={() => setEditingUser(null)} disabled={saving} className="houzen-button-secondary">Cancelar</button><button type="submit" form="access-form" disabled={saving} className="houzen-button-primary">{saving ? <span className="spinner-border spinner-border-sm" /> : <Save size={17} />} Salvar alterações</button></>}
      >
        {editingUser && (
          <form id="access-form" onSubmit={saveAccess}>
            <div className="houzen-access-status-grid">
              <button type="button" className={editingUser.status === 'ativo' ? 'is-selected is-active' : ''} onClick={() => setEditingUser({ ...editingUser, status: 'ativo', statusReason: '' })}><UserCheck size={20} /><span><strong>Conta ativa</strong><small>Permite autenticação e uso dos módulos contratados.</small></span>{editingUser.status === 'ativo' && <Check size={17} />}</button>
              <button type="button" className={editingUser.status !== 'ativo' ? 'is-selected is-suspended' : ''} onClick={() => setEditingUser({ ...editingUser, status: 'suspenso' })}><CircleDollarSign size={20} /><span><strong>Suspender acesso</strong><small>Use para inadimplência, cancelamento ou bloqueio administrativo.</small></span>{editingUser.status !== 'ativo' && <Check size={17} />}</button>
            </div>

            {editingUser.status !== 'ativo' && <label className="houzen-field mt-3"><span>Motivo exibido ao usuário</span><textarea value={editingUser.statusReason} onChange={(event) => setEditingUser({ ...editingUser, statusReason: event.target.value })} minLength={5} maxLength={255} required rows={3} placeholder="Ex.: Acesso suspenso por pendência financeira. Entre em contato com o suporte." /></label>}

            <div className="houzen-field mt-4"><span>Perfil da conta</span><select value={editingUser.nivel} onChange={(event) => setEditingUser({ ...editingUser, nivel: event.target.value })}><option value="comum">Usuário comum</option><option value="empresa">Empresa</option><option value="operador">Operador</option><option value="admin">Administrador</option></select></div>

            <div className="houzen-section-heading mt-4"><div><h3>Módulos contratados</h3><p>O backend bloqueará chamadas diretas para módulos não selecionados.</p></div><span className="houzen-selection-count">{editingUser.permissoes.length} selecionados</span></div>
            <div className="houzen-module-grid">
              {MODULES.map((module) => {
                const selected = editingUser.permissoes.includes(module.id);
                return <button key={module.id} type="button" aria-pressed={selected} onClick={() => togglePermission(module.id)} className={selected ? 'is-selected' : ''}><span className="houzen-module-check">{selected && <Check size={15} />}</span><span><strong>{module.name}</strong><small>{module.description}</small></span></button>;
              })}
            </div>
          </form>
        )}
      </ModalDialog>

      <ModalDialog
        open={Boolean(deleteCandidate)}
        onClose={() => !saving && setDeleteCandidate(null)}
        title="Excluir conta permanentemente?"
        description="Esta operação remove também os dados vinculados à conta e não pode ser desfeita."
        actions={<><button type="button" onClick={() => setDeleteCandidate(null)} disabled={saving} className="houzen-button-secondary">Cancelar</button><button type="button" onClick={deleteUser} disabled={saving} className="houzen-button-danger">{saving ? <span className="spinner-border spinner-border-sm" /> : <Trash2 size={17} />} Excluir conta</button></>}
      >
        {deleteCandidate && <div className="houzen-danger-summary"><strong>{deleteCandidate.nome}</strong><span>{deleteCandidate.email}</span></div>}
      </ModalDialog>
    </div>
  );
}
