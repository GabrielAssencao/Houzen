import { useState } from 'react';
import { KeyRound, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export default function ChangeTemporaryPassword({ usuario, onPasswordChanged }) {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErro('');
    if (novaSenha !== confirmacao) {
      setErro('As senhas não coincidem.');
      return;
    }

    setSalvando(true);
    try {
      const { data } = await axios.put(`${API_URL}/api/auth/change-temporary-password`, { novaSenha });
      localStorage.setItem('@Houzen:user', JSON.stringify(data));
      axios.defaults.headers.common.Authorization = `Bearer ${data.token}`;
      onPasswordChanged(data);
      const isAdmin = ['admin', 'administrador', 'superadmin'].includes(data.nivel);
      navigate(isAdmin ? '/dashboard/admin' : '/dashboard', { replace: true });
    } catch (error) {
      setErro(error.response?.data?.error || 'Não foi possível atualizar a senha.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <main className="min-vh-100 d-flex align-items-center justify-content-center p-3" style={{ backgroundColor: '#09090B', color: '#FFFFFF' }}>
      <section className="card border p-4 p-md-5 w-100" style={{ maxWidth: '460px', backgroundColor: '#151518', borderColor: '#262629', borderRadius: '16px' }}>
        <div className="d-flex align-items-center gap-3 mb-3">
          <span className="d-inline-flex p-3 rounded-3" style={{ backgroundColor: '#F97316', color: '#000000' }}><KeyRound size={24} /></span>
          <div>
            <h1 className="h4 fw-bold mb-1">Crie uma nova senha</h1>
            <p className="text-secondary small mb-0">A senha temporária de {usuario?.email} não pode acessar os módulos.</p>
          </div>
        </div>

        <div className="alert border-0 small d-flex gap-2" style={{ backgroundColor: '#172554', color: '#BFDBFE' }}>
          <CheckCircle2 size={18} className="flex-shrink-0" /> Use pelo menos 8 caracteres e não reutilize a senha temporária.
        </div>

        {erro && <div className="alert border-0 small d-flex gap-2" style={{ backgroundColor: '#450A0A', color: '#FECACA' }}><AlertCircle size={18} />{erro}</div>}

        <form onSubmit={handleSubmit}>
          <label htmlFor="new-password" className="form-label small fw-semibold">Nova senha</label>
          <div className="input-group mb-3">
            <span className="input-group-text border-0 text-secondary" style={{ backgroundColor: '#0F0F11' }}><Lock size={18} /></span>
            <input id="new-password" type="password" minLength={8} maxLength={72} autoComplete="new-password" required className="form-control border-0 text-white" style={{ backgroundColor: '#0F0F11' }} value={novaSenha} onChange={(event) => setNovaSenha(event.target.value)} />
          </div>

          <label htmlFor="confirm-password" className="form-label small fw-semibold">Confirmar nova senha</label>
          <div className="input-group mb-4">
            <span className="input-group-text border-0 text-secondary" style={{ backgroundColor: '#0F0F11' }}><Lock size={18} /></span>
            <input id="confirm-password" type="password" minLength={8} maxLength={72} autoComplete="new-password" required className="form-control border-0 text-white" style={{ backgroundColor: '#0F0F11' }} value={confirmacao} onChange={(event) => setConfirmacao(event.target.value)} />
          </div>

          <button type="submit" disabled={salvando} className="btn w-100 fw-bold py-2 border-0" style={{ backgroundColor: '#F97316', color: '#000000' }}>
            {salvando ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      </section>
    </main>
  );
}
