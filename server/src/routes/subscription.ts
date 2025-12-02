import express from 'express'
import { SubscriptionService } from '../services/subscriptionService'
import { authenticateToken } from '../middleware/auth'
import { logger } from '../utils/logger'

const router = express.Router()

// 获取用户订阅信息
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '用户未认证'
      })
    }
    
    let subscription = await SubscriptionService.getUserSubscription(userId)
    
    // 如果用户没有订阅，创建免费订阅
    if (!subscription) {
      subscription = await SubscriptionService.createUserSubscription(userId)
    }
    
    res.json({
      success: true,
      data: subscription
    })
  } catch (error: any) {
    logger.error('Failed to get current subscription:', error)
    res.status(500).json({
      success: false,
      error: error.message || '获取订阅信息失败'
    })
  }
})

// 获取使用统计
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '用户未认证'
      })
    }
    
    const usageStats = await SubscriptionService.getUsageStats(userId)
    
    res.json({
      success: true,
      data: usageStats
    })
  } catch (error: any) {
    logger.error('Failed to get usage stats:', error)
    res.status(500).json({
      success: false,
      error: error.message || '获取使用统计失败'
    })
  }
})

// 获取所有订阅计划
router.get('/plans', authenticateToken, (req, res) => {
  try {
    const plans = SubscriptionService.getAllPlans()
    
    res.json({
      success: true,
      data: plans
    })
  } catch (error: any) {
    logger.error('Failed to get subscription plans:', error)
    res.status(500).json({
      success: false,
      error: error.message || '获取订阅计划失败'
    })
  }
})

// 更新订阅计划
router.post('/update', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    const { plan } = req.body
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '用户未认证'
      })
    }
    
    if (!plan) {
      return res.status(400).json({
        success: false,
        error: '订阅计划参数是必需的'
      })
    }
    
    const subscription = await SubscriptionService.updateSubscriptionPlan(userId, plan)
    
    res.json({
      success: true,
      message: '订阅计划更新成功',
      data: subscription
    })
  } catch (error: any) {
    logger.error('Failed to update subscription plan:', error)
    res.status(500).json({
      success: false,
      error: error.message || '更新订阅计划失败'
    })
  }
})

// 取消订阅
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '用户未认证'
      })
    }
    
    await SubscriptionService.cancelSubscription(userId)
    
    res.json({
      success: true,
      message: '订阅已取消'
    })
  } catch (error: any) {
    logger.error('Failed to cancel subscription:', error)
    res.status(500).json({
      success: false,
      error: error.message || '取消订阅失败'
    })
  }
})

// 检查使用量限制
router.get('/check-limit/:type', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    const { type } = req.params
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '用户未认证'
      })
    }
    
    if (!['message', 'image', 'token'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: '无效的使用量类型'
      })
    }
    
    const limitCheck = await SubscriptionService.checkUsageLimits(
      userId, 
      type as 'message' | 'image' | 'token'
    )
    
    res.json({
      success: true,
      data: limitCheck
    })
  } catch (error: any) {
    logger.error('Failed to check usage limits:', error)
    res.status(500).json({
      success: false,
      error: error.message || '检查使用量限制失败'
    })
  }
})

// 中间件：检查使用量限制
export const checkUsageLimit = (usageType: 'message' | 'image' | 'token') => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const userId = req.user?.id
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: '用户未认证'
        })
      }
      
      const limitCheck = await SubscriptionService.checkUsageLimits(userId, usageType)
      
      if (!limitCheck.canUse) {
        return res.status(429).json({
          success: false,
          error: `已达到${usageType === 'message' ? '消息' : usageType === 'image' ? '图像' : '令牌'}使用限制`,
          data: limitCheck
        })
      }
      
      // 增加使用量
      await SubscriptionService.incrementUsage(userId, usageType)
      
      next()
    } catch (error: any) {
      logger.error('Usage limit check failed:', error)
      res.status(500).json({
        success: false,
        error: error.message || '检查使用量限制失败'
      })
    }
  }
}

export default router