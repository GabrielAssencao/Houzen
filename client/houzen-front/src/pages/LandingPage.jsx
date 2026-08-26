import { useState, Suspense } from 'react';
import { Link } from 'react-router-dom'; 
import { Canvas } from '@react-three/fiber';
import { ReactLenis, useLenis } from 'lenis/react'; 
import { motion } from 'framer-motion'; 
import axios from 'axios';
import { 
  HardHat, ArrowRight, Play, BarChart3, Users, Package, 
  Truck, CalendarDays, Shield, LayoutDashboard, X, CheckCircle2,
  AlertCircle // <-- Ícone de alerta importado
} from 'lucide-react';
import BuildingModel from '../components/3d/BuildingModel';
import QuartoAnimado from '../components/QuartoAnimado'; 
import 'lenis/dist/lenis.css'; 

const features = [
  { icon: BarChart3, title: 'Fluxo de Caixa', description: 'Controle completo de despesas e receitas com gráficos intuitivos e relatórios em tempo real.' },
  { icon: Users, title: 'Gestão de RH', description: 'Gerencie funcionários, horas trabalhadas, cargos e folha de pagamento em um só lugar.' },
  { icon: Package, title: 'Suprimentos', description: 'Inventário de materiais com controle de estoque mínimo e avaliação de fornecedores.' },
  { icon: Truck, title: 'Frota & Equipamentos', description: 'Acompanhe o status de máquinas e equipamentos com alertas de manutenção preventiva.' },
  { icon: CalendarDays, title: 'Cronograma', description: 'Linha do tempo visual das etapas da obra com alertas de atraso e progresso em tempo real.' },
  { icon: Shield, title: 'Segurança & Acesso', description: 'Níveis de acesso por perfil de usuário garantindo segurança dos dados do projeto.' },
];

const modules = [
  { icon: LayoutDashboard, title: 'Dashboard', desc: 'Visão geral de custos e receitas', color: 'linear-gradient(135deg, #F97316, #F59E0B)' },
  { icon: Users, title: 'RH', desc: 'Gestão completa de equipes', color: 'linear-gradient(135deg, #3B82F6, #06B6D4)' },
  { icon: Package, title: 'Suprimentos', desc: 'Controle de materiais e fornecedores', color: 'linear-gradient(135deg, #10B981, #22C55E)' },
  { icon: Truck, title: 'Frota', desc: 'Monitoramento de equipamentos', color: 'linear-gradient(135deg, #8B5CF6, #A855F7)' },
  { icon: CalendarDays, title: 'Cronograma', desc: 'Linha do tempo da obra', color: 'linear-gradient(135deg, #F43F5E, #EC4899)' },
];

