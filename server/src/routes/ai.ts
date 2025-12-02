import express from 'express'
import { ExtendedAIServiceFactory } from '../services/aiService'
import { authenticateToken } from '../middleware/auth'
import { logger } from '../utils/logger'

const router = express.Router()

// 获取所有可用的AI模型
router.get('/models', authenticateToken, (req, res) => {
  try {
    const models = ExtendedAIServiceFactory.getAvailableModels()
    
    res.json({
      success: true,
      data: models
    })
    
    logger.info(`AI models list retrieved: ${models.length} models`)
  } catch (error: any) {
    logger.error('Failed to get AI models:', error)
    res.status(500).json({
      success: false,
      error: error.message || '获取AI模型列表失败'
    })
  }
})

// 获取特定提供商的模型
router.get('/models/:provider', authenticateToken, (req, res) => {
  try {
    const { provider } = req.params
    const allModels = ExtendedAIServiceFactory.getAvailableModels()
    const providerModels = allModels.filter(model => model.provider === provider)
    
    res.json({
      success: true,
      data: providerModels
    })
    
    logger.info(`AI models for provider ${provider}: ${providerModels.length} models`)
  } catch (error: any) {
    logger.error(`Failed to get AI models for provider ${req.params.provider}:`, error)
    res.status(500).json({
      success: false,
      error: error.message || '获取AI模型列表失败'
    })
  }
})

// 测试AI模型连接
router.post('/test/:provider', authenticateToken, async (req, res) => {
  try {
    const { provider } = req.params
    const { model } = req.body
    
    if (!model) {
      return res.status(400).json({
        success: false,
        error: '模型参数是必需的'
      })
    }
    
    const aiService = ExtendedAIServiceFactory.createService(provider, model)
    
    if (!aiService.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'AI服务未正确配置'
      })
    }
    
    // 发送测试消息
    const testResponse = await aiService.sendMessage([
      { role: 'user', content: '测试连接，请回复"连接成功"' }
    ])
    
    res.json({
      success: true,
      message: 'AI模型连接测试成功',
      data: {
        response: testResponse.message,
        model: testResponse.model,
        usage: testResponse.usage
      }
    })
    
    logger.info(`AI model test successful for ${provider}/${model}`)
  } catch (error: any) {
    logger.error(`AI model test failed for ${req.params.provider}:`, error)
    res.status(500).json({
      success: false,
      error: error.message || 'AI模型连接测试失败'
    })
  }
})

export default router