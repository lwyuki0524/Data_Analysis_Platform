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
  getPreview: (id: string) => api.get(`/dataset/${id}/preview`),
  delete: (id: string) => api.delete(`/dataset/${id}`),
};

export const chatService = {
  ask: (datasetId: string | null, roomId: number, message: string) => 
    api.post('/chat', { dataset_id: datasetId, room_id: roomId, message }),
  getHistory: (roomId: number) => 
    api.get('/chat/history', { params: { room_id: roomId } }),
  deleteHistory: (id: number) => api.delete(`/chat/${id}`),
  
  // Chat Room Services
  createRoom: (name: string, datasetId: string | null) => 
    api.post('/chat/rooms', { name, dataset_id: datasetId }),
  getRooms: () => api.get('/chat/rooms'),
  deleteRoom: (id: number) => api.delete(`/chat/rooms/${id}`),
  updateRoom: (id: number, name: string) => api.put(`/chat/rooms/${id}`, { name }),
};

export const dashboardService = {
  create: (name: string, datasetId?: string) => api.post('/dashboard', { name, dataset_id: datasetId }),
  getAll: () => api.get('/dashboard'),
  getLatest: () => api.get('/dashboard/latest'),
  getById: (id: string) => api.get(`/dashboard/${id}`),
  update: (id: string, name: string) => api.put(`/dashboard/${id}`, { name }),
  delete: (id: string) => api.delete(`/dashboard/${id}`),
};

export default api;
