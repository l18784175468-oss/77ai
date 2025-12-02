import axios from 'axios'
import { logger } from '../utils/logger'
import { AIService, AIMessage, AIResponse } from './aiService'

// 自定义AI服务配置接口
export interface CustomAIConfig {
  name: string
  baseURL: string
  apiKey: string
  model: string
  maxTokens: number
  supportsStreaming: boolean
  customHeaders?: { [key: string]: string }
  requestFormat?: 'openai' | 'anthropic' | 'claude' | 'google' | 'custom'
  responseFormat?: 'json' | 'text' | 'openai' | 'claude' | 'google'
  endpoint?: string
  method?: 'POST' | 'GET'
  temperature?: number
  description?: string
}

// 自定义AI服务类
export class CustomAIService extends AIService {
  private customConfig: CustomAIConfig

  constructor(apiKey: string, baseURL: string, model: string, customConfig: CustomAIConfig) {
    super(apiKey, baseURL, model)
    this.customConfig = customConfig
  }

  async sendMessage(messages: AIMessage[]): Promise<AIResponse> {
    try {
      const requestData = this.buildCustomRequest(messages)
      
      const response = await axios({
        method: this.customConfig.method || 'POST',
        url: this.customConfig.endpoint,
        headers: {
          ...this.getHeaders(),
          ...this.customConfig.customHeaders
        },
        data: requestData,
        timeout: 60000
      })

      return this.parseCustomResponse(response.data)
    } catch (error: any) {
      logger.error('Custom AI API error:', error.response?.data || error.message)
      throw new Error(`Custom AI API error: ${error.response?.data?.error || error.message}`)
    }
  }

  async generateImage(prompt: string, options: any = {}): Promise<any> {
    throw new Error('Image generation not supported by this custom AI service')
  }

  isConfigured(): boolean {
    return !!this.apiKey && !!this.customConfig.endpoint
  }

  private buildCustomRequest(messages: AIMessage[]): any {
    // 根据自定义配置构建请求
    if (this.customConfig.requestFormat === 'openai') {
      return {
        model: this.model,
        messages,
        temperature: this.customConfig.temperature || 0.7,
        max_tokens: this.customConfig.maxTokens || 2000,
        stream: this.customConfig.supportsStreaming || false
      }
    } else if (this.customConfig.requestFormat === 'claude') {
      return {
        model: this.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        max_tokens: this.customConfig.maxTokens || 4096,
        temperature: this.customConfig.temperature || 0.7
      }
    } else if (this.customConfig.requestFormat === 'google') {
      return {
        contents: [{
          parts: [{
            text: messages[messages.length - 1]?.content || ''
          }]
        }],
        generationConfig: {
          temperature: this.customConfig.temperature || 0.7,
          maxOutputTokens: this.customConfig.maxTokens || 2048
        }
      }
    } else {
      // 默认格式
      return {
        model: this.model,
        messages,
        temperature: this.customConfig.temperature || 0.7,
        max_tokens: this.customConfig.maxTokens || 2000
      }
    }
  }

  private getHeaders(): { [key: string]: string } {
    const headers: { [key: string]: string } = {}
    
    // 添加认证头
    if (this.customConfig.customHeaders && this.customConfig.customHeaders.authHeader) {
      headers[this.customConfig.customHeaders.authHeader] = this.apiKey
    }
    
    // 添加其他自定义头
    if (this.customConfig.customHeaders) {
      Object.assign(headers, this.customConfig.customHeaders)
    }
    
    return headers
  }

  private parseCustomResponse(data: any): AIResponse {
    if (this.customConfig.responseFormat === 'openai') {
      return {
        message: data.choices?.[0]?.message?.content || data.message || '',
        usage: data.usage,
        model: data.model || this.model
      }
    } else if (this.customConfig.responseFormat === 'claude') {
      return {
        message: data.content?.[0]?.text || data.message || '',
        usage: data.usage,
        model: data.model || this.model
      }
    } else if (this.customConfig.responseFormat === 'google') {
      return {
        message: data.candidates?.[0]?.content?.parts?.[0]?.text || data.message || '',
        usage: data.usageMetadata,
        model: data.model || this.model
      }
    } else {
      // 默认文本格式
      return {
        message: data.message || data.response || '',
        usage: data.usage,
        model: data.model || this.model
      }
    }
  }
}

// 自定义AI服务工厂
export class CustomAIServiceFactory {
  private static customServices: Map<string, CustomAIConfig> = new Map()

  static registerCustomService(id: string, config: CustomAIConfig): void {
    this.customServices.set(id, config)
    logger.info(`Custom AI service registered: ${id}`)
  }

  static getCustomService(id: string): CustomAIConfig | null {
    return this.customServices.get(id) || null
  }

  static getAllCustomServices(): Map<string, CustomAIConfig> {
    return new Map(this.customServices)
  }

  static createCustomService(config: CustomAIConfig): CustomAIService {
    return new CustomAIService(
      config.apiKey,
      config.baseURL || '',
      config.model || 'custom-model',
      config
    )
  }

  static removeCustomService(id: string): boolean {
    return this.customServices.delete(id)
  }

  static updateCustomService(id: string, config: Partial<CustomAIConfig>): boolean {
    const existingService = this.customServices.get(id)
    if (existingService) {
      const updatedService = { ...existingService, ...config }
      this.customServices.set(id, updatedService)
      logger.info(`Custom AI service updated: ${id}`)
      return true
    }
    return false
  }

  static getCustomServices(): Map<string, CustomAIConfig> {
    return new Map(this.customServices)
  }

  static getCustomModels(): any[] {
    const customServices = this.getAllCustomServices()
    const models = []
    
    for (const [id, config] of customServices) {
      models.push({
        id: id,
        name: config.name || id,
        provider: 'custom',
        maxTokens: config.maxTokens || 2000,
        supportsStreaming: config.supportsStreaming || false,
        description: config.description || '自定义AI模型'
      })
    }
    
    return models
  }
}

export default CustomAIServiceFactory