export default function LandingPage({ usuario }) { 
  const [formCadastro, setFormCadastro] = useState({ nome: '', email: '', senha: '', nivel: 'comum' });
  const [modalResetAberto, setModalResetAberto] = useState(false);
  const [emailReset, setEmailReset] = useState('');
  
  const [statusCadastro, setStatusCadastro] = useState('');
  const [erroCadastro, setErroCadastro] = useState(''); // <-- NOVO ESTADO PARA GUARDAR A MENSAGEM DO BACK-END
  
  const [statusReset, setStatusReset] = useState('');

  const lenis = useLenis();

  const scrollToSection = (targetId) => {
    if (lenis) {
      lenis.scrollTo(`#${targetId}`, { 
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) 
      });
    }
  };

  // FUNÇÃO DE CADASTRO CORRIGIDA
  const handleCadastroTest = async (e) => {
    e.preventDefault();
    setStatusCadastro('processando');
    setErroCadastro(''); // Limpa os erros anteriores ao tentar de novo

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/usuarios/registrar_teste`, formCadastro);
      setStatusCadastro('sucesso');
      setFormCadastro({ nome: '', email: '', senha: '', nivel: 'comum' });
    } catch (err) { 
      setStatusCadastro('erro');
      // Pega a mensagem exata que o Back-end mandou (DNS inválido, email já existe, etc.)
      // Se a API não mandar nada estruturado, exibe um erro genérico
      setErroCadastro(err.response?.data?.error || 'Erro ao conectar com o servidor.');
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setStatusReset('enviando');
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, { email: emailReset });
      setStatusReset('sucesso');
    } catch (err) { setStatusReset('erro'); }
  };

  return (
    <ReactLenis root>
      <div style={{
        backgroundColor: '#0F0F11',
        backgroundImage: `radial-gradient(at 10% 20%, rgba(249, 115, 22, 0.04) 0px, transparent 50%), radial-gradient(at 90% 80%, rgba(39, 39, 42, 0.3) 0px, transparent 50%)`,
        color: '#FFFFFF',
        minHeight: '100vh',
        position: 'relative',
        overflowX: 'hidden'
      }}>
        
        {/* === NAVBAR FLUTUANTE === */}
        <motion.nav 
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, 
            backgroundColor: 'rgba(15, 15, 17, 0.85)', 
            backdropFilter: 'blur(20px)', 
            zIndex: 99999, 
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          <div className="container d-flex align-items-center justify-content-between py-3" style={{ height: '64px' }}>
            <div style={{ cursor: 'pointer' }} onClick={() => window.location.href = '/'} className="d-flex align-items-center gap-2 text-white">
              <div className="d-flex items-center justify-content-center rounded-3 p-1.5" style={{ backgroundColor: '#F97316' }}>
                <HardHat size={18} className="text-black" />
              </div>
              <span className="fw-bold fs-5 tracking-tight">Houzen<span style={{ color: '#F97316' }}>.</span></span>
            </div>
            
            <div className="d-none d-md-flex gap-4">
              <button onClick={() => scrollToSection('features')} className="btn p-0 text-secondary small hover-white bg-transparent border-0 shadow-none">Funcionalidades</button>
              <button onClick={() => scrollToSection('modules')} className="btn p-0 text-secondary small hover-white bg-transparent border-0 shadow-none">Módulos</button>
              <button onClick={() => scrollToSection('testar')} className="btn p-0 text-secondary small hover-white bg-transparent border-0 shadow-none">Demonstração</button>
            </div>
            
            <Link 
              to={usuario ? '/dashboard' : '/login'} 
              className="btn btn-sm px-4 py-2 border border-secondary border-opacity-30 text-white rounded-3 bg-transparent fw-semibold text-decoration-none"
              style={{ position: 'relative', zIndex: 100000 }}
            >
              {usuario ? 'Acessar Painel' : 'Entrar'}
            </Link>
          </div>
        </motion.nav>

        {/* === CANVAS 3D FLUTUANTE === */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none', overflow: 'hidden', filter: 'grayscale(100%) brightness(0.3) contrast(1.15)' }} className="d-none d-lg-block">
          <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
            <ambientLight intensity={0.7} />
            <directionalLight position={[10, 10, 5]} intensity={1.5} />
            <Suspense fallback={null}>
              <BuildingModel />
            </Suspense>
          </Canvas>
        </div>

        {/* === CONTEÚDO PRINCIPAL === */}
        <div className="container" style={{ position: 'relative', zIndex: 10, paddingTop: '110px' }}>
          
          {/* === HERO SECTION === */}
          <section className="d-flex align-items-center justify-content-start" style={{ minHeight: '85vh' }}>
            <div style={{ maxWidth: '640px' }}>
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
                <div className="inline-flex d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-pill mb-4 border border-warning border-opacity-20" style={{ backgroundColor: 'rgba(249, 115, 22, 0.08)' }}>
                  <div className="rounded-full animate-pulse" style={{ width: '6px', height: '6px', backgroundColor: '#F97316' }} />
                  <span className="text-xs font-semibold tracking-wide" style={{ color: '#F97316', fontSize: '11px' }}>PLATAFORMA DE GESTÃO CIVIL</span>
                </div>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="fw-extrabold text-white display-3 mb-4 tracking-tight" style={{ lineHeight: 1.05 }}>
                Gerencie suas <br /><span style={{ color: '#F97316' }}>obras</span> com <br />inteligência
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }} className="text-secondary fs-5 mb-5 leading-relaxed" style={{ maxWidth: '460px' }}>
                O Houzen unifica custos, equipe, suprimentos e cronograma em uma única plataforma elegante para engenharia civil.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }} className="d-flex gap-3 align-items-center">
                <button onClick={() => scrollToSection('testar')} className="btn btn-lg px-4 py-3 text-black fw-bold d-inline-flex align-items-center gap-2" style={{ backgroundColor: '#F97316', borderRadius: '8px', fontSize: '15px', border: '0' }}>
                  Começar Agora <ArrowRight size={16} />
                </button>
                <button onClick={() => scrollToSection('modules')} className="btn btn-lg px-4 py-3 border border-secondary border-opacity-30 text-white fw-semibold d-inline-flex align-items-center gap-2 bg-transparent" style={{ borderRadius: '8px', fontSize: '15px' }}>
                  <Play size={14} fill="white" /> Ver Módulos
                </button>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.8 }} className="d-flex gap-5 mt-5 pt-4 border-top border-secondary border-opacity-10">
                {[
                  { value: '150+', label: 'Obras gerenciadas' },
                  { value: '98%', label: 'Satisfação' },
                  { value: '24/7', label: 'Suporte Técnico' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="fs-3 fw-bold text-white m-0">{stat.value}</p>
                    <p className="text-secondary m-0" style={{ fontSize: '12px' }}>{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* === FUNCIONALIDADES === */}
          <section id="features" className="py-5 my-5">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-5">
              <span className="text-uppercase tracking-widest fw-semibold small" style={{ color: '#F97316' }}>Funcionalidades</span>
              <h2 className="fw-bold text-white display-5 mt-2">Tudo que sua obra precisa</h2>
              <p className="text-secondary mt-3 mx-auto small" style={{ maxWidth: '440px' }}>Módulos integrados para cobrir todas as áreas de gestão de uma obra de engenharia civil.</p>
            </motion.div>

            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
              {features.map((feat, index) => (
                <div className="col" key={feat.title}>
                  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.08 }} className="p-4 rounded-4 h-100 transition-all border border-secondary border-opacity-10 card-hover-effect" style={{ backgroundColor: '#151518' }}>
                    <div className="p-2.5 rounded-3 d-inline-block mb-4" style={{ backgroundColor: 'rgba(249, 115, 22, 0.08)', color: '#F97316' }}>
                      <feat.icon size={22} />
                    </div>
                    <h5 className="fw-bold text-white mb-2">{feat.title}</h5>
                    <p className="text-secondary small m-0 leading-relaxed">{feat.description}</p>
                  </motion.div>
                </div>
              ))}
            </div>
          </section>

          {/* === MÓDULOS === */}
          <section id="modules" className="py-5 my-5">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-5">
              <span className="text-uppercase tracking-widest fw-semibold small" style={{ color: '#F97316' }}>Módulos</span>
              <h2 className="fw-bold text-white display-5 mt-2">Ecossistema completo</h2>
              <p className="text-secondary mt-3 mx-auto small" style={{ maxWidth: '440px' }}>Navegue entre os módulos do painel e tenha controle total da sua obra.</p>
            </motion.div>

            <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-5 g-3">
              {modules.map((mod, index) => (
                <div className="col" key={mod.title}>
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.06 }} className="p-4 rounded-4 h-100 border border-secondary border-opacity-10 d-flex flex-column justify-content-between position-relative overflow-hidden group-card" style={{ backgroundColor: '#151518', cursor: 'pointer' }}>
                    <div>
                      <div className="p-2.5 rounded-3 d-inline-block mb-3 text-white shadow-sm" style={{ background: mod.color }}>
                        <mod.icon size={20} />
                      </div>
                      <h6 className="fw-bold text-white m-0">{mod.title}</h6>
                      <p className="text-secondary mt-1 m-0" style={{ fontSize: '11px' }}>{mod.desc}</p>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </section>

          {/* === CADASTRO DE TESTE PÚBLICO === */}
          <section id="testar" className="row py-5 my-5 align-items-center justify-content-between">
            <div className="col-12 col-lg-5">
              <div className="card p-4 border-0 rounded-4" style={{ backgroundColor: '#151518' }}>
                <h4 className="fw-bold text-white mb-1">Crie sua conta de demonstração</h4>
                <p className="text-secondary small mb-4">Adicione, edite e movimente insumos ou equipes livremente para testar.</p>

                {statusCadastro === 'sucesso' ? (
                  <div className="text-center py-4">
                    <CheckCircle2 size={48} className="text-success mb-3 mx-auto" />
                    <h5 className="fw-bold text-white">Conta criada!</h5>
                    <p className="text-secondary small mb-4">Acesse a tela principal utilizando as credenciais cadastradas.</p>
                    <Link to="/login" className="btn btn-sm w-100 py-2 text-black border-0 fw-semibold text-decoration-none" style={{ backgroundColor: '#F97316', display: 'block', textAlign: 'center' }}>Ir para Tela de Login</Link>
                  </div>
                ) : (
                  <form onSubmit={handleCadastroTest} className="d-flex flex-column gap-3">
                    
                    {/* ÁREA DE EXIBIÇÃO DE ERRO DO BACK-END */}
                    {statusCadastro === 'erro' && erroCadastro && (
                      <div className="alert border-0 text-danger small mb-1 p-3 d-flex align-items-center gap-2" style={{ backgroundColor: '#450A0A', borderRadius: '8px' }}>
                        <AlertCircle size={18} />
                        {erroCadastro}
                      </div>
                    )}

                    <div>
                      <label className="form-label small text-secondary mb-1">Nome / Construtora</label>
                      <input type="text" required placeholder="Seu nome ou empresa" className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(255,255,255,0.05)' }} value={formCadastro.nome} onChange={e => setFormCadastro({...formCadastro, nome: e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label small text-secondary mb-1">E-mail Corporativo</label>
                      <input type="email" required placeholder="nome@empresa.com" className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(255,255,255,0.05)' }} value={formCadastro.email} onChange={e => setFormCadastro({...formCadastro, email: e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label small text-secondary mb-1">Senha de Acesso</label>
                      <input type="password" required placeholder="Crie uma senha forte" className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(255,255,255,0.05)' }} value={formCadastro.senha} onChange={e => setFormCadastro({...formCadastro, senha: e.target.value})} />
                    </div>
                    
                    <button type="submit" disabled={statusCadastro === 'processando'} className="btn text-black fw-bold py-2.5 mt-2 border-0" style={{ backgroundColor: '#F97316', borderRadius: '6px' }}>
                      {statusCadastro === 'processando' ? 'Processando...' : 'Criar Conta de Teste'}
                    </button>
                    <div className="text-center mt-2">
                      <button type="button" onClick={() => { setStatusReset(''); setModalResetAberto(true); }} className="btn btn-sm text-secondary border-0 bg-transparent shadow-none small">Esqueceu sua senha?</button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* === NOVO CONTAINER ANIMADO NA DIREITA === */}
            <div className="col-12 col-lg-6 d-none d-lg-flex justify-content-center align-items-center">
              <QuartoAnimado />
            </div>

          </section>

          {/* === FOOTER === */}
          <footer id="about" className="py-5 border-top border-secondary border-opacity-10 mt-5">
            <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-4">
              <div className="d-flex align-items-center gap-2">
                <div className="rounded-2 p-1.5" style={{ backgroundColor: '#F97316' }}>
                  <HardHat size={14} className="text-black" />
                </div>
                <span className="fw-bold text-white small">Houzen</span>
              </div>
              <p className="text-secondary text-center m-0" style={{ fontSize: '13px' }}>
                Plataforma de gestão para engenharia civil — Projeto acadêmico © 2026
              </p>
              <div className="d-flex gap-4">
                <button onClick={() => scrollToSection('features')} className="btn p-0 text-secondary small hover-white bg-transparent border-0 shadow-none" style={{ fontSize: '12px' }}>Funcionalidades</button>
                <button onClick={() => scrollToSection('modules')} className="btn p-0 text-secondary small hover-white bg-transparent border-0 shadow-none" style={{ fontSize: '12px' }}>Módulos</button>
              </div>
            </div>
          </footer>
        </div>

        {/* === MODAL DE RECUPERAÇÃO DE SENHA === */}
        {modalResetAberto && (
          <div className="d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 3000 }}>
            <div className="card p-4 border w-100 mx-3" style={{ backgroundColor: '#151518', maxWidth: '420px', borderRadius: '16px', color: '#FFFFFF', borderColor: 'rgba(38, 38, 41, 0.6)' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold m-0 text-white d-flex align-items-center gap-2"> Recuperar Acesso</h5>
                <button onClick={() => setModalResetAberto(false)} className="btn p-0 text-secondary border-0 bg-transparent shadow-none"><X size={20} /></button>
              </div>
              <p className="text-secondary small mb-4">Insira seu e-mail cadastrado para enviarmos as instruções de redefinição.</p>

              {statusReset === 'sucesso' ? (
                <div className="alert border-0 text-success bg-success bg-opacity-10 small mb-2 p-3">
                  ✓ Link enviado! Verifique sua caixa de entrada.
                </div>
              ) : (
                <form onSubmit={handleRequestReset} className="d-flex flex-column gap-3">
                  <div>
                    <label className="form-label small text-secondary mb-1">E-mail Cadastrado</label>
                    <input type="email" required placeholder="exemplo@houzen.com" className="form-control text-white border-0 py-2 shadow-none" style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(38, 38, 41, 0.6)' }} value={emailReset} onChange={e => setEmailReset(e.target.value)} />
                  </div>
                  {statusReset === 'erro' && <div className="text-danger small">E-mail não localizado.</div>}
                  <div className="d-flex gap-2 justify-content-end mt-2">
                    <button type="button" onClick={() => setModalResetAberto(false)} className="btn btn-sm px-3 py-2 text-white border-0" style={{ backgroundColor: 'rgba(38, 38, 41, 0.6)' }}>Fechar</button>
                    <button type="submit" disabled={statusReset === 'enviando'} className="btn btn-sm px-3 py-2 text-black border-0 fw-semibold" style={{ backgroundColor: '#F97316' }}>
                      {statusReset === 'enviando' ? 'Enviando...' : 'Disparar Recuperação'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </ReactLenis>
  );
}
