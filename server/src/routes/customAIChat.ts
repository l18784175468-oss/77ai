import express from 'express'
import { CustomAIServiceFactory } from '../services/customAIService'
import { authenticateToken } from '../middleware/auth'
import { logger } from '../utils/logger'

const router = express.Router()

// 自定义AI聊天接口
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, model, chatId } = req.body
    
    if (!message || !model) {
      return res.status(400).json({
        success: false,
        error: '消息和模型参数是必需的'
      })
    }
    
    // 获取自定义AI服务配置
    const customService = CustomAIServiceFactory.getCustomService(model)
    
    if (!customService) {
      return res.status(404).json({
        success: false,
        error: '未找到指定的自定义AI服务'
      })
    }
    
    // 创建自定义AI服务实例
    const aiService = CustomAIServiceFactory.createCustomService(customService)
    
    // 构建消息历史
    const messages = [
      { role: 'user' as const, content: message }
    ]
    
    // 发送消息到自定义AI服务
    const response = await aiService.sendMessage(messages)
    
    res.json({
      success: true,
      message: response.message,
      model: response.model,
      usage: response.usage,
      chatId
    })
    
    logger.info(`Custom AI chat request processed for model: ${model}`)
  } catch (error: any) {
    logger.error('Custom AI chat error:', error)
    res.status(500).json({
      success: false,
      error: error.message || '处理聊天请求时发生错误'
    })
  }
})

// 获取自定义AI服务信息
router.get('/service/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params
    const service = CustomAIServiceFactory.getCustomService(id)
    
    if (!service) {
      return res.status(404).json({
        success: false,
        error: '未找到指定的自定义AI服务'
      })
    }
    
    // 返回服务信息，隐藏API密钥
    const serviceInfo = {
      ...service,
      apiKey: service.apiKey ? '***' : ''
    }
    
    res.json({
      success: true,
      data: serviceInfo
    })
  } catch (error: any) {
    logger.error('Get custom AI service error:', error)
    res.status(500).json({
      success: false,
      error: error.message || '获取服务信息时发生错误'
    })
  }
})

export default router