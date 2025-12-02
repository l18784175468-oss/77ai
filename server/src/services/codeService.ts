import { AIServiceFactory, AIMessage } from './aiService'
import { logger } from '../utils/logger'

export interface CodeAnalysisRequest {
  code: string
  language: string
  model?: string
  userId: string
}

export interface CodeGenerationRequest {
  prompt: string
  language: string
  model?: string
  userId: string
}

export interface CodeOptimizationRequest {
  code: string
  language: string
  model?: string
  userId: string
}

export interface CodeErrorDetectionRequest {
  code: string
  language: string
  model?: string
  userId: string
}

export interface CodeExplanationRequest {
  code: string
  language: string
  model?: string
  userId: string
}

export interface CodeFormatRequest {
  code: string
  language: string
}

export interface CodeError {
  type: string
  message: string
  line: number
  severity: 'error' | 'warning' | 'info'
}

export interface CodeRecord {
  id: string
  type: 'analysis' | 'generation' | 'optimization' | 'explanation'
  code: string
  language: string
  result: any
  model: string
  userId: string
  createdAt: string
}

// 内存存储（生产环境应使用数据库）
const codeStorage = new Map<string, CodeRecord>()
const userCodesStorage = new Map<string, string[]>()

const codeService = {
  async analyzeCode(request: CodeAnalysisRequest): Promise<any> {
    const { code, language, model, userId } = request

    try {
      const prompt = `请分析以下${language}代码，提供详细的解释、潜在问题和改进建议：

\`\`\`${language}
${code}
\`\`\`

请以JSON格式返回结果，包含以下字段：
- explanation: 代码解释
- errors: 错误列表（如果有）
- suggestions: 改进建议
- complexity: 复杂度评估`

      const aiMessages: AIMessage[] = [
        { role: 'user', content: prompt }
      ]

      const provider = this.getProviderFromModel(model || 'gpt-4')
      const aiService = AIServiceFactory.createService(provider, model || 'gpt-4')

      const response = await aiService.sendMessage(aiMessages)

      // 保存分析记录
      const recordId = Date.now().toString()
      const record: CodeRecord = {
        id: recordId,
        type: 'analysis',
        code,
        language,
        result: response.message,
        model: response.model,
        userId,
        createdAt: new Date().toISOString()
      }

      codeStorage.set(recordId, record)

      // 更新用户代码列表
      const userCodes = userCodesStorage.get(userId) || []
      userCodes.unshift(recordId)
      userCodesStorage.set(userId, userCodes)

      logger.info(`Code analyzed successfully for user ${userId}`)

      try {
        return JSON.parse(response.message)
      } catch {
        return {
          explanation: response.message,
          errors: [],
          suggestions: [],
          complexity: 'medium'
        }
      }
    } catch (error: any) {
      logger.error('Error analyzing code:', error)
      throw error
    }
  },

  async generateCode(request: CodeGenerationRequest): Promise<string> {
    const { prompt, language, model, userId } = request

    try {
      const fullPrompt = `请生成${language}代码，要求如下：
${prompt}

请只返回代码，不要包含解释或其他文本。确保代码语法正确，遵循最佳实践。`

      const aiMessages: AIMessage[] = [
        { role: 'user', content: fullPrompt }
      ]

      const provider = this.getProviderFromModel(model || 'gpt-4')
      const aiService = AIServiceFactory.createService(provider, model || 'gpt-4')

      const response = await aiService.sendMessage(aiMessages)

      // 保存生成记录
      const recordId = Date.now().toString()
      const record: CodeRecord = {
        id: recordId,
        type: 'generation',
        code: response.message,
        language,
        result: { prompt },
        model: response.model,
        userId,
        createdAt: new Date().toISOString()
      }

      codeStorage.set(recordId, record)

      // 更新用户代码列表
      const userCodes = userCodesStorage.get(userId) || []
      userCodes.unshift(recordId)
      userCodesStorage.set(userId, userCodes)

      logger.info(`Code generated successfully for user ${userId}`)

      return response.message
    } catch (error: any) {
      logger.error('Error generating code:', error)
      throw error
    }
  },

  async optimizeCode(request: CodeOptimizationRequest): Promise<string> {
    const { code, language, model, userId } = request

    try {
      const prompt = `请优化以下${language}代码，提高性能、可读性和最佳实践：

\`\`\`${language}
${code}
\`\`\`

请只返回优化后的代码，不要包含解释。如果代码已经很好，请返回原代码。`

      const aiMessages: AIMessage[] = [
        { role: 'user', content: prompt }
      ]

      const provider = this.getProviderFromModel(model || 'gpt-4')
      const aiService = AIServiceFactory.createService(provider, model || 'gpt-4')

      const response = await aiService.sendMessage(aiMessages)

      // 保存优化记录
      const recordId = Date.now().toString()
      const record: CodeRecord = {
        id: recordId,
        type: 'optimization',
        code,
        language,
        result: { optimized: response.message },
        model: response.model,
        userId,
        createdAt: new Date().toISOString()
      }

      codeStorage.set(recordId, record)

      // 更新用户代码列表
      const userCodes = userCodesStorage.get(userId) || []
      userCodes.unshift(recordId)
      userCodesStorage.set(userId, userCodes)

      logger.info(`Code optimized successfully for user ${userId}`)

      return response.message
    } catch (error: any) {
      logger.error('Error optimizing code:', error)
      throw error
    }
  },

  async detectErrors(request: CodeErrorDetectionRequest): Promise<CodeError[]> {
    const { code, language, model, userId } = request

    try {
      const prompt = `请检测以下${language}代码中的错误和问题：

\`\`\`${language}
${code}
\`\`\`

请以JSON格式返回结果，包含错误列表，每个错误包含：
- type: 错误类型
- message: 错误描述
- line: 行号
- severity: 严重程度（error/warning/info）`

      const aiMessages: AIMessage[] = [
        { role: 'user', content: prompt }
      ]

      const provider = this.getProviderFromModel(model || 'gpt-4')
      const aiService = AIServiceFactory.createService(provider, model || 'gpt-4')

      const response = await aiService.sendMessage(aiMessages)

      logger.info(`Code errors detected for user ${userId}`)

      try {
        const result = JSON.parse(response.message)
        return Array.isArray(result.errors) ? result.errors : []
      } catch {
        return []
      }
    } catch (error: any) {
      logger.error('Error detecting code errors:', error)
      throw error
    }
  },

  async explainCode(request: CodeExplanationRequest): Promise<string> {
    const { code, language, model, userId } = request

    try {
      const prompt = `请详细解释以下${language}代码的功能、逻辑和实现方式：

\`\`\`${language}
${code}
\`\`\`

请提供清晰、易懂的解释，包括：
1. 代码整体功能
2. 关键逻辑说明
3. 重要函数/方法的作用
4. 可能的使用场景`

      const aiMessages: AIMessage[] = [
        { role: 'user', content: prompt }
      ]

      const provider = this.getProviderFromModel(model || 'gpt-4')
      const aiService = AIServiceFactory.createService(provider, model || 'gpt-4')

      const response = await aiService.sendMessage(aiMessages)

      // 保存解释记录
      const recordId = Date.now().toString()
      const record: CodeRecord = {
        id: recordId,
        type: 'explanation',
        code,
        language,
        result: { explanation: response.message },
        model: response.model,
        userId,
        createdAt: new Date().toISOString()
      }

      codeStorage.set(recordId, record)

      // 更新用户代码列表
      const userCodes = userCodesStorage.get(userId) || []
      userCodes.unshift(recordId)
      userCodesStorage.set(userId, userCodes)

      logger.info(`Code explained successfully for user ${userId}`)

      return response.message
    } catch (error: any) {
      logger.error('Error explaining code:', error)
      throw error
    }
  },

  async formatCode(request: CodeFormatRequest): Promise<string> {
    const { code, language } = request

    try {
      // 这里应该使用专业的代码格式化库
      // 暂时返回原代码
      logger.info(`Code formatting requested for ${language}`)
      return code
    } catch (error: any) {
      logger.error('Error formatting code:', error)
      throw error
    }
  },

  async getCodeHistory(userId: string, page: number = 1, limit: number = 20): Promise<any> {
    const userCodes = userCodesStorage.get(userId) || []
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedIds = userCodes.slice(startIndex, endIndex)

    const records = paginatedIds
      .map(id => codeStorage.get(id))
      .filter(record => record !== undefined)

    return {
      records,
      pagination: {
        page,
        limit,
        total: userCodes.length,
        totalPages: Math.ceil(userCodes.length / limit)
      }
    }
  },

  async deleteCodeRecord(codeId: string): Promise<boolean> {
    const record = codeStorage.get(codeId)
    if (!record) {
      return false
    }

    codeStorage.delete(codeId)

    // 从用户代码列表中移除
    const userCodes = userCodesStorage.get(record.userId) || []
    const index = userCodes.indexOf(codeId)
    if (index > -1) {
      userCodes.splice(index, 1)
      userCodesStorage.set(record.userId, userCodes)
    }

    logger.info(`Code record deleted: ${codeId}`)
    return true
  },

  getProviderFromModel(model: string): string {
    if (model.startsWith('gpt')) {
      return 'openai'
    } else if (model.startsWith('claude')) {
      return 'anthropic'
    } else if (model.startsWith('gemini')) {
      return 'google'
    }
    return 'openai' // 默认
  }
}

export default codeService