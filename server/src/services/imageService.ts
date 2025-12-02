import { AIServiceFactory } from './aiService'
import { logger } from '../utils/logger'

export interface ImageGenerationRequest {
  prompt: string
  negativePrompt?: string
  size?: string
  count?: number
  quality?: number
  model?: string
  userId: string
}

export interface ImageGenerationResponse {
  images: string[]
  model: string
  usage?: any
}

export interface ImageHistory {
  id: string
  prompt: string
  negativePrompt?: string
  size: string
  model: string
  images: string[]
  userId: string
  createdAt: string
}

export interface ImageEditRequest {
  imageId: string
  editPrompt: string
  userId: string
}

export interface ImageVariationsRequest {
  imageId: string
  count: number
  userId: string
}

// 内存存储（生产环境应使用数据库）
const imageStorage = new Map<string, ImageHistory>()
const userImagesStorage = new Map<string, string[]>()

const imageService = {
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const { prompt, negativePrompt, size, count, quality, model, userId } = request

    try {
      // 获取AI服务
      const provider = this.getProviderFromModel(model || 'dall-e-3')
      const aiService = AIServiceFactory.createService(provider, model || 'dall-e-3')

      // 生成图像
      const response = await aiService.generateImage(prompt, {
        negativePrompt,
        size: size || '1024x1024',
        count: count || 1,
        quality: quality || 80
      })

      // 保存图像记录
      const imageId = Date.now().toString()
      const imageRecord: ImageHistory = {
        id: imageId,
        prompt,
        negativePrompt,
        size: size || '1024x1024',
        model: model || 'dall-e-3',
        images: response.images,
        userId,
        createdAt: new Date().toISOString()
      }

      imageStorage.set(imageId, imageRecord)

      // 更新用户图像列表
      const userImages = userImagesStorage.get(userId) || []
      userImages.unshift(imageId)
      userImagesStorage.set(userId, userImages)

      logger.info(`Image generated successfully for user ${userId}, imageId: ${imageId}`)

      return {
        images: response.images,
        model: response.model,
        usage: response.usage
      }
    } catch (error: any) {
      logger.error('Error generating image:', error)
      throw error
    }
  },

  async getImageHistory(userId: string, page: number = 1, limit: number = 20): Promise<any> {
    const userImages = userImagesStorage.get(userId) || []
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedIds = userImages.slice(startIndex, endIndex)

    const images = paginatedIds
      .map(id => imageStorage.get(id))
      .filter(img => img !== undefined)

    return {
      images,
      pagination: {
        page,
        limit,
        total: userImages.length,
        totalPages: Math.ceil(userImages.length / limit)
      }
    }
  },

  async getImageById(imageId: string): Promise<ImageHistory | null> {
    return imageStorage.get(imageId) || null
  },

  async deleteImage(imageId: string): Promise<boolean> {
    const image = imageStorage.get(imageId)
    if (!image) {
      return false
    }

    imageStorage.delete(imageId)

    // 从用户图像列表中移除
    const userImages = userImagesStorage.get(image.userId) || []
    const index = userImages.indexOf(imageId)
    if (index > -1) {
      userImages.splice(index, 1)
      userImagesStorage.set(image.userId, userImages)
    }

    logger.info(`Image deleted: ${imageId}`)
    return true
  },

  async editImage(request: ImageEditRequest): Promise<ImageHistory | null> {
    const { imageId, editPrompt, userId } = request

    const originalImage = imageStorage.get(imageId)
    if (!originalImage || originalImage.userId !== userId) {
      return null
    }

    try {
      // 获取AI服务
      const provider = this.getProviderFromModel(originalImage.model)
      const aiService = AIServiceFactory.createService(provider, originalImage.model)

      // 这里应该实现图像编辑逻辑
      // 暂时返回原图像记录
      logger.info(`Image edit requested for imageId: ${imageId}`)
      return originalImage
    } catch (error: any) {
      logger.error('Error editing image:', error)
      throw error
    }
  },

  async createVariations(request: ImageVariationsRequest): Promise<string[]> {
    const { imageId, count, userId } = request

    const originalImage = imageStorage.get(imageId)
    if (!originalImage || originalImage.userId !== userId) {
      throw new Error('Image not found or access denied')
    }

    try {
      // 获取AI服务
      const provider = this.getProviderFromModel(originalImage.model)
      const aiService = AIServiceFactory.createService(provider, originalImage.model)

      // 这里应该实现图像变体生成逻辑
      // 暂时返回空数组
      logger.info(`Image variations requested for imageId: ${imageId}`)
      return []
    } catch (error: any) {
      logger.error('Error creating image variations:', error)
      throw error
    }
  },

  getProviderFromModel(model: string): string {
    if (model.startsWith('dall-e')) {
      return 'openai'
    } else if (model.startsWith('stable-diffusion')) {
      return 'openai' // 假设使用OpenAI兼容的API
    } else if (model.startsWith('midjourney')) {
      return 'openai' // 假设使用OpenAI兼容的API
    }
    return 'openai' // 默认
  },

  async getImageStats(userId: string): Promise<any> {
    const userImages = userImagesStorage.get(userId) || []
    let totalImages = 0
    const modelStats: { [key: string]: number } = {}

    for (const imageId of userImages) {
      const image = imageStorage.get(imageId)
      if (image) {
        totalImages += image.images.length
        modelStats[image.model] = (modelStats[image.model] || 0) + 1
      }
    }

    return {
      totalImages,
      totalGenerations: userImages.length,
      modelStats,
      averageImagesPerGeneration: userImages.length > 0 ? Math.round(totalImages / userImages.length) : 0
    }
  }
}

export default imageService