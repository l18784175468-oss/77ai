import { Router, Request, Response } from 'express'
import { catchAsync } from '../middleware/errorHandler'
import { settingsService } from '../services/settingsService'
import { logger } from '../utils/logger'

const router = Router()

// 获取用户设置
router.get('/', catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.query
  
  if (!userId) {
    return res.status(400).json({
      status: 'error',
      message: 'User ID is required'
    })
  }
  
  const settings = await settingsService.getUserSettings(userId as string)
  
  res.status(200).json({
    status: 'success',
    data: {
      settings
    }
  })
}))

// 更新用户设置
router.put('/', catchAsync(async (req: Request, res: Response) => {
  const { userId, settings } = req.body
  
  if (!userId || !settings) {
    return res.status(400).json({
      status: 'error',
      message: 'User ID and settings are required'
    })
  }
  
  const updatedSettings = await settingsService.updateUserSettings(userId, settings)
  
  res.status(200).json({
    status: 'success',
    message: 'Settings updated successfully',
    data: {
      settings: updatedSettings
    }
  })
}))

// 获取AI配置
router.get('/ai', catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.query
  
  if (!userId) {
    return res.status(400).json({
      status: 'error',
      message: 'User ID is required'
    })
  }
  
  const aiSettings = await settingsService.getAISettings(userId as string)
  
  res.status(200).json({
    status: 'success',
    data: {
      settings: aiSettings
    }
  })
}))

// 更新AI配置
router.put('/ai', catchAsync(async (req: Request, res: Response) => {
  const { userId, settings } = req.body
  
  if (!userId || !settings) {
    return res.status(400).json({
      status: 'error',
      message: 'User ID and settings are required'
    })
  }
  
  const updatedSettings = await settingsService.updateAISettings(userId, settings)
  
  res.status(200).json({
    status: 'success',
    message: 'AI settings updated successfully',
    data: {
      settings: updatedSettings
    }
  })
}))

// 测试AI连接
router.post('/test-connection', catchAsync(async (req: Request, res: Response) => {
  const { userId, provider, apiKey } = req.body
  
  if (!userId || !provider || !apiKey) {
    return res.status(400).json({
      status: 'error',
      message: 'User ID, provider, and API key are required'
    })
  }
  
  logger.info(`Testing AI connection for user ${userId} with provider ${provider}`)
  
  const result = await settingsService.testAIConnection({
    userId,
    provider,
    apiKey
  })
  
  if (result.error) {
    return res.status(400).json({
      status: 'error',
      message: result.error
    })
  }
  
  res.status(200).json({
    status: 'success',
    message: 'AI connection test successful',
    data: {
      provider,
      status: 'connected'
    }
  })
}))

// 重置设置
router.post('/reset', catchAsync(async (req: Request, res: Response) => {
  const { userId, category } = req.body
  
  if (!userId) {
    return res.status(400).json({
      status: 'error',
      message: 'User ID is required'
    })
  }
  
  const resetSettings = await settingsService.resetSettings(userId, category)
  
  res.status(200).json({
    status: 'success',
    message: 'Settings reset successfully',
    data: {
      settings: resetSettings
    }
  })
}))

// 导出设置
router.get('/export', catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.query
  
  if (!userId) {
    return res.status(400).json({
      status: 'error',
      message: 'User ID is required'
    })
  }
  
  const exportData = await settingsService.exportSettings(userId as string)
  
  res.status(200).json({
    status: 'success',
    data: {
      export: exportData
    }
  })
}))

// 导入设置
router.post('/import', catchAsync(async (req: Request, res: Response) => {
  const { userId, settings } = req.body
  
  if (!userId || !settings) {
    return res.status(400).json({
      status: 'error',
      message: 'User ID and settings are required'
    })
  }
  
  const importedSettings = await settingsService.importSettings(userId, settings)
  
  res.status(200).json({
    status: 'success',
    message: 'Settings imported successfully',
    data: {
      settings: importedSettings
    }
  })
}))

// 获取系统配置
router.get('/system', catchAsync(async (req: Request, res: Response) => {
  const systemSettings = await settingsService.getSystemSettings()
  
  res.status(200).json({
    status: 'success',
    data: {
      settings: systemSettings
    }
  })
}))

export default router