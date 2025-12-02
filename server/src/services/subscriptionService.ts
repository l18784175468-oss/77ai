import { Subscription, ISubscription, SubscriptionPlan, SubscriptionStatus } from '../models/Subscription'
import { logger } from '../utils/logger'

export class SubscriptionService {
  // 获取用户订阅
  static async getUserSubscription(userId: string): Promise<ISubscription | null> {
    try {
      const subscription = await Subscription.findOne({ userId })
      return subscription
    } catch (error) {
      logger.error('Failed to get user subscription:', error)
      throw new Error('获取用户订阅失败')
    }
  }

  // 创建用户订阅
  static async createUserSubscription(userId: string, plan: SubscriptionPlan = SubscriptionPlan.FREE): Promise<ISubscription> {
    try {
      const planFeatures = Subscription.getPlanFeatures(plan)
      
      const subscription = new Subscription({
        userId,
        plan,
        status: SubscriptionStatus.ACTIVE,
        features: {
          monthlyMessages: planFeatures.monthlyMessages,
          monthlyImages: planFeatures.monthlyImages,
          maxTokens: planFeatures.maxTokens,
          customModels: planFeatures.customModels,
          prioritySupport: planFeatures.prioritySupport
        },
        usage: {
          messages: 0,
          images: 0,
          tokens: 0,
          lastReset: new Date()
        }
      })
      
      await subscription.save()
      logger.info(`Created subscription for user ${userId} with plan ${plan}`)
      
      return subscription
    } catch (error) {
      logger.error('Failed to create user subscription:', error)
      throw new Error('创建用户订阅失败')
    }
  }

  // 更新订阅计划
  static async updateSubscriptionPlan(userId: string, newPlan: SubscriptionPlan): Promise<ISubscription> {
    try {
      const subscription = await Subscription.findOne({ userId })
      
      if (!subscription) {
        throw new Error('用户订阅不存在')
      }
      
      const planFeatures = Subscription.getPlanFeatures(newPlan)
      
      subscription.plan = newPlan
      subscription.features = {
        monthlyMessages: planFeatures.monthlyMessages,
        monthlyImages: planFeatures.monthlyImages,
        maxTokens: planFeatures.maxTokens,
        customModels: planFeatures.customModels,
        prioritySupport: planFeatures.prioritySupport
      }
      
      // 如果升级计划，设置新的结束日期
      if (newPlan !== SubscriptionPlan.FREE) {
        const endDate = new Date()
        endDate.setMonth(endDate.getMonth() + 1)
        subscription.endDate = endDate
      } else {
        subscription.endDate = undefined
      }
      
      await subscription.save()
      logger.info(`Updated subscription for user ${userId} to plan ${newPlan}`)
      
      return subscription
    } catch (error) {
      logger.error('Failed to update subscription plan:', error)
      throw new Error('更新订阅计划失败')
    }
  }

  // 检查使用量限制
  static async checkUsageLimits(userId: string, usageType: 'message' | 'image' | 'token'): Promise<{
    canUse: boolean
    remaining?: number
    limit?: number
  }> {
    try {
      const subscription = await Subscription.getUserSubscription(userId)
      
      if (!subscription) {
        return { canUse: false }
      }
      
      const { features, usage } = subscription
      
      // 检查订阅状态
      if (subscription.status !== SubscriptionStatus.ACTIVE) {
        return { canUse: false }
      }
      
      // 检查订阅是否过期
      if (subscription.endDate && new Date() > subscription.endDate) {
        return { canUse: false }
      }
      
      let limit: number
      let current: number
      
      switch (usageType) {
        case 'message':
          limit = features.monthlyMessages
          current = usage.messages
          break
        case 'image':
          limit = features.monthlyImages
          current = usage.images
          break
        case 'token':
          limit = features.maxTokens
          current = usage.tokens
          break
        default:
          return { canUse: false }
      }
      
      // -1 表示无限制
      if (limit === -1) {
        return { canUse: true, remaining: -1, limit: -1 }
      }
      
      const remaining = Math.max(0, limit - current)
      return {
        canUse: remaining > 0,
        remaining,
        limit
      }
    } catch (error) {
      logger.error('Failed to check usage limits:', error)
      return { canUse: false }
    }
  }

