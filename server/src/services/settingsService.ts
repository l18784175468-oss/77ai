import { AIServiceFactory } from './aiService'
import { logger } from '../utils/logger'

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

export interface TestConnectionRequest {
  userId: string
  provider: string
  apiKey: string
}

// 内存存储（生产环境应使用数据库）
const userSettingsStorage = new Map<string, UserSettings>()
const aiSettingsStorage = new Map<string, AISettings>()

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

const settingsService = {
  async getUserSettings(userId: string): Promise<UserSettings> {
    const settings = userSettingsStorage.get(userId)
    if (!settings) {
      // 返回默认设置
      userSettingsStorage.set(userId, { ...defaultUserSettings })
      return { ...defaultUserSettings }
    }
    return settings
  },

  async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<UserSettings> {
    const currentSettings = await this.getUserSettings(userId)
    const updatedSettings = { ...currentSettings, ...settings }

    userSettingsStorage.set(userId, updatedSettings)

    logger.info(`User settings updated for user: ${userId}`)
    return updatedSettings
  },

  async getAISettings(userId: string): Promise<AISettings> {
    const settings = aiSettingsStorage.get(userId)
    if (!settings) {
      // 返回默认设置
      aiSettingsStorage.set(userId, { ...defaultAISettings })
      return { ...defaultAISettings }
    }
    return settings
  },

  async updateAISettings(userId: string, settings: Partial<AISettings>): Promise<AISettings> {
    const currentSettings = await this.getAISettings(userId)
    const updatedSettings = { ...currentSettings, ...settings }

    aiSettingsStorage.set(userId, updatedSettings)

    logger.info(`AI settings updated for user: ${userId}`)
    return updatedSettings
  },

  async testAIConnection(request: TestConnectionRequest): Promise<any> {
    const { userId, provider, apiKey } = request

    try {
      // 创建临时AI服务实例进行测试
      const aiService = AIServiceFactory.createService(provider, 'test-model')

      // 检查配置
      if (!aiService.isConfigured()) {
        return {
          error: 'Invalid API key format'
        }
      }

      // 发送测试消息
      const testMessage = [
        { role: 'user' as const, content: 'Hello, this is a connection test.' }
      ]

      await aiService.sendMessage(testMessage)

      logger.info(`AI connection test successful for user ${userId}, provider: ${provider}`)

      return {
        provider,
        status: 'connected',
        message: 'Connection test successful'
      }
    } catch (error: any) {
      logger.error(`AI connection test failed for user ${userId}, provider: ${provider}:`, error)
      return {
        error: `Connection test failed: ${error.message}`
      }
    }
  },

  async resetSettings(userId: string, category?: string): Promise<UserSettings | AISettings> {
    if (category === 'ai') {
      const resetSettings = { ...defaultAISettings }
      aiSettingsStorage.set(userId, resetSettings)

      logger.info(`AI settings reset for user: ${userId}`)
      return resetSettings
    } else {
      const resetSettings = { ...defaultUserSettings }
      userSettingsStorage.set(userId, resetSettings)

      logger.info(`User settings reset for user: ${userId}`)
      return resetSettings
    }
  },

  async exportSettings(userId: string): Promise<any> {
    const userSettings = await this.getUserSettings(userId)
    const aiSettings = await this.getAISettings(userId)

    return {
      userSettings,
      aiSettings,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    }
  },

  async importSettings(userId: string, settings: any): Promise<{ userSettings: UserSettings; aiSettings: AISettings }> {
    try {
      const { userSettings, aiSettings } = settings

      // 验证和导入用户设置
      const validUserSettings = this.validateUserSettings(userSettings || {})
      const validAISettings = this.validateAISettings(aiSettings || {})

      userSettingsStorage.set(userId, validUserSettings)
      aiSettingsStorage.set(userId, validAISettings)

      logger.info(`Settings imported for user: ${userId}`)

      return {
        userSettings: validUserSettings,
        aiSettings: validAISettings
      }
    } catch (error: any) {
      logger.error('Error importing settings:', error)
      throw new Error('Invalid settings format')
    }
  },

  async getSystemSettings(): Promise<any> {
    return {
      version: '1.0.0',
      supportedLanguages: [
        { code: 'zh-CN', name: '简体中文' },
        { code: 'en-US', name: 'English' },
        { code: 'ja-JP', name: '日本語' }
      ],
      supportedThemes: [
        { value: 'light', name: '浅色' },
        { value: 'dark', name: '深色' },
        { value: 'auto', name: '跟随系统' }
      ],
      supportedModels: AIServiceFactory.getAvailableModels(),
      features: {
        chat: true,
        imageGeneration: true,
        codeAssistance: true,
        multiProvider: true,
        streaming: true
      },
      limits: {
        maxChatHistory: 1000,
        maxImageHistory: 500,
        maxCodeHistory: 500,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        apiRateLimit: {
          requestsPerMinute: 20,
          requestsPerHour: 1000
        }
      }
    }
  },

  validateUserSettings(settings: any): UserSettings {
    return {
      language: this.validateLanguage(settings.language) || defaultUserSettings.language,
      timezone: this.validateTimezone(settings.timezone) || defaultUserSettings.timezone,
      autoSave: typeof settings.autoSave === 'boolean' ? settings.autoSave : defaultUserSettings.autoSave,
      notifications: typeof settings.notifications === 'boolean' ? settings.notifications : defaultUserSettings.notifications,
      theme: this.validateTheme(settings.theme) || defaultUserSettings.theme,
      fontSize: this.validateFontSize(settings.fontSize) || defaultUserSettings.fontSize,
      compactMode: typeof settings.compactMode === 'boolean' ? settings.compactMode : defaultUserSettings.compactMode,
      animations: typeof settings.animations === 'boolean' ? settings.animations : defaultUserSettings.animations
    }
  },

  validateAISettings(settings: any): AISettings {
    return {
      defaultModel: this.validateModel(settings.defaultModel) || defaultAISettings.defaultModel,
      openaiApiKey: typeof settings.openaiApiKey === 'string' ? settings.openaiApiKey : defaultAISettings.openaiApiKey,
      claudeApiKey: typeof settings.claudeApiKey === 'string' ? settings.claudeApiKey : defaultAISettings.claudeApiKey,
      googleApiKey: typeof settings.googleApiKey === 'string' ? settings.googleApiKey : defaultAISettings.googleApiKey,
      temperature: typeof settings.temperature === 'number' && settings.temperature >= 0 && settings.temperature <= 2 
        ? settings.temperature 
        : defaultAISettings.temperature,
      maxTokens: typeof settings.maxTokens === 'number' && settings.maxTokens >= 100 && settings.maxTokens <= 4000
        ? settings.maxTokens
        : defaultAISettings.maxTokens
    }
  },

  validateLanguage(language: string): string | null {
    const validLanguages = ['zh-CN', 'en-US', 'ja-JP']
    return validLanguages.includes(language) ? language : null
  },

  validateTimezone(timezone: string): string | null {
    const validTimezones = ['Asia/Shanghai', 'Asia/Tokyo', 'America/New_York', 'Europe/London']
    return validTimezones.includes(timezone) ? timezone : null
  },

  validateTheme(theme: string): string | null {
    const validThemes = ['light', 'dark', 'auto']
    return validThemes.includes(theme) ? theme : null
  },

  validateFontSize(fontSize: string): string | null {
    const validFontSizes = ['small', 'medium', 'large']
    return validFontSizes.includes(fontSize) ? fontSize : null
  },

  validateModel(model: string): string | null {
    const validModels = AIServiceFactory.getAvailableModels().map(m => m.id)
    return validModels.includes(model) ? model : null
  }
}

export default settingsService