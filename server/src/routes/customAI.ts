import express from 'express'
import { CustomAIServiceFactory, CustomAIConfig } from '../services/customAIService'
import { authenticateToken } from '../middleware/auth'
import { logger } from '../utils/logger'

const router = express.Router()

// 获取所有自定义AI服务配置
router.get('/services', authenticateToken, (req, res) => {
  try {
    const services = CustomAIServiceFactory.getAllCustomServices()
    const servicesArray = Array.from(services.entries()).map(([id, config]) => ({
      id,
      ...config,
      apiKey: config.apiKey ? '***' : '' // 隐藏API密钥
    }))
    
    res.json({
      success: true,
      data: servicesArray
    })
  } catch (error: any) {
    logger.error('Failed to get custom AI services:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// 添加或更新自定义AI服务配置
router.post('/services', authenticateToken, (req, res) => {
  try {
    const { id, ...config } = req.body as { id?: string } & CustomAIConfig
    
    if (!config.name || !config.endpoint) {
      return res.status(400).json({
        success: false,
        error: '服务名称和API端点是必需的'
      })
    }
    
    if (id) {
      // 更新现有服务
      const updated = CustomAIServiceFactory.updateCustomService(id, config)
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: '未找到指定的自定义AI服务'
        })
      }
      
      logger.info(`Custom AI service updated: ${id}`)
      res.json({
        success: true,
        message: '自定义AI服务更新成功',
        data: { id, ...config }
      })
    } else {
      // 添加新服务
      const serviceId = `custom-${Date.now()}`
      CustomAIServiceFactory.registerCustomService(serviceId, config)
      
      logger.info(`Custom AI service added: ${serviceId}`)
      res.json({
        success: true,
        message: '自定义AI服务添加成功',
        data: { id: serviceId, ...config }
      })
    }
  } catch (error: any) {
    logger.error('Failed to save custom AI service:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// 删除自定义AI服务配置
router.delete('/services/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params
    const deleted = CustomAIServiceFactory.removeCustomService(id)
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: '未找到指定的自定义AI服务'
      })
    }
    
    logger.info(`Custom AI service deleted: ${id}`)
    res.json({
      success: true,
      message: '自定义AI服务删除成功'
    })
  } catch (error: any) {
    logger.error('Failed to delete custom AI service:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// 测试自定义AI服务连接
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const config = req.body as CustomAIConfig
    
    if (!config.endpoint || !config.apiKey) {
      return res.status(400).json({
        success: false,
        error: 'API端点和密钥是必需的'
      })
    }
    
    // 创建临时服务实例进行测试
    const testService = CustomAIServiceFactory.createCustomService(config)
    
    // 发送测试消息
    const testResponse = await testService.sendMessage([
      { role: 'user', content: '测试连接，请回复"连接成功"' }
    ])
    
    res.json({
      success: true,
      message: '自定义AI服务连接测试成功',
      data: {
        response: testResponse.message,
        model: testResponse.model,
        usage: testResponse.usage
      }
    })
  } catch (error: any) {
    logger.error('Custom AI service test failed:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// 获取所有可用的AI模型（包括自定义模型）
router.get('/models', authenticateToken, (req, res) => {
  try {
    const customModels = CustomAIServiceFactory.getCustomModels()
    
    res.json({
      success: true,
      data: customModels
    })
  } catch (error: any) {
    logger.error('Failed to get custom AI models:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router