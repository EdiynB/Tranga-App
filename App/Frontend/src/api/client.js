import axios from 'axios';

const getBaseURL = () => {
  const envHost = window.__ENV__ && window.__ENV__.API_HOST;
  // If envHost is valid (not empty and not just "http://:6531"), use it
  if (envHost && envHost !== 'http://:6531' && envHost !== 'https://:6531') return envHost;

  // Fallback 1: Vite build-time variable
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

  // Fallback 2: If we are on an IP or non-localhost domain, assume API is on 6531 of the same machine
  const { hostname, protocol } = window.location;
  if (hostname !== 'localhost' && !hostname.includes('tjcs.io')) {
    return `${protocol}//${hostname}:6531`;
  }

  // Final fallback
  return 'https://trangaapi.tjcs.io';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000, // Increased timeout for slow RPi/Connectors
});

// Auth interceptor if needed (add if not present)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Adjust if using different storage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const useApi = async (url, method = 'GET', data = null) => {
  try {
    const response = await api[method.toLowerCase()](url, data);
    return response.data;
  } catch (error) {
    console.error(`API error for ${url}:`, error);
    if (error.response?.status === 401) {
      // Handle auth, e.g., redirect to login
      window.location.href = '/login';
    }
    throw error;
  }
};

// Export apiClient as a function that returns the api instance (matches SearchContext usage)
export const apiClient = () => api;

// Enhanced getCoverAsBlob with proper blob handling
export const getCoverAsBlob = async (mangaId, size = 'Original') => {
  try {
    const response = await api.get(`/v2/Manga/${mangaId}/Cover/${size}`, {
      responseType: 'blob',
      timeout: 45000 // Increased for slow covers
    });
    const blob = response.data;
    console.log('Raw blob from API:', { type: blob.type, size: blob.size, isBlob: blob instanceof Blob });
    if (blob && blob.type && blob.type.startsWith('image/')) {
      return blob;
    } else if (blob) {
      // Fallback: If not Blob (e.g., buffer), wrap it
      return new Blob([blob], { type: 'image/jpeg' }); // Default to jpeg
    }
    throw new Error('Invalid cover response: No data');
  } catch (error) {
    console.error(`Cover fetch error for ${mangaId}:`, error);
    throw error;
  }
};

export const getDownloadedChaptersCount = async (mangaId) => {
  try {
    const data = await useApi(`/v2/Manga/${mangaId}/Chapters/Downloaded`);
    return data.length || 0;
  } catch (error) {
    console.error('Error fetching downloaded chapters:', error);
    return 0;
  }
};

export const getTotalChaptersCount = async (mangaId) => {
  try {
    const data = await useApi(`/v2/Manga/${mangaId}/Chapters`);
    return data.length || 0;
  } catch (error) {
    console.error('Error fetching total chapters:', error);
    return 0;
  }
};

export default useApi;