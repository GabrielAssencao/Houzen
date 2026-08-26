import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Search, X, Trash2, Edit2, AlertTriangle, UserX, Briefcase, Users, UserCheck, UserPlus } from 'lucide-react';

export default function HRModule() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [obras, setObras] = useState([]);
  
  // Filtros Avançados de Escala
  const [busca, setBusca] = useState('');
  const [filtroDepartamento, setFiltroDepartamento] = useState('TODOS');
  const [filtroAlocacao, setFiltroAlocacao] = useState('TODOS');

  // Modais de Controle
  const [modalAberto, setModalAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [modalDeletarAberto, setModalDeletarAberto] = useState(false);

  // Estados de Operação
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [carregandoSalvar, setCarregandoSalvar] = useState(false);
  const [erroForm, setErroForm] = useState('');
  const [erroConexao, setErroConexao] = useState('');

  const [formFunc, setFormFunc] = useState({
    nome: '', cargo: '', departamento: '', horas: '176h', salario: '', status: 'Ativo', obra_id: ''
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

  const carregarDadosDoSistema = async () => {
    setCarregandoDados(true);
    setErroConexao('');
    try {
      const config = getAuthHeader();

      const [resFunc, resObras] = await Promise.all([
        axios.get(`${API_URL}/api/auth/rh/funcionarios`, config),
        axios.get(`${API_URL}/api/auth/obras`, config)
      ]);

      if (Array.isArray(resFunc.data)) setFuncionarios(resFunc.data);
      if (Array.isArray(resObras.data)) setObras(resObras.data);
      
      setCarregandoDados(false);
    } catch (error) {
      console.error(error);
      setErroConexao('Erro ao conectar ao servidor de RH ou Obras.');
      setCarregandoDados(false);
    }
  };

  useEffect(() => {
    carregarDadosDoSistema();
  }, []);

  // Cadastrar Funcionário
  const handleCadastrar = async (e) => {
    e.preventDefault();
    setErroForm('');
    setCarregandoSalvar(true);
    try {
      const payload = { ...formFunc, obra_id: formFunc.obra_id ? Number(formFunc.obra_id) : null };
      await axios.post(`${API_URL}/api/auth/rh/funcionarios`, payload, getAuthHeader());
      setModalAberto(false);
      carregarDadosDoSistema();
    } catch (error) {
      setErroForm('Erro interno ao salvar colaborador.');
    } finally {
      setCarregandoSalvar(false);
    }
  };

  // Abrir Modal de Edição
  const abrirEdicao = (func) => {
    setFuncionarioSelecionado(func);
    setFormFunc({
      nome: func.nome,
      cargo: func.cargo,
      departamento: func.departamento,
      text_departamento: func.departamento,
      horas: func.horas,
      salario: func.salario,
      status: func.status,
      obra_id: func.obra_id ? func.obra_id.toString() : ''
    });
    setModalEditarAberto(true);
  };

  // Salvar Edição / Realocação
  const handleEditar = async (e) => {
    e.preventDefault();
    setErroForm('');
    setCarregandoSalvar(true);
    try {
      const payload = { ...formFunc, obra_id: formFunc.obra_id ? Number(formFunc.obra_id) : null };
      await axios.put(`${API_URL}/api/auth/rh/funcionarios/${funcionarioSelecionado.id}`, payload, getAuthHeader());
      setModalEditarAberto(false);
      carregarDadosDoSistema();
    } catch (error) {
      setErroForm('Erro ao atualizar cadastro.');
    } finally {
      setCarregandoSalvar(false);
    }
  };

  // Deletar Funcionário
  const handleDeletar = async () => {
    setCarregandoSalvar(true);
    try {
      await axios.delete(`${API_URL}/api/auth/rh/funcionarios/${funcionarioSelecionado.id}`, getAuthHeader());
      setModalDeletarAberto(false);
      carregarDadosDoSistema();
    } catch (error) {
      alert('Erro ao excluir funcionário.');
    } finally {
      setCarregandoSalvar(false);
    }
  };

  // EXTRAÇÃO DINÂMICA DE DEPARTAMENTOS DO BANCO (Evita que a lista fique desatualizada)
  const departamentosUnicos = [...new Set(funcionarios.map(f => f.departamento).filter(Boolean))];

  // FILTRAGEM MULTICRITÉRIO DE ALTA PERFORMANCE
  const filtrados = funcionarios.filter(f => {
    const bateBusca = f.nome && f.nome.toLowerCase().includes(busca.toLowerCase());
    const bateDepto = filtroDepartamento === 'TODOS' || f.departamento === filtroDepartamento;
    
    let bateAlocacao = true;
    if (filtroAlocacao !== 'TODOS') {
      if (filtroAlocacao === 'DISPONIVEL') {
        bateAlocacao = !f.obra_id || f.obra_status === 'Finalizada';
      } else {
        bateAlocacao = f.obra_id?.toString() === filtroAlocacao;
      }
    }
    return bateBusca && bateDepto && bateAlocacao;
  });

  // CÁLCULO DE MÉTRICAS OPERACIONAIS
  const totalFuncionarios = funcionarios.length;
  const totalAlocados = funcionarios.filter(f => f.obra_id && f.obra_status !== 'Finalizada').length;
  const totalDisponiveis = totalFuncionarios - totalAlocados;

  const obrasAtivas = obras.filter(o => o.status === 'Em Andamento');

  return (
    <div style={{ position: 'relative' }}>
      
      {/* Cabeçalho */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold fs-3 mb-1" style={{ color: '#FFFFFF' }}>Gestão de Recursos Humanos</h1>
          <p className="text-secondary small">Alocação de mão de obra e controle de departamentos</p>
        </div>
        <button 
          onClick={() => {
            setFormFunc({ nome: '', cargo: '', departamento: '', horas: '176h', salario: '', status: 'Ativo', obra_id: '' });
            setModalAberto(true);
          }}
          className="btn d-flex align-items-center gap-2 fw-semibold border-0 px-3 py-2 text-black" 
          style={{ backgroundColor: '#F97316', borderRadius: '8px' }}
        >
          <Plus size={18} /> Novo Funcionário
        </button>
      </div>

      {erroConexao && (
        <div className="alert d-flex align-items-center gap-2 p-3 small border-0 mb-4" style={{ backgroundColor: '#450A0A', color: '#FECACA', borderRadius: '10px' }}>
          <AlertTriangle size={18} /> <span>{erroConexao}</span>
        </div>
      )}

      {/* PLACAS DE MÉTRICAS PARA SINALIZAR QUANTIDADES GERAIS */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-md-4">
          <div className="card p-3 border-0 rounded-4 d-flex flex-row align-items-center gap-3" style={{ backgroundColor: '#151518' }}>
            <div className="p-2.5 rounded-3 bg-primary bg-opacity-10 text-primary"><Users size={22} /></div>
            <div>
              <span className="text-secondary small d-block">Efetivo Cadastrado</span>
              <h3 className="fw-bold m-0 text-white">{totalFuncionarios} <span className="fs-6 text-secondary fw-normal">colaboradores</span></h3>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card p-3 border-0 rounded-4 d-flex flex-row align-items-center gap-3" style={{ backgroundColor: '#151518' }}>
            <div className="p-2.5 rounded-3 bg-success bg-opacity-10 text-success"><UserCheck size={22} /></div>
            <div>
              <span className="text-secondary small d-block">Operando em Obras</span>
              <h3 className="fw-bold m-0 text-white">{totalAlocados} <span className="fs-6 text-secondary fw-normal">em campo</span></h3>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card p-3 border-0 rounded-4 d-flex flex-row align-items-center gap-3" style={{ backgroundColor: '#151518' }}>
            <div className="p-2.5 rounded-3 bg-secondary bg-opacity-10 text-secondary"><UserPlus size={22} /></div>
            <div>
              <span className="text-secondary small d-block">Banco de Reserva (Disponíveis)</span>
              <h3 className="fw-bold m-0 text-white">{totalDisponiveis} <span className="fs-6 text-secondary fw-normal">aguardando</span></h3>
            </div>
          </div>
        </div>
      </div>

      {/* PAINEL DE CONTROLE FILTRADO CONTRA WALL OF TEXT */}
      <div className="card p-3 border-0 rounded-4 mb-4 d-flex flex-column flex-md-row gap-3 align-items-md-center justify-content-between" style={{ backgroundColor: '#151518' }}>
        <div className="d-flex align-items-center px-3 rounded-3 flex-grow-1" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)', maxWidth: '300px' }}>
          <Search size={18} className="text-secondary me-2" />
          <input type="text" className="form-control bg-transparent border-0 text-white shadow-none py-2 small" placeholder="Buscar operário por nome..." value={busca} onChange={e => setBusca(e.target.value)} />
        </div>

        <div className="d-flex gap-2 flex-wrap">
          {/* Seletor de Departamento */}
          <select className="form-select bg-transparent text-secondary border-secondary border-opacity-30 small shadow-none" style={{ width: '180px', backgroundColor: '#151518' }} value={filtroDepartamento} onChange={e => setFiltroDepartamento(e.target.value)}>
            <option value="TODOS">-- Todos Departamentos --</option>
            {departamentosUnicos.map((dept, idx) => (
              <option key={idx} value={dept}>{dept}</option>
            ))}
          </select>

          {/* Seletor de Localização / Obra */}
          <select className="form-select bg-transparent text-secondary border-secondary border-opacity-30 small shadow-none" style={{ width: '180px', backgroundColor: '#151518' }} value={filtroAlocacao} onChange={e => setFiltroAlocacao(e.target.value)}>
            <option value="TODOS">-- Todas Alocações --</option>
            <option value="DISPONIVEL">Disponíveis (Sem Obra)</option>
            {obrasAtivas.map(o => (
              <option key={o.id} value={o.id}>{o.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TABELA PRINCIPAL */}
      <div className="card p-4 border-0 rounded-4" style={{ backgroundColor: '#151518' }}>
        {carregandoDados ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning spinner-border-sm me-2" style={{ color: '#F97316' }} />
            <span className="text-secondary small">Consultando registros...</span>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-5 text-secondary d-flex flex-column align-items-center gap-2">
            <UserX size={32} /> <span className="small">Nenhum colaborador corresponde aos filtros aplicados.</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover m-0" style={{ '--bs-table-bg': 'transparent' }}>
              <thead>
                <tr className="text-secondary small border-bottom" style={{ borderColor: 'rgba(38, 38, 41, 0.6)' }}>
                  <th className="py-3">Nome</th>
                  <th className="py-3">Cargo</th>
                  <th className="py-3">Departamento</th>
                  <th className="py-3">Horas/Mês</th>
                  <th className="py-3">Salário</th>
                  <th className="py-3">Obra / Alocação</th>
                  <th className="py-3">Status</th>
                  <th className="py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((func) => (
                  <tr key={func.id} className="align-middle border-bottom" style={{ borderColor: 'rgba(38, 38, 41, 0.2)' }}>
                    <td className="py-3 fw-medium text-white">{func.nome}</td>
                    <td className="text-secondary">{func.cargo}</td>
                    <td className="text-secondary">{func.departamento}</td>
                    <td className="text-secondary">{func.horas}</td>
                    <td className="text-white">R$ {Number(func.salario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    
                    <td>
                      {!func.obra_id || func.obra_status === 'Finalizada' ? (
                        <span className="badge px-2 py-1 rounded bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-10 small">
                          Disponível
                        </span>
                      ) : (
                        <span className="text-warning small d-flex align-items-center gap-1 fw-medium">
                          <Briefcase size={12} /> {func.obra_nome}
                        </span>
                      )}
                    </td>

                    <td>
                      <span className={`badge px-2.5 py-1 rounded small ${func.status === 'Ativo' ? 'bg-success bg-opacity-10 text-success' : 'bg-primary bg-opacity-10 text-primary'}`}>
                        {func.status}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-1">
                        <button onClick={() => abrirEdicao(func)} className="btn p-2 border-0 bg-transparent text-secondary shadow-none icon-edit-hover" title="Editar / Alocar"><Edit2 size={15} /></button>
                        <button onClick={() => { setFuncionarioSelecionado(func); setModalDeletarAberto(true); }} className="btn p-2 border-0 bg-transparent text-secondary shadow-none icon-delete-hover" title="Excluir"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .icon-delete-hover:hover { color: #EF4444 !important; }
        .icon-edit-hover:hover { color: #F97316 !important; }
      `}</style>

      {/* MODAL 1: CADASTRO */}
      {modalAberto && (
        <div className="d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 2000 }}>
          <div className="card p-4 border w-100 mx-3" style={{ backgroundColor: '#151518', maxWidth: '500px', borderRadius: '16px', color: '#FFFFFF', borderColor: 'rgba(38, 38, 41, 0.6)' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0 text-white">Cadastrar Novo Colaborador</h5>
              <button onClick={() => setModalAberto(false)} className="btn p-0 text-secondary border-0 bg-transparent shadow-none"><X size={20} /></button>
            </div>
            {erroForm && <div className="alert alert-danger p-2 small border-0 mb-3" style={{ backgroundColor: '#450A0A', color: '#FECACA' }}>{erroForm}</div>}
            <form onSubmit={handleCadastrar} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label small text-secondary mb-1">Nome Completo</label>
                <input type="text" required className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formFunc.nome} onChange={e => setFormFunc({...formFunc, nome: e.target.value})} />
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small text-secondary mb-1">Cargo</label>
                  <input type="text" required className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formFunc.cargo} onChange={e => setFormFunc({...formFunc, cargo: e.target.value})} />
                </div>
                <div className="col-6">
                  <label className="form-label small text-secondary mb-1">Departamento</label>
                  <input type="text" required className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formFunc.departamento} onChange={e => setFormFunc({...formFunc, departamento: e.target.value})} />
                </div>
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small text-secondary mb-1">Salário Bruto</label>
                  <input type="number" step="0.01" required className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formFunc.salario} onChange={e => setFormFunc({...formFunc, salario: e.target.value})} />
                </div>
                <div className="col-6">
                  <label className="form-label small text-secondary mb-1">Carga Horária</label>
                  <input type="text" className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formFunc.horas} onChange={e => setFormFunc({...formFunc, hours: e.target.value})} />
                </div>
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small text-secondary mb-1">Status Inicial</label>
                  <select className="form-select text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formFunc.status} onChange={e => setFormFunc({...formFunc, status: e.target.value})}>
                    <option value="Ativo">Ativo</option>
                    <option value="Férias">Férias</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label small text-secondary mb-1">Alocar em Obra</label>
                  <select className="form-select text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formFunc.obra_id} onChange={e => setFormFunc({...formFunc, obra_id: e.target.value})}>
                    <option value="">-- Deixar Disponível --</option>
                    {obrasAtivas.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                  </select>
                </div>
              </div>
              <div className="d-flex gap-2 justify-content-end mt-2">
                <button type="button" onClick={() => setModalAberto(false)} className="btn btn-sm px-3 py-2 text-white border-0" style={{ backgroundColor: 'rgba(38, 38, 41, 0.6)' }}>Cancelar</button>
                <button type="submit" className="btn btn-sm px-3 py-2 text-black border-0 fw-semibold" style={{ backgroundColor: '#F97316' }}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIÇÃO / REALOCAÇÃO */}
      {modalEditarAberto && (
        <div className="d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 2000 }}>
          <div className="card p-4 border w-100 mx-3" style={{ backgroundColor: '#151518', maxWidth: '500px', borderRadius: '16px', color: '#FFFFFF', borderColor: 'rgba(38, 38, 41, 0.6)' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0 text-white">Editar / Realocar Funcionário</h5>
              <button onClick={() => setModalEditarAberto(false)} className="btn p-0 text-secondary border-0 bg-transparent shadow-none"><X size={20} /></button>
            </div>
            {erroForm && <div className="alert alert-danger p-2 small border-0 mb-3" style={{ backgroundColor: '#450A0A', color: '#FECACA' }}>{erroForm}</div>}
            <form onSubmit={handleEditar} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label small text-secondary mb-1">Nome Completo</label>
                <input type="text" required className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formFunc.nome} onChange={e => setFormFunc({...formFunc, nome: e.target.value})} />
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small text-secondary mb-1">Cargo</label>
                  <input type="text" required className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formFunc.cargo} onChange={e => setFormFunc({...formFunc, cargo: e.target.value})} />
                </div>
                <div className="col-6">
                  <label className="form-label small text-secondary mb-1">Alocação de Obra Atual</label>
                  <select className="form-select text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formFunc.obra_id} onChange={e => setFormFunc({...formFunc, obra_id: e.target.value})}>
                    <option value="">-- Sem Obra (Disponível) --</option>
                    {obrasAtivas.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                  </select>
                </div>
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small text-secondary mb-1">Salário Bruto</label>
                  <input type="number" step="0.01" required className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formFunc.salario} onChange={e => setFormFunc({...formFunc, salario: e.target.value})} />
                </div>
                <div className="col-6">
                  <label className="form-label small text-secondary mb-1">Status</label>
                  <select className="form-select text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formFunc.status} onChange={e => setFormFunc({...formFunc, status: e.target.value})}>
                    <option value="Ativo">Ativo</option>
                    <option value="Férias">Férias</option>
                  </select>
                </div>
              </div>
              <div className="d-flex gap-2 justify-content-end mt-2">
                <button type="button" onClick={() => setModalEditarAberto(false)} className="btn btn-sm px-3 py-2 text-white border-0" style={{ backgroundColor: 'rgba(38, 38, 41, 0.6)' }}>Cancelar</button>
                <button type="submit" disabled={carregandoSalvar} className="btn btn-sm px-3 py-2 text-black border-0 fw-semibold" style={{ backgroundColor: '#F97316' }}>Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELEÇÃO */}
      {modalDeletarAberto && funcionarioSelecionado && (
        <div className="d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000 }}>
          <div className="card p-4 border w-100 mx-3 text-center" style={{ backgroundColor: '#151518', maxWidth: '420px', borderRadius: '16px', color: '#FFFFFF', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
            <h5 className="fw-bold mb-2 text-danger">Excluir Colaborador</h5>
            <p className="text-secondary small mb-4">Deseja remover <strong className="text-white">{funcionarioSelecionado.nome}</strong> permanentemente?</p>
            <div className="d-flex gap-2 justify-content-center">
              <button type="button" onClick={() => setModalDeletarAberto(false)} className="btn btn-sm px-4 py-2 text-white border-0" style={{ backgroundColor: 'rgba(38, 38, 41, 0.6)', borderRadius: '8px' }}>Não</button>
              <button type="button" onClick={handleDeletar} className="btn btn-sm px-4 py-2 text-white border-0 fw-semibold" style={{ backgroundColor: '#EF4444', borderRadius: '8px' }}>Sim, Excluir</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
