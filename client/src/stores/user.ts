import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '@/services/api'

export interface User {
  id: string
  username: string
  email: string
  isEmailVerified?: boolean
  twoFactorAuth?: boolean
  createdAt: string
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string>('')
  const isLoading = ref(false)
  const error = ref<string>('')

  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isAuthenticated = computed(() => !!user.value)

  // 登录
  const login = async (credentials: { email: string; password: string }) => {
    try {
      isLoading.value = true
      error.value = ''

      const response = await authAPI.login(credentials)
      
      if (response.token && response.user) {
        token.value = response.token
        user.value = response.user
        localStorage.setItem('auth_token', response.token)
        
        return { success: true }
      } else {
        error.value = response.error || '登录失败'
        return { success: false, error: response.error }
      }
    } catch (err: any) {
      error.value = err.message || '登录失败'
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  // 注册
  const signup = async (userData: { username: string; email: string; password: string }) => {
    try {
      isLoading.value = true
      error.value = ''

      const response = await authAPI.signup(userData)
      
      if (response.user) {
        user.value = response.user
        
        return { success: true }
      } else {
        error.value = response.error || '注册失败'
        return { success: false, error: response.error }
      }
    } catch (err: any) {
      error.value = err.message || '注册失败'
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  // 登出
  const logout = async () => {
    try {
      if (token.value) {
        await authAPI.logout(token.value)
      }
      
      token.value = ''
      user.value = null
      localStorage.removeItem('auth_token')
      
      return { success: true }
    } catch (err: any) {
      error.value = err.message || '登出失败'
      return { success: false, error: err.message }
    }
  }

  // 刷新token
  const refreshToken = async () => {
    try {
      const storedToken = localStorage.getItem('refresh_token')
      if (!storedToken) {
        return { success: false, error: '没有刷新令牌' }
      }

      const response = await authAPI.refreshToken(storedToken)
      
      if (response.token) {
        token.value = response.token
        localStorage.setItem('auth_token', response.token)
        
        return { success: true }
      } else {
        error.value = response.error || '令牌刷新失败'
        return { success: false, error: response.error }
      }
    } catch (err: any) {
      error.value = err.message || '令牌刷新失败'
      return { success: false, error: err.message }
    }
  }

  // 获取当前用户
  const getCurrentUser = async () => {
    try {
      const storedToken = localStorage.getItem('auth_token')
      if (!storedToken) {
        return { success: false, error: '没有认证令牌' }
      }

      const response = await authAPI.getCurrentUser()
      
      if (response.user) {
        token.value = storedToken
        user.value = response.user
        
        return { success: true }
      } else {
        // 清除无效token
        localStorage.removeItem('auth_token')
        return { success: false, error: response.error || '获取用户信息失败' }
      }
    } catch (err: any) {
      error.value = err.message || '获取用户信息失败'
      return { success: false, error: err.message }
    }
  }

  // 忘记密码
  const forgotPassword = async (email: string) => {
    try {
      isLoading.value = true
      error.value = ''

      await authAPI.forgotPassword(email)
      
      return { success: true }
    } catch (err: any) {
      error.value = err.message || '发送重置邮件失败'
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  // 重置密码
  const resetPassword = async (data: { token: string; newPassword: string }) => {
    try {
      isLoading.value = true
      error.value = ''

      const response = await authAPI.resetPassword(data)
      
      if (response.user) {
        return { success: true }
      } else {
        error.value = response.error || '重置密码失败'
        return { success: false, error: response.error }
      }
    } catch (err: any) {
      error.value = err.message || '重置密码失败'
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  // 验证邮箱
  const verifyEmail = async (token: string) => {
    try {
      isLoading.value = true
      error.value = ''

      const response = await authAPI.verifyEmail(token)
      
      if (response.user) {
        if (user.value) {
          user.value.isEmailVerified = true
        }
        
        return { success: true }
      } else {
        error.value = response.error || '邮箱验证失败'
        return { success: false, error: response.error }
      }
    } catch (err: any) {
      error.value = err.message || '邮箱验证失败'
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  // 初始化认证状态
  const initAuth = async () => {
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken) {
      await getCurrentUser()
    }
  }

  // 清除错误
  const clearError = () => {
    error.value = ''
  }

  return {
    // 状态
    user: readonly(user),
    token: readonly(token),
    isLoading: readonly(isLoading),
    error: readonly(error),
    isLoggedIn,
    isAuthenticated,
    
    // 方法
    login,
    signup,
    logout,
    refreshToken,
    getCurrentUser,
    forgotPassword,
    resetPassword,
    verifyEmail,
    initAuth,
    clearError
  }
})