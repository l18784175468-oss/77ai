import axios from 'axios'
import { config } from '../config'
import { logger } from '../utils/logger'

// 自定义AI服务接口
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
  headers?: { [key: string]: string }
  authHeader?: string
}

export interface CustomAIRequest {
  endpoint: string
  method: 'POST' | 'GET'
  headers?: { [key: string]: string }
  params?: any
  data?: any
}

export interface CustomAIResponse {
  success: boolean
  data?: any
  error?: string
  usage?: any
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIResponse {
  message: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model: string
}

export interface AIModel {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'google' | 'stability' | 'custom'
  maxTokens: number
  supportsStreaming: boolean
  description?: string
}

export abstract class AIService {
  protected apiKey: string
  protected baseURL: string
  protected model: string

  constructor(apiKey: string, baseURL: string, model: string) {
    this.apiKey = apiKey
    this.baseURL = baseURL
    this.model = model
  }

  abstract sendMessage(messages: AIMessage[]): Promise<AIResponse>
  abstract generateImage(prompt: string, options?: any): Promise<any>
  abstract isConfigured(): boolean
}

export class OpenAIService extends AIService {
  async sendMessage(messages: AIMessage[]): Promise<AIResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const choice = response.data.choices[0]
      return {
        message: choice.message.content,
        usage: response.data.usage,
        model: this.model
      }
    } catch (error: any) {
      logger.error('OpenAI API error:', error.response?.data || error.message)
      throw new Error(`OpenAI API error: ${error.response?.data?.error?.message || error.message}`)
    }
  }

  async generateImage(prompt: string, options: any = {}): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseURL}/images/generations`,
        {
          model: this.model || 'dall-e-3',
          prompt,
          n: options.count || 1,
          size: options.size || '1024x1024',
          quality: options.quality || 'standard'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return {
        images: response.data.data.map((item: any) => item.url),
        model: this.model
      }
    } catch (error: any) {
      logger.error('OpenAI Image API error:', error.response?.data || error.message)
      throw new Error(`OpenAI Image API error: ${error.response?.data?.error?.message || error.message}`)
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.startsWith('sk-')
  }
}

export class AnthropicService extends AIService {
  async sendMessage(messages: AIMessage[]): Promise<AIResponse> {
    try {
      // 转换消息格式为Anthropic格式
      const systemMessage = messages.find(msg => msg.role === 'system')
      const conversationMessages = messages.filter(msg => msg.role !== 'system')

      const response = await axios.post(
        `${this.baseURL}/v1/messages`,
        {
          model: this.model || 'claude-3-sonnet-20240229',
          max_tokens: 2000,
          system: systemMessage?.content,
          messages: conversationMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          }
        }
      )

      return {
        message: response.data.content[0].text,
        usage: response.data.usage,
        model: this.model
      }
    } catch (error: any) {
      logger.error('Anthropic API error:', error.response?.data || error.message)
      throw new Error(`Anthropic API error: ${error.response?.data?.error?.message || error.message}`)
    }
  }

  async generateImage(prompt: string, options: any = {}): Promise<any> {
    // Anthropic目前不支持图像生成
    throw new Error('Anthropic does not support image generation')
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.startsWith('sk-ant-')
  }
}

export class GoogleAIService extends AIService {
  async sendMessage(messages: AIMessage[]): Promise<AIResponse> {
    try {
      // 转换消息格式为Google AI格式
      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))

      const response = await axios.post(
        `${this.baseURL}/v1beta/models/${this.model || 'gemini-pro'}:generateContent?key=${this.apiKey}`,
        {
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      return {
        message: response.data.candidates[0].content.parts[0].text,
        usage: response.data.usageMetadata,
        model: this.model
      }
    } catch (error: any) {
      logger.error('Google AI API error:', error.response?.data || error.message)
      throw new Error(`Google AI API error: ${error.response?.data?.error?.message || error.message}`)
    }
  }

  async generateImage(prompt: string, options: any = {}): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseURL}/v1beta/models/${this.model || 'imagegeneration'}:generateContent?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            sampleCount: options.count || 1,
            aspectRatio: this.getAspectRatio(options.size || '1024x1024')
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      return {
        images: response.data.candidates.map((candidate: any) => candidate.content.parts[0].url),
        model: this.model
      }
    } catch (error: any) {
      logger.error('Google AI Image API error:', error.response?.data || error.message)
      throw new Error(`Google AI Image API error: ${error.response?.data?.error?.message || error.message}`)
    }
  }

  private getAspectRatio(size: string): string {
    const sizeMap: { [key: string]: string } = {
      '1024x1024': '1:1',
      '1024x768': '4:3',
      '768x1024': '3:4',
      '1024x576': '16:9',
      '576x1024': '9:16'
    }
    return sizeMap[size] || '1:1'
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.startsWith('AIza')
  }
}

export class StabilityAIService extends AIService {
  async sendMessage(messages: AIMessage[]): Promise<AIResponse> {
    // Stability AI主要用于图像生成，不支持文本聊天
    throw new Error('Stability AI does not support text chat')
  }

  async generateImage(prompt: string, options: any = {}): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseURL}/v1/generation/${this.model || 'stable-diffusion-xl-1024-v1-0'}/text-to-image`,
        {
          prompt,
          negative_prompt: options.negativePrompt || '',
          width: options.width || 1024,
          height: options.height || 1024,
          samples: options.count || 1,
          steps: options.steps || 30,
          cfg_scale: options.cfgScale || 7,
          seed: options.seed || -1
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return {
        images: response.data.artifacts.map((artifact: any) =>
          `data:image/png;base64,${artifact.base64}`
        ),
        model: this.model
      }
    } catch (error: any) {
      logger.error('Stability AI API error:', error.response?.data || error.message)
      throw new Error(`Stability AI API error: ${error.response?.data?.message || error.message}`)
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.startsWith('sk-')
  }
}

