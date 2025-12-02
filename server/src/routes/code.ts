import { Router, Request, Response } from 'express'
import { catchAsync } from '../middleware/errorHandler'
import { aiRateLimiter } from '../middleware/rateLimiter'
import { codeService } from '../services/codeService'
import { logger } from '../utils/logger'

const router = Router()

// 分析代码
router.post('/analyze', aiRateLimiter, catchAsync(async (req: Request, res: Response) => {
  const { code, language, model, userId } = req.body
  
  if (!code || !language || !userId) {
    return res.status(400).json({
      status: 'error',
      message: 'Code, language, and userId are required'
    })
  }
  
  logger.info(`Code analysis request from user ${userId} with model ${model}`)
  
  const analysis = await codeService.analyzeCode({
    code,
    language,
    model: model || 'gpt-4',
    userId
  })
  
  res.status(200).json({
    status: 'success',
    data: analysis
  })
}))

// 生成代码
router.post('/generate', aiRateLimiter, catchAsync(async (req: Request, res: Response) => {
  const { prompt, language, model, userId } = req.body
  
  if (!prompt || !language || !userId) {
    return res.status(400).json({
      status: 'error',
      message: 'Prompt, language, and userId are required'
    })
  }
  
  logger.info(`Code generation request from user ${userId} with model ${model}`)
  
  const generatedCode = await codeService.generateCode({
    prompt,
    language,
    model: model || 'gpt-4',
    userId
  })
  
  res.status(200).json({
    status: 'success',
    data: {
      code: generatedCode
    }
  })
}))

// 优化代码
router.post('/optimize', aiRateLimiter, catchAsync(async (req: Request, res: Response) => {
  const { code, language, model, userId } = req.body
  
  if (!code || !language || !userId) {
    return res.status(400).json({
      status: 'error',
      message: 'Code, language, and userId are required'
    })
  }
  
  const optimized = await codeService.optimizeCode({
    code,
    language,
    model: model || 'gpt-4',
    userId
  })
  
  res.status(200).json({
    status: 'success',
    data: {
      optimized
    }
  })
}))

// 检测代码错误
router.post('/errors', aiRateLimiter, catchAsync(async (req: Request, res: Response) => {
  const { code, language, model, userId } = req.body
  
  if (!code || !language || !userId) {
    return res.status(400).json({
      status: 'error',
      message: 'Code, language, and userId are required'
    })
  }
  
  const errors = await codeService.detectErrors({
    code,
    language,
    model: model || 'gpt-4',
    userId
  })
  
  res.status(200).json({
    status: 'success',
    data: {
      errors
    }
  })
}))

// 解释代码
router.post('/explain', aiRateLimiter, catchAsync(async (req: Request, res: Response) => {
  const { code, language, model, userId } = req.body
  
  if (!code || !language || !userId) {
    return res.status(400).json({
      status: 'error',
      message: 'Code, language, and userId are required'
    })
  }
  
  const explanation = await codeService.explainCode({
    code,
    language,
    model: model || 'gpt-4',
    userId
  })
  
  res.status(200).json({
    status: 'success',
    data: {
      explanation
    }
  })
}))

// 格式化代码
router.post('/format', catchAsync(async (req: Request, res: Response) => {
  const { code, language } = req.body
  
  if (!code || !language) {
    return res.status(400).json({
      status: 'error',
      message: 'Code and language are required'
    })
  }
  
  const formatted = await codeService.formatCode({
    code,
    language
  })
  
  res.status(200).json({
    status: 'success',
    data: {
      formatted
    }
  })
}))

// 获取代码历史
router.get('/history', catchAsync(async (req: Request, res: Response) => {
  const { userId, page = 1, limit = 20 } = req.query
  
  if (!userId) {
    return res.status(400).json({
      status: 'error',
      message: 'User ID is required'
    })
  }
  
  const history = await codeService.getCodeHistory(
    userId as string,
    parseInt(page as string),
    parseInt(limit as string)
  )
  
  res.status(200).json({
    status: 'success',
    data: history
  })
}))

// 删除代码记录
router.delete('/:codeId', catchAsync(async (req: Request, res: Response) => {
  const { codeId } = req.params
  
  const deleted = await codeService.deleteCodeRecord(codeId)
  
  if (!deleted) {
    return res.status(404).json({
      status: 'error',
      message: 'Code record not found'
    })
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Code record deleted successfully'
  })
}))

export default router