import { Check, Moon, Settings, Sun } from 'lucide-react';
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api, { getApiError } from '../services/api';
import { useNotifications } from '../components/notificationContext';

const themes = [
  { id: 'dark', name: 'Escuro', description: 'Menor luminosidade e maior contraste.', icon: Moon },
  { id: 'light', name: 'Claro', description: 'Superfícies claras para ambientes iluminados.', icon: Sun }
];

export default function SettingsPage() {
  const { usuario, onUserUpdated } = useOutletContext();
  const [saving, setSaving] = useState('');
  const { notify } = useNotifications();
  const currentTheme = usuario?.theme || 'dark';

  const updateTheme = async (theme) => {
    if (theme === currentTheme || saving) return;
    setSaving(theme);
    try {
      const { data } = await api.put('/api/auth/preferences/theme', { theme });
      onUserUpdated(data);
      notify({ type: 'success', title: 'Preferência salva', message: `O tema ${theme === 'light' ? 'claro' : 'escuro'} foi aplicado ao seu perfil.` });
    } catch (error) {
      notify({ type: 'error', title: 'Tema não atualizado', message: getApiError(error) });
    } finally {
      setSaving('');
    }
  };

  return (
    <div className="houzen-page houzen-settings-page">
      <header className="houzen-page-header">
        <div>
          <span className="houzen-eyebrow"><Settings size={15} /> Preferências</span>
          <h1>Configurações da conta</h1>
          <p>Personalize sua experiência. Esta escolha fica salva somente no seu perfil.</p>
        </div>
      </header>

      <section className="houzen-panel">
        <div className="houzen-section-heading">
          <div>
            <h2>Aparência do sistema</h2>
            <p>O tema é aplicado aos painéis e módulos. A landing page permanece com o visual original.</p>
          </div>
        </div>
        <div className="houzen-theme-grid" role="radiogroup" aria-label="Tema da interface">
          {themes.map((theme) => {
            const Icon = theme.icon;
            const selected = currentTheme === theme.id;
            return (
              <button key={theme.id} type="button" role="radio" aria-checked={selected} disabled={Boolean(saving)} onClick={() => updateTheme(theme.id)} className={`houzen-theme-option ${selected ? 'is-selected' : ''}`}>
                <span className="houzen-theme-option__preview" data-preview-theme={theme.id}><Icon size={22} /></span>
                <span className="flex-grow-1 text-start"><strong>{theme.name}</strong><small>{theme.description}</small></span>
                {selected && <span className="houzen-theme-option__check"><Check size={16} /></span>}
                {saving === theme.id && <span className="spinner-border spinner-border-sm" aria-label="Salvando" />}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
