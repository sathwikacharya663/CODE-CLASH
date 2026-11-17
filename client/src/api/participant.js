import api from './axios'

export const getRoundStatus = () => api.get('/participant/round-status')
export const getMySubmissions = (round) => api.get(`/participant/my-submissions/${round}`)
export const autoSave = (data) => api.post('/participant/autosave', data)
export const runCode = (data) => api.post('/submissions/run', data)
export const submitCode = (data) => api.post('/submissions/submit', data)
