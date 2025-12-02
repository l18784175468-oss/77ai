<template>
  <div class="custom-ai-container">
    <div class="page-header">
      <h1>自定义AI服务</h1>
      <p>配置和管理您的自定义AI服务</p>
    </div>

    <div class="content-wrapper">
      <!-- 添加新服务按钮 -->
      <div class="actions-bar">
        <button @click="showAddModal = true" class="btn btn-primary">
          <i class="fas fa-plus"></i> 添加自定义AI服务
        </button>
        <button @click="refreshServices" class="btn btn-secondary" :disabled="loading">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i> 刷新
        </button>
      </div>

      <!-- 服务列表 -->
      <div class="services-grid" v-if="!loading && services.length > 0">
        <div v-for="service in services" :key="service.id" class="service-card">
          <div class="card-header">
            <h3>{{ service.name }}</h3>
            <div class="card-actions">
              <button @click="testService(service)" class="btn btn-sm btn-outline" title="测试连接">
                <i class="fas fa-plug"></i>
              </button>
              <button @click="editService(service)" class="btn btn-sm btn-outline" title="编辑">
                <i class="fas fa-edit"></i>
              </button>
              <button @click="deleteService(service.id)" class="btn btn-sm btn-danger" title="删除">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          
          <div class="card-content">
            <div class="service-info">
              <p><strong>模型:</strong> {{ service.model }}</p>
              <p><strong>端点:</strong> {{ service.endpoint }}</p>
              <p><strong>最大令牌:</strong> {{ service.maxTokens }}</p>
              <p><strong>支持流式:</strong> {{ service.supportsStreaming ? '是' : '否' }}</p>
              <p><strong>请求格式:</strong> {{ service.requestFormat || 'custom' }}</p>
            </div>
            
            <div class="service-status" :class="{ 'connected': service.connected }">
              <i class="fas fa-circle" :class="service.connected ? 'text-success' : 'text-muted'"></i>
              {{ service.connected ? '已连接' : '未连接' }}
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!loading && services.length === 0" class="empty-state">
        <i class="fas fa-robot"></i>
        <h3>暂无自定义AI服务</h3>
        <p>点击上方按钮添加您的第一个自定义AI服务</p>
      </div>

      <!-- 加载状态 -->
      <div v-else-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>加载中...</p>
      </div>
    </div>

    <!-- 添加/编辑服务模态框 -->
    <div v-if="showAddModal || editingService" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>{{ editingService ? '编辑自定义AI服务' : '添加自定义AI服务' }}</h2>
          <button @click="closeModal" class="btn-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="saveService">
            <div class="form-group">
              <label for="serviceName">服务名称 *</label>
              <input 
                type="text" 
                id="serviceName" 
                v-model="serviceForm.name" 
                required 
                placeholder="例如：我的自定义GPT"
              />
            </div>
            
            <div class="form-group">
              <label for="serviceEndpoint">API端点 *</label>
              <input 
                type="url" 
                id="serviceEndpoint" 
                v-model="serviceForm.endpoint" 
                required 
                placeholder="https://api.example.com/v1/chat/completions"
              />
            </div>
            
            <div class="form-group">
              <label for="serviceApiKey">API密钥 *</label>
              <input 
                type="password" 
                id="serviceApiKey" 
                v-model="serviceForm.apiKey" 
                required 
                placeholder="sk-..."
              />
            </div>
            
            <div class="form-group">
              <label for="serviceModel">模型名称 *</label>
              <input 
                type="text" 
                id="serviceModel" 
                v-model="serviceForm.model" 
                required 
                placeholder="gpt-3.5-turbo"
              />
            </div>
            
            <div class="form-group">
              <label for="requestFormat">请求格式</label>
              <select id="requestFormat" v-model="serviceForm.requestFormat">
                <option value="openai">OpenAI格式</option>
                <option value="claude">Claude格式</option>
                <option value="anthropic">Anthropic格式</option>
                <option value="google">Google格式</option>
                <option value="custom">自定义格式</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="maxTokens">最大令牌数</label>
              <input 
                type="number" 
                id="maxTokens" 
                v-model.number="serviceForm.maxTokens" 
                min="1" 
                max="100000"
              />
            </div>
            
            <div class="form-group">
              <label for="temperature">温度 (0-2)</label>
              <input 
                type="number" 
                id="temperature" 
                v-model.number="serviceForm.temperature" 
                min="0" 
                max="2" 
                step="0.1"
              />
            </div>
            
            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="serviceForm.supportsStreaming"
                />
                支持流式响应
              </label>
            </div>
            
            <div class="form-group">
              <label for="description">描述</label>
              <textarea 
                id="description" 
                v-model="serviceForm.description" 
                rows="3" 
                placeholder="服务描述..."
              ></textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" @click="closeModal" class="btn btn-secondary">
                取消
              </button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                {{ editingService ? '更新' : '添加' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 测试结果模态框 -->
    <div v-if="testResult" class="modal-overlay" @click="testResult = null">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>连接测试结果</h2>
          <button @click="testResult = null" class="btn-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="test-result" :class="{ 'success': testResult.success, 'error': !testResult.success }">
            <i class="fas" :class="testResult.success ? 'fa-check-circle' : 'fa-exclamation-circle'"></i>
            <p>{{ testResult.message }}</p>
          </div>
          
          <div v-if="testResult.data" class="test-details">
            <h4>响应详情:</h4>
            <pre>{{ JSON.stringify(testResult.data, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'

interface CustomAIService {
  id: string
  name: string
  endpoint: string
  apiKey: string
  model: string
  requestFormat?: string
  maxTokens: number
  temperature?: number
  supportsStreaming: boolean
  description?: string
  connected?: boolean
}

interface ServiceForm {
  name: string
  endpoint: string
  apiKey: string
  model: string
  requestFormat: string
  maxTokens: number
  temperature: number
  supportsStreaming: boolean
  description: string
}

interface TestResult {
  success: boolean
  message: string
  data?: any
}

const { showToast } = useToast()

const services = ref<CustomAIService[]>([])
const loading = ref(false)
const saving = ref(false)
const showAddModal = ref(false)
const editingService = ref<CustomAIService | null>(null)
const testResult = ref<TestResult | null>(null)

const serviceForm = ref<ServiceForm>({
  name: '',
  endpoint: '',
  apiKey: '',
  model: '',
  requestFormat: 'openai',
  maxTokens: 2000,
  temperature: 0.7,
  supportsStreaming: false,
  description: ''
})

// 获取所有自定义AI服务
const fetchServices = async () => {
  loading.value = true
  try {
    const response = await fetch('/api/custom-ai/services', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    if (!response.ok) throw new Error('获取服务列表失败')
    
    const data = await response.json()
    services.value = data.data || []
  } catch (error: any) {
    showToast(error.message || '获取服务列表失败', 'error')
  } finally {
    loading.value = false
  }
}

// 刷新服务列表
const refreshServices = () => {
  fetchServices()
}

// 编辑服务
const editService = (service: CustomAIService) => {
  editingService.value = { ...service }
  serviceForm.value = {
    name: service.name,
    endpoint: service.endpoint,
    apiKey: service.apiKey === '***' ? '' : service.apiKey,
    model: service.model,
    requestFormat: service.requestFormat || 'openai',
    maxTokens: service.maxTokens,
    temperature: service.temperature || 0.7,
    supportsStreaming: service.supportsStreaming,
    description: service.description || ''
  }
}

// 删除服务
const deleteService = async (id: string) => {
  if (!confirm('确定要删除这个自定义AI服务吗？')) return
  
  try {
    const response = await fetch(`/api/custom-ai/services/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    if (!response.ok) throw new Error('删除服务失败')
    
    showToast('服务删除成功', 'success')
    fetchServices()
  } catch (error: any) {
    showToast(error.message || '删除服务失败', 'error')
  }
}

// 测试服务连接
const testService = async (service: CustomAIService) => {
  try {
    const response = await fetch('/api/custom-ai/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(service)
    })
    
    const data = await response.json()
    
    testResult.value = {
      success: data.success,
      message: data.message || (data.success ? '连接测试成功' : '连接测试失败'),
      data: data.data
    }
    
    // 更新服务连接状态
    if (data.success) {
      const serviceIndex = services.value.findIndex(s => s.id === service.id)
      if (serviceIndex !== -1) {
        services.value[serviceIndex].connected = true
      }
    }
  } catch (error: any) {
    testResult.value = {
      success: false,
      message: error.message || '连接测试失败'
    }
  }
}

// 保存服务
const saveService = async () => {
  saving.value = true
  
  try {
    const url = editingService.value 
      ? `/api/custom-ai/services/${editingService.value.id}`
      : '/api/custom-ai/services'
    
    const method = editingService.value ? 'PUT' : 'POST'
    
    const body = editingService.value 
      ? { ...serviceForm.value }
      : { ...serviceForm.value }
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(body)
    })
    
    if (!response.ok) throw new Error('保存服务失败')
    
    showToast(editingService.value ? '服务更新成功' : '服务添加成功', 'success')
    closeModal()
    fetchServices()
  } catch (error: any) {
    showToast(error.message || '保存服务失败', 'error')
  } finally {
    saving.value = false
  }
}

// 关闭模态框
const closeModal = () => {
  showAddModal.value = false
  editingService.value = null
  serviceForm.value = {
    name: '',
    endpoint: '',
    apiKey: '',
    model: '',
    requestFormat: 'openai',
    maxTokens: 2000,
    temperature: 0.7,
    supportsStreaming: false,
    description: ''
  }
}

onMounted(() => {
  fetchServices()
})
</script>

<style scoped>
.custom-ai-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
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

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.service-card {
  border: 1px solid #e1e8ed;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.service-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e1e8ed;
}

.card-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.card-content {
  padding: 20px;
}

.service-info p {
  margin: 8px 0;
  font-size: 0.9rem;
}

.service-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e1e8ed;
  font-weight: 500;
}

.service-status.connected {
  color: #27ae60;
}

.empty-state, .loading-state {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
}

.empty-state i, .loading-state i {
  font-size: 3rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state h3, .loading-state h3 {
  margin-bottom: 10px;
  color: #2c3e50;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e1e8ed;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #2c3e50;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 30px;
}

.test-result {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.test-result.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.test-result.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.test-details {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
}

.test-details h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #2c3e50;
}

.test-details pre {
  background: #2c3e50;
  color: #ecf0f1;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 0.85rem;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
}

.btn-outline {
  background: transparent;
  border: 1px solid #3498db;
  color: #3498db;
}

.btn-outline:hover {
  background: #3498db;
  color: white;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.85rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #7f8c8d;
}

.btn-close:hover {
  color: #2c3e50;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .services-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-bar {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .modal {
    width: 95%;
    margin: 10px;
  }
}
</style>