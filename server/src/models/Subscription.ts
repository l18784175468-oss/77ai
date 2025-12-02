import mongoose from 'mongoose'

// 订阅计划枚举
export enum SubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

// 订阅状态枚举
export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
  PENDING = 'pending'
}

// 订阅接口
export interface ISubscription {
  userId: mongoose.Types.ObjectId
  plan: SubscriptionPlan
  status: SubscriptionStatus
  startDate: Date
  endDate?: Date
  features: {
    monthlyMessages: number
    monthlyImages: number
    maxTokens: number
    customModels: number
    prioritySupport: boolean
  }
  usage: {
    messages: number
    images: number
    tokens: number
    lastReset: Date
  }
  paymentMethod?: string
  stripeSubscriptionId?: string
  canceledAt?: Date
}

// 订阅Schema
const subscriptionSchema = new mongoose.Schema<ISubscription>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  plan: {
    type: String,
    enum: Object.values(SubscriptionPlan),
    default: SubscriptionPlan.FREE
  },
  status: {
    type: String,
    enum: Object.values(SubscriptionStatus),
    default: SubscriptionStatus.ACTIVE
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  features: {
    monthlyMessages: {
      type: Number,
      default: 100
    },
    monthlyImages: {
      type: Number,
      default: 10
    },
    maxTokens: {
      type: Number,
      default: 4000
    },
    customModels: {
      type: Number,
      default: 0
    },
    prioritySupport: {
      type: Boolean,
      default: false
    }
  },
  usage: {
    messages: {
      type: Number,
      default: 0
    },
    images: {
      type: Number,
      default: 0
    },
    tokens: {
      type: Number,
      default: 0
    },
    lastReset: {
      type: Date,
      default: Date.now
    }
  },
  paymentMethod: {
    type: String
  },
  stripeSubscriptionId: {
    type: String
  },
  canceledAt: {
    type: Date
  }
}, {
  timestamps: true
})

// 索引
subscriptionSchema.index({ userId: 1 })
subscriptionSchema.index({ status: 1 })
subscriptionSchema.index({ plan: 1 })

// 中间件：重置月度使用量
subscriptionSchema.pre('save', function(next) {
  const now = new Date()
  const lastReset = this.usage.lastReset
  
  // 如果距离上次重置已经过了一个月，重置使用量
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    this.usage.messages = 0
    this.usage.images = 0
    this.usage.tokens = 0
    this.usage.lastReset = now
  }
  
  next()
})

// 静态方法：获取订阅计划配置
subscriptionSchema.statics.getPlanFeatures = function(plan: SubscriptionPlan) {
  const plans = {
    [SubscriptionPlan.FREE]: {
      monthlyMessages: 100,
      monthlyImages: 10,
      maxTokens: 4000,
      customModels: 0,
      prioritySupport: false,
      price: 0
    },
    [SubscriptionPlan.BASIC]: {
      monthlyMessages: 1000,
      monthlyImages: 100,
      maxTokens: 8000,
      customModels: 3,
      prioritySupport: false,
      price: 9.99
    },
    [SubscriptionPlan.PRO]: {
      monthlyMessages: 5000,
      monthlyImages: 500,
      maxTokens: 16000,
      customModels: 10,
      prioritySupport: true,
      price: 29.99
    },
    [SubscriptionPlan.ENTERPRISE]: {
      monthlyMessages: -1, // 无限制
      monthlyImages: -1, // 无限制
      maxTokens: 32000,
      customModels: -1, // 无限制
      prioritySupport: true,
      price: 99.99
    }
  }
  
  return plans[plan] || plans[SubscriptionPlan.FREE]
}

export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema)
export { SubscriptionPlan, SubscriptionStatus }