import { useCallback, useEffect, useState } from 'react';
import { Check, Clipboard, KeyRound, Mail, MessageCircle, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import ModalDialog from '../../components/ModalDialog';
import { useNotifications } from '../../components/notificationContext';
import api, { getApiError } from '../../services/api';

export default function PasswordResetRequestsPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [temporaryCredential, setTemporaryCredential] = useState(null);
  const [copied, setCopied] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dialog, setDialog] = useState(null);
  const { notify } = useNotifications();

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/auth/admin/password-reset-requests');
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      notify({ type: 'error', title: 'Solicitações não carregadas', message: getApiError(error) });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const resolveRequest = async (event) => {
    event.preventDefault();
    setProcessing(true);
    try {
      const { data } = await api.post(`/api/auth/admin/password-reset-requests/${dialog.request.id}/resolve`, {
        verificationNote: dialog.value.trim()
      });
      setTemporaryCredential(data);
      setCopied(false);
      setRequests((current) => current.filter((item) => item.id !== dialog.request.id));
      setDialog(null);
      notify({ type: 'success', title: 'Senha temporária gerada', message: 'Copie a credencial e envie somente pelo canal confirmado.' });
    } catch (error) {
      notify({ type: 'error', title: 'Senha não gerada', message: getApiError(error) });
    } finally {
      setProcessing(false);
    }
  };

  const rejectRequest = async (event) => {
    event.preventDefault();
    setProcessing(true);
    try {
      await api.put(`/api/auth/admin/password-reset-requests/${dialog.request.id}/reject`, { reason: dialog.value.trim() || null });
      setRequests((current) => current.filter((item) => item.id !== dialog.request.id));
      setDialog(null);
      notify({ type: 'info', title: 'Solicitação rejeitada', message: 'Nenhuma credencial foi alterada.' });
    } catch (error) {
      notify({ type: 'error', title: 'Solicitação não rejeitada', message: getApiError(error) });
    } finally {
      setProcessing(false);
    }
  };

  const copyTemporaryPassword = async () => {
    try {
      await navigator.clipboard.writeText(temporaryCredential.temporaryPassword);
      setCopied(true);
      notify({ type: 'success', title: 'Senha copiada', message: 'Envie a senha pelo contato verificado e não a armazene.' });
    } catch {
      notify({ type: 'error', title: 'Não foi possível copiar', message: 'Selecione a senha e copie manualmente.' });
    }
  };

  return (
    <div className="d-flex flex-column gap-3">
      {temporaryCredential && (
        <section className="houzen-credential-card" role="status">
          <div>
            <span className="houzen-eyebrow"><ShieldCheck size={15} /> Exibição única</span>
            <h2>Senha temporária de {temporaryCredential.user.nome}</h2>
            <p>Expira em 24 horas. O usuário precisará criar uma nova senha antes de acessar os módulos.</p>
            <code>{temporaryCredential.temporaryPassword}</code>
            <small>Enviar para: {temporaryCredential.contact}</small>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button type="button" onClick={copyTemporaryPassword} className="houzen-button-primary">{copied ? <Check size={16} /> : <Clipboard size={16} />} {copied ? 'Copiada' : 'Copiar senha'}</button>
            <button type="button" onClick={() => setTemporaryCredential(null)} className="houzen-button-secondary">Ocultar</button>
          </div>
        </section>
      )}

      <section className="houzen-panel">
        <div className="houzen-panel-toolbar">
          <div><h2>Recuperação de acesso</h2><p>O contato informado não comprova identidade; valide o solicitante por um canal independente.</p></div>
          <button type="button" onClick={loadRequests} disabled={loading} className="houzen-button-secondary"><RefreshCw size={15} /> Atualizar</button>
        </div>

        {loading ? <div className="houzen-loading-state"><span className="spinner-border spinner-border-sm" /> Carregando solicitações...</div> : requests.length === 0 ? <div className="houzen-empty-inline"><KeyRound size={24} /><p>Nenhuma solicitação pendente.</p></div> : (
          <div className="table-responsive">
            <table className="houzen-table">
              <thead><tr><th>Usuário</th><th>Contato não verificado</th><th>Solicitada em</th><th><span className="visually-hidden">Ações</span></th></tr></thead>
              <tbody>{requests.map((request) => <tr key={request.id}>
                <td><strong>{request.nome}</strong><small>{request.email}</small></td>
                <td><span className="d-flex align-items-center gap-2">{request.contact_type === 'whatsapp' ? <MessageCircle size={16} /> : <Mail size={16} />}{request.contact_value}</span></td>
                <td><span>{new Date(request.requested_at).toLocaleString('pt-BR')}</span></td>
                <td className="text-end"><div className="d-inline-flex gap-2"><button type="button" onClick={() => setDialog({ type: 'reject', request, value: '' })} className="houzen-button-secondary"><XCircle size={15} /> Rejeitar</button><button type="button" onClick={() => setDialog({ type: 'resolve', request, value: '' })} className="houzen-button-primary"><KeyRound size={15} /> Verificar e gerar</button></div></td>
              </tr>)}</tbody>
            </table>
          </div>
        )}
      </section>

      <ModalDialog
        open={Boolean(dialog)}
        onClose={() => !processing && setDialog(null)}
        title={dialog?.type === 'resolve' ? 'Confirmar identidade e gerar senha' : 'Rejeitar solicitação'}
        description={dialog ? `${dialog.request.nome} • ${dialog.request.email}` : ''}
        actions={dialog && <><button type="button" onClick={() => setDialog(null)} disabled={processing} className="houzen-button-secondary">Cancelar</button><button type="submit" form="reset-request-form" disabled={processing} className={dialog.type === 'resolve' ? 'houzen-button-primary' : 'houzen-button-danger'}>{processing && <span className="spinner-border spinner-border-sm" />}{dialog.type === 'resolve' ? 'Gerar senha temporária' : 'Rejeitar solicitação'}</button></>}
      >
        {dialog && <form id="reset-request-form" onSubmit={dialog.type === 'resolve' ? resolveRequest : rejectRequest}><label className="houzen-field"><span>{dialog.type === 'resolve' ? 'Como a identidade foi confirmada?' : 'Motivo da rejeição (opcional)'}</span><textarea autoFocus value={dialog.value} onChange={(event) => setDialog({ ...dialog, value: event.target.value })} minLength={dialog.type === 'resolve' ? 10 : undefined} maxLength={500} required={dialog.type === 'resolve'} rows={4} placeholder={dialog.type === 'resolve' ? 'Ex.: Confirmei pessoalmente com o responsável cadastrado...' : 'Ex.: Não foi possível confirmar o solicitante.'} /></label>{dialog.type === 'resolve' && <p className="houzen-security-note"><ShieldCheck size={17} /> Ao continuar, a senha atual e todas as sessões desse usuário serão invalidadas.</p>}</form>}
      </ModalDialog>
    </div>
  );
}
