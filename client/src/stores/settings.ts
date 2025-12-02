import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { settingsAPI } from '@/services/api'

export interface UserSettings {
  language: string
  timezone: string
  autoSave: boolean
  notifications: boolean
  theme: string
  fontSize: string
  compactMode: boolean
  animations: boolean
}

export interface AISettings {
  defaultModel: string
  openaiApiKey: string
  claudeApiKey: string
  googleApiKey: string
  temperature: number
  maxTokens: number
}

const defaultUserSettings: UserSettings = {
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  autoSave: true,
  notifications: true,
  theme: 'light',
  fontSize: 'medium',
  compactMode: false,
  animations: true
}

const defaultAISettings: AISettings = {
  defaultModel: 'gpt-3.5-turbo',
  openaiApiKey: '',
  claudeApiKey: '',
  googleApiKey: '',
  temperature: 0.7,
  maxTokens: 2000
}

export const useSettingsStore = defineStore('settings', () => {
  const userSettings = ref<UserSettings>({ ...defaultUserSettings })
  const aiSettings = ref<AISettings>({ ...defaultAISettings })
  const isLoading = ref(false)
  const error = ref<string>('')

  // 计算属性
  const currentTheme = computed(() => userSettings.value.theme)
  const currentLanguage = computed(() => userSettings.value.language)
  const isDarkMode = computed(() => {
    if (userSettings.value.theme === 'dark') return true
    if (userSettings.value.theme === 'light') return false
    // auto模式跟随系统
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // 获取用户设置
  const getUserSettings = async (userId: string) => {
    try {
      isLoading.value = true
      error.value = ''

      const response = await settingsAPI.getUserSettings(userId)
      
      if (response.settings) {
        userSettings.value = { ...defaultUserSettings, ...response.settings }
        
        return { success: true }
      } else {
        error.value = '获取设置失败'
        return { success: false, error: '获取设置失败' }
      }
    } catch (err: any) {
      error.value = err.message || '获取设置失败'
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  // 更新用户设置
  const updateUserSettings = async (userId: string, settings: Partial<UserSettings>) => {
    try {
      isLoading.value = true
      error.value = ''

      const response = await settingsAPI.updateUserSettings(userId, settings)
      
      if (response.settings) {
        userSettings.value = { ...userSettings.value, ...response.settings }
        
        return { success: true }
      } else {
        error.value = response.error || '更新设置失败'
        return { success: false, error: response.error || '更新设置失败' }
      }
    } catch (err: any) {
      error.value = err.message || '更新设置失败'
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  // 获取AI设置
  const getAISettings = async (userId: string) => {
    try {
      isLoading.value = true
      error.value = ''

      const response = await settingsAPI.getAISettings(userId)
      
      if (response.settings) {
        aiSettings.value = { ...defaultAISettings, ...response.settings }
        
        return { success: true }
      } else {
        error.value = '获取AI设置失败'
        return { success: false, error: '获取AI设置失败' }
      }
    } catch (err: any) {
      error.value = err.message || '获取AI设置失败'
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  // 更新AI设置
  const updateAISettings = async (userId: string, settings: Partial<AISettings>) => {
    try {
      isLoading.value = true
      error.value = ''

      const response = await settingsAPI.updateAISettings(userId, settings)
      
      if (response.settings) {
        aiSettings.value = { ...aiSettings.value, ...response.settings }
        
        return { success: true }
      } else {
        error.value = response.error || '更新AI设置失败'
        return { success: false, error: response.error || '更新AI设置失败' }
      }
    } catch (err: any) {
      error.value = err.message || '更新AI设置失败'
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  // 测试AI连接
  const testAIConnection = async (userId: string, provider: string, apiKey: string) => {
    try {
      isLoading.value = true
      error.value = ''

      const response = await settingsAPI.testConnection({ userId, provider, apiKey })
      
      if (response.status === 'connected') {
        return { success: true, message: '连接测试成功' }
      } else {
        error.value = response.error || '连接测试失败'
        return { success: false, error: response.error || '连接测试失败' }
      }
    } catch (err: any) {
      error.value = err.message || '连接测试失败'
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  // 重置设置
  const resetSettings = async (userId: string, category?: string) => {
    try {
      isLoading.value = true
      error.value = ''

      const response = await settingsAPI.resetSettings(userId, category)
      
      if (category === 'ai') {
        aiSettings.value = { ...defaultAISettings }
      } else {
        userSettings.value = { ...defaultUserSettings }
      }
      
      return { success: true }
    } catch (err: any) {
      error.value = err.message || '重置设置失败'
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  // 导出设置
  const exportSettings = async (userId: string) => {
    try {
      isLoading.value = true
      error.value = ''

      const response = await settingsAPI.exportSettings(userId)
      
      if (response.export) {
        // 创建下载链接
        const dataStr = JSON.stringify(response.export, null, 2)
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
        
        const exportFileDefaultName = `ai-web-framework-settings-${new Date().toISOString().split('T')[0]}.json`
        
        const linkElement = document.createElement('a')
        linkElement.setAttribute('href', dataUri)
        linkElement.setAttribute('download', exportFileDefaultName)
        linkElement.click()
        
        return { success: true }
      } else {
        error.value = '导出设置失败'
        return { success: false, error: '导出设置失败' }
      }
    } catch (err: any) {
      error.value = err.message || '导出设置失败'
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  // 导入设置
  const importSettings = async (userId: string, file: File) => {
    try {
      isLoading.value = true
      error.value = ''

      const text = await file.text()
      const settings = JSON.parse(text)
      
      const response = await settingsAPI.importSettings(userId, settings)
      
      if (response.userSettings && response.aiSettings) {
        userSettings.value = { ...userSettings.value, ...response.userSettings }
        aiSettings.value = { ...aiSettings.value, ...response.aiSettings }
        
        return { success: true }
      } else {
        error.value = response.error || '导入设置失败'
        return { success: false, error: response.error || '导入设置失败' }
      }
    } catch (err: any) {
      error.value = err.message || '导入设置失败'
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  // 获取系统设置
  const getSystemSettings = async () => {
    try {
      const response = await settingsAPI.getSystemSettings()
      return response.settings
    } catch (err: any) {
      error.value = err.message || '获取系统设置失败'
      return null
    }
  }

  // 应用主题
  const applyTheme = (theme: string) => {
    document.documentElement.setAttribute('data-theme', theme)
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // 切换主题
  const toggleTheme = () => {
    const newTheme = userSettings.value.theme === 'light' ? 'dark' : 'light'
    userSettings.value.theme = newTheme
    applyTheme(newTheme)
  }

  // 清除错误
  const clearError = () => {
    error.value = ''
  }

  return {
    // 状态
    userSettings: readonly(userSettings),
    aiSettings: readonly(aiSettings),
    isLoading: readonly(isLoading),
    error: readonly(error),
    currentTheme,
    currentLanguage,
    isDarkMode,
    
    // 方法
    getUserSettings,
    updateUserSettings,
    getAISettings,
    updateAISettings,
    testAIConnection,
    resetSettings,
    exportSettings,
    importSettings,
    getSystemSettings,
    applyTheme,
    toggleTheme,
    clearError
  }
})