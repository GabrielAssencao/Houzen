import { useState, useEffect, useRef } from 'react';
import { Mail, Lock, AlertCircle, LogIn, CheckCircle2, ArrowLeft, KeyRound } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../services/firebase'; 

export default function Login({ onLoginSucesso }) {
  let API_URL = import.meta.env.VITE_API_URL || 'https://houzen-back.onrender.com';
  const baseUrl = API_URL.replace(/\/api\/auth\/?$/, '').replace(/\/+$/, '');

  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  const [modoRecuperacao, setModoRecuperacao] = useState(searchParams.get('recover') === '1');
  const [emailRecuperacao, setEmailRecuperacao] = useState('');
  const [tipoContato, setTipoContato] = useState('whatsapp');
  const [contatoRecuperacao, setContatoRecuperacao] = useState('');
  const [statusRecuperacao, setStatusRecuperacao] = useState(''); 

  const canvasRef = useRef(null);
  const navigate = useNavigate(); 

  const cores = {
    fundo: '#09090B', card: 'rgba(21, 21, 24, 0.75)', laranja: '#F97316',
    borda: 'rgba(38, 38, 41, 0.6)', inputBg: '#0F0F11', textoPrincipal: '#FFFFFF', textoSecundario: '#A1A1AA'
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animacaoId;
    
    const ajustarTamanho = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    ajustarTamanho();
    window.addEventListener('resize', ajustarTamanho);

    const mouse = { x: null, y: null, raio: 150 };
    const rastrearMouse = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const limparMouse = () => { mouse.x = null; mouse.y = null; };

    window.addEventListener('mousemove', rastrearMouse);
    window.addEventListener('mouseleave', limparMouse);

    class Particula {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.4; this.vy = (Math.random() - 0.5) * 0.4;
        this.raio = Math.random() * 2.5 + 1; this.alfa = Math.random() * 0.5 + 0.2;
      }
      atualizar() {
        this.x += this.vx; this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x; const dy = mouse.y - this.y;
          const dist = Math.hypot(dx, dy);
          if (dist < mouse.raio) {
            const forca = (mouse.raio - dist) / mouse.raio;
            this.x -= (dx / dist) * forca * 0.6; this.y -= (dy / dist) * forca * 0.6;
          }
        }
      }
      desenhar() {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.raio, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(249, 115, 22, ${this.alfa})`; ctx.fill();
      }
    }

    class FormaGeometrica {
      constructor() {
        this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
        this.tamanho = Math.random() * 40 + 20; this.lados = Math.random() > 0.5 ? 4 : 3;
        this.rotacao = Math.random() * Math.PI; this.velRotacao = (Math.random() - 0.5) * 0.002;
        this.vx = (Math.random() - 0.5) * 0.15; this.vy = (Math.random() - 0.5) * 0.15;
      }
      atualizar() {
        this.x += this.vx; this.y += this.vy; this.rotacao += this.velRotacao;
        if (this.x < -100 || this.x > canvas.width + 100) this.x = Math.random() * canvas.width;
        if (this.y < -100 || this.y > canvas.height + 100) this.y = Math.random() * canvas.height;
      }
      desenhar() {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotacao);
        ctx.beginPath();
        for (let i = 0; i < this.lados; i++) {
          const angulo = (i * 2 * Math.PI) / this.lados;
          ctx.lineTo(this.tamanho * Math.cos(angulo), this.tamanho * Math.sin(angulo));
        }
        ctx.closePath(); ctx.strokeStyle = 'rgba(249, 115, 22, 0.05)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
      }
    }

    const quantidadeParticulas = Math.min(100, Math.floor((canvas.width * canvas.height) / 15000));
    const particulas = Array.from({ length: quantidadeParticulas }, () => new Particula());
    const formas = Array.from({ length: 12 }, () => new FormaGeometrica());

    const renderizar = () => {
      ctx.fillStyle = '#09090B'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      formas.forEach(forma => { forma.atualizar(); forma.desenhar(); });
      for (let i = 0; i < particulas.length; i++) {
        particulas[i].atualizar(); particulas[i].desenhar();
        for (let j = i + 1; j < particulas.length; j++) {
          const dist = Math.hypot(particulas[i].x - particulas[j].x, particulas[i].y - particulas[j].y);
          if (dist < 120) {
            ctx.beginPath(); ctx.moveTo(particulas[i].x, particulas[i].y); ctx.lineTo(particulas[j].x, particulas[j].y);
            ctx.strokeStyle = `rgba(249, 115, 22, ${(120 - dist) / 120 * 0.12})`; ctx.stroke();
          }
        }
      }
      animacaoId = requestAnimationFrame(renderizar);
    };
    renderizar();

    return () => {
      window.removeEventListener('resize', ajustarTamanho);
      window.removeEventListener('mousemove', rastrearMouse);
      window.removeEventListener('mouseleave', limparMouse);
      cancelAnimationFrame(animacaoId);
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault(); setErro(''); setSucesso(''); setCarregando(true);
    const endpoint = `${baseUrl}/api/auth/login`;

    try {
      const resposta = await axios.post(endpoint, { email, senha });
      const dados = resposta.data;
      
      localStorage.setItem('@Houzen:user', JSON.stringify(dados));
      setSucesso(`Bem-vindo, ${dados.nome}!`);
      
      const nivel = dados.nivel?.toLowerCase().trim();
      const isAdmin = ['admin', 'administrador', 'superadmin'].includes(nivel);
      const destino = dados.mustChangePassword ? '/change-temporary-password' : (isAdmin ? '/dashboard/admin' : '/dashboard');

      setTimeout(() => {
        onLoginSucesso(dados);
        navigate(destino, { replace: true }); 
      }, 1200);
      
    } catch (error) {
      if (error.response?.status === 404) {
        setErro('Serviço temporariamente indisponível. Rota não encontrada.');
      } else if (error.response?.status === 401) {
        setErro('E-mail ou senha incorretos.');
      } else if (error.response?.status === 403) {
        setErro(error.response?.data?.message || 'Conta inativa ou suspensa.');
      } else {
        setErro(error.response?.data?.message || 'Erro de conexão com o servidor.');
      }
    } finally { setCarregando(false); }
  };

  const handleGoogleLogin = async () => {
    setCarregando(true);
    const endpoint = `${baseUrl}/api/auth/google`;
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken(true);
      
      const resposta = await axios.post(endpoint, { idToken });
      const dados = resposta.data;
      
      localStorage.setItem('@Houzen:user', JSON.stringify(dados));
      onLoginSucesso(dados);
      
      const nivel = dados.nivel?.toLowerCase().trim();
      const isAdmin = ['admin', 'administrador', 'superadmin'].includes(nivel);
      const destino = dados.mustChangePassword ? '/change-temporary-password' : (isAdmin ? '/dashboard/admin' : '/dashboard');
      navigate(destino, { replace: true });
    } catch (error) {
      setErro('Falha ao autenticar com Google.');
    } finally {
      setCarregando(false);
    }
  };

  const handleRecuperarSenha = async (e) => {
    e.preventDefault(); setErro(''); setStatusRecuperacao('enviando');
    const endpoint = `${baseUrl}/api/auth/forgot-password`;
    
    try {
      await axios.post(endpoint, {
        email: emailRecuperacao,
        contactType: tipoContato,
        contact: contatoRecuperacao
      });
      setStatusRecuperacao('sucesso');
    } catch (error) {
      setStatusRecuperacao('erro');
      setErro(error.response?.data?.error || 'Erro ao solicitar redefinição.');
    }
  };

  return (
    <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100 position-relative py-5" style={{ backgroundColor: cores.fundo, fontFamily: 'Inter, sans-serif' }}>
      <canvas ref={canvasRef} className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 1, pointerEvents: 'none' }} />
      
      <style>{`
        .custom-input:focus-within { border-color: ${cores.laranja} !important; box-shadow: 0 0 0 1px ${cores.laranja} !important; }
        input:-webkit-autofill { -webkit-text-fill-color: ${cores.textoPrincipal} !important; -webkit-box-shadow: 0 0 0px 1000px ${cores.inputBg} inset !important; }
        .back-button-effect:hover { color: #FFFFFF !important; transform: translateX(-3px); }
        .google-btn-effect:hover { background-color: rgba(255, 255, 255, 0.03) !important; border-color: #FFFFFF !important; }
        .forgot-link:hover { color: #FFFFFF !important; text-decoration: underline !important; }
      `}</style>
      
      <div className="text-center" style={{ maxWidth: '440px', width: '100%', padding: '10px 20px', zIndex: 2 }}>
        <div className="mb-4 d-flex flex-column align-items-center">
          <div className="d-inline-flex p-3 rounded-4 mb-3 shadow" style={{ backgroundColor: cores.laranja, boxShadow: '0 8px 30px rgba(249, 115, 22, 0.3)' }}>
            {modoRecuperacao ? <KeyRound size={26} color="#FFFFFF" strokeWidth={2.5} /> : <LogIn size={26} color="#FFFFFF" strokeWidth={2.5} />}
          </div>
          <h2 className="fw-bold mb-1 text-white" style={{ fontSize: '28px', letterSpacing: '-0.5px' }}>
            {modoRecuperacao ? 'Recuperar Acesso' : 'Bem-vindo de volta'}
          </h2>
          <p style={{ color: cores.textoSecundario, fontSize: '15px' }}>
            {modoRecuperacao ? 'O suporte analisará sua solicitação e entrará em contato' : 'Entre na sua conta'}
          </p>
        </div>

        <div className="card p-4 p-md-5 shadow-lg border text-start position-relative" style={{ backgroundColor: cores.card, borderRadius: '20px', borderColor: cores.borda, backdropFilter: 'blur(16px)' }}>
          <button type="button" onClick={() => { if (modoRecuperacao) { setModoRecuperacao(false); setStatusRecuperacao(''); setErro(''); } else { navigate('/'); } }} className="btn p-0 d-inline-flex align-items-center gap-2 mb-4 bg-transparent border-0 shadow-none text-start back-button-effect transition-all" style={{ color: cores.textoSecundario, fontSize: '14px' }}>
            <ArrowLeft size={16} /> {modoRecuperacao ? 'Voltar para o Login' : 'Voltar para a página inicial'}
          </button>

          {erro && <div className="alert d-flex align-items-center gap-2 p-3 small border-0 mb-4" style={{ backgroundColor: '#450A0A', color: '#FECACA', borderRadius: '10px' }}><AlertCircle size={18} />{erro}</div>}
          {sucesso && <div className="alert d-flex align-items-center gap-2 p-3 small border-0 mb-4" style={{ backgroundColor: '#064E3B', color: '#D1FAE5', borderRadius: '10px' }}><CheckCircle2 size={18} color="#34D399" />{sucesso}</div>}
          
          {modoRecuperacao ? (
            statusRecuperacao === 'sucesso' ? (
              <div className="text-center py-3">
                <CheckCircle2 size={40} className="text-success mb-3 mx-auto" />
                <h6 className="text-white fw-bold">Solicitação registrada</h6>
                <p className="small text-secondary mb-4">Se os dados corresponderem a uma conta ativa, o suporte enviará uma senha temporária pelo contato informado.</p>
                <button onClick={() => setModoRecuperacao(false)} className="btn w-100 py-2 fw-semibold" style={{ backgroundColor: 'transparent', border: `1px solid ${cores.borda}`, color: '#FFFFFF' }}>Voltar ao login</button>
              </div>
            ) : (
              <form onSubmit={handleRecuperarSenha}>
                <div className="mb-4">
                  <label className="form-label fw-medium small mb-2 text-white">E-mail Cadastrado</label>
                  <div className="d-flex align-items-center px-3 custom-input" style={{ backgroundColor: cores.inputBg, border: `1px solid ${cores.borda}`, borderRadius: '10px' }}>
                    <Mail size={18} style={{ color: cores.textoSecundario }} />
                    <input type="email" className="form-control text-light py-2 border-0" placeholder="you@example.com" value={emailRecuperacao} onChange={e => setEmailRecuperacao(e.target.value)} required style={{ backgroundColor: 'transparent', boxShadow: 'none' }} />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-medium small mb-2 text-white">Forma de contato</label>
                  <select className="form-select text-light border-0" style={{ backgroundColor: cores.inputBg }} value={tipoContato} onChange={e => { setTipoContato(e.target.value); setContatoRecuperacao(''); }}>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">E-mail alternativo</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="form-label fw-medium small mb-2 text-white">{tipoContato === 'whatsapp' ? 'Número com DDD' : 'E-mail para contato'}</label>
                  <div className="d-flex align-items-center px-3 custom-input" style={{ backgroundColor: cores.inputBg, border: `1px solid ${cores.borda}`, borderRadius: '10px' }}>
                    <Mail size={18} style={{ color: cores.textoSecundario }} />
                    <input type={tipoContato === 'email' ? 'email' : 'tel'} className="form-control text-light py-2 border-0" placeholder={tipoContato === 'email' ? 'contato@example.com' : '(11) 99999-9999'} value={contatoRecuperacao} onChange={e => setContatoRecuperacao(e.target.value)} required maxLength={tipoContato === 'email' ? 254 : 24} style={{ backgroundColor: 'transparent', boxShadow: 'none' }} />
                  </div>
                </div>
                <button type="submit" className="btn w-100 py-2 fw-bold border-0 mb-2" disabled={statusRecuperacao === 'enviando'} style={{ backgroundColor: cores.laranja, borderRadius: '10px', color: '#000000', fontSize: '15px' }}>
                  {statusRecuperacao === 'enviando' ? <span className="spinner-border spinner-border-sm" /> : 'Solicitar Redefinição'}
                </button>
              </form>
            )
          ) : (
            <>
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label fw-medium small mb-2 text-white">E-mail</label>
                  <div className="d-flex align-items-center px-3 custom-input" style={{ backgroundColor: cores.inputBg, border: `1px solid ${cores.borda}`, borderRadius: '10px' }}>
                    <Mail size={18} style={{ color: cores.textoSecundario }} />
                    <input type="email" className="form-control text-light py-2 border-0" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ backgroundColor: 'transparent', boxShadow: 'none' }} />
                  </div>
                </div>
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label fw-medium small m-0 text-white">Senha</label>
                    <button type="button" onClick={() => setModoRecuperacao(true)} className="btn p-0 border-0 bg-transparent shadow-none small forgot-link transition-all" style={{ color: cores.textoSecundario, fontSize: '13px' }}>
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="d-flex align-items-center px-3 custom-input" style={{ backgroundColor: '#0F0F11', border: `1px solid ${cores.borda}`, borderRadius: '10px' }}>
                    <Lock size={18} style={{ color: cores.textoSecundario }} />
                    <input type="password" className="form-control text-light py-2 border-0" placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)} required style={{ backgroundColor: 'transparent', boxShadow: 'none' }} />
                  </div>
                </div>
                <button type="submit" className="btn w-100 py-2 fw-bold border-0" disabled={carregando} style={{ backgroundColor: cores.laranja, borderRadius: '10px', color: '#000000', fontSize: '15px' }}>
                  {carregando ? <span className="spinner-border spinner-border-sm" /> : 'Entrar'}
                </button>
              </form>

              <div className="d-flex align-items-center my-4">
                <hr className="flex-grow-1 m-0" style={{ borderColor: cores.borda, opacity: 0.3 }} />
                <span className="px-3 small" style={{ color: cores.textoSecundario, fontSize: '12px' }}>ou continue com</span>
                <hr className="flex-grow-1 m-0" style={{ borderColor: cores.borda, opacity: 0.3 }} />
              </div>

              <button type="button" onClick={handleGoogleLogin} className="btn w-100 py-2 d-flex align-items-center justify-content-center gap-2 google-btn-effect transition-all" style={{ backgroundColor: 'transparent', border: `1px solid ${cores.borda}`, borderRadius: '10px', color: '#FFFFFF', fontSize: '14px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" style={{ display: 'block' }}>
                  <path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.96 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.86 3c.9-2.7 3.4-4.6 6.64-4.6z"/>
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2 3.7-5 3.7-8.62z"/>
                  <path fill="#FBBC05" d="M5.36 14.17c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.5 6.5C.54 8.42 0 10.58 0 12s.54 3.58 1.5 5.5l3.86-3.33z"/>
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.89c-1.1.74-2.52 1.18-4.23 1.18-3.24 0-5.74-1.9-6.73-4.52l-3.83 2.96C3.44 20.3 7.39 23 12 23z"/>
                </svg>
                Entrar com o Google
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
