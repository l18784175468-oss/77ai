import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { config } from '../config'
import { logger } from '../utils/logger'

export interface User {
  id: string
  username: string
  email: string
  password: string
  createdAt: string
  updatedAt: string
  isEmailVerified?: boolean
  twoFactorAuth?: boolean
}

export interface SignupRequest {
  username: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  user?: Omit<User, 'password'>
  token?: string
  error?: string
}

// 内存存储（生产环境应使用数据库）
const userStorage = new Map<string, User>()
const refreshTokensStorage = new Map<string, { userId: string; expiresAt: number }>()
const verificationTokensStorage = new Map<string, { userId: string; expiresAt: number }>()
const resetTokensStorage = new Map<string, { userId: string; expiresAt: number }>()

const authService = {
  async signup(request: SignupRequest): Promise<AuthResponse> {
    const { username, email, password } = request

    try {
      // 检查用户是否已存在
      const existingUser = Array.from(userStorage.values())
        .find(user => user.email === email || user.username === username)

      if (existingUser) {
        return {
          error: existingUser.email === email ? 'Email already exists' : 'Username already exists'
        }
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 12)

      // 创建用户
      const userId = Date.now().toString()
      const user: User = {
        id: userId,
        username,
        email,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isEmailVerified: false,
        twoFactorAuth: false
      }

      userStorage.set(userId, user)

      // 生成JWT令牌
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      )

      logger.info(`User signed up: ${email}`)

      return {
        user: this.sanitizeUser(user),
        token
      }
    } catch (error: any) {
      logger.error('Error during signup:', error)
      return {
        error: 'Signup failed. Please try again.'
      }
    }
  },

  async login(request: LoginRequest): Promise<AuthResponse> {
    const { email, password } = request

    try {
      // 查找用户
      const user = Array.from(userStorage.values())
        .find(u => u.email === email)

      if (!user) {
        return {
          error: 'Invalid email or password'
        }
      }

      // 验证密码
      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return {
          error: 'Invalid email or password'
        }
      }

      // 生成JWT令牌
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      )

      // 生成刷新令牌
      const refreshToken = this.generateRefreshToken(user.id)

      // 更新最后登录时间
      user.updatedAt = new Date().toISOString()
      userStorage.set(user.id, user)

      logger.info(`User logged in: ${email}`)

      return {
        user: this.sanitizeUser(user),
        token
      }
    } catch (error: any) {
      logger.error('Error during login:', error)
      return {
        error: 'Login failed. Please try again.'
      }
    }
  },

  async logout(token: string): Promise<void> {
    try {
      // 验证令牌
      const decoded = jwt.verify(token, config.jwt.secret) as any
      const userId = decoded.userId

      // 删除刷新令牌
      const tokensToDelete = Array.from(refreshTokensStorage.entries())
        .filter(([_, data]) => data.userId === userId)
        .map(([token]) => token)

      tokensToDelete.forEach(token => refreshTokensStorage.delete(token))

      logger.info(`User logged out: ${userId}`)
    } catch (error: any) {
      logger.error('Error during logout:', error)
    }
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const tokenData = refreshTokensStorage.get(refreshToken)
      if (!tokenData || tokenData.expiresAt < Date.now()) {
        return {
          error: 'Invalid or expired refresh token'
        }
      }

      const user = userStorage.get(tokenData.userId)
      if (!user) {
        return {
          error: 'User not found'
        }
      }

      // 生成新的访问令牌
      const newToken = jwt.sign(
        { userId: user.id, email: user.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      )

      // 删除旧的刷新令牌
      refreshTokensStorage.delete(refreshToken)

      return {
        token: newToken
      }
    } catch (error: any) {
      logger.error('Error refreshing token:', error)
      return {
        error: 'Token refresh failed'
      }
    }
  },

  async forgotPassword(email: string): Promise<void> {
    try {
      const user = Array.from(userStorage.values())
        .find(u => u.email === email)

      if (!user) {
        // 为了安全，即使用户不存在也返回成功
        logger.info(`Password reset requested for non-existent email: ${email}`)
        return
      }

      // 生成重置令牌
      const resetToken = this.generateResetToken(user.id)

      // 这里应该发送邮件
      logger.info(`Password reset token generated for user: ${user.id}`)
    } catch (error: any) {
      logger.error('Error during password reset:', error)
    }
  },

  async resetPassword(request: { token: string; newPassword: string }): Promise<AuthResponse> {
    const { token, newPassword } = request

    try {
      const tokenData = resetTokensStorage.get(token)
      if (!tokenData || tokenData.expiresAt < Date.now()) {
        return {
          error: 'Invalid or expired reset token'
        }
      }

      const user = userStorage.get(tokenData.userId)
      if (!user) {
        return {
          error: 'User not found'
        }
      }

      // 更新密码
      const hashedPassword = await bcrypt.hash(newPassword, 12)
      user.password = hashedPassword
      user.updatedAt = new Date().toISOString()
      userStorage.set(user.id, user)

      // 删除重置令牌
      resetTokensStorage.delete(token)

      logger.info(`Password reset successful for user: ${user.id}`)

      return {
        user: this.sanitizeUser(user)
      }
    } catch (error: any) {
      logger.error('Error during password reset:', error)
      return {
        error: 'Password reset failed'
      }
    }
  },

  async verifyEmail(token: string): Promise<AuthResponse> {
    try {
      const tokenData = verificationTokensStorage.get(token)
      if (!tokenData || tokenData.expiresAt < Date.now()) {
        return {
          error: 'Invalid or expired verification token'
        }
      }

      const user = userStorage.get(tokenData.userId)
      if (!user) {
        return {
          error: 'User not found'
        }
      }

      // 验证邮箱
      user.isEmailVerified = true
      user.updatedAt = new Date().toISOString()
      userStorage.set(user.id, user)

      // 删除验证令牌
      verificationTokensStorage.delete(token)

      logger.info(`Email verified for user: ${user.id}`)

      return {
        user: this.sanitizeUser(user)
      }
    } catch (error: any) {
      logger.error('Error during email verification:', error)
      return {
        error: 'Email verification failed'
      }
    }
  },

  async getCurrentUser(token: string): Promise<AuthResponse> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any
      const user = userStorage.get(decoded.userId)

      if (!user) {
        return {
          error: 'User not found'
        }
      }

      return {
        user: this.sanitizeUser(user)
      }
    } catch (error: any) {
      return {
        error: 'Invalid token'
      }
    }
  },

  generateRefreshToken(userId: string): string {
    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      config.jwt.secret,
      { expiresIn: '7d' }
    )

    refreshTokensStorage.set(refreshToken, {
      userId,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天
    })

    return refreshToken
  },

  generateResetToken(userId: string): string {
    const resetToken = jwt.sign(
      { userId, type: 'reset' },
      config.jwt.secret,
      { expiresIn: '1h' }
    )

    resetTokensStorage.set(resetToken, {
      userId,
      expiresAt: Date.now() + 60 * 60 * 1000 // 1小时
    })

    return resetToken
  },

  generateVerificationToken(userId: string): string {
    const verificationToken = jwt.sign(
      { userId, type: 'verification' },
      config.jwt.secret,
      { expiresIn: '24h' }
    )

    verificationTokensStorage.set(verificationToken, {
      userId,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24小时
    })

    return verificationToken
  },

  sanitizeUser(user: User): Omit<User, 'password'> {
    const { password, ...sanitizedUser } = user
    return sanitizedUser
  }
}

export default authService