export class AIServiceFactory {
  static createService(provider: string, model: string): AIService {
    switch (provider) {
      case 'openai':
        return new OpenAIService(
          config.ai.openai.apiKey,
          config.ai.openai.baseURL,
          model
        )
      case 'anthropic':
        return new AnthropicService(
          config.ai.anthropic.apiKey,
          config.ai.anthropic.baseURL,
          model
        )
      case 'google':
        return new GoogleAIService(
          config.ai.google.apiKey,
          config.ai.google.baseURL,
          model
        )
      case 'stability':
        return new StabilityAIService(
          config.ai.stability?.apiKey || '',
          config.ai.stability?.baseURL || 'https://api.stability.ai',
          model
        )
      default:
        throw new Error(`Unsupported AI provider: ${provider}`)
    }
  }

  static getAvailableModels(): AIModel[] {
    return [
      // OpenAI 模型
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'openai',
        maxTokens: 128000,
        supportsStreaming: true,
        description: '最新的GPT-4模型，支持更长上下文'
      },
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        maxTokens: 8192,
        supportsStreaming: true,
        description: '强大的多模态AI模型'
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        maxTokens: 4096,
        supportsStreaming: true,
        description: '快速高效的对话模型'
      },
      {
        id: 'gpt-3.5-turbo-16k',
        name: 'GPT-3.5 Turbo 16K',
        provider: 'openai',
        maxTokens: 16384,
        supportsStreaming: true,
        description: '支持更长上下文的GPT-3.5模型'
      },
      
      // Anthropic Claude 模型
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        provider: 'anthropic',
        maxTokens: 4096,
        supportsStreaming: true,
        description: '最强大的Claude模型，适合复杂任务'
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        provider: 'anthropic',
        maxTokens: 4096,
        supportsStreaming: true,
        description: '平衡性能和速度的Claude模型'
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        provider: 'anthropic',
        maxTokens: 4096,
        supportsStreaming: true,
        description: '快速响应的Claude模型'
      },
      
      // Google Gemini 模型
      {
        id: 'gemini-1.5-pro-latest',
        name: 'Gemini 1.5 Pro',
        provider: 'google',
        maxTokens: 2097152,
        supportsStreaming: true,
        description: '支持超长上下文的Google模型'
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'google',
        maxTokens: 32768,
        supportsStreaming: true,
        description: 'Google的多模态AI模型'
      },
      {
        id: 'gemini-pro-vision',
        name: 'Gemini Pro Vision',
        provider: 'google',
        maxTokens: 16384,
        supportsStreaming: false,
        description: '支持图像理解的Gemini模型'
      },
      
      // 图像生成模型
      {
        id: 'dall-e-3',
        name: 'DALL-E 3',
        provider: 'openai',
        maxTokens: 0,
        supportsStreaming: false,
        description: 'OpenAI的最新图像生成模型'
      },
      {
        id: 'dall-e-2',
        name: 'DALL-E 2',
        provider: 'openai',
        maxTokens: 0,
        supportsStreaming: false,
        description: 'OpenAI的经典图像生成模型'
      },
      {
        id: 'stable-diffusion-xl',
        name: 'Stable Diffusion XL',
        provider: 'stability',
        maxTokens: 0,
        supportsStreaming: false,
        description: '高质量的开源图像生成模型'
      }
    ]
  }
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
          ...this.customConfig.headers
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
    if (this.customConfig.authHeader) {
      headers[this.customConfig.authHeader] = this.apiKey
    }
    
    // 添加自定义头
    if (this.customConfig.headers) {
      Object.assign(headers, this.customConfig.headers)
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
}

// 扩展AIServiceFactory
export class ExtendedAIServiceFactory extends AIServiceFactory {
  static createService(provider: string, model: string): AIService {
    // 检查是否有自定义服务配置
    const customConfig = CustomAIServiceFactory.getCustomService(`${provider}-${model}`)
    
    if (customConfig) {
      return CustomAIServiceFactory.createCustomService(customConfig)
    }
    
    // 使用原有的工厂方法
    return super.createService(provider, model)
  }

  static getAvailableModels(): AIModel[] {
    const originalModels = super.getAvailableModels()
    const customServices = CustomAIServiceFactory.getAllCustomServices()
    
    // 添加自定义模型
    const customModels: AIModel[] = []
    for (const [id, config] of customServices) {
      customModels.push({
        id: id,
        name: config.name || id,
        provider: 'custom',
        maxTokens: config.maxTokens || 2000,
        supportsStreaming: config.supportsStreaming || false,
        description: config.description || '自定义AI模型'
      })
    }
    
    return [...originalModels, ...customModels]
  }
}

export default ExtendedAIServiceFactory