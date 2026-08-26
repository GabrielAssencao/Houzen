import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Search, X, Trash2, Edit2, History, Truck, Shield, Hammer, MapPin } from 'lucide-react';

export default function FleetModule() {
  const [frota, setFrota] = useState([]);
  const [obras, setObras] = useState([]);
  const [sedes, setSedes] = useState([]);
  
  // Filtros Avançados
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [filtroLocal, setFiltroLocal] = useState('TODOS');

  // Controle de Modais
  const [modalAberto, setModalAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [modalDeletarAberto, setModalDeletarAberto] = useState(false);
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);

  // Controle de Operações
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState(null);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [carregandoAction, setCarregandoAction] = useState(false);
  const [erroForm, setErroForm] = useState('');

  const [formEquip, setFormEquip] = useState({
    nome: '', tipo: 'EQUIPAMENTO', codigo: '', operador: '', manutencao: '', status: 'Disponível', tipoLocal: 'SEDE', local_id: ''
  });

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

  const carregarDadosDoPatio = async () => {
    setCarregandoDados(true);
    try {
      const config = getAuthHeader();
      
      const [resFrota, resObras, resSedes] = await Promise.all([
        axios.get(`${API_URL}/api/auth/frota`, config),
        axios.get(`${API_URL}/api/auth/obras`, config),
        axios.get(`${API_URL}/api/auth/sedes`, config)
      ]);

      if (Array.isArray(resFrota.data)) setFrota(resFrota.data);
      if (Array.isArray(resObras.data)) setObras(resObras.data);
      if (Array.isArray(resSedes.data)) setSedes(resSedes.data);
      
      setCarregandoDados(false);
    } catch (error) {
      console.error("Erro ao sincronizar pátio:", error);
      setCarregandoDados(false);
    }
  };

  useEffect(() => {
    carregarDadosDoPatio();
  }, []);

  // Cadastrar Ativo
  const handleCadastrar = async (e) => {
    e.preventDefault();
    setErroForm('');
    if (!formEquip.local_id) {
      setErroForm('Erro: Você precisa escolher obrigatoriamente um local de alocação!');
      return;
    }

    setCarregandoAction(true);
    try {
      const payload = {
        nome: formEquip.nome,
        tipo: formEquip.tipo,
        codigo: formEquip.codigo,
        operador: formEquip.operador,
        manutencao: formEquip.manutencao,
        status: formEquip.status,
        obra_id: formEquip.tipoLocal === 'OBRA' ? Number(formEquip.local_id) : null,
        sede_id: formEquip.tipoLocal === 'SEDE' ? Number(formEquip.local_id) : null
      };

      await axios.post(`${API_URL}/api/auth/frota`, payload, getAuthHeader());
      setModalAberto(false);
      carregarDadosDoPatio();
    } catch (err) {
      setErroForm(err.response?.data?.error || 'Erro ao salvar ativo.');
    } finally {
      setCarregandoAction(false);
    }
  };

  // Abrir Modal Edição
  const abrirEdicao = (equip) => {
    setEquipamentoSelecionado(equip);
    setFormEquip({
      nome: equip.nome,
      tipo: equip.tipo,
      codigo: equip.codigo,
      operador: equip.operador,
      manutencao: equip.manutencao,
      status: equip.status,
      tipoLocal: equip.sede_id ? 'SEDE' : 'OBRA',
      local_id: equip.sede_id ? equip.sede_id.toString() : equip.obra_id.toString()
    });
    setModalEditarAberto(true);
  };

  // Salvar Edição
  const handleEditar = async (e) => {
    e.preventDefault();
    setErroForm('');
    setCarregandoAction(true);
    try {
      const payload = {
        nome: formEquip.nome,
        tipo: formEquip.tipo,
        codigo: formEquip.codigo,
        operador: formEquip.operador,
        manutencao: formEquip.manutencao,
        status: formEquip.status,
        obra_id: formEquip.tipoLocal === 'OBRA' ? Number(formEquip.local_id) : null,
        sede_id: formEquip.tipoLocal === 'SEDE' ? Number(formEquip.local_id) : null
      };

      await axios.put(`${API_URL}/api/auth/frota/${equipamentoSelecionado.id}`, payload, getAuthHeader());
      setModalEditarAberto(false);
      carregarDadosDoPatio();
    } catch (err) {
      setErroForm('Erro ao atualizar dados.');
    } finally {
      setCarregandoAction(false);
    }
  };

  // Excluir Ativo
  const handleDeletar = async () => {
    setCarregandoAction(true);
    try {
      await axios.delete(`${API_URL}/api/auth/frota/${equipamentoSelecionado.id}`, getAuthHeader());
      setModalDeletarAberto(false);
      carregarDadosDoPatio();
    } catch (err) {
      alert('Erro ao remover ativo.');
    } finally {
      setCarregandoAction(false);
    }
  };

  // REGRAS DE FILTRAGEM DE ALTA PERFORMANCE
  const filtrados = frota.filter(f => {
    const bateBusca = f.nome && f.nome.toLowerCase().includes(busca.toLowerCase());
    const bateTipo = filtroTipo === 'TODOS' || f.tipo === filtroTipo;
    
    let bateLocal = true;
    if (filtroLocal !== 'TODOS') {
      if (filtroLocal.startsWith('OBRA_')) {
        bateLocal = f.obra_id?.toString() === filtroLocal.replace('OBRA_', '');
      } else if (filtroLocal.startsWith('SEDE_')) {
        bateLocal = f.sede_id?.toString() === filtroLocal.replace('SEDE_', '');
      }
    }
    return bateBusca && bateTipo && bateLocal;
  });

  // CONTADORES INTELIGENTES DO TOPO
  const totalGeralAtivos = frota.length;
  const totalVeiculos = frota.filter(f => f.tipo === 'VEÍCULO PESADO' || f.tipo === 'VEÍCULO LEVE').length;
  const totalEquipamentos = frota.filter(f => f.tipo === 'EQUIPAMENTO' || f.tipo === 'FERRAMENTA').length;

  const obterEstiloStatus = (status) => {
    if (status === 'Operando') return 'bg-success bg-opacity-10 text-success';
    if (status === 'Manutenção') return 'bg-danger bg-opacity-10 text-danger';
    return 'bg-warning bg-opacity-10 text-warning';
  };

  return (
    <div style={{ position: 'relative' }}>
      
      {/* Cabeçalho */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold fs-3 mb-1" style={{ color: '#FFFFFF' }}>Frota e Equipamentos</h1>
          <p className="text-secondary small">Inventário e alocação de maquinários operacionais</p>
        </div>
        <button 
          onClick={() => setModalAberto(true)}
          className="btn d-flex align-items-center gap-2 fw-semibold border-0 px-3 py-2 text-black" 
          style={{ backgroundColor: '#F97316', borderRadius: '8px' }}
        >
          <Plus size={18} /> Novo Equipamento
        </button>
      </div>

      {/* PLACAS DE METRICAS NO TOPO */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-md-4">
          <div className="card p-3 border-0 rounded-4 d-flex flex-row align-items-center gap-3" style={{ backgroundColor: '#151518' }}>
            <div className="p-2.5 rounded-3 bg-primary bg-opacity-10 text-primary"><Shield size={22} /></div>
            <div>
              <span className="text-secondary small d-block">Ativos Cadastrados</span>
              <h3 className="fw-bold m-0 text-white">{totalGeralAtivos} <span className="fs-6 text-secondary fw-normal">unidades</span></h3>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card p-3 border-0 rounded-4 d-flex flex-row align-items-center gap-3" style={{ backgroundColor: '#151518' }}>
            <div className="p-2.5 rounded-3 bg-success bg-opacity-10 text-success"><Truck size={22} /></div>
            <div>
              <span className="text-secondary small d-block">Veículos (Leves / Pesados)</span>
              <h3 className="fw-bold m-0 text-white">{totalVeiculos} <span className="fs-6 text-secondary fw-normal">veículos</span></h3>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card p-3 border-0 rounded-4 d-flex flex-row align-items-center gap-3" style={{ backgroundColor: '#151518' }}>
            <div className="p-2.5 rounded-3 bg-warning bg-opacity-10 text-warning"><Hammer size={22} /></div>
            <div>
              <span className="text-secondary small d-block">Maquinários & Ferramentas</span>
              <h3 className="fw-bold m-0 text-white">{totalEquipamentos} <span className="fs-6 text-secondary fw-normal">itens</span></h3>
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS CRUZADOS AVANÇADOS */}
      <div className="card p-3 border-0 rounded-4 mb-4 d-flex flex-column flex-md-row gap-3 align-items-md-center justify-content-between" style={{ backgroundColor: '#151518' }}>
        <div className="d-flex align-items-center px-3 rounded-3 flex-grow-1" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)', maxWidth: '300px' }}>
          <Search size={18} className="text-secondary me-2" />
          <input type="text" className="form-control bg-transparent border-0 text-white shadow-none py-2 small" placeholder="Buscar por modelo..." value={busca} onChange={e => setBusca(e.target.value)} />
        </div>

        <div className="d-flex flex-wrap gap-2">
          {/* Filtro de Categoria */}
          <select className="form-select bg-transparent text-secondary border-secondary border-opacity-30 small shadow-none" style={{ width: '180px', backgroundColor: '#151518' }} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
            <option value="TODOS">-- Todas Categorias --</option>
            <option value="VEÍCULO PESADO">Veículo Pesado</option>
            <option value="VEÍCULO LEVE">Veículo Leve</option>
            <option value="EQUIPAMENTO">Equipamento</option>
            <option value="FERRAMENTA">Ferramenta</option>
          </select>

          {/* Filtro de Localização Cruzada */}
          <select className="form-select bg-transparent text-secondary border-secondary border-opacity-30 small shadow-none" style={{ width: '180px', backgroundColor: '#151518' }} value={filtroLocal} onChange={e => setFiltroLocal(e.target.value)}>
            <option value="TODOS">-- Todas Localizações --</option>
            <optgroup label="Almoxarifados / Sedes" style={{ backgroundColor: '#151518', color: '#fff' }}>
              {sedes.map(s => <option key={s.id} value={`SEDE_${s.id}`}>{s.nome}</option>)}
            </optgroup>
            <optgroup label="Canteiros de Obras" style={{ backgroundColor: '#151518', color: '#fff' }}>
              {obras.filter(o => o.status === 'Em Andamento').map(o => <option key={o.id} value={`OBRA_${o.id}`}>{o.nome}</option>)}
            </optgroup>
          </select>
        </div>
      </div>

      {/* GRID DE CARDS LOGÍSTICOS */}
      {carregandoDados ? (
        <div className="text-center py-5"><div className="spinner-border text-warning spinner-border-sm" style={{ color: '#F97316' }} /></div>
      ) : filtrados.length === 0 ? (
        <div className="card text-center py-5 text-secondary border-0 rounded-4" style={{ backgroundColor: '#151518' }}>Nenhum ativo localizado com os filtros aplicados.</div>
      ) : (
        <div className="row g-4">
          {filtrados.map((equip) => (
            <div key={equip.id} className="col-12 col-md-6 col-lg-4">
              <div className="card p-4 border-0 rounded-4 h-100 d-flex flex-column" style={{ backgroundColor: '#151518' }}>
                
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <span className="text-secondary text-uppercase fw-bold" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                    {equip.tipo} • {equip.codigo}
                  </span>
                  <span className={`badge px-2.5 py-1 rounded small ${obterEstiloStatus(equip.status)}`}>
                    {equip.status}
                  </span>
                </div>

                <h5 className="fw-bold text-white mb-3" style={{ fontSize: '16px' }}>{equip.nome}</h5>

                <div className="d-flex flex-column gap-2 mb-4 small">
                  <div className="d-flex justify-content-between">
                    <span style={{ color: '#71717A' }}>Localização:</span>
                    <span className="text-warning fw-medium d-flex align-items-center gap-1">
                      <MapPin size={12} /> {equip.sede_id ? equip.sede_nome : equip.obra_name || equip.obra_nome}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span style={{ color: '#71717A' }}>Responsável:</span>
                    <span className="text-white fw-medium">{equip.operador}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span style={{ color: '#71717A' }}>Manutenção:</span>
                    <span className="text-white fw-medium">{equip.manutencao}</span>
                  </div>
                </div>

                <div className="d-flex gap-2 mt-auto pt-2 border-top" style={{ borderColor: 'rgba(38, 38, 41, 0.4)' }}>
                  <button onClick={() => { setEquipamentoSelecionado(equip); setModalHistoricoAberto(true); }} className="btn btn-sm d-flex align-items-center justify-content-center gap-1.5 flex-grow-1 border-0 text-white py-2 shadow-none" style={{ backgroundColor: '#27272A', borderRadius: '6px' }}>
                    <History size={13} /> Histórico
                  </button>
                  <button onClick={() => abrirEdicao(equip)} className="btn btn-sm d-flex align-items-center justify-content-center gap-1.5 flex-grow-1 border-0 text-black fw-semibold py-2 shadow-none" style={{ backgroundColor: '#F97316', borderRadius: '6px' }}>
                    <Edit2 size={13} /> Editar
                  </button>
                  <button onClick={() => { setEquipamentoSelecionado(equip); setModalDeletarAberto(true); }} className="btn btn-sm border-0 text-secondary bg-transparent px-2 icon-delete-hover shadow-none">
                    <Trash2 size={15} />
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: ADICIONAR ATIVO */}
      {modalAberto && (
        <div className="d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 2000 }}>
          <div className="card p-4 border w-100 mx-3" style={{ backgroundColor: '#151518', maxWidth: '500px', borderRadius: '16px', color: '#FFFFFF', borderColor: 'rgba(38, 38, 41, 0.6)' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0">Adicionar à Frota</h5>
              <button onClick={() => setModalAberto(false)} className="btn p-0 text-secondary border-0 bg-transparent shadow-none"><X size={20} /></button>
            </div>
            {erroForm && <div className="alert alert-danger p-2 small border-0 mb-3" style={{ backgroundColor: '#450A0A', color: '#FECACA' }}>{erroForm}</div>}
            
            <form onSubmit={handleCadastrar} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label small text-secondary mb-1">Nome do Equipamento / Veículo</label>
                <input type="text" required placeholder="Ex: Caminhão Caçamba Volco VM" className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formEquip.nome} onChange={e => setFormEquip({...formEquip, nome: e.target.value})} />
              </div>

              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small text-secondary mb-1">Categoria Obrigatória</label>
                  <select className="form-select text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formEquip.tipo} onChange={e => setFormEquip({...formEquip, tipo: e.target.value})}>
                    <option value="VEÍCULO PESADO">VEÍCULO PESADO</option>
                    <option value="VEÍCULO LEVE">VEÍCULO LEVE</option>
                    <option value="EQUIPAMENTO">EQUIPAMENTO</option>
                    <option value="FERRAMENTA">FERRAMENTA</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label small text-secondary mb-1">Código de Frota</label>
                  <input type="text" required placeholder="Ex: CAM-02, CAC-01" className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formEquip.codigo} onChange={e => setFormEquip({...formEquip, codigo: e.target.value.toUpperCase()})} />
                </div>
              </div>

              {/* TRAVA LOGÍSTICA OBRIGATÓRIA */}
              <div className="p-3 rounded-3" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }}>
                <label className="form-label small text-warning fw-semibold mb-1">Alocação Física Obrigatória</label>
                <div className="d-flex gap-4 small mb-2 text-secondary">
                  <label className="d-flex align-items-center gap-1.5 cursor-pointer"><input type="radio" checked={formEquip.tipoLocal === 'SEDE'} onChange={() => setFormEquip({...formEquip, tipoLocal: 'SEDE', local_id: ''})} /> Armazenado na Sede</label>
                  <label className="d-flex align-items-center gap-1.5 cursor-pointer"><input type="radio" checked={formEquip.tipoLocal === 'OBRA'} onChange={() => setFormEquip({...formEquip, tipoLocal: 'OBRA', local_id: ''})} /> Alocado em Canteiro</label>
                </div>
                <select required className="form-select text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#151518', border: '1px solid rgba(38, 38, 41, 0.3)' }} value={formEquip.local_id} onChange={e => setFormEquip({...formEquip, local_id: e.target.value})}>
                  <option value="">-- Escolha a Localização --</option>
                  {formEquip.tipoLocal === 'SEDE'
                    ? sedes.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)
                    : obras.filter(o => o.status === 'Em Andamento').map(o => <option key={o.id} value={o.id}>{o.nome}</option>)
                  }
                </select>
              </div>

              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small text-secondary mb-1">Responsável / Operador</label>
                  <input type="text" placeholder="Nome do operador" className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formEquip.operador} onChange={e => setFormEquip({...formEquip, operador: e.target.value})} />
                </div>
                <div className="col-6">
                  <label className="form-label small text-secondary mb-1">Data da Revisão</label>
                  <input type="text" placeholder="Ex: 22/06/2026" className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formEquip.manutencao} onChange={e => setFormEquip({...formEquip, manutencao: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="form-label small text-secondary mb-1">Status Inicial</label>
                <select className="form-select text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formEquip.status} onChange={e => setFormEquip({...formEquip, status: e.target.value})}>
                  <option value="Disponível">Disponível</option>
                  <option value="Operando">Operando</option>
                  <option value="Manutenção">Manutenção</option>
                </select>
              </div>

              <div className="d-flex gap-2 justify-content-end mt-2">
                <button type="button" onClick={() => setModalAberto(false)} className="btn btn-sm px-3 py-2 text-white border-0" style={{ backgroundColor: 'rgba(38, 38, 41, 0.6)' }}>Cancelar</button>
                <button type="submit" disabled={carregandoAction} className="btn btn-sm px-3 py-2 text-black border-0 fw-semibold" style={{ backgroundColor: '#F97316' }}>
                  {carregandoAction ? 'Salvando...' : 'Salvar Ativo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR / REMANEJAR ATIVO */}
      {modalEditarAberto && (
        <div className="d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 2000 }}>
          <div className="card p-4 border w-100 mx-3" style={{ backgroundColor: '#151518', maxWidth: '500px', borderRadius: '16px', color: '#FFFFFF', borderColor: 'rgba(38, 38, 41, 0.6)' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0">Editar / Alterar Destino</h5>
              <button onClick={() => setModalEditarAberto(false)} className="btn p-0 text-secondary border-0 bg-transparent shadow-none"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleEditar} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label small text-secondary mb-1">Nome / Modelo do Maquinário</label>
                <input type="text" required className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formEquip.nome} onChange={e => setFormEquip({...formEquip, nome: e.target.value})} />
              </div>

              <div className="p-3 rounded-3" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }}>
                <label className="form-label small text-warning fw-semibold mb-1">Localização Atual</label>
                <div className="d-flex gap-4 small mb-2 text-secondary">
                  <label className="d-flex align-items-center gap-1.5 cursor-pointer"><input type="radio" checked={formEquip.tipoLocal === 'SEDE'} onChange={() => setFormEquip({...formEquip, tipoLocal: 'SEDE', local_id: ''})} /> Mover para Sede</label>
                  <label className="d-flex align-items-center gap-1.5 cursor-pointer"><input type="radio" checked={formEquip.tipoLocal === 'OBRA'} onChange={() => setFormEquip({...formEquip, tipoLocal: 'OBRA', local_id: ''})} /> Transferir para Canteiro</label>
                </div>
                <select required className="form-select text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#151518', border: '1px solid rgba(38, 38, 41, 0.3)' }} value={formEquip.local_id} onChange={e => setFormEquip({...formEquip, local_id: e.target.value})}>
                  <option value="">-- Escolha o Destino Logístico --</option>
                  {formEquip.tipoLocal === 'SEDE'
                    ? sedes.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)
                    : obras.filter(o => o.status === 'Em Andamento').map(o => <option key={o.id} value={o.id}>{o.nome}</option>)
                  }
                </select>
              </div>

              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small text-secondary mb-1">Responsável Atual</label>
                  <input type="text" className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formEquip.operador} onChange={e => setFormEquip({...formEquip, operador: e.target.value})} />
                </div>
                <div className="col-6">
                  <label className="form-label small text-secondary mb-1">Status Operacional</label>
                  <select className="form-select text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formEquip.status} onChange={e => setFormEquip({...formEquip, status: e.target.value})}>
                    <option value="Disponível">Disponível</option>
                    <option value="Operando">Operando</option>
                    <option value="Manutenção">Manutenção</option>
                  </select>
                </div>
              </div>

              <div className="d-flex gap-2 justify-content-end mt-2">
                <button type="button" onClick={() => setModalEditarAberto(false)} className="btn btn-sm px-3 py-2 text-white border-0" style={{ backgroundColor: 'rgba(38, 38, 41, 0.6)' }}>Cancelar</button>
                <button type="submit" disabled={carregandoAction} className="btn btn-sm px-3 py-2 text-black border-0 fw-semibold" style={{ backgroundColor: '#F97316' }}>
                  {carregandoAction ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRMAÇÃO DE EXCLUSÃO */}
      {modalDeletarAberto && equipamentoSelecionado && (
        <div className="d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000 }}>
          <div className="card p-4 border w-100 mx-3 text-center" style={{ backgroundColor: '#151518', maxWidth: '420px', borderRadius: '16px', color: '#FFFFFF', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
            <h5 className="fw-bold mb-2 text-danger">Baixa Patrimonial</h5>
            <p className="text-secondary small mb-4">Tem certeza que deseja remover <strong className="text-white">{equipamentoSelecionado.nome}</strong> permanentemente da frota empresarial?</p>
            <div className="d-flex gap-2 justify-content-center">
              <button type="button" onClick={() => setModalDeletarAberto(false)} className="btn btn-sm px-4 py-2 text-white border-0" style={{ backgroundColor: 'rgba(38, 38, 41, 0.6)', borderRadius: '8px' }}>Não</button>
              <button type="button" onClick={handleDeletar} disabled={carregandoAction} className="btn btn-sm px-4 py-2 text-white border-0 fw-semibold" style={{ backgroundColor: '#EF4444', borderRadius: '8px' }}>
                {carregandoAction ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: HISTÓRICO PREMIUM AJUSTADO (LARGURA MÁXIMA DE 560PX E ROLAGEM SENSÍVEL) */}
      {modalHistoricoAberto && equipamentoSelecionado && (
        <div className="d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000 }}>
          <div className="card p-4 border w-100 mx-3" style={{ backgroundColor: '#151518', maxWidth: '560px', borderRadius: '16px', color: '#FFFFFF', borderColor: 'rgba(38, 38, 41, 0.6)' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold m-0">Ficha Histórica Operacional: {equipamentoSelecionado.codigo}</h5>
              <button onClick={() => setModalHistoricoAberto(false)} className="btn p-0 text-secondary border-0 bg-transparent shadow-none"><X size={20} /></button>
            </div>
            
            {/* Box com Scroll Customizado para Suportar Grandes Massas de Dados sem estourar o layout */}
            <div className="pr-2" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {/* Linha do Tempo Vertical Clássica */}
              <div className="position-relative pl-4 border-left border-secondary border-opacity-30 d-flex flex-column gap-4 ml-2">
                <div className="position-relative">
                  <div className="position-absolute bg-success rounded-circle" style={{ width: '10px', height: '10px', left: '-21px', top: '5px' }} />
                  <span className="text-secondary d-block" style={{ fontSize: '11px' }}>10/05/2026</span>
                  <p className="m-0 small text-white font-medium">Equipamento liberado e alocado na frente de trabalho atual.</p>
                </div>
                <div className="position-relative">
                  <div className="position-absolute bg-danger rounded-circle" style={{ width: '10px', height: '10px', left: '-21px', top: '5px' }} />
                  <span className="text-secondary d-block" style={{ fontSize: '11px' }}>24/04/2026</span>
                  <p className="m-0 small text-white font-medium">Troca total de fluidos hidráulicos e filtros na revisão periódica.</p>
                </div>
                <div className="position-relative">
                  <div className="position-absolute bg-warning rounded-circle" style={{ width: '10px', height: '10px', left: '-21px', top: '5px' }} />
                  <span className="text-secondary d-block" style={{ fontSize: '11px' }}>12/03/2026</span>
                  <p className="m-0 small text-white font-medium">Entrada e homologação técnica de frota realizada no sistema Houzen.</p>
                </div>
              </div>
            </div>

            <button onClick={() => setModalHistoricoAberto(false)} className="btn btn-sm w-100 mt-4 text-white border-0 py-2 fw-medium" style={{ backgroundColor: '#27272A', borderRadius: '8px' }}>Fechar Ficha</button>
          </div>
        </div>
      )}

      <style>{`
        .icon-delete-hover:hover { color: #EF4444 !important; }
      `}</style>
    </div>
  );
}
