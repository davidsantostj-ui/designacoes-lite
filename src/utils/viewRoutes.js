const VIEW_ALIASES = {
  ALERTS: 'NOTICES',
  ANNOUNCEMENTS: 'NOTICES',
  NOTIFICATIONS_LIST: 'NOTICES'
};

const VIEW_PATHS = {
  DASHBOARD: '/',
  ASSIGNMENTS_MONTH: '/minha-agenda',
  MEETINGS: '/programacao-da-reuniao',
  TALKS: '/discursos',
  SWAP_MARKET: '/trocas',
  NOTICES: '/avisos',
  SEARCH: '/busca',
  ADMIN: '/admin',
  SPECIAL_EVENTS: '/eventos-especiais'
};

const PATH_VIEWS = Object.entries(VIEW_PATHS).reduce((accumulator, [view, path]) => {
  accumulator[path] = view;
  return accumulator;
}, {});

const normalizeViewId = (value) => {
  const raw = String(value || '').trim().toUpperCase();
  if (!raw) return 'DASHBOARD';
  return VIEW_ALIASES[raw] || (raw in VIEW_PATHS ? raw : 'DASHBOARD');
};

const getPathForView = (value) => {
  const normalized = normalizeViewId(value);
  return VIEW_PATHS[normalized] || VIEW_PATHS.DASHBOARD;
};

const getViewFromPath = (pathname) => {
  const cleanPath = String(pathname || '').split('?')[0].split('#')[0] || '/';
  return PATH_VIEWS[cleanPath] || 'DASHBOARD';
};

export { VIEW_ALIASES, VIEW_PATHS, normalizeViewId, getPathForView, getViewFromPath };
