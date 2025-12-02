import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import path from 'path'

// 导入路由
import chatRoutes from './routes/chat'
import imageRoutes from './routes/image'
import codeRoutes from './routes/code'
import authRoutes from './routes/auth'
import settingsRoutes from './routes/settings'
import customAIRoutes from './routes/customAI'
import customAIChatRoutes from './routes/customAIChat'
import aiRoutes from './routes/ai'
import subscriptionRoutes from './routes/subscription'

// 导入中间件
import { errorHandler } from './middleware/errorHandler'
import { rateLimiter } from './middleware/rateLimiter'
import { logger } from './utils/logger'

// 加载环境变量
dotenv.config()

const app = express()
const server = createServer(app)
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

const PORT = process.env.PORT || 5000

// 基础中间件
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}))
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 速率限制
app.use(rateLimiter)

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// API路由
app.use('/api/chat', chatRoutes)
app.use('/api/image', imageRoutes)
app.use('/api/code', codeRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/custom-ai', customAIRoutes)
app.use('/api/custom-ai', customAIChatRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/subscription', subscriptionRoutes)

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  })
})

// 错误处理中间件
app.use(errorHandler)

// Socket.IO连接处理
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`)

  socket.on('join-chat', (chatId) => {
    socket.join(chatId)
    logger.info(`Client ${socket.id} joined chat ${chatId}`)
  })

  socket.on('leave-chat', (chatId) => {
    socket.leave(chatId)
    logger.info(`Client ${socket.id} left chat ${chatId}`)
  })

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`)
  })
})

// 启动服务器
server.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`)
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
})

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

export { app, io }