import api from './axios'

export const getSubmissions = (params) => api.get('/submissions', { params })
export const getSubmission = (id) => api.get(`/submissions/${id}`)
