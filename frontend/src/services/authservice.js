import api from './api';

const trimLeadingSlash = (path) => path.replace(/^\/+/g, '');

export const register = (data) => api.post(trimLeadingSlash('/auth/register'), data);
export const login = (data) => api.post(trimLeadingSlash('/auth/login'), data);
export const googleAuth = (token) => api.post(trimLeadingSlash('/auth/google'), { token });
export const getMe = () => api.get(trimLeadingSlash('/auth/me'));
export const updatePassword = (data) => api.put(trimLeadingSlash('/auth/update-password'), data);
export const forgotPassword = (email) => api.post(trimLeadingSlash('/auth/forgot-password'), { email });
export const resetPassword = (data) => api.post(trimLeadingSlash('/auth/reset-password'), data);
