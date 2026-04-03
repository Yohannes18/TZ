const rawApiBase =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

const normalizedApiBase = rawApiBase.endsWith('/')
  ? rawApiBase.slice(0, -1)
  : rawApiBase;

export const API_URL = normalizedApiBase.endsWith('/api')
  ? normalizedApiBase.slice(0, -4)
  : normalizedApiBase;

export const API_BASE_URL = normalizedApiBase.endsWith('/api')
  ? normalizedApiBase
  : `${normalizedApiBase}/api`;
