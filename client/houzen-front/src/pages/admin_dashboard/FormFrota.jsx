import { useState } from 'react';
import axios from 'axios';
import { Save } from 'lucide-react';
import { useNotifications } from '../../components/notificationContext';

export default function FormFrota({ usuarioId, obras, sedes, onSuccess }) {
  const { notify } = useNotifications();
  const [data, setData] = useState({ 
    obra_id: '', 
    sede_id: '', 
    nome: '', 
    tipo: 'Equipamento', 
    codigo: '', 
    status: 'Operando' 
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
      await axios.post(`${API_URL}/api/auth/admin/popular/frota`, { 
        ...data, 
        usuario_id: usuarioId 
      }, getAuthHeader());
      
      notify({ type: 'success', title: 'Ativo cadastrado', message: 'O equipamento ou veículo foi vinculado à empresa.' });
      onSuccess();
      setData({ obra_id: '', sede_id: '', nome: '', tipo: 'Equipamento', codigo: '', status: 'Operando' });
    } catch (err) {
      console.error(err);
      notify({ type: 'error', title: 'Ativo não cadastrado', message: 'Revise os dados e tente novamente.' });
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

      {/* Nome e Tipo */}
      <div className="row g-2">
        <div className="col-8">
          <label className="text-secondary small mb-1">Nome/Modelo</label>
          <input required className="form-control py-2" style={inputStyle} placeholder="Ex: Escavadeira CAT" onChange={e => setData({...data, nome: e.target.value})} value={data.nome} />
        </div>
        <div className="col-4">
          <label className="text-secondary small mb-1">Tipo</label>
          <select className="form-select py-2" style={inputStyle} onChange={e => setData({...data, tipo: e.target.value})} value={data.tipo}>
            <option value="Equipamento">Equipamento</option>
            <option value="Veículo">Veículo</option>
          </select>
        </div>
      </div>

      {/* Campo Dinâmico: Placa ou Código */}
      <div>
        <label className="text-secondary small mb-1">
          {data.tipo === 'Veículo' ? 'Placa do Veículo' : 'Código Patrimonial'}
        </label>
        <input 
          required
          className="form-control py-2" 
          style={inputStyle} 
          placeholder={data.tipo === 'Veículo' ? 'Ex: ABC-1234' : 'Ex: EQUIP-001'} 
          onChange={e => setData({...data, codigo: e.target.value})} 
          value={data.codigo} 
        />
      </div>

      <button type="submit" disabled={loading} className="btn fw-bold mt-2 py-2 d-flex align-items-center justify-content-center gap-2" style={{ backgroundColor: '#F97316', color: '#000' }}>
        <Save size={18} /> {loading ? 'Salvando...' : 'Salvar Equipamento'}
      </button>
    </form>
  );
}
