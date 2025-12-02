import axios, { AxiosResponse, AxiosError } from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error: AxiosError) => {
    const { response } = error
    
    if (response) {
      switch (response.status) {
        case 401:
          ElMessage.error('认证失败，请重新登录')
          localStorage.removeItem('auth_token')
          window.location.href = '/login'
          break
        case 403:
          ElMessage.error('权限不足')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 429:
          ElMessage.error('请求过于频繁，请稍后重试')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(response.data?.message || '请求失败')
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络连接')
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }
    
    return Promise.reject(error)
  }
)

// 聊天API
export const chatAPI = {
  sendMessage: async (data: {
    message: string
    model: string
    chatId?: string
    userId: string
  }) => {
    const response = await api.post('/chat', data)
    return response.data
  },

  getHistory: async (userId: string) => {
    const response = await api.get('/chat/history', {
      params: { userId }
    })
    return response.data
  },

  getChatById: async (chatId: string) => {
    const response = await api.get(`/chat/${chatId}`)
    return response.data
  },

  createChat: async (data: {
    title: string
    userId: string
  }) => {
    const response = await api.post('/chat/new', data)
    return response.data
  },

  updateChatTitle: async (chatId: string, title: string) => {
    const response = await api.patch(`/chat/${chatId}/title`, { title })
    return response.data
  },

  deleteChat: async (chatId: string) => {
    const response = await api.delete(`/chat/${chatId}`)
    return response.data
  },

  clearHistory: async (userId: string) => {
    const response = await api.delete(`/chat/history/${userId}`)
    return response.data
  }
}

// 图像API
export const imageAPI = {
  generate: async (data: {
    prompt: string
    negativePrompt?: string
    size?: string
    count?: number
    quality?: number
    model?: string
    userId: string
  }) => {
    const response = await api.post('/image/generate', data)
    return response.data
  },

  getHistory: async (userId: string, page = 1, limit = 20) => {
    const response = await api.get('/image/history', {
      params: { userId, page, limit }
    })
    return response.data
  },

  getImageById: async (imageId: string) => {
    const response = await api.get(`/image/${imageId}`)
    return response.data
  },

  deleteImage: async (imageId: string) => {
    const response = await api.delete(`/image/${imageId}`)
    return response.data
  },

  editImage: async (imageId: string, editPrompt: string, userId: string) => {
    const response = await api.post(`/image/${imageId}/edit`, {
      editPrompt,
      userId
    })
    return response.data
  },

  createVariations: async (imageId: string, count: number, userId: string) => {
    const response = await api.post(`/image/${imageId}/variations`, {
      count,
      userId
    })
    return response.data
  }
}

// 代码API
export const codeAPI = {
  analyze: async (data: {
    code: string
    language: string
    model?: string
    userId: string
  }) => {
    const response = await api.post('/code/analyze', data)
    return response.data
  },

  generate: async (data: {
    prompt: string
    language: string
    model?: string
    userId: string
  }) => {
    const response = await api.post('/code/generate', data)
    return response.data
  },

  optimize: async (data: {
    code: string
    language: string
    model?: string
    userId: string
  }) => {
    const response = await api.post('/code/optimize', data)
    return response.data
  },

  detectErrors: async (data: {
    code: string
    language: string
    model?: string
    userId: string
  }) => {
    const response = await api.post('/code/errors', data)
    return response.data
  },

  explain: async (data: {
    code: string
    language: string
    model?: string
    userId: string
  }) => {
    const response = await api.post('/code/explain', data)
    return response.data
  },

  format: async (data: {
    code: string
    language: string
  }) => {
    const response = await api.post('/code/format', data)
    return response.data
  },

  getHistory: async (userId: string, page = 1, limit = 20) => {
    const response = await api.get('/code/history', {
      params: { userId, page, limit }
    })
    return response.data
  },

  deleteCodeRecord: async (codeId: string) => {
    const response = await api.delete(`/code/${codeId}`)
    return response.data
  }
}

// 认证API
export const authAPI = {
  signup: async (data: {
    username: string
    email: string
    password: string
  }) => {
    const response = await api.post('/auth/signup', data)
    return response.data
  },

  login: async (data: {
    email: string
    password: string
  }) => {
    const response = await api.post('/auth/login', data)
    return response.data
  },

  logout: async (token: string) => {
    const response = await api.post('/auth/logout', { token })
    return response.data
  },

  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refreshToken })
    return response.data
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async (data: {
    token: string
    newPassword: string
  }) => {
    const response = await api.post('/auth/reset-password', data)
    return response.data
  },

  verifyEmail: async (token: string) => {
    const response = await api.post('/auth/verify-email', { token })
    return response.data
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    return response.data
  }
}

// 设置API
export const settingsAPI = {
  getUserSettings: async (userId: string) => {
    const response = await api.get('/settings', {
      params: { userId }
    })
    return response.data
  },

  updateUserSettings: async (userId: string, settings: any) => {
    const response = await api.put('/settings', { userId, settings })
    return response.data
  },

  getAISettings: async (userId: string) => {
    const response = await api.get('/settings/ai', {
      params: { userId }
    })
    return response.data
  },

  updateAISettings: async (userId: string, settings: any) => {
    const response = await api.put('/settings/ai', { userId, settings })
    return response.data
  },

  testConnection: async (data: {
    userId: string
    provider: string
    apiKey: string
  }) => {
    const response = await api.post('/settings/test-connection', data)
    return response.data
  },

  resetSettings: async (userId: string, category?: string) => {
    const response = await api.post('/settings/reset', { userId, category })
    return response.data
  },

  exportSettings: async (userId: string) => {
    const response = await api.get('/settings/export', {
      params: { userId }
    })
    return response.data
  },

  importSettings: async (userId: string, settings: any) => {
    const response = await api.post('/settings/import', { userId, settings })
    return response.data
  },

  getSystemSettings: async () => {
    const response = await api.get('/settings/system')
    return response.data
  }
}

export default api