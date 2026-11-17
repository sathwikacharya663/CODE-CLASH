import api from './axios'

export const getTeams = () => api.get('/admin/teams')
export const createTeam = (data) => api.post('/admin/teams', data)
export const updateTeam = (id, data) => api.put(`/admin/teams/${id}`, data)
export const deleteTeam = (id) => api.delete(`/admin/teams/${id}`)
export const bulkImportTeams = (formData) =>
  api.post('/admin/teams/bulk-import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
export const getLeaderboard = () => api.get('/admin/leaderboard')
export const unlockRound = (round) => api.post(`/admin/rounds/${round}/unlock`)
export const pauseRound = (round) => api.post(`/admin/rounds/${round}/pause`)
export const resumeRound = (round) => api.post(`/admin/rounds/${round}/resume`)
export const endRound = (round) => api.post(`/admin/rounds/${round}/end`)
export const resetRound = (round, clearSubmissions = true) =>
  api.post(`/admin/rounds/${round}/reset`, { clearSubmissions })
export const resetAllRounds = () => api.post('/admin/rounds/reset-all')
export const extendRound = (round, minutes) =>
  api.post(`/admin/rounds/${round}/extend`, { minutes })
export const selectTop10 = () => api.post('/admin/rounds/select-top10')
export const manualSelectTop10 = (teamIds) =>
  api.put('/admin/rounds/select-top10', { teamIds })
export const getSubmissions = (params) => api.get('/admin/submissions', { params })
export const adjustPoints = (id, delta) =>
  api.post(`/admin/submissions/${id}/adjust-points`, { delta })
export const getRoundStates = () => api.get('/admin/rounds')
export const getSettings = () => api.get('/admin/settings')
export const updateSettings = (data) => api.put('/admin/settings', data)
export const revealWinners = () => api.get('/admin/winners')
