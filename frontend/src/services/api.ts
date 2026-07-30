import axios from 'axios'
import { motivate } from '@/utils/motivation'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toLowerCase()
    const url = response.config.url || ''
    const isMutation = ['post', 'put', 'patch', 'delete'].includes(method || '')
    const isAuthRoute = /^\/(login|register|logout|user|profile|change-password)/.test(url)
    if (isMutation && !isAuthRoute && response.status >= 200 && response.status < 300) {
      motivate()
    }
    return response
  },
  (error) => Promise.reject(error)
)

export default api