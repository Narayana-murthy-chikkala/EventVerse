import api from './api';

export const getAllEvents = (params) => api.get('/events', { params });
export const getEventById = (id) => api.get(`/events/${id}`);
export const getFeaturedEvents = () => api.get('/events/featured');
export const getEventsByCategory = () => api.get('/events/categories');
export const getUpcomingEvents = () => api.get('/events/upcoming');

export const createEvent = (formData) =>
  api.post('/events', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateEvent = (id, formData) =>
  api.put(`/events/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteEvent = (id) => api.delete(`/events/${id}`);

export const registerForEvent = (data) => api.post('/registrations/register', data);
export const verifyPayment = (data) => api.post('/registrations/verify-payment', data);
export const cancelRegistration = (id) => api.delete(`/registrations/${id}/cancel`);
export const getRegistrationById = (id) => api.get(`/registrations/${id}`);
export const getMyRegistrations = () => api.get('/users/my-registrations');

export const updateProfile = (formData) =>
  api.put('/users/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getAdminStats = () => api.get('/admin/stats');
export const getAllUsers = (params) => api.get('/admin/users', { params });
export const updateUserRole = (id) => api.put(`/admin/users/${id}/role`);
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);
export const getAllAdminRegistrations = (params) => api.get('/admin/registrations', { params });
export const toggleFeatured = (id) => api.put(`/admin/events/${id}/feature`);