  // 增加使用量
  static async incrementUsage(userId: string, usageType: 'message' | 'image' | 'token', amount: number = 1): Promise<void> {
    try {
      const subscription = await Subscription.findOne({ userId })
      
      if (!subscription) {
        throw new Error('用户订阅不存在')
      }
      
      switch (usageType) {
        case 'message':
          subscription.usage.messages += amount
          break
        case 'image':
          subscription.usage.images += amount
          break
        case 'token':
          subscription.usage.tokens += amount
          break
      }
      
      await subscription.save()
    } catch (error) {
      logger.error('Failed to increment usage:', error)
      throw new Error('更新使用量失败')
    }
  }

  // 获取所有订阅计划
  static getAllPlans(): Array<{
    id: SubscriptionPlan
    name: string
    features: any
    price: number
  }> {
    return Object.values(SubscriptionPlan).map(plan => {
      const features = Subscription.getPlanFeatures(plan)
      return {
        id: plan,
        name: this.getPlanName(plan),
        features,
        price: features.price
      }
    })
  }

  // 获取计划名称
  static getPlanName(plan: SubscriptionPlan): string {
    const planNames = {
      [SubscriptionPlan.FREE]: '免费版',
      [SubscriptionPlan.BASIC]: '基础版',
      [SubscriptionPlan.PRO]: '专业版',
      [SubscriptionPlan.ENTERPRISE]: '企业版'
    }
    
    return planNames[plan] || '未知计划'
  }

  // 取消订阅
  static async cancelSubscription(userId: string): Promise<void> {
    try {
      const subscription = await Subscription.findOne({ userId })
      
      if (!subscription) {
        throw new Error('用户订阅不存在')
      }
      
      subscription.status = SubscriptionStatus.CANCELED
      subscription.canceledAt = new Date()
      
      // 设置免费计划
      const freeFeatures = Subscription.getPlanFeatures(SubscriptionPlan.FREE)
      subscription.plan = SubscriptionPlan.FREE
      subscription.features = {
        monthlyMessages: freeFeatures.monthlyMessages,
        monthlyImages: freeFeatures.monthlyImages,
        maxTokens: freeFeatures.maxTokens,
        customModels: freeFeatures.customModels,
        prioritySupport: freeFeatures.prioritySupport
      }
      
      await subscription.save()
      logger.info(`Canceled subscription for user ${userId}`)
    } catch (error) {
      logger.error('Failed to cancel subscription:', error)
      throw new Error('取消订阅失败')
    }
  }

  // 获取使用统计
  static async getUsageStats(userId: string): Promise<{
    messages: { used: number; limit: number; remaining: number }
    images: { used: number; limit: number; remaining: number }
    tokens: { used: number; limit: number; remaining: number }
  }> {
    try {
      const subscription = await Subscription.getUserSubscription(userId)
      
      if (!subscription) {
        throw new Error('用户订阅不存在')
      }
      
      const { features, usage } = subscription
      
      return {
        messages: {
          used: usage.messages,
          limit: features.monthlyMessages,
          remaining: Math.max(0, features.monthlyMessages - usage.messages)
        },
        images: {
          used: usage.images,
          limit: features.monthlyImages,
          remaining: Math.max(0, features.monthlyImages - usage.images)
        },
        tokens: {
          used: usage.tokens,
          limit: features.maxTokens,
          remaining: Math.max(0, features.maxTokens - usage.tokens)
        }
      }
    } catch (error) {
      logger.error('Failed to get usage stats:', error)
      throw new Error('获取使用统计失败')
    }
  }
}

export default SubscriptionService