import { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, X, Trash2, Edit2, AlertTriangle, Box, Warehouse, Building, Bell } from 'lucide-react';

export default function SuppliesModule() {
  const [materiais, setMateriais] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [obras, setObras] = useState([]);
  
  // Filtros de Alta Escalabilidade
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('TODAS');
  const [sedeFiltroId, setSedeFiltroId] = useState('TODAS');
  const [obraFiltroId, setObraFiltroId] = useState('TODAS');
  
  // Notificações de Baixa Automatizada
  const [notificacoes, setNotificacoes] = useState([]);

  // Modais
  const [modalAberto, setModalAberto] = useState(false);
  const [modalSedeAberto, setModalSedeAberto] = useState(false);
  
  const [carregando, setCarregando] = useState(true);
  const [erroForm, setErroForm] = useState('');
  const [carregandoAction, setCarregandoAction] = useState(false);

  // O id no state ajuda a diferenciar entre Criar Novo e Editar
  const [formMat, setFormMat] = useState({
    id: null, nome: '', categoria: 'Cimento', qtd: '', preco: '', fornecedor: '', status: 'Disponível', destino: 'SEDE', vinculo_id: ''
  });
  const [nomeNovaSede, setNomeNovaSede] = useState('');

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

  const carregarDadosEstoque = async () => {
    setCarregando(true);
    try {
      const config = getAuthHeader();

      const [resSup, resSedes, resObras] = await Promise.all([
        axios.get(`${API_URL}/api/auth/suprimentos`, config),
        axios.get(`${API_URL}/api/auth/sedes`, config),
        axios.get(`${API_URL}/api/auth/obras`, config)
      ]);

      setMateriais(resSup.data.itens || []);
      setNotificacoes(resSup.data.notificacoes || []);
      setSedes(resSedes.data || []);
      setObras(resObras.data || []);
      setCarregando(false);
    } catch (err) {
      console.error(err);
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDadosEstoque();
  }, []);

  // Abrir Modal de Edição Preenchido
  const handleEditarClick = (mat) => {
    setErroForm('');
    setFormMat({
      id: mat.id,
      nome: mat.nome,
      categoria: mat.categoria,
      qtd: mat.qtd,
      preco: mat.preco,
      fornecedor: mat.fornecedor || '',
      status: mat.status,
      destino: mat.sede_id ? 'SEDE' : 'OBRA',
      vinculo_id: mat.sede_id || mat.obra_id || ''
    });
    setModalAberto(true);
  };

  // Cadastrar ou Editar Material (Função Unificada)
  const handleSalvarMaterial = async (e) => {
    e.preventDefault();
    setErroForm('');
    
    if (!formMat.vinculo_id) {
      setErroForm('Erro: Você precisa escolher obrigatoriamente um local de destino (Obra ou Sede)!');
      return;
    }

    setCarregandoAction(true);
    try {
      const payload = {
        nome: formMat.nome,
        categoria: formMat.categoria,
        qtd: formMat.qtd,
        preco: Number(formMat.preco),
        fornecedor: formMat.fornecedor,
        status: formMat.status,
        obra_id: formMat.destino === 'OBRA' ? Number(formMat.vinculo_id) : null,
        sede_id: formMat.destino === 'SEDE' ? Number(formMat.vinculo_id) : null
      };

      if (formMat.id) {
        // Se tem ID, faz UPDATE (PUT)
        await axios.put(`${API_URL}/api/auth/suprimentos/${formMat.id}`, payload, getAuthHeader());
      } else {
        // Se não tem ID, faz INSERT (POST)
        await axios.post(`${API_URL}/api/auth/suprimentos`, payload, getAuthHeader());
      }

      setModalAberto(false);
      carregarDadosEstoque();
    } catch (err) {
      setErroForm(err.response?.data?.error || 'Erro ao salvar.');
    } finally {
      setCarregandoAction(false);
    }
  };

  // Cadastrar Nova Sede de Armazenamento
  const handleCriarSede = async (e) => {
    e.preventDefault();
    if (!nomeNovaSede) return;
    try {
      await axios.post(`${API_URL}/api/auth/sedes`, { nome: nomeNovaSede }, getAuthHeader());
      setModalSedeAberto(false);
      setNomeNovaSede('');
      carregarDadosEstoque();
    } catch (err) {
      alert('Erro ao criar sede.');
    }
  };

  const handleDeletar = async (id) => {
    if (!window.confirm('Deseja excluir este suprimento?')) return;
    try {
      await axios.delete(`${API_URL}/api/auth/suprimentos/${id}`, getAuthHeader());
      carregarDadosEstoque();
    } catch (err) {
      alert('Erro ao deletar item.');
    }
  };

  // EXTRAÇÃO DINÂMICA DE CATEGORIAS EM TEMPO REAL
  const categoriasUnicas = [...new Set(materiais.map(m => m.categoria).filter(Boolean))];

  // FILTRAGEM INTELIGENTE
  const filtrados = materiais.filter(m => {
    const bateBusca = m.nome && m.nome.toLowerCase().includes(busca.toLowerCase());
    const bateSede = sedeFiltroId === 'TODAS' || m.sede_id?.toString() === sedeFiltroId;
    const bateObra = obraFiltroId === 'TODAS' || m.obra_id?.toString() === obraFiltroId;
    const bateCategoria = filtroCategoria === 'TODAS' || m.categoria === filtroCategoria;
    return bateBusca && bateSede && bateObra && bateCategoria;
  });

  // CÁLCULO DE QUANTIDADES
  const totalInsumosGeral = materiais.length;
  const totalItensSedeAtiva = materiais.filter(m => sedeFiltroId !== 'TODAS' ? m.sede_id?.toString() === sedeFiltroId : m.sede_id).length;
  const totalItensObraAtiva = materiais.filter(m => obraFiltroId !== 'TODAS' ? m.obra_id?.toString() === obraFiltroId : m.obra_id).length;

  return (
    <div style={{ position: 'relative' }}>
      
      {/* Cabeçalho */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold fs-3 mb-1" style={{ color: '#FFFFFF' }}>Módulo de Suprimentos</h1>
          <p className="text-secondary small">Inventário compartilhado entre almoxarifados e frentes de trabalho</p>
        </div>
        <div className="d-flex gap-2">
          <button onClick={() => setModalSedeAberto(true)} className="btn btn-sm px-3 py-2 border-0 text-white font-medium" style={{ backgroundColor: '#27272A', borderRadius: '8px' }}>
            + Nova Sede
          </button>
          <button onClick={() => { setFormMat({ id: null, nome: '', categoria: 'Cimento', qtd: '', preco: '', fornecedor: '', status: 'Disponível', destino: 'SEDE', vinculo_id: '' }); setModalAberto(true); }} className="btn btn-sm px-3 py-2 border-0 text-black fw-semibold" style={{ backgroundColor: '#F97316', borderRadius: '8px' }}>
            + Novo Material
          </button>
        </div>
      </div>

      {/* BANNER NOTIFICAÇÃO DE BAIXAS AUTOMÁTICAS */}
      {notificacoes.length > 0 && (
        <div className="alert p-3 border-0 mb-4 rounded-4 d-flex gap-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#FECACA' }}>
          <Bell size={24} className="text-danger flex-shrink-0" />
          <div>
            <h6 className="fw-bold m-0 text-white">Aviso de Baixa no Inventário</h6>
            <p className="small m-0 mt-1 text-secondary">
              Os seguintes materiais foram <strong>excluídos automaticamente</strong> do banco corporativo pois suas obras foram finalizadas:
            </p>
            <ul className="small mt-2 mb-0 pl-3">
              {notificacoes.map((n, i) => (
                <li key={i}><strong className="text-white">{n.nome}</strong> ({n.qtd}) alocado na obra <em>{n.obra_name || n.obra_nome}</em>.</li>
              ))}
            </ul>
            <p className="small m-0 mt-2 text-warning fw-medium">As quantidades globais e parciais já foram recalculadas abaixo.</p>
          </div>
        </div>
      )}

      {/* ICONES DE QUANTIDADES */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-md-4">
          <div className="card p-3 border-0 rounded-4 d-flex flex-row align-items-center gap-3" style={{ backgroundColor: '#151518' }}>
            <div className="p-2.5 rounded-3 bg-warning bg-opacity-10 text-warning"><Box size={22} /></div>
            <div>
              <span className="text-secondary small d-block">Total de Itens Ativos</span>
              <h3 className="fw-bold m-0 text-white">{totalInsumosGeral} <span className="fs-6 text-secondary fw-normal">insumos</span></h3>
            </div>
          </div>
        </div>

        {/* CARD SEDE SELECIONÁVEL */}
        <div className="col-12 col-md-4">
          <div className="card p-3 border-0 rounded-4 d-flex flex-row align-items-center gap-3" style={{ backgroundColor: '#151518' }}>
            <div className="p-2.5 rounded-3 bg-info bg-opacity-10 text-info"><Warehouse size={22} /></div>
            <div className="flex-grow-1">
              <span className="text-secondary small d-block">Quantidade por Sede</span>
              <div className="d-flex align-items-center gap-2 mt-0.5">
                <h4 className="fw-bold m-0 text-white">{totalItensSedeAtiva}</h4>
                <select className="form-select bg-transparent text-secondary border-0 p-0 fs-6 shadow-none cursor-pointer" style={{ maxWidth: '160px' }} value={sedeFiltroId} onChange={e => { setSedeFiltroId(e.target.value); setObraFiltroId('TODAS'); }}>
                  <option value="TODAS">-- Todas Sedes --</option>
                  {sedes.map(s => <option key={s.id} value={s.id} style={{ backgroundColor: '#151518' }}>{s.nome}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* CARD OBRA SELECIONÁVEL */}
        <div className="col-12 col-md-4">
          <div className="card p-3 border-0 rounded-4 d-flex flex-row align-items-center gap-3" style={{ backgroundColor: '#151518' }}>
            <div className="p-2.5 rounded-3 bg-success bg-opacity-10 text-success"><Building size={22} /></div>
            <div className="flex-grow-1">
              <span className="text-secondary small d-block">Quantidade por Obra</span>
              <div className="d-flex align-items-center gap-2 mt-0.5">
                <h4 className="fw-bold m-0 text-white">{totalItensObraAtiva}</h4>
                <select className="form-select bg-transparent text-secondary border-0 p-0 fs-6 shadow-none cursor-pointer" style={{ maxWidth: '160px' }} value={obraFiltroId} onChange={e => { setObraFiltroId(e.target.value); setSedeFiltroId('TODAS'); }}>
                  <option value="TODAS">-- Todas Obras --</option>
                  {obras.filter(o => o.status === 'Em Andamento').map(o => <option key={o.id} value={o.id} style={{ backgroundColor: '#151518' }}>{o.nome}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS CRUZADOS */}
      <div className="card p-3 border-0 rounded-4 mb-4 d-flex flex-column flex-md-row gap-3 align-items-md-center justify-content-between" style={{ backgroundColor: '#151518' }}>
        <div className="d-flex align-items-center px-3 rounded-3 flex-grow-1" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)', maxWidth: '300px' }}>
          <Search size={18} className="text-secondary me-2" />
          <input type="text" className="form-control bg-transparent border-0 text-white shadow-none py-2 small" placeholder="Buscar material por nome..." value={busca} onChange={e => setBusca(e.target.value)} />
        </div>

        <div className="d-flex gap-2">
          <select className="form-select bg-transparent text-secondary border-secondary border-opacity-30 small shadow-none" style={{ width: '190px', backgroundColor: '#151518' }} value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
            <option value="TODAS">-- Todas Categorias --</option>
            {categoriasUnicas.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* LISTAGEM (TABELA) */}
      <div className="card p-4 border-0 rounded-4" style={{ backgroundColor: '#151518' }}>
        {carregando ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning spinner-border-sm me-2" style={{ color: '#F97316' }} />
            <span className="text-secondary small">Sincronizando depósitos...</span>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-5 text-secondary small">Nenhum material localizado com a combinação de filtros ativa.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover m-0" style={{ '--bs-table-bg': 'transparent' }}>
              <thead>
                <tr className="text-secondary small border-bottom" style={{ borderColor: 'rgba(38, 38, 41, 0.6)' }}>
                  <th className="py-3">Material</th>
                  <th className="py-3">Categoria</th>
                  <th className="py-3">Quantidade</th>
                  <th className="py-3">Preço Unit.</th>
                  <th className="py-3">Localização Atual</th>
                  <th className="py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((mat) => (
                  <tr key={mat.id} className="align-middle border-bottom" style={{ borderColor: 'rgba(38, 38, 41, 0.2)' }}>
                    <td className="py-3 fw-medium text-white">{mat.nome}</td>
                    <td className="text-secondary small"><span className="px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>{mat.categoria}</span></td>
                    <td className="text-secondary fw-semibold">{mat.qtd}</td>
                    <td className="text-white">R$ {Number(mat.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    
                    <td>
                      {mat.sede_id ? (
                        <span className="badge px-2 py-1 bg-info bg-opacity-10 text-info small fw-normal">📍 {mat.sede_nome}</span>
                      ) : (
                        <span className="badge px-2 py-1 bg-warning bg-opacity-10 text-warning small fw-normal">🚧 {mat.obra_nome}</span>
                      )}
                    </td>

                    <td className="text-center">
                      {/* BOTOES DE AÇÃO - EDITAR E DELETAR */}
                      <button onClick={() => handleEditarClick(mat)} className="btn p-1 border-0 bg-transparent text-secondary icon-edit-hover shadow-none me-2" title="Editar"><Edit2 size={15} /></button>
                      <button onClick={() => handleDeletar(mat.id)} className="btn p-1 border-0 bg-transparent text-secondary icon-delete-hover shadow-none" title="Excluir"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: CADASTRAR/EDITAR INSUMO */}
      {modalAberto && (
        <div className="d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 2000 }}>
          <div className="card p-4 border w-100 mx-3" style={{ backgroundColor: '#151518', maxWidth: '500px', borderRadius: '16px', color: '#FFFFFF', borderColor: 'rgba(38, 38, 41, 0.6)' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0">{formMat.id ? 'Editar Material' : 'Cadastrar Novo Material'}</h5>
              <button onClick={() => setModalAberto(false)} className="btn p-0 text-secondary border-0 bg-transparent shadow-none"><X size={20} /></button>
            </div>
            {erroForm && <div className="alert alert-danger p-2 small border-0 mb-3" style={{ backgroundColor: '#450A0A', color: '#FECACA' }}><AlertTriangle size={14} className="me-1"/>{erroForm}</div>}
            
            <form onSubmit={handleSalvarMaterial} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label small text-secondary mb-1">Nome do Insumo</label>
                <input type="text" required placeholder="Ex: Areia Lavada M3" className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formMat.nome} onChange={e => setFormMat({...formMat, nome: e.target.value})} />
              </div>

              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small text-secondary mb-1">Categoria</label>
                  <select className="form-select text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formMat.categoria} onChange={e => setFormMat({...formMat, categoria: e.target.value})}>
                    <option value="Cimento">Cimento</option>
                    <option value="Aço">Aço</option>
                    <option value="Hidráulica">Hidráulica</option>
                    <option value="Elétrica">Elétrica</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label small text-secondary mb-1">Quantidade</label>
                  <input type="text" required placeholder="Ex: 50 sacos" className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formMat.qtd} onChange={e => setFormMat({...formMat, qtd: e.target.value})} />
                </div>
              </div>

              {/* SELEÇÃO DE DESTINO OBRIGATÓRIA */}
              <div className="p-3 rounded-3" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }}>
                <label className="form-label small text-warning fw-semibold mb-2">Vínculo de Destino Obrigatório</label>
                <div className="d-flex gap-4 small mb-2 text-secondary">
                  <label className="d-flex align-items-center gap-1.5 cursor-pointer"><input type="radio" name="dest" checked={formMat.destino === 'SEDE'} onChange={() => setFormMat({...formMat, destino: 'SEDE', vinculo_id: ''})} /> Armazenar na Sede</label>
                  <label className="d-flex align-items-center gap-1.5 cursor-pointer"><input type="radio" name="dest" checked={formMat.destino === 'OBRA'} onChange={() => setFormMat({...formMat, destino: 'OBRA', vinculo_id: ''})} /> Enviar direto para Obra</label>
                </div>

                <select required className="form-select text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#151518', border: '1px solid rgba(38, 38, 41, 0.3)' }} value={formMat.vinculo_id} onChange={e => setFormMat({...formMat, vinculo_id: e.target.value})}>
                  <option value="">-- Escolha o Destino Físico --</option>
                  {formMat.destino === 'SEDE' 
                    ? sedes.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)
                    : obras.filter(o => o.status === 'Em Andamento').map(o => <option key={o.id} value={o.id}>{o.nome}</option>)
                  }
                </select>
              </div>

              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small text-secondary mb-1">Preço Unitário (R$)</label>
                  <input type="number" step="0.01" required className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formMat.preco} onChange={e => setFormMat({...formMat, preco: e.target.value})} />
                </div>
                <div className="col-6">
                  <label className="form-label small text-secondary mb-1">Fornecedor</label>
                  <input type="text" placeholder="Nome da empresa" className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={formMat.fornecedor} onChange={e => setFormMat({...formMat, fornecedor: e.target.value})} />
                </div>
              </div>

              <div className="d-flex gap-2 justify-content-end mt-2">
                <button type="button" onClick={() => setModalAberto(false)} className="btn btn-sm px-3 py-2 text-white border-0" style={{ backgroundColor: 'rgba(38, 38, 41, 0.6)' }}>Cancelar</button>
                <button type="submit" disabled={carregandoAction} className="btn btn-sm px-3 py-2 text-black border-0 fw-semibold" style={{ backgroundColor: '#F97316' }}>{formMat.id ? 'Salvar Alterações' : 'Salvar Insumo'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADICIONAR NOVA SEDE */}
      {modalSedeAberto && (
        <div className="d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 2000 }}>
          <div className="card p-4 border w-100 mx-3" style={{ backgroundColor: '#151518', maxWidth: '400px', borderRadius: '16px', color: '#FFFFFF', borderColor: 'rgba(38, 38, 41, 0.6)' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0">Cadastrar Novo Almoxarifado / Sede</h5>
              <button onClick={() => setModalSedeAberto(false)} className="btn p-0 text-secondary border-0 bg-transparent shadow-none"><X size={20} /></button>
            </div>
            <form onSubmit={handleCriarSede} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label small text-secondary mb-1">Nome Identificador da Sede</label>
                <input type="text" required placeholder="Ex: Depósito Central Filial Sul" className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={nomeNovaSede} onChange={e => setNomeNovaSede(e.target.value)} />
              </div>
              <div className="d-flex gap-2 justify-content-end mt-2">
                <button type="button" onClick={() => setModalSedeAberto(false)} className="btn btn-sm px-3 py-2 text-white border-0" style={{ backgroundColor: 'rgba(38, 38, 41, 0.6)' }}>Cancelar</button>
                <button type="submit" className="btn btn-sm px-3 py-2 text-black border-0 fw-semibold" style={{ backgroundColor: '#F97316' }}>Salvar Sede</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .icon-delete-hover:hover { color: #EF4444 !important; }
        .icon-edit-hover:hover { color: #F97316 !important; }
      `}</style>
    </div>
  );
}
