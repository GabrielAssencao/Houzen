import { useState } from 'react';
import axios from 'axios';
import { Save } from 'lucide-react';
import { useNotifications } from '../../components/notificationContext';

export default function FormObra({ usuarioId, onSuccess }) {
  const { notify } = useNotifications();
  const [data, setData] = useState({ nome: '', status: 'Em Andamento', receitas: '', despesas: '' });
  const [loading, setLoading] = useState(false);
  
  // Configuração Global da API
  const API_URL = import.meta.env.VITE_API_URL || 'https://houzen-back.onrender.com';

  const getAuthHeader = () => {
    const userStorage = localStorage.getItem('@Houzen:user');
    if (userStorage) {
      const user = JSON.parse(userStorage);
      return { headers: { Authorization: `Bearer ${user.token}` } };
    }
    return {};
  };
  
  // Estilo padrão para manter o visual escuro
  const inputStyle = { 
    backgroundColor: '#0F0F11', 
    color: '#FFFFFF', 
    border: '1px solid #333' 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Correção: Crases na URL e envio do cabeçalho de autenticação
      await axios.post(`${API_URL}/api/auth/admin/popular/obra`, { 
        ...data, 
        usuario_id: usuarioId 
      }, getAuthHeader());
      
      notify({ type: 'success', title: 'Obra registrada', message: 'A obra foi vinculada à empresa selecionada.' });
      onSuccess();
      setData({ nome: '', status: 'Em Andamento', receitas: '', despesas: '' });
    } catch (err) {
      console.error(err);
      notify({ type: 'error', title: 'Obra não registrada', message: 'Revise os dados e tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
      {/* Nome da Obra */}
      <div>
        <label className="text-secondary small mb-1">Nome da Obra</label>
        <input 
          className="form-control py-2" 
          style={inputStyle} 
          placeholder="Ex: Edifício Horizon" 
          onChange={e => setData({...data, nome: e.target.value})} 
          value={data.nome}
          required 
        />
      </div>

      {/* Linha de Valores */}
      <div className="row g-3">
        <div className="col-6">
          <label className="text-secondary small mb-1">Receitas Totais (R$)</label>
          <div className="input-group">
            <span className="input-group-text border-0" style={{backgroundColor: '#0F0F11', color: '#888'}}>R$</span>
            <input 
              type="number" 
              className="form-control py-2" 
              style={inputStyle} 
              placeholder="0,00"
              onChange={e => setData({...data, receitas: e.target.value})} 
              value={data.receitas}
              required 
            />
          </div>
        </div>
        
        <div className="col-6">
          <label className="text-secondary small mb-1">Despesas Totais (R$)</label>
          <div className="input-group">
            <span className="input-group-text border-0" style={{backgroundColor: '#0F0F11', color: '#888'}}>R$</span>
            <input 
              type="number" 
              className="form-control py-2" 
              style={inputStyle} 
              placeholder="0,00"
              onChange={e => setData({...data, despesas: e.target.value})} 
              value={data.despesas}
              required 
            />
          </div>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading} 
        className="btn fw-bold mt-2 py-2 d-flex align-items-center justify-content-center gap-2" 
        style={{ backgroundColor: '#F97316', color: '#000' }}
      >
        <Save size={18} /> {loading ? 'Salvando...' : 'Salvar Obra'}
      </button>
    </form>
  );
}
