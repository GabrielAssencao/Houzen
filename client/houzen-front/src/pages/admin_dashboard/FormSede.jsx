import { useState } from 'react';
import axios from 'axios';

export default function FormSede({ usuarioId, onSuccess }) {
  const [data, setData] = useState({ nome: '' });
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
      await axios.post(`${API_URL}/api/auth/admin/popular/sede`, { 
        ...data, 
        usuario_id: usuarioId 
      }, getAuthHeader());
      
      alert('Sede cadastrada!');
      onSuccess();
      setData({ nome: '' });
    } catch (err) {
      console.error(err);
      alert('Erro ao cadastrar sede.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
      <input 
        className="form-control py-2" 
        style={inputStyle} 
        placeholder="Nome da Sede" 
        onChange={e => setData({nome: e.target.value})} 
        value={data.nome} 
        required 
      />
      <button 
        type="submit" 
        disabled={loading} 
        className="btn fw-bold" 
        style={{ backgroundColor: '#F97316', color: '#000' }}
      >
        {loading ? 'Salvando...' : 'Salvar Sede'}
      </button>
    </form>
  );
}
