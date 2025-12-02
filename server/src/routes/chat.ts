import { Router, Request, Response } from 'express'
import { catchAsync } from '../middleware/errorHandler'
import { aiRateLimiter } from '../middleware/rateLimiter'
import { chatService } from '../services/chatService'
import { logger } from '../utils/logger'

const router = Router()

// 获取聊天历史
router.get('/history', catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.query
  
  if (!userId) {
    return res.status(400).json({
      status: 'error',
      message: 'User ID is required'
    })
  }
  
  const history = await chatService.getChatHistory(userId as string)
  
  res.status(200).json({
    status: 'success',
    data: {
      history
    }
  })
}))

// 获取单个聊天记录
router.get('/:chatId', catchAsync(async (req: Request, res: Response) => {
  const { chatId } = req.params
  
  const chat = await chatService.getChatById(chatId)
  
  if (!chat) {
    return res.status(404).json({
      status: 'error',
      message: 'Chat not found'
    })
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      chat
    }
  })
}))

// 发送聊天消息
router.post('/', aiRateLimiter, catchAsync(async (req: Request, res: Response) => {
  const { message, model, chatId, userId } = req.body
  
  if (!message || !model || !userId) {
    return res.status(400).json({
      status: 'error',
      message: 'Message, model, and userId are required'
    })
  }
  
  logger.info(`Chat request from user ${userId} with model ${model}`)
  
  const response = await chatService.sendMessage({
    message,
    model,
    chatId,
    userId
  })
  
  res.status(200).json({
    status: 'success',
    data: response
  })
}))

// 创建新聊天
router.post('/new', catchAsync(async (req: Request, res: Response) => {
  const { title, userId } = req.body
  
  if (!userId) {
    return res.status(400).json({
      status: 'error',
      message: 'User ID is required'
    })
  }
  
  const newChat = await chatService.createChat({
    title: title || 'New Chat',
    userId
  })
  
  res.status(201).json({
    status: 'success',
    data: {
      chat: newChat
    }
  })
}))

// 更新聊天标题
router.patch('/:chatId/title', catchAsync(async (req: Request, res: Response) => {
  const { chatId } = req.params
  const { title } = req.body
  
  if (!title) {
    return res.status(400).json({
      status: 'error',
      message: 'Title is required'
    })
  }
  
  const updatedChat = await chatService.updateChatTitle(chatId, title)
  
  if (!updatedChat) {
    return res.status(404).json({
      status: 'error',
      message: 'Chat not found'
    })
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      chat: updatedChat
    }
  })
}))

// 删除聊天
router.delete('/:chatId', catchAsync(async (req: Request, res: Response) => {
  const { chatId } = req.params
  
  const deleted = await chatService.deleteChat(chatId)
  
  if (!deleted) {
    return res.status(404).json({
      status: 'error',
      message: 'Chat not found'
    })
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Chat deleted successfully'
  })
}))

// 清空聊天历史
router.delete('/history/:userId', catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params
  
  const deleted = await chatService.clearChatHistory(userId)
  
  res.status(200).json({
    status: 'success',
    message: 'Chat history cleared successfully',
    data: {
      deletedCount: deleted
    }
  })
}))

export default router