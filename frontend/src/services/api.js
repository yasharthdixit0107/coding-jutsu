import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 30000,
});

export const scanText = async (text) => {
  const response = await api.post('/api/scan/text', { text });
  return response.data;
};

export const scanFile = async (formData) => {
  const response = await api.post('/api/scan/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const scanEmail = async (data) => {
  const response = await api.post('/api/scan/email', data);
  return response.data;
};

export const getIncidents = async (page = 1, limit = 20, action = null) => {
  let url = `/api/incidents?page=${page}&limit=${limit}`;
  if (action && action !== 'All') url += `&action=${action.toLowerCase()}`;
  const response = await api.get(url);
  return response.data;
};

export const getStats = async () => {
  const response = await api.get('/api/stats');
  return response.data;
};

export const getPolicies = async () => {
  const response = await api.get('/api/policies');
  return response.data;
};

export const updatePolicy = async (data_type, action) => {
  const response = await api.put('/api/policies', { data_type, action });
  return response.data;
};
