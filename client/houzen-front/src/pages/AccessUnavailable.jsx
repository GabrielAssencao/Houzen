import { LockKeyhole, LogOut } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

export default function AccessUnavailable() {
  const { usuario, onLogout } = useOutletContext();
  return (
    <div className="houzen-empty-state">
      <span className="houzen-empty-state__icon"><LockKeyhole size={26} /></span>
      <h1>Nenhum módulo liberado</h1>
      <p>A conta {usuario?.email} está ativa, mas ainda não possui módulos contratados. Solicite a liberação ao administrador da plataforma.</p>
      <button type="button" onClick={onLogout} className="btn houzen-button-secondary d-inline-flex align-items-center gap-2"><LogOut size={17} /> Sair da conta</button>
    </div>
  );
}
