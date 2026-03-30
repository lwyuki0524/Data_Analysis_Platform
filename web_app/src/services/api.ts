import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export const datasetService = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/dataset/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAll: () => api.get('/dataset'),
  getById: (id: string) => api.get(`/dataset/${id}`),
  delete: (id: string) => api.delete(`/dataset/${id}`),
};

export const chatService = {
  ask: (datasetId: string | null, message: string) => 
    api.post('/chat', { dataset_id: datasetId, message }),
  getHistory: (datasetId?: string) => 
    api.get('/chat/history', { params: { dataset_id: datasetId } }),
};

export const dashboardService = {
  generate: (datasetId?: string) => api.post('/dashboard/generate', { dataset_id: datasetId }),
  getLatest: () => api.get('/dashboard/latest'),
  getById: (id: string) => api.get(`/dashboard/${id}`),
};

export default api;
