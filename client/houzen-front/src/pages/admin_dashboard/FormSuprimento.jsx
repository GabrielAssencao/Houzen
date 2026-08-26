import { useState } from 'react';
import axios from 'axios';
import { Save } from 'lucide-react';

export default function FormSuprimento({ usuarioId, obras, sedes, onSuccess }) {
  const [data, setData] = useState({ 
    obra_id: '', 
    sede_id: '', 
    nome: '', 
    qtd: '', 
    preco: '' 
  });
  
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
      await axios.post(`${API_URL}/api/auth/admin/popular/suprimento`, { 
        ...data, 
        usuario_id: usuarioId 
      }, getAuthHeader());
      
      alert('Suprimento adicionado com sucesso!');
      onSuccess();
      setData({ obra_id: '', sede_id: '', nome: '', qtd: '', preco: '' });
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar suprimento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
      {/* Seletores de Obra e Sede */}
      <div className="row g-2">
        <div className="col-6">
          <label className="text-secondary small mb-1">Obra</label>
          <select className="form-select py-2" style={inputStyle} onChange={e => setData({...data, obra_id: e.target.value, sede_id: ''})} value={data.obra_id}>
            <option value="">Selecione a Obra</option>
            {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>
        </div>
        <div className="col-6">
          <label className="text-secondary small mb-1">Sede</label>
          <select className="form-select py-2" style={inputStyle} onChange={e => setData({...data, sede_id: e.target.value, obra_id: ''})} value={data.sede_id}>
            <option value="">Selecione a Sede</option>
            {sedes.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>
      </div>

      {/* Nome e Quantidade */}
      <div className="row g-2">
        <div className="col-8">
          <label className="text-secondary small mb-1">Nome do Material</label>
          <input required className="form-control py-2" style={inputStyle} placeholder="Ex: Cimento 50kg" onChange={e => setData({...data, nome: e.target.value})} value={data.nome} />
        </div>
        <div className="col-4">
          <label className="text-secondary small mb-1">Quantidade</label>
          <input required className="form-control py-2" style={inputStyle} placeholder="0" onChange={e => setData({...data, qtd: e.target.value})} value={data.qtd} />
        </div>
      </div>

      {/* Custo Unitário */}
      <div>
        <label className="text-secondary small mb-1">Custo Unitário (R$)</label>
        <div className="input-group">
          <span className="input-group-text border-0" style={{backgroundColor: '#0F0F11', color: '#888'}}>R$</span>
          <input 
            required
            type="number" 
            step="0.01"
            className="form-control py-2" 
            style={inputStyle} 
            placeholder="0,00" 
            onChange={e => setData({...data, preco: e.target.value})} 
            value={data.preco} 
          />
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn fw-bold mt-2 py-2" style={{ backgroundColor: '#F97316', color: '#000' }}>
        <Save size={18} className="me-2" /> {loading ? 'Salvando...' : 'Salvar Suprimento'}
      </button>
    </form>
  );
}
