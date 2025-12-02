import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// 扩展Request接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        name?: string
      }
    }
  }
}

// JWT密钥（应该从环境变量获取）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// 认证中间件
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: '访问令牌缺失'
    })
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: '令牌无效或已过期'
      })
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name
    }

    next()
  })
}

// 可选认证中间件（不强制要求登录）
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return next() // 没有令牌，继续执行
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (!err) {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name
      }
    }
    next()
  })
}

// 生成JWT令牌
export const generateToken = (user: { id: string; email: string; name?: string }) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}