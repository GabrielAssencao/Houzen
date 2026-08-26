import { useEffect, useState } from 'react';
import axios from 'axios';
import { Building, Settings, Briefcase, UserPlus, Package, Truck, Calendar, MapPin } from 'lucide-react';

import FormObra from './FormObra';
import FormSede from './FormSede';
import FormFuncionario from './FormFuncionario';
import FormSuprimento from './FormSuprimento';
import FormFrota from './FormFrota';
import FormCronograma from './FormCronograma';

export default function EmpresasDataManagement() {
  const [empresas, setEmpresas] = useState([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null);
  const [, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('obra');
  const [obras, setObras] = useState([]);
  const [sedes, setSedes] = useState([]);

  // Configuração Global da API e Header
  const API_URL = import.meta.env.VITE_API_URL || 'https://houzen-back.onrender.com';
  
  const getAuthHeader = () => {
    const userStorage = localStorage.getItem('@Houzen:user');
    if (userStorage) {
      const user = JSON.parse(userStorage);
      return { headers: { Authorization: `Bearer ${user.token}` } };
    }
    return {};
  };

  useEffect(() => { carregarEmpresas(); }, []);
  useEffect(() => { if (empresaSelecionada) carregarDadosEmpresa(empresaSelecionada.id); }, [empresaSelecionada]);

  const carregarEmpresas = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/admin/usuarios`, getAuthHeader());
      setEmpresas(res.data.filter(u => u.nivel === 'empresa'));
      setCarregando(false);
    } catch (err) { console.error(err); setCarregando(false); }
  };

  const carregarDadosEmpresa = async (usuarioId) => {
    try {
      const config = getAuthHeader();
      const [resObras, resSedes] = await Promise.all([
        axios.get(`${API_URL}/api/auth/admin/usuarios/${usuarioId}/obras`, config),
        axios.get(`${API_URL}/api/auth/admin/usuarios/${usuarioId}/sedes`, config)
      ]);
      setObras(resObras.data);
      setSedes(resSedes.data);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="container-fluid p-0">
      <div className="mb-4">
        <h1 className="fw-bold fs-3 text-white d-flex align-items-center gap-2">
          <Settings size={28} style={{ color: '#F97316' }} /> Gerenciador de Dados (Data Seed)
        </h1>
      </div>
      <div className="row g-4">
        <div className="col-md-3">
          <div className="card p-3 border-0 rounded-4" style={{ backgroundColor: '#151518' }}>
            <h6 className="text-secondary mb-3">Selecione a Empresa</h6>
            <div className="d-flex flex-column gap-2">
              {empresas.map(emp => (
                <button key={emp.id} onClick={() => setEmpresaSelecionada(emp)} className="btn text-start d-flex align-items-center gap-2 border-0"
                  style={{ backgroundColor: empresaSelecionada?.id === emp.id ? '#F97316' : '#0F0F11', color: '#fff' }}>
                  <Building size={16} /> {emp.nome}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="col-md-9">
          {empresaSelecionada ? (
            <div className="card p-4 border-0 rounded-4" style={{ backgroundColor: '#151518' }}>
              <h4 className="text-white mb-4"><Building style={{ color: '#F97316' }} /> Populando: <span style={{ color: '#F97316' }}>{empresaSelecionada.nome}</span></h4>
              <div className="d-flex gap-2 mb-4 border-bottom border-secondary pb-3 flex-wrap">
                {[
                  { id: 'obra', nome: 'Obra', icon: Briefcase }, { id: 'sede', nome: 'Sede', icon: MapPin },
                  { id: 'funcionario', nome: 'Funcionario', icon: UserPlus }, { id: 'suprimento', nome: 'Suprimento', icon: Package },
                  { id: 'frota', nome: 'Frota', icon: Truck }, { id: 'cronograma', nome: 'Cronograma', icon: Calendar }
                ].map(tab => (
                  <button type="button" key={tab.id} onClick={() => setAbaAtiva(tab.id)} className="btn btn-sm d-flex align-items-center gap-2 px-3 py-2 border-0"
                    style={{ backgroundColor: abaAtiva === tab.id ? '#F97316' : '#0F0F11', color: '#fff', cursor: 'pointer' }}>
                    <tab.icon size={16} /> {tab.nome}
                  </button>
                ))}
              </div>
              <div className="p-3 rounded-3" style={{ backgroundColor: '#0F0F11' }}>
                <h6 className="text-white mb-3 fw-bold">Cadastrar {abaAtiva.charAt(0).toUpperCase() + abaAtiva.slice(1)}</h6>
                {abaAtiva === 'obra' && <FormObra usuarioId={empresaSelecionada.id} onSuccess={() => carregarDadosEmpresa(empresaSelecionada.id)} />}
                {abaAtiva === 'sede' && <FormSede usuarioId={empresaSelecionada.id} onSuccess={() => carregarDadosEmpresa(empresaSelecionada.id)} />}
                {abaAtiva === 'funcionario' && <FormFuncionario usuarioId={empresaSelecionada.id} obras={obras} onSuccess={() => carregarDadosEmpresa(empresaSelecionada.id)} />}
                {abaAtiva === 'suprimento' && <FormSuprimento usuarioId={empresaSelecionada.id} obras={obras} sedes={sedes} onSuccess={() => carregarDadosEmpresa(empresaSelecionada.id)} />}
                {abaAtiva === 'frota' && <FormFrota usuarioId={empresaSelecionada.id} obras={obras} sedes={sedes} onSuccess={() => carregarDadosEmpresa(empresaSelecionada.id)} />}
                {abaAtiva === 'cronograma' && <FormCronograma usuarioId={empresaSelecionada.id} obras={obras} onSuccess={() => carregarDadosEmpresa(empresaSelecionada.id)} />}
              </div>
            </div>
          ) : <div className="card p-5 border-0 rounded-4 text-center text-secondary" style={{ backgroundColor: '#151518' }}>Selecione uma empresa.</div>}
        </div>
      </div>
    </div>
  );
}
