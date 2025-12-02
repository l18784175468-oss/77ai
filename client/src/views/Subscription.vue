<template>
  <div class="subscription-container">
    <div class="page-header">
      <h1>订阅计划</h1>
      <p>选择适合您需求的订阅计划</p>
    </div>

    <div class="content-wrapper">
      <!-- 当前订阅信息 -->
      <div v-if="currentSubscription" class="current-subscription">
        <h2>当前订阅</h2>
        <div class="subscription-card current">
          <div class="card-header">
            <h3>{{ getPlanName(currentSubscription.plan) }}</h3>
            <el-tag :type="getStatusType(currentSubscription.status)">
              {{ getStatusText(currentSubscription.status) }}
            </el-tag>
          </div>
          
          <div class="card-content">
            <div class="features">
              <div class="feature-item">
                <span class="feature-name">月度消息</span>
                <span class="feature-value">
                  {{ currentSubscription.features.monthlyMessages === -1 ? '无限制' : currentSubscription.features.monthlyMessages }}
                </span>
              </div>
              <div class="feature-item">
                <span class="feature-name">月度图像</span>
                <span class="feature-value">
                  {{ currentSubscription.features.monthlyImages === -1 ? '无限制' : currentSubscription.features.monthlyImages }}
                </span>
              </div>
              <div class="feature-item">
                <span class="feature-name">最大令牌</span>
                <span class="feature-value">{{ currentSubscription.features.maxTokens }}</span>
              </div>
              <div class="feature-item">
                <span class="feature-name">自定义模型</span>
                <span class="feature-value">
                  {{ currentSubscription.features.customModels === -1 ? '无限制' : currentSubscription.features.customModels }}
                </span>
              </div>
              <div class="feature-item">
                <span class="feature-name">优先支持</span>
                <span class="feature-value">
                  <el-tag :type="currentSubscription.features.prioritySupport ? 'success' : 'info'" size="small">
                    {{ currentSubscription.features.prioritySupport ? '是' : '否' }}
                  </el-tag>
                </span>
              </div>
            </div>
            
            <div class="usage-stats">
              <h4>使用统计</h4>
              <div class="usage-item">
                <span>消息</span>
                <el-progress 
                  :percentage="getUsagePercentage('messages')" 
                  :color="getUsageColor('messages')"
                >
                  <span>{{ usageStats.messages.used }} / {{ usageStats.messages.limit }}</span>
                </el-progress>
              </div>
              <div class="usage-item">
                <span>图像</span>
                <el-progress 
                  :percentage="getUsagePercentage('images')" 
                  :color="getUsageColor('images')"
                >
                  <span>{{ usageStats.images.used }} / {{ usageStats.images.limit }}</span>
                </el-progress>
              </div>
              <div class="usage-item">
                <span>令牌</span>
                <el-progress 
                  :percentage="getUsagePercentage('tokens')" 
                  :color="getUsageColor('tokens')"
                >
                  <span>{{ usageStats.tokens.used }} / {{ usageStats.tokens.limit }}</span>
                </el-progress>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 可用计划 -->
      <div class="available-plans">
        <h2>可用计划</h2>
        <div class="plans-grid">
          <div 
            v-for="plan in availablePlans" 
            :key="plan.id"
            class="plan-card"
            :class="{ 
              'recommended': plan.id === 'pro',
              'current': currentSubscription?.plan === plan.id 
            }"
          >
            <div class="card-header">
              <h3>{{ plan.name }}</h3>
              <div class="price">
                <span class="currency">¥</span>
                <span class="amount">{{ plan.price }}</span>
                <span class="period">/月</span>
              </div>
            </div>
            
            <div class="card-content">
              <div class="features">
                <div class="feature-item">
                  <i class="fas fa-check" :class="{ 'text-success': plan.features.monthlyMessages > 0 }"></i>
                  <span>月度消息 {{ plan.features.monthlyMessages === -1 ? '无限制' : plan.features.monthlyMessages }}</span>
                </div>
                <div class="feature-item">
                  <i class="fas fa-check" :class="{ 'text-success': plan.features.monthlyImages > 0 }"></i>
                  <span>月度图像 {{ plan.features.monthlyImages === -1 ? '无限制' : plan.features.monthlyImages }}</span>
                </div>
                <div class="feature-item">
                  <i class="fas fa-check" :class="{ 'text-success': plan.features.maxTokens > 0 }"></i>
                  <span>最大令牌 {{ plan.features.maxTokens }}</span>
                </div>
                <div class="feature-item">
                  <i class="fas fa-check" :class="{ 'text-success': plan.features.customModels > 0 }"></i>
                  <span>自定义模型 {{ plan.features.customModels === -1 ? '无限制' : plan.features.customModels }}</span>
                </div>
                <div class="feature-item">
                  <i class="fas fa-check" :class="{ 'text-success': plan.features.prioritySupport }"></i>
                  <span>优先支持</span>
                </div>
              </div>
              
              <div class="card-actions">
                <el-button 
                  v-if="currentSubscription?.plan === plan.id"
                  type="info"
                  disabled
                >
                  当前计划
                </el-button>
                <el-button 
                  v-else-if="plan.id === 'free'"
                  type="success"
                  @click="updateSubscription(plan.id)"
                  :loading="updating"
                >
                  免费使用
                </el-button>
                <el-button 
                  v-else
                  type="primary"
                  @click="updateSubscription(plan.id)"
                  :loading="updating"
                >
                  {{ currentSubscription?.plan === 'free' ? '升级' : '切换' }}
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useToast } from '@/composables/useToast'

