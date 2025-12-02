import { Router, Request, Response } from 'express'
import { catchAsync } from '../middleware/errorHandler'
import { imageRateLimiter } from '../middleware/rateLimiter'
import { imageService } from '../services/imageService'
import { logger } from '../utils/logger'

const router = Router()

// 生成图像
router.post('/generate', imageRateLimiter, catchAsync(async (req: Request, res: Response) => {
  const { prompt, negativePrompt, size, count, quality, model, userId } = req.body
  
  if (!prompt || !userId) {
    return res.status(400).json({
      status: 'error',
      message: 'Prompt and userId are required'
    })
  }
  
  logger.info(`Image generation request from user ${userId} with model ${model}`)
  
  const response = await imageService.generateImage({
    prompt,
    negativePrompt,
    size: size || '1024x1024',
    count: count || 1,
    quality: quality || 80,
    model: model || 'dall-e-3',
    userId
  })
  
  res.status(200).json({
    status: 'success',
    data: response
  })
}))

// 获取图像历史
router.get('/history', catchAsync(async (req: Request, res: Response) => {
  const { userId, page = 1, limit = 20 } = req.query
  
  if (!userId) {
    return res.status(400).json({
      status: 'error',
      message: 'User ID is required'
    })
  }
  
  const history = await imageService.getImageHistory(
    userId as string,
    parseInt(page as string),
    parseInt(limit as string)
  )
  
  res.status(200).json({
    status: 'success',
    data: history
  })
}))

// 获取单个图像信息
router.get('/:imageId', catchAsync(async (req: Request, res: Response) => {
  const { imageId } = req.params
  
  const image = await imageService.getImageById(imageId)
  
  if (!image) {
    return res.status(404).json({
      status: 'error',
      message: 'Image not found'
    })
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      image
    }
  })
}))

// 删除图像
router.delete('/:imageId', catchAsync(async (req: Request, res: Response) => {
  const { imageId } = req.params
  
  const deleted = await imageService.deleteImage(imageId)
  
  if (!deleted) {
    return res.status(404).json({
      status: 'error',
      message: 'Image not found'
    })
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Image deleted successfully'
  })
}))

// 编辑图像
router.post('/:imageId/edit', imageRateLimiter, catchAsync(async (req: Request, res: Response) => {
  const { imageId } = req.params
  const { editPrompt, userId } = req.body
  
  if (!editPrompt || !userId) {
    return res.status(400).json({
      status: 'error',
      message: 'Edit prompt and userId are required'
    })
  }
  
  const editedImage = await imageService.editImage({
    imageId,
    editPrompt,
    userId
  })
  
  if (!editedImage) {
    return res.status(404).json({
      status: 'error',
      message: 'Image not found or edit failed'
    })
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      image: editedImage
    }
  })
}))

// 图像变体生成
router.post('/:imageId/variations', imageRateLimiter, catchAsync(async (req: Request, res: Response) => {
  const { imageId } = req.params
  const { count, userId } = req.body
  
  if (!userId) {
    return res.status(400).json({
      status: 'error',
      message: 'User ID is required'
    })
  }
  
  const variations = await imageService.createVariations({
    imageId,
    count: count || 1,
    userId
  })
  
  res.status(200).json({
    status: 'success',
    data: {
      variations
    }
  })
}))

// 上传图像作为编辑基础
router.post('/upload', catchAsync(async (req: Request, res: Response) => {
  // 这里应该使用multer中间件处理文件上传
  // 暂时返回基础响应
  res.status(200).json({
    status: 'success',
    message: 'Image upload endpoint - needs multer middleware'
  })
}))

export default router