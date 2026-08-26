import { useState } from 'react';
import axios from 'axios';
import { useNotifications } from '../../components/notificationContext';

export default function FormFuncionario({ usuarioId, obras, onSuccess }) {
  const { notify } = useNotifications();
  const [data, setData] = useState({ obra_id: '', nome: '', cargo: '', salario: '', status: 'Ativo' });
  const [loading, setLoading] = useState(false);
  const inputStyle = { backgroundColor: '#0F0F11', color: '#FFFFFF', border: '1px solid #333' };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Correção: Crases na URL e envio do cabeçalho de autenticação
      await axios.post(`${API_URL}/api/auth/admin/popular/funcionario`, { 
        ...data, 
        usuario_id: usuarioId 
      }, getAuthHeader());
      
      notify({ type: 'success', title: 'Funcionário registrado', message: 'O profissional foi vinculado à empresa.' });
      onSuccess();
      setData({ obra_id: '', nome: '', cargo: '', salario: '', status: 'Ativo' });
    } catch (err) {
      console.error(err);
      notify({ type: 'error', title: 'Funcionário não registrado', message: 'Revise os dados e tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
      <select required className="form-select py-2" style={inputStyle} onChange={e => setData({...data, obra_id: e.target.value})} value={data.obra_id}>
        <option value="">Selecione a Obra</option>
        {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
      </select>
      
      <input required className="form-control py-2" style={inputStyle} placeholder="Nome" value={data.nome} onChange={e => setData({...data, nome: e.target.value})} />
      <input required className="form-control py-2" style={inputStyle} placeholder="Cargo" value={data.cargo} onChange={e => setData({...data, cargo: e.target.value})} />
      <input required type="number" className="form-control py-2" style={inputStyle} placeholder="Salário" value={data.salario} onChange={e => setData({...data, salario: e.target.value})} />
      
      <button type="submit" disabled={loading} className="btn fw-bold" style={{ backgroundColor: '#F97316', color: '#000' }}>
        {loading ? 'Salvando...' : 'Salvar Funcionário'}
      </button>
    </form>
  );
}