interface SubscriptionPlan {
  id: string
  name: string
  features: {
    monthlyMessages: number
    monthlyImages: number
    maxTokens: number
    customModels: number
    prioritySupport: boolean
  }
  price: number
}

interface CurrentSubscription {
  plan: string
  status: string
  features: any
  usage: any
}

interface UsageStats {
  messages: { used: number; limit: number; remaining: number }
  images: { used: number; limit: number; remaining: number }
  tokens: { used: number; limit: number; remaining: number }
}

const { showToast } = useToast()

const currentSubscription = ref<CurrentSubscription | null>(null)
const availablePlans = ref<SubscriptionPlan[]>([])
const usageStats = ref<UsageStats>({
  messages: { used: 0, limit: 100, remaining: 100 },
  images: { used: 0, limit: 10, remaining: 10 },
  tokens: { used: 0, limit: 4000, remaining: 4000 }
})
const updating = ref(false)

// 获取当前订阅
const fetchCurrentSubscription = async () => {
  try {
    const response = await fetch('/api/subscription/current', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      currentSubscription.value = data.data
    }
  } catch (error) {
    console.error('获取当前订阅失败:', error)
  }
}

// 获取使用统计
const fetchUsageStats = async () => {
  try {
    const response = await fetch('/api/subscription/usage', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      usageStats.value = data.data
    }
  } catch (error) {
    console.error('获取使用统计失败:', error)
  }
}

// 获取可用计划
const fetchAvailablePlans = async () => {
  try {
    const response = await fetch('/api/subscription/plans', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      availablePlans.value = data.data
    }
  } catch (error) {
    console.error('获取可用计划失败:', error)
  }
}

// 更新订阅
const updateSubscription = async (planId: string) => {
  if (planId === currentSubscription.value?.plan) {
    showToast('您已经在使用此计划', 'warning')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要${currentSubscription.value?.plan === 'free' ? '升级到' : '切换到'}${getPlanName(planId)}计划吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    updating.value = true
    
    const response = await fetch('/api/subscription/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({ plan: planId })
    })
    
    if (response.ok) {
      showToast('订阅计划更新成功', 'success')
      await fetchCurrentSubscription()
      await fetchUsageStats()
    } else {
      throw new Error('更新失败')
    }
  } catch (error: any) {
    console.error('更新订阅失败:', error)
    showToast(error.message || '更新订阅失败', 'error')
  } finally {
    updating.value = false
  }
}

