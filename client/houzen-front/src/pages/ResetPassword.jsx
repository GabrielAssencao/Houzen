import { useState, useEffect, useRef } from 'react';
import { Lock, AlertCircle, CheckCircle2, KeySquare } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom'; 
import axios from 'axios';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token');

  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  const canvasRef = useRef(null);
  const navigate = useNavigate(); 

  const cores = {
    fundo: '#09090B',
    card: 'rgba(21, 21, 24, 0.75)',
    laranja: '#F97316',
    borda: 'rgba(38, 38, 41, 0.6)',
    inputBg: '#0F0F11',
    textoPrincipal: '#FFFFFF',
    textoSecundario: '#A1A1AA'
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

    const particulas = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      raio: Math.random() * 2 + 1,
    }));

    const renderizar = () => {
      ctx.fillStyle = cores.fundo; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      particulas.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.raio, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(249, 115, 22, 0.3)`;
        ctx.fill();
      });
      animacaoId = requestAnimationFrame(renderizar);
    };
    renderizar();

    return () => {
      window.removeEventListener('resize', ajustarTamanho);
      cancelAnimationFrame(animacaoId);
    };
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!resetToken) {
      setErro('Link de redefinição inválido. Solicite um novo link.');
      return;
    }
    if (senha.length < 8) {
      setErro('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem. Tente novamente.');
      return;
    }

    setCarregando(true);
    try {
      // CORREÇÃO APLICADA AQUI COM CRASES:
      await axios.put(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        token: resetToken,
        novaSenha: senha
      });

      setSucesso('Senha atualizada com sucesso!');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      setErro(error.response?.data?.error || 'Erro ao redefinir a senha. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100 position-relative py-5" style={{ backgroundColor: cores.fundo, fontFamily: 'Inter, sans-serif' }}>
      <canvas ref={canvasRef} className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 1, pointerEvents: 'none' }} />
      
      <style>{`
        .custom-input:focus-within { border-color: ${cores.laranja} !important; box-shadow: 0 0 0 1px ${cores.laranja} !important; }
      `}</style>
      
      <div className="text-center" style={{ maxWidth: '440px', width: '100%', padding: '10px 20px', zIndex: 2 }}>
        
        <div className="mb-4 d-flex flex-column align-items-center">
          <div className="d-inline-flex p-3 rounded-4 mb-3 shadow" style={{ backgroundColor: cores.laranja, boxShadow: '0 8px 30px rgba(249, 115, 22, 0.3)' }}>
            <KeySquare size={26} color="#FFFFFF" strokeWidth={2.5} />
          </div>
          <h2 className="fw-bold mb-1 text-white" style={{ fontSize: '28px', letterSpacing: '-0.5px' }}>Criar nova senha</h2>
          <p style={{ color: cores.textoSecundario, fontSize: '15px' }}>Digite sua nova senha de acesso</p>
        </div>

        <div className="card p-4 p-md-5 shadow-lg border text-start position-relative" style={{ backgroundColor: cores.card, borderRadius: '20px', borderColor: cores.borda, backdropFilter: 'blur(16px)' }}>
          
          {erro && <div className="alert d-flex align-items-center gap-2 p-3 small border-0 mb-4" style={{ backgroundColor: '#450A0A', color: '#FECACA', borderRadius: '10px' }}><AlertCircle size={18} />{erro}</div>}
          {sucesso && <div className="alert d-flex align-items-center gap-2 p-3 small border-0 mb-4" style={{ backgroundColor: '#064E3B', color: '#D1FAE5', borderRadius: '10px' }}><CheckCircle2 size={18} color="#34D399" />{sucesso}</div>}
          
          <form onSubmit={handleReset}>
            <div className="mb-3">
              <label className="form-label fw-medium small mb-2 text-white">Nova Senha</label>
              <div className="d-flex align-items-center px-3 custom-input" style={{ backgroundColor: cores.inputBg, border: `1px solid ${cores.borda}`, borderRadius: '10px' }}>
                <Lock size={18} style={{ color: cores.textoSecundario }} />
                <input 
                  type="password" 
                  className="form-control text-light py-2 border-0" 
                  placeholder="Mínimo de 8 caracteres"
                  value={senha} 
                  onChange={e => setSenha(e.target.value)} 
                  required 
                  style={{ backgroundColor: 'transparent', boxShadow: 'none' }} 
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-medium small mb-2 text-white">Confirmar Nova Senha</label>
              <div className="d-flex align-items-center px-3 custom-input" style={{ backgroundColor: cores.inputBg, border: `1px solid ${cores.borda}`, borderRadius: '10px' }}>
                <Lock size={18} style={{ color: cores.textoSecundario }} />
                <input 
                  type="password" 
                  className="form-control text-light py-2 border-0" 
                  placeholder="Repita a nova senha" 
                  value={confirmarSenha} 
                  onChange={e => setConfirmarSenha(e.target.value)} 
                  required 
                  style={{ backgroundColor: 'transparent', boxShadow: 'none' }} 
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn w-100 py-2 fw-bold border-0" 
              disabled={carregando || sucesso !== ''} 
              style={{ backgroundColor: cores.laranja, borderRadius: '10px', color: '#000000', fontSize: '15px' }}
            >
              {carregando ? <span className="spinner-border spinner-border-sm" /> : 'Salvar e Entrar'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
