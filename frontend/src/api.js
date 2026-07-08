const normalizeBaseUrl = (value) => (value || '').replace(/\/$/, '');

export const getApiBaseUrlCandidates = () => {
  const configured = normalizeBaseUrl(import.meta.env.VITE_API_URL);
  const candidates = [];

  if (configured) {
    candidates.push(configured);
  }

  ['http://localhost:5000', 'http://localhost:5001', 'http://localhost:5002', 'http://localhost:5003'].forEach((candidate) => {
    if (!candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  });

  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = normalizeBaseUrl(window.location.origin);
    if (!candidates.includes(origin)) {
      candidates.push(origin);
    }
  }

  return candidates;
};

export const fetchApi = async (path, options = {}) => {
  let lastError;

  for (const baseUrl of getApiBaseUrlCandidates()) {
    try {
      const response = await fetch(`${baseUrl}${path}`, options);
      if (response.status !== 404) {
        return response;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Unable to reach backend');
};
