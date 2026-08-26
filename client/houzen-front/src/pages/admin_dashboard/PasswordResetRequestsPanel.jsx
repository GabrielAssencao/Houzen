import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Check, Clipboard, KeyRound, Mail, MessageCircle, RefreshCw, XCircle } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

function getAuthHeader() {
  const stored = localStorage.getItem('@Houzen:user');
  if (!stored) return {};
  const user = JSON.parse(stored);
  return { headers: { Authorization: `Bearer ${user.token}` } };
}

export default function PasswordResetRequestsPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [temporaryCredential, setTemporaryCredential] = useState(null);
  const [copied, setCopied] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`${API_URL}/api/auth/admin/password-reset-requests`, getAuthHeader());
      setRequests(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Não foi possível carregar as solicitações.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const generateTemporaryPassword = async (request) => {
    const verificationNote = window.prompt(
      `O contato informado não comprova a identidade de ${request.nome}. Descreva como você confirmou o solicitante por um canal independente:`,
      ''
    );
    if (verificationNote === null) return;
    if (verificationNote.trim().length < 10) {
      setError('Registre como a identidade foi confirmada antes de gerar a senha.');
      return;
    }
    if (!window.confirm(`Gerar a senha temporária agora? A senha atual de ${request.nome} será invalidada.`)) return;
    setProcessingId(request.id);
    setError('');
    try {
      const { data } = await axios.post(
        `${API_URL}/api/auth/admin/password-reset-requests/${request.id}/resolve`,
        { verificationNote: verificationNote.trim() },
        getAuthHeader()
      );
      setTemporaryCredential(data);
      setCopied(false);
      setRequests((current) => current.filter((item) => item.id !== request.id));
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Não foi possível gerar a senha temporária.');
    } finally {
      setProcessingId(null);
    }
  };

  const rejectRequest = async (request) => {
    const reason = window.prompt('Motivo da rejeição (opcional):', '') ?? null;
    if (reason === null) return;
    setProcessingId(request.id);
    setError('');
    try {
      await axios.put(
        `${API_URL}/api/auth/admin/password-reset-requests/${request.id}/reject`,
        { reason },
        getAuthHeader()
      );
      setRequests((current) => current.filter((item) => item.id !== request.id));
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Não foi possível rejeitar a solicitação.');
    } finally {
      setProcessingId(null);
    }
  };

  const copyTemporaryPassword = async () => {
    await navigator.clipboard.writeText(temporaryCredential.temporaryPassword);
    setCopied(true);
  };

  return (
    <div className="d-flex flex-column gap-3">
      {temporaryCredential && (
        <div className="card border p-4" style={{ backgroundColor: '#172554', borderColor: '#1D4ED8', color: '#DBEAFE' }} role="status">
          <div className="d-flex justify-content-between gap-3 align-items-start">
            <div>
              <h2 className="h6 fw-bold text-white mb-2">Senha temporária gerada para {temporaryCredential.user.nome}</h2>
              <p className="small mb-3">Copie agora e envie pelo contato solicitado. Esta senha expira em 24 horas e não será exibida novamente após atualizar a página.</p>
              <code className="d-inline-block px-3 py-2 rounded text-white fs-5" style={{ backgroundColor: '#0F172A', userSelect: 'all' }}>{temporaryCredential.temporaryPassword}</code>
              <p className="small mt-3 mb-0">Contato: {temporaryCredential.contact}</p>
            </div>
            <button type="button" onClick={() => setTemporaryCredential(null)} className="btn btn-sm text-white border-0" aria-label="Ocultar senha temporária">×</button>
          </div>
          <button type="button" onClick={copyTemporaryPassword} className="btn btn-sm align-self-start mt-3 d-flex align-items-center gap-2" style={{ backgroundColor: '#F97316', color: '#000000' }}>
            {copied ? <Check size={16} /> : <Clipboard size={16} />} {copied ? 'Copiada' : 'Copiar senha'}
          </button>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h2 className="h5 text-white mb-1 d-flex align-items-center gap-2"><KeyRound size={20} className="text-warning" /> Recuperação de acesso</h2>
          <p className="text-secondary small mb-0">Somente o SuperAdmin pode gerar credenciais após verificar a identidade por um canal independente.</p>
        </div>
        <button type="button" onClick={loadRequests} disabled={loading} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2"><RefreshCw size={15} /> Atualizar</button>
      </div>

      {error && <div className="alert alert-danger border-0 small mb-0">{error}</div>}

      <div className="card p-4 border-0 rounded-4" style={{ backgroundColor: '#151518' }}>
        {loading ? (
          <p className="text-secondary text-center my-4">Carregando solicitações...</p>
        ) : requests.length === 0 ? (
          <p className="text-secondary text-center my-4">Nenhuma solicitação pendente.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle mb-0" style={{ '--bs-table-bg': 'transparent' }}>
              <thead><tr><th>Usuário</th><th>Contato informado (não verificado)</th><th>Solicitado em</th><th className="text-end">Ações</th></tr></thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td><div className="text-white fw-semibold">{request.nome}</div><div className="text-secondary small">{request.email}</div></td>
                    <td>
                      <div className="d-flex align-items-center gap-2 text-white">
                        {request.contact_type === 'whatsapp' ? <MessageCircle size={16} className="text-success" /> : <Mail size={16} className="text-info" />}
                        <span>{request.contact_value}</span>
                      </div>
                    </td>
                    <td className="text-secondary small">{new Date(request.requested_at).toLocaleString('pt-BR')}</td>
                    <td>
                      <div className="d-flex justify-content-end gap-2">
                        <button type="button" onClick={() => rejectRequest(request)} disabled={processingId === request.id} className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"><XCircle size={15} /> Rejeitar</button>
                        <button type="button" onClick={() => generateTemporaryPassword(request)} disabled={processingId === request.id} className="btn btn-sm d-flex align-items-center gap-1" style={{ backgroundColor: '#F97316', color: '#000000' }}><KeyRound size={15} /> Gerar senha</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
