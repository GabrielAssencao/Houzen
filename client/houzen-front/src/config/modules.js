export const MODULES = [
  { id: 'dashboard', name: 'Dashboard', description: 'Indicadores financeiros e visão geral.', path: '/dashboard' },
  { id: 'obras', name: 'Gestão de obras', description: 'Projetos, dados financeiros e operação das obras.' },
  { id: 'rh', name: 'Recursos Humanos', description: 'Funcionários, alocações e equipes.', path: '/dashboard/rh' },
  { id: 'suprimentos', name: 'Suprimentos', description: 'Estoque, fornecedores e almoxarifado.', path: '/dashboard/suprimentos' },
  { id: 'frota', name: 'Frota', description: 'Veículos, equipamentos e manutenções.', path: '/dashboard/frota' },
  { id: 'cronograma', name: 'Cronograma', description: 'Etapas e acompanhamento físico das obras.', path: '/dashboard/cronograma' }
];

export const ADMIN_LEVELS = ['admin', 'administrador', 'superadmin'];

export function isAdminUser(user) {
  return ADMIN_LEVELS.includes(user?.nivel);
}

export function hasModuleAccess(user, moduleId) {
  if (isAdminUser(user)) return true;
  return Array.isArray(user?.permissoes) && user.permissoes.includes(moduleId);
}

export function firstAllowedPath(user) {
  return MODULES.find((module) => module.path && hasModuleAccess(user, module.id))?.path || '/dashboard/access-unavailable';
}
