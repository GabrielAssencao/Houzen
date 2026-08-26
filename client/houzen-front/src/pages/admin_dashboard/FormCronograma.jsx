import { useState } from 'react';
import axios from 'axios';
import { useNotifications } from '../../components/notificationContext';

export default function FormCronograma({ usuarioId, obras, onSuccess }) {
  const { notify } = useNotifications();
  const [data, setData] = useState({ obra_id: '', fase: '', prazo: '' });
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
    try {
      // Correção: Crases na URL e envio do cabeçalho de autenticação
      await axios.post(`${API_URL}/api/auth/admin/popular/cronograma`, { 
        ...data, 
        usuario_id: usuarioId 
      }, getAuthHeader());
      
      notify({ type: 'success', title: 'Cronograma registrado', message: 'A nova etapa foi adicionada à empresa.' });
      onSuccess();
    } catch (err) {
      console.error(err);
      notify({ type: 'error', title: 'Cronograma não registrado', message: 'Revise os dados e tente novamente.' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
      <select required className="form-select py-2" style={inputStyle} onChange={e => setData({...data, obra_id: e.target.value})}>
        <option value="">Selecione a Obra</option>
        {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
      </select>
      <input required className="form-control py-2" style={inputStyle} placeholder="Fase" onChange={e => setData({...data, fase: e.target.value})}/>
      <input type="date" required className="form-control py-2" style={inputStyle} onChange={e => setData({...data, prazo: e.target.value})}/>
      <button type="submit" className="btn fw-bold" style={{ backgroundColor: '#F97316', color: '#000' }}>Salvar Cronograma</button>
    </form>
  );
}
