import { Router, Request, Response } from 'express'
import { catchAsync } from '../middleware/errorHandler'
import { loginRateLimiter, signupRateLimiter } from '../middleware/rateLimiter'
import { authService } from '../services/authService'
import { logger } from '../utils/logger'

const router = Router()

// 用户注册
router.post('/signup', signupRateLimiter, catchAsync(async (req: Request, res: Response) => {
  const { username, email, password } = req.body
  
  if (!username || !email || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Username, email, and password are required'
    })
  }
  
  logger.info(`Signup attempt for user: ${email}`)
  
  const result = await authService.signup({
    username,
    email,
    password
  })
  
  if (result.error) {
    return res.status(400).json({
      status: 'error',
      message: result.error
    })
  }
  
  res.status(201).json({
    status: 'success',
    message: 'User created successfully',
    data: {
      user: result.user
    }
  })
}))

// 用户登录
router.post('/login', loginRateLimiter, catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body
  
  if (!email || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Email and password are required'
    })
  }
  
  logger.info(`Login attempt for user: ${email}`)
  
  const result = await authService.login({
    email,
    password
  })
  
  if (result.error) {
    return res.status(401).json({
      status: 'error',
      message: result.error
    })
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Login successful',
    data: {
      user: result.user,
      token: result.token
    }
  })
}))

// 用户登出
router.post('/logout', catchAsync(async (req: Request, res: Response) => {
  const { token } = req.body
  
  await authService.logout(token)
  
  res.status(200).json({
    status: 'success',
    message: 'Logout successful'
  })
}))

// 刷新令牌
router.post('/refresh', catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body
  
  if (!refreshToken) {
    return res.status(400).json({
      status: 'error',
      message: 'Refresh token is required'
    })
  }
  
  const result = await authService.refreshToken(refreshToken)
  
  if (result.error) {
    return res.status(401).json({
      status: 'error',
      message: result.error
    })
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      token: result.token
    }
  })
}))

// 忘记密码
router.post('/forgot-password', loginRateLimiter, catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body
  
  if (!email) {
    return res.status(400).json({
      status: 'error',
      message: 'Email is required'
    })
  }
  
  const result = await authService.forgotPassword(email)
  
  res.status(200).json({
    status: 'success',
    message: 'Password reset email sent if account exists'
  })
}))

// 重置密码
router.post('/reset-password', catchAsync(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body
  
  if (!token || !newPassword) {
    return res.status(400).json({
      status: 'error',
      message: 'Token and new password are required'
    })
  }
  
  const result = await authService.resetPassword({
    token,
    newPassword
  })
  
  if (result.error) {
    return res.status(400).json({
      status: 'error',
      message: result.error
    })
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Password reset successful'
  })
}))

// 验证邮箱
router.post('/verify-email', catchAsync(async (req: Request, res: Response) => {
  const { token } = req.body
  
  if (!token) {
    return res.status(400).json({
      status: 'error',
      message: 'Verification token is required'
    })
  }
  
  const result = await authService.verifyEmail(token)
  
  if (result.error) {
    return res.status(400).json({
      status: 'error',
      message: result.error
    })
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Email verified successfully'
  })
}))

// 获取当前用户信息
router.get('/me', catchAsync(async (req: Request, res: Response) => {
  const { token } = req.headers
  
  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Token is required'
    })
  }
  
  const result = await authService.getCurrentUser(token as string)
  
  if (result.error) {
    return res.status(401).json({
      status: 'error',
      message: result.error
    })
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      user: result.user
    }
  })
}))

export default router