// 获取计划名称
const getPlanName = (planId: string): string => {
  const planNames: { [key: string]: string } = {
    'free': '免费版',
    'basic': '基础版',
    'pro': '专业版',
    'enterprise': '企业版'
  }
  return planNames[planId] || '未知计划'
}

// 获取状态类型
const getStatusType = (status: string): string => {
  const statusTypes: { [key: string]: string } = {
    'active': 'success',
    'canceled': 'danger',
    'expired': 'warning',
    'pending': 'info'
  }
  return statusTypes[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string): string => {
  const statusTexts: { [key: string]: string } = {
    'active': '活跃',
    'canceled': '已取消',
    'expired': '已过期',
    'pending': '待处理'
  }
  return statusTexts[status] || '未知状态'
}

// 计算使用百分比
const getUsagePercentage = (type: 'messages' | 'images' | 'tokens'): number => {
  const stats = usageStats.value[type]
  if (stats.limit === -1) return 0 // 无限制
  return Math.min(100, Math.round((stats.used / stats.limit) * 100))
}

// 获取使用颜色
const getUsageColor = (type: 'messages' | 'images' | 'tokens'): string => {
  const percentage = getUsagePercentage(type)
  if (percentage >= 90) return '#f56c6c'
  if (percentage >= 70) return '#e6a23c'
  return '#67c23a'
}

onMounted(async () => {
  await Promise.all([
    fetchCurrentSubscription(),
    fetchAvailablePlans(),
    fetchUsageStats()
  ])
})
</script>

<style scoped>
.subscription-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 10px;
}

.page-header p {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.content-wrapper {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.current-subscription {
  margin-bottom: 40px;
}

.current-subscription h2 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 20px;
}

.subscription-card {
  border: 1px solid #e1e8ed;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.subscription-card.current {
  border-color: #409eff;
  box-shadow: 0 0 20px rgba(64, 158, 255, 0.2);
}

.card-header {
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e1e8ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.card-content {
  padding: 20px;
}

.features {
  margin-bottom: 20px;
}

.feature-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.feature-item:last-child {
  border-bottom: none;
}

.feature-name {
  font-weight: 500;
  color: #2c3e50;
}

.feature-value {
  font-weight: 600;
  color: #409eff;
}

.usage-stats h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
}

.usage-item {
  margin-bottom: 15px;
}

.usage-item span {
  display: block;
  margin-bottom: 5px;
  font-size: 0.9rem;
  color: #666;
}

.available-plans h2 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 20px;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.plan-card {
  border: 1px solid #e1e8ed;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.plan-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.plan-card.recommended {
  border-color: #409eff;
}

.plan-card.recommended::before {
  content: '推荐';
  position: absolute;
  top: 15px;
  right: -30px;
  background: #409eff;
  color: white;
  padding: 5px 30px;
  font-size: 0.8rem;
  transform: rotate(45deg);
}

.plan-card.current {
  border-color: #67c23a;
  background: #f0f9ff;
}

.price {
  text-align: center;
  margin-bottom: 20px;
}

.currency {
  font-size: 1rem;
  color: #666;
}

.amount {
  font-size: 2.5rem;
  font-weight: bold;
  color: #409eff;
}

.period {
  font-size: 1rem;
  color: #666;
}

.card-actions {
  padding: 20px;
  text-align: center;
}

.text-success {
  color: #67c23a;
}

@media (max-width: 768px) {
  .plans-grid {
    grid-template-columns: 1fr;
  }
  
  .subscription-container {
    padding: 10px;
  }
  
  .content-wrapper {
    padding: 20px;
  }
}
</style>