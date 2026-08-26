import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, X, Trash2, CheckCircle2, Clock, Calendar, AlertTriangle, Briefcase, Edit3 } from 'lucide-react';
import { useNotifications } from '../../components/notificationContext';

export default function TimelineModule() {
  const { notify } = useNotifications();
  const [obras, setObras] = useState([]);
  const [obraSelecionadaId, setObraSelecionadaId] = useState('');
  const [etapas, setEtapas] = useState([]);
  
  const [carregandoObras, setCarregandoObras] = useState(true);
  const [carregandoEtapas, setCarregandoEtapas] = useState(false);
  const [erroConexao, setErroConexao] = useState('');

  // Modais de Controle
  const [modalNovaObraAberto, setModalNovaObraAberto] = useState(false);
  const [modalEditarObraAberto, setModalEditarObraAberto] = useState(false);
  const [modalDeletarObraAberto, setModalDeletarAberto] = useState(false);
  const [modalNovaEtapaAberto, setModalNovaEtapaAberto] = useState(false);
  const [modalDeletarEtapaAberto, setModalDeletarEtapaAberto] = useState(false);

  // Estados de Operação de Dados
  const [etapaSelecionada, setEtapaSelecionada] = useState(null);
  const [carregandoAction, setCarregandoAction] = useState(false);
  const [, setErroForm] = useState('');

  // Formulários estruturados
  const [formObra, setFormObra] = useState({ nome: '', receitas: '', despesas: '', status: 'Em Andamento' });
  const [formEtapa, setFormEtapa] = useState({ fase: '', descricao: '', prazo: '', status: 'Pendente', ordem: '' });

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

  // 1. Carregar lista de todas as obras cadastradas
  const carregarObrasDoBanco = (idParaSelecionar = null) => {
    setCarregandoObras(true);
    axios.get(`${API_URL}/api/auth/obras`, getAuthHeader())
      .then(res => {
        if (Array.isArray(res.data)) {
          setObras(res.data);
          if (res.data.length > 0) {
            // Seleciona a primeira obra ou mantém a recém criada ativa
            setObraSelecionadaId(idParaSelecionar || res.data[0].id.toString());
          }
        }
        setCarregandoObras(false);
      })
      .catch(() => {
        setErroConexao('Falha ao conectar com o banco de Obras da empreiteira.');
        setCarregandoObras(false);
      });
  };

  // 2. Carregar o cronograma filtrado pela obra selecionada
  const carregarCronogramaDaObra = (id) => {
    if (!id) return;
    setCarregandoEtapas(true);
    axios.get(`${API_URL}/api/auth/cronograma?obra_id=${id}`, getAuthHeader())
      .then(res => {
        if (Array.isArray(res.data)) setEtapas(res.data);
        setCarregandoEtapas(false);
      })
      .catch(() => {
        setCarregandoEtapas(false);
      });
  };

  useEffect(() => {
    carregarObrasDoBanco();
  }, []);

  useEffect(() => {
    if (obraSelecionadaId) {
      carregarCronogramaDaObra(obraSelecionadaId);
    } else {
      setEtapas([]);
    }
  }, [obraSelecionadaId]);

  // Capturar dados da obra ativa para os cards de exibição
  const obraAtiva = obras.find(o => o.id.toString() === obraSelecionadaId);

  // OPERAÇÕES COM OBRAS
  const handleCriarObra = async (e) => {
    e.preventDefault();
    setCarregandoAction(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/obras`, formObra, getAuthHeader());
      setModalNovaObraAberto(false);
      carregarObrasDoBanco(res.data.id.toString());
    } catch (err) {
      setErroForm('Erro ao cadastrar projeto.');
    } finally {
      setCarregandoAction(false);
    }
  };

  const handleEditarObra = async (e) => {
    e.preventDefault();
    setCarregandoAction(true);
    try {
      await axios.put(`${API_URL}/api/auth/obras/${obraSelecionadaId}`, formObra, getAuthHeader());
      setModalEditarObraAberto(false);
      carregarObrasDoBanco(obraSelecionadaId);
    } catch (err) {
      setErroForm('Erro ao atualizar custos.');
    } finally {
      setCarregandoAction(false);
    }
  };

  const handleDeletarObra = async () => {
    setCarregandoAction(true);
    try {
      await axios.delete(`${API_URL}/api/auth/obras/${obraSelecionadaId}`, getAuthHeader());
      setModalDeletarAberto(false);
      setObraSelecionadaId('');
      carregarObrasDoBanco();
    } catch (err) {
      notify({ type: 'error', title: 'Obra não removida', message: err.response?.data?.error || 'Não foi possível excluir o projeto de obra.' });
    } finally {
      setCarregandoAction(false);
    }
  };

  // OPERAÇÕES COM O CRONOGRAMA INTERNO DA OBRA
  const handleCriarEtapa = async (e) => {
    e.preventDefault();
    setCarregandoAction(true);
    try {
      const payload = { ...formEtapa, obra_id: Number(obraSelecionadaId) };
      const res = await axios.post(`${API_URL}/api/auth/cronograma`, payload, getAuthHeader());
      setEtapas([...etapas, res.data].sort((a, b) => a.ordem - b.ordem));
      setModalNovaEtapaAberto(false);
      setFormEtapa({ fase: '', descricao: '', prazo: '', status: 'Pendente', ordem: '' });
    } catch (err) {
      setErroForm('Preencha os dados da fase corretamente.');
    } finally {
      setCarregandoAction(false);
    }
  };

  const handleAlternarStatusEtapa = async (etapa) => {
    let novoStatus = 'Pendente';
    if (etapa.status === 'Pendente') novoStatus = 'Em Andamento';
    else if (etapa.status === 'Em Andamento') novoStatus = 'Concluído';

    try {
      await axios.put(`${API_URL}/api/auth/cronograma/${etapa.id}`, { status: novoStatus }, getAuthHeader());
      setEtapas(etapas.map(item => item.id === etapa.id ? { ...item, status: novoStatus } : item));
    } catch (err) {
      notify({ type: 'error', title: 'Status não atualizado', message: err.response?.data?.error || 'Não foi possível alterar o status da etapa.' });
    }
  };

  const handleDeletarEtapa = async () => {
    setCarregandoAction(true);
    try {
      await axios.delete(`${API_URL}/api/auth/cronograma/${etapaSelecionada.id}`, getAuthHeader());
      setEtapas(etapas.filter(item => item.id !== etapaSelecionada.id));
      setModalDeletarEtapaAberto(false);
      setEtapaSelecionada(null);
    } catch (err) {
      notify({ type: 'error', title: 'Etapa não removida', message: err.response?.data?.error || 'Não foi possível excluir a etapa.' });
    } finally {
      setCarregandoAction(false);
    }
  };

  // Cálculo de Progresso Local da Obra Ativa
  const totalEtapas = etapas.length;
  const concluidas = etapas.filter(e => e.status === 'Concluído').length;
  const progressoPorcentagem = totalEtapas > 0 ? Math.round((concluidas / totalEtapas) * 100) : 0;

  return (
    <div style={{ position: 'relative' }}>
      
      {/* SELETOR DE OBRAS NO TOPO */}
      <div className="card p-3 border-0 rounded-4 mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3" style={{ backgroundColor: '#151518' }}>
        <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '400px' }}>
          <Briefcase size={20} style={{ color: '#F97316' }} />
          <select 
            className="form-select bg-transparent text-white border-0 fw-bold fs-5 shadow-none p-0"
            value={obraSelecionadaId}
            onChange={e => setObraSelecionadaId(e.target.value)}
            disabled={carregandoObras || obras.length === 0}
          >
            {obras.length === 0 ? (
              <option value="">Nenhuma Obra Cadastrada</option>
            ) : (
              obras.map(o => (
                <option key={o.id} value={o.id} style={{ backgroundColor: '#151518' }}>{o.nome}</option>
              ))
            )}
          </select>
        </div>

        {/* Gerenciadores Globais do Canteiro */}
        <div className="d-flex gap-2">
          <button onClick={() => { setFormObra({ nome: '', receitas: '', despesas: '', status: 'Em Andamento' }); setModalNovaObraAberto(true); }} className="btn btn-sm px-3 py-2 border-0 text-black fw-semibold d-flex align-items-center gap-1.5" style={{ backgroundColor: '#F97316', borderRadius: '6px' }}>
            <Plus size={16} /> Criar Nova Obra
          </button>
          {obraAtiva && (
            <>
              <button onClick={() => { setFormObra({ ...obraAtiva }); setModalEditarObraAberto(true); }} className="btn btn-sm px-3 py-2 border-0 text-white font-medium d-flex align-items-center gap-1.5" style={{ backgroundColor: '#27272A', borderRadius: '6px' }}>
                <Edit3 size={15} /> Ajustar Custos / Status
              </button>
              <button onClick={() => setModalDeletarAberto(true)} className="btn btn-sm border-0 text-secondary px-2 bg-transparent icon-delete-hover"><Trash2 size={16} /></button>
            </>
          )}
        </div>
      </div>

      {erroConexao && (
        <div className="alert d-flex align-items-center gap-2 p-3 small border-0 mb-4" style={{ backgroundColor: '#450A0A', color: '#FECACA', borderRadius: '10px' }}>
          <AlertTriangle size={18} /> <span>{erroConexao}</span>
        </div>
      )}

      {/* PAINEL FINANCEIRO DE CUSTOS DA OBRA ATIVA */}
      {obraAtiva && (
        <div className="row g-4 mb-4">
          <div className="col-12 col-md-4">
            <div className="card p-3 border-0 rounded-4" style={{ backgroundColor: '#151518' }}>
              <span className="text-secondary small d-block mb-1">Aportes (Faturamento)</span>
              <h4 className="fw-bold m-0 text-success">R$ {Number(obraAtiva.receitas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card p-3 border-0 rounded-4" style={{ backgroundColor: '#151518' }}>
              <span className="text-secondary small d-block mb-1">Gastos e Custos Alocados</span>
              <h4 className="fw-bold m-0 text-danger">R$ {Number(obraAtiva.despesas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card p-3 border-0 rounded-4" style={{ backgroundColor: '#151518' }}>
              <span className="text-secondary small d-block mb-1">Situação Comercial</span>
              <span className={`badge mt-1.5 px-2.5 py-1.5 rounded fw-semibold ${obraAtiva.status === 'Finalizada' ? 'bg-success bg-opacity-15 text-success' : 'bg-warning bg-opacity-15 text-warning'}`}>
                {obraAtiva.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO DO CRONOGRAMA INTERNO */}
      {obraAtiva && (
        <div className="card p-4 border-0 rounded-4" style={{ backgroundColor: '#151518' }}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h5 className="fw-bold text-white m-0" style={{ fontSize: '16px' }}>Evolução Cronológica</h5>
              <span className="text-secondary small">Progresso do projeto: {progressoPorcentagem}% concluído</span>
            </div>
            <button onClick={() => setModalNovaEtapaAberto(true)} className="btn btn-sm px-3 py-2 border-0 text-white d-flex align-items-center gap-1.5" style={{ backgroundColor: '#27272A', borderRadius: '6px' }}>
              <Plus size={15} /> Nova Etapa
            </button>
          </div>

          {carregandoEtapas ? (
            <div className="text-center py-5">
              <div className="spinner-border text-warning spinner-border-sm" style={{ color: '#F97316' }} />
            </div>
          ) : etapas.length === 0 ? (
            <div className="text-center py-5 text-secondary small">Nenhuma etapa inserida na linha do tempo deste projeto.</div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {etapas.map((etapa) => (
                <div key={etapa.id} className="p-3 rounded-4 d-flex align-items-center justify-content-between" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.4)' }}>
                  <div className="d-flex align-items-center gap-3">
                    <button onClick={() => handleAlternarStatusEtapa(etapa)} className="btn p-0 border-0 bg-transparent shadow-none">
                      {etapa.status === 'Concluído' ? <CheckCircle2 size={22} className="text-success" /> : etapa.status === 'Em Andamento' ? <Clock size={22} className="text-warning" /> : <div className="rounded-circle border border-2" style={{ width: '20px', height: '20px', borderColor: '#52525B' }} />}
                    </button>
                    <div>
                      <h6 className="text-white fw-bold m-0" style={{ fontSize: '14px' }}>{etapa.fase}</h6>
                      <p className="text-secondary small m-0">{etapa.descricao}</p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-4">
                    <span className="text-secondary small d-none d-md-flex align-items-center gap-1.5"><Calendar size={14} /> {etapa.prazo}</span>
                    <span className={`badge px-2 py-1 rounded small ${etapa.status === 'Concluído' ? 'bg-success bg-opacity-10 text-success' : etapa.status === 'Em Andamento' ? 'bg-warning bg-opacity-10 text-warning' : 'bg-secondary bg-opacity-10 text-secondary'}`}>{etapa.status}</span>
                    <button onClick={() => { setEtapaSelecionada(etapa); setModalDeletarEtapaAberto(true); }} className="btn p-1 border-0 bg-transparent text-secondary icon-delete-hover"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: CRIAR NOVA OBRA */}
      {modalNovaObraAberto && (
        <div className="d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 2000 }}>
          <div className="card p-4 border w-100 mx-3" style={{ backgroundColor: '#151518', maxWidth: '480px', borderRadius: '16px', color: '#FFFFFF', borderColor: 'rgba(38, 38, 41, 0.6)' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0">Cadastrar Novo Canteiro (Obra)</h5>
              <button onClick={() => setModalNovaObraAberto(false)} className="btn p-0 text-secondary border-0 bg-transparent shadow-none"><X size={20} /></button>
            </div>
            <form onSubmit={handleCriarObra} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label small text-secondary mb-1">Nome do Projeto / Obra</label>
                <input type="text" required placeholder="Ex: Residencial Bella Vista" className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formObra.nome} onChange={e => setFormObra({...formObra, nome: e.target.value})} />
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small text-secondary mb-1">Aporte Inicial (R$)</label>
                  <input type="number" step="0.01" placeholder="0.00" className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formObra.receitas} onChange={e => setFormObra({...formObra, receitas: e.target.value})} />
                </div>
                <div className="col-6">
                  <label className="form-label small text-secondary mb-1">Custo Inicial (R$)</label>
                  <input type="number" step="0.01" placeholder="0.00" className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formObra.despesas} onChange={e => setFormObra({...formObra, despesas: e.target.value})} />
                </div>
              </div>
              <div className="d-flex gap-2 justify-content-end mt-2">
                <button type="button" onClick={() => setModalNovaObraAberto(false)} className="btn btn-sm px-3 py-2 text-white border-0" style={{ backgroundColor: 'rgba(38, 38, 41, 0.6)' }}>Cancelar</button>
                <button type="submit" disabled={carregandoAction} className="btn btn-sm px-3 py-2 text-black border-0 fw-semibold" style={{ backgroundColor: '#F97316' }}>Salvar Projeto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR CUSTOS / FINALIZAR OBRA */}
      {modalEditarObraAberto && (
        <div className="d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 2000 }}>
          <div className="card p-4 border w-100 mx-3" style={{ backgroundColor: '#151518', maxWidth: '480px', borderRadius: '16px', color: '#FFFFFF', borderColor: 'rgba(38, 38, 41, 0.6)' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0">Ajustar Custos & Status da Obra</h5>
              <button onClick={() => setModalEditarObraAberto(false)} className="btn p-0 text-secondary border-0 bg-transparent shadow-none"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditarObra} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label small text-secondary mb-1">Aportes Consolidados (Receitas)</label>
                <input type="number" step="0.01" className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formObra.receitas} onChange={e => setFormObra({...formObra, receitas: e.target.value})} />
              </div>
              <div>
                <label className="form-label small text-secondary mb-1">Gastos Operacionais (Despesas / Custos)</label>
                <input type="number" step="0.01" className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formObra.despesas} onChange={e => setFormObra({...formObra, despesas: e.target.value})} />
              </div>
              <div>
                <label className="form-label small text-secondary mb-1">Situação Construtiva</label>
                <select className="form-select text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formObra.status} onChange={e => setFormObra({...formObra, status: e.target.value})}>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Finalizada">Finalizada (Obra Concluída)</option>
                </select>
              </div>
              <div className="d-flex gap-2 justify-content-end mt-2">
                <button type="button" onClick={() => setModalEditarObraAberto(false)} className="btn btn-sm px-3 py-2 text-white border-0" style={{ backgroundColor: 'rgba(38, 38, 41, 0.6)' }}>Cancelar</button>
                <button type="submit" disabled={carregandoAction} className="btn btn-sm px-3 py-2 text-black border-0 fw-semibold" style={{ backgroundColor: '#F97316' }}>Salvar Custos</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EXCLUIR OBRA INTEIRA */}
      {modalDeletarObraAberto && obraAtiva && (
        <div className="d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000 }}>
          <div className="card p-4 border w-100 mx-3 text-center" style={{ backgroundColor: '#151518', maxWidth: '420px', borderRadius: '16px', color: '#FFFFFF', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
            <h5 className="fw-bold mb-2 text-danger">Excluir Projeto de Obra</h5>
            <p className="text-secondary small mb-4">Tem certeza que deseja apagar <strong className="text-white">{obraAtiva.nome}</strong>? Isso apagará os balanços e as fases vinculadas a ela.</p>
            <div className="d-flex gap-2 justify-content-center">
              <button type="button" onClick={() => setModalDeletarAberto(false)} className="btn btn-sm px-4 py-2 text-white border-0" style={{ backgroundColor: 'rgba(38, 38, 41, 0.6)', borderRadius: '8px' }}>Não, Manter</button>
              <button type="button" onClick={handleDeletarObra} className="btn btn-sm px-4 py-2 text-white border-0 fw-semibold" style={{ backgroundColor: '#EF4444', borderRadius: '8px' }}>Sim, Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR NOVA ETAPA CRONOGRAMA */}
      {modalNovaEtapaAberto && (
        <div className="d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 2000 }}>
          <div className="card p-4 border w-100 mx-3" style={{ backgroundColor: '#151518', maxWidth: '500px', borderRadius: '16px', color: '#FFFFFF', borderColor: 'rgba(38, 38, 41, 0.6)' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0">Nova Etapa no Cronograma</h5>
              <button onClick={() => setModalNovaEtapaAberto(false)} className="btn p-0 text-secondary border-0 bg-transparent shadow-none"><X size={20} /></button>
            </div>
            <form onSubmit={handleCriarEtapa} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label small text-secondary mb-1">Título da Etapa</label>
                <input type="text" required placeholder="Ex: Fase 3: Concretagem da Laje" className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formEtapa.fase} onChange={e => setFormEtapa({...formEtapa, fase: e.target.value})} />
              </div>
              <div>
                <label className="form-label small text-secondary mb-1">Descrição</label>
                <textarea required rows={2} placeholder="O que será feito..." className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formEtapa.descricao} onChange={e => setFormEtapa({...formEtapa, descricao: e.target.value})} />
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small text-secondary mb-1">Prazo Estimado</label>
                  <input type="text" required placeholder="Ex: 20/11/2026" className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formEtapa.prazo} onChange={e => setFormEtapa({...formEtapa, prazo: e.target.value})} />
                </div>
                <div className="col-6">
                  <label className="form-label small text-secondary mb-1">Ordem na Fila</label>
                  <input type="number" required placeholder="Ex: 1, 2" className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formEtapa.ordem} onChange={e => setFormEtapa({...formEtapa, ordem: e.target.value})} />
                </div>
              </div>
              <div className="d-flex gap-2 justify-content-end mt-2">
                <button type="button" onClick={() => setModalNovaEtapaAberto(false)} className="btn btn-sm px-3 py-2 text-white border-0" style={{ backgroundColor: 'rgba(38, 38, 41, 0.6)' }}>Cancelar</button>
                <button type="submit" className="btn btn-sm px-3 py-2 text-black border-0 fw-semibold" style={{ backgroundColor: '#F97316' }}>Salvar Fase</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO EXCLUSÃO ETAPA */}
      {modalDeletarEtapaAberto && etapaSelecionada && (
        <div className="d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000 }}>
          <div className="card p-4 border w-100 mx-3 text-center" style={{ backgroundColor: '#151518', maxWidth: '420px', borderRadius: '16px', color: '#FFFFFF', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
            <h5 className="fw-bold mb-2 text-danger">Remover Etapa</h5>
            <p className="text-secondary small mb-4">Deseja excluir a etapa <strong className="text-white">{etapaSelecionada.fase}</strong>?</p>
            <div className="d-flex gap-2 justify-content-center">
              <button type="button" onClick={() => setModalDeletarEtapaAberto(false)} className="btn btn-sm px-4 py-2 text-white border-0" style={{ backgroundColor: 'rgba(38, 38, 41, 0.6)', borderRadius: '8px' }}>Cancelar</button>
              <button type="button" onClick={handleDeletarEtapa} className="btn btn-sm px-4 py-2 text-white border-0 fw-semibold" style={{ backgroundColor: '#EF4444', borderRadius: '8px' }}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .icon-delete-hover:hover { color: #EF4444 !important; }
      `}</style>

    </div>
  );
}
