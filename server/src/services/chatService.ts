import { AIServiceFactory, AIMessage, AIResponse } from './aiService'
import { logger } from '../utils/logger'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  model?: string
}

export interface Chat {
  id: string
  title: string
  userId: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
  model?: string
}

export interface SendMessageRequest {
  message: string
  model: string
  chatId?: string
  userId: string
}

export interface SendMessageResponse {
  message: string
  chatId: string
  messageId: string
  model: string
  usage?: any
}

// 内存存储（生产环境应使用数据库）
const chatStorage = new Map<string, Chat>()
const userChatsStorage = new Map<string, string[]>()

const chatService = {
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    const { message, model, chatId, userId } = request

    try {
      // 获取或创建聊天
      let chat: Chat
      if (chatId) {
        const existingChat = chatStorage.get(chatId)
        if (!existingChat) {
          throw new Error('Chat not found')
        }
        chat = existingChat
      } else {
        chat = await chatService.createChat({
          title: message.slice(0, 20) + (message.length > 20 ? '...' : ''),
          userId
        })
        request.chatId = chat.id
      }

      // 添加用户消息
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        model
      }
      chat.messages.push(userMessage)

      // 准备AI消息
      const aiMessages: AIMessage[] = chat.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // 获取AI服务
      const provider = chatService.getProviderFromModel(model)
      const aiService = AIServiceFactory.createService(provider, model)

      // 发送消息到AI
      const aiResponse: AIResponse = await aiService.sendMessage(aiMessages)

      // 添加AI响应
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.message,
        timestamp: new Date().toISOString(),
        model: aiResponse.model
      }
      chat.messages.push(assistantMessage)

      // 更新聊天时间
      chat.updatedAt = new Date().toISOString()

      // 保存聊天
      if (chatId) {
        chatStorage.set(chatId, chat)
      }

      logger.info(`Message sent successfully for chat ${chatId}`)

      return {
        message: aiResponse.message,
        chatId,
        messageId: assistantMessage.id,
        model: aiResponse.model,
        usage: aiResponse.usage
      }
    } catch (error: any) {
      logger.error('Error sending message:', error)
      throw error
    }
  },

  async createChat(request: { title: string; userId: string }): Promise<Chat> {
    const { title, userId } = request
    const chatId = Date.now().toString()

    const chat: Chat = {
      id: chatId,
      title,
      userId,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    chatStorage.set(chatId, chat)

    // 更新用户聊天列表
    const userChats = userChatsStorage.get(userId) || []
    userChats.unshift(chat.id)
    userChatsStorage.set(userId, userChats)

    logger.info(`Chat created: ${chat.id} for user: ${userId}`)
    return chat
  },

  async getChatHistory(userId: string): Promise<Chat[]> {
    const userChats = userChatsStorage.get(userId) || []
    return userChats
      .map(chatId => chatStorage.get(chatId))
      .filter((chat): chat is Chat => chat !== undefined)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  },

  getChatById(chatId: string): Chat | null {
    return chatStorage.get(chatId) || null
  },

  updateChatTitle(chatId: string, title: string): Chat | null {
    const chat = chatStorage.get(chatId)
    if (!chat) {
      return null
    }

    chat.title = title
    chat.updatedAt = new Date().toISOString()
    chatStorage.set(chatId, chat)

    logger.info(`Chat title updated: ${chatId}`)
    return chat
  },

  deleteChat(chatId: string): boolean {
    const chat = chatStorage.get(chatId)
    if (!chat) {
      return false
    }

    chatStorage.delete(chatId)

    // 从用户聊天列表中移除
    const userChats = userChatsStorage.get(chat.userId) || []
    const index = userChats.indexOf(chatId)
    if (index > -1) {
      userChats.splice(index, 1)
      userChatsStorage.set(chat.userId, userChats)
    }

    logger.info(`Chat deleted: ${chatId}`)
    return true
  },

  clearChatHistory(userId: string): number {
    const userChats = userChatsStorage.get(userId) || []
    let deletedCount = 0

    for (const chatId of userChats) {
      if (chatStorage.delete(chatId)) {
        deletedCount++
      }
    }

    userChatsStorage.set(userId, [])
    logger.info(`Chat history cleared for user: ${userId}, deleted: ${deletedCount}`)
    return deletedCount
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
  },

  getChatStats(userId: string): any {
    const userChats = userChatsStorage.get(userId) || []
    let totalMessages = 0
    let totalChats = userChats.length

    for (const chatId of userChats) {
      const chat = chatStorage.get(chatId)
      if (chat) {
        totalMessages += chat.messages.length
      }
    }

    return {
      totalChats,
      totalMessages,
      averageMessagesPerChat: totalChats > 0 ? Math.round(totalMessages / totalChats) : 0
    }
  }
}

export default chatService