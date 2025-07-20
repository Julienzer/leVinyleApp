// Utilitaire pour construire les URLs d'API
const getApiUrl = (path) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  // Nettoyer le path pour éviter les doubles slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

// Wrapper pour fetch avec URL API automatique
export const apiCall = async (path, options = {}) => {
  const url = getApiUrl(path);
  console.log(`🔗 API Call: ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    console.log(`📡 API Response: ${response.status} ${response.statusText}`);
    return response;
  } catch (error) {
    console.error(`❌ API Error for ${url}:`, error);
    throw error;
  }
};

// Helpers pour les requêtes courantes
export const api = {
  get: (path, token) => apiCall(path, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  }),
  
  post: (path, data, token) => apiCall(path, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  }),
  
  patch: (path, data, token) => apiCall(path, {
    method: 'PATCH', 
    body: JSON.stringify(data),
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  }),
  
  delete: (path, token) => apiCall(path, {
    method: 'DELETE',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  })
};

export default getApiUrl; 