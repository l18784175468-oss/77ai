<template>
  <div class="image-page">
    <div class="container">
      <h2 class="page-title">AI图像生成</h2>
      
      <div class="image-generator">
        <div class="generator-panel">
          <el-card class="config-card">
            <template #header>
              <div class="card-header">
                <span>生成配置</span>
              </div>
            </template>
            
            <el-form :model="imageConfig" label-width="100px">
              <el-form-item label="模型选择">
                <el-select v-model="imageConfig.model" placeholder="选择AI模型">
                  <el-option
                    v-for="model in availableModels"
                    :key="model.id"
                    :label="model.name"
                    :value="model.id"
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item label="图像描述">
                <el-input
                  v-model="imageConfig.prompt"
                  type="textarea"
                  :rows="4"
                  placeholder="请描述您想要生成的图像..."
                />
              </el-form-item>
              
              <el-form-item label="负面描述">
                <el-input
                  v-model="imageConfig.negativePrompt"
                  type="textarea"
                  :rows="2"
                  placeholder="描述您不希望出现在图像中的内容..."
                />
              </el-form-item>
              
              <el-form-item label="图像尺寸">
                <el-select v-model="imageConfig.size">
                  <el-option label="512x512" value="512x512" />
                  <el-option label="768x768" value="768x768" />
                  <el-option label="1024x1024" value="1024x1024" />
                  <el-option label="1024x768" value="1024x768" />
                  <el-option label="768x1024" value="768x1024" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="生成数量">
                <el-input-number
                  v-model="imageConfig.count"
                  :min="1"
                  :max="4"
                  :step="1"
                />
              </el-form-item>
              
              <el-form-item label="质量">
                <el-slider
                  v-model="imageConfig.quality"
                  :min="1"
                  :max="100"
                  show-stops
                />
              </el-form-item>
              
              <el-form-item>
                <el-button 
                  type="primary" 
                  @click="generateImage"
                  :loading="isGenerating"
                  :disabled="!imageConfig.prompt.trim()"
                >
                  <el-icon><Picture /></el-icon>
                  生成图像
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
        
        <div class="result-panel">
          <el-card class="result-card">
            <template #header>
              <div class="card-header">
                <span>生成结果</span>
                <el-button 
                  v-if="generatedImages.length > 0"
                  type="text" 
                  @click="clearResults"
                >
                  清空结果
                </el-button>
              </div>
            </template>
            
            <div v-if="isGenerating" class="generating-status">
              <el-icon class="is-loading"><Loading /></el-icon>
              <p>正在生成图像，请稍候...</p>
            </div>
            
            <div v-else-if="generatedImages.length === 0" class="empty-result">
              <el-icon size="64"><Picture /></el-icon>
              <p>暂无生成结果</p>
            </div>
            
            <div v-else class="image-grid">
              <div 
                v-for="(image, index) in generatedImages" 
                :key="index"
                class="image-item"
              >
                <div class="image-container">
                  <img :src="image.url" :alt="`生成的图像 ${index + 1}`" />
                  <div class="image-actions">
                    <el-button 
                      type="primary" 
                      size="small" 
                      @click="downloadImage(image)"
                    >
                      <el-icon><Download /></el-icon>
                      下载
                    </el-button>
                    <el-button 
                      type="default" 
                      size="small" 
                      @click="editImage(image)"
                    >
                      <el-icon><Edit /></el-icon>
                      编辑
                    </el-button>
                  </div>
                </div>
                <div class="image-info">
                  <p class="image-prompt">{{ image.prompt }}</p>
                  <p class="image-time">{{ formatTime(image.createdAt) }}</p>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
      
      <div class="history-section">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>历史记录</span>
              <el-button type="text" @click="loadHistory">刷新</el-button>
            </div>
          </template>
          
          <div class="history-grid">
            <div 
              v-for="item in history" 
              :key="item.id"
              class="history-item"
              @click="loadHistoryItem(item)"
            >
              <img :src="item.thumbnail" :alt="item.prompt" />
              <div class="history-info">
                <p class="history-prompt">{{ item.prompt }}</p>
                <p class="history-time">{{ formatTime(item.createdAt) }}</p>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture, Loading, Download, Edit } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

interface ImageConfig {
  model: string
  prompt: string
  negativePrompt: string
  size: string
  count: number
  quality: number
}

interface GeneratedImage {
  id: string
  url: string
  prompt: string
  createdAt: string
}

interface HistoryItem {
  id: string
  prompt: string
  thumbnail: string
  createdAt: string
}

const imageConfig = reactive<ImageConfig>({
  model: 'dall-e-3',
  prompt: '',
  negativePrompt: '',
  size: '1024x1024',
  count: 1,
  quality: 80
})

const availableModels = [
  { id: 'dall-e-3', name: 'DALL-E 3' },
  { id: 'dall-e-2', name: 'DALL-E 2' },
  { id: 'stable-diffusion', name: 'Stable Diffusion' },
  { id: 'midjourney', name: 'Midjourney' }
]

const isGenerating = ref(false)
const generatedImages = ref<GeneratedImage[]>([])
const history = ref<HistoryItem[]>([])

const generateImage = async () => {
  if (!imageConfig.prompt.trim()) {
    ElMessage.warning('请输入图像描述')
    return
  }
  
  isGenerating.value = true
  
  try {
    const response = await fetch('/api/image/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(imageConfig)
    })
    
    if (!response.ok) {
      throw new Error('生成图像失败')
    }
    
    const data = await response.json()
    
    // 模拟生成的图像数据
    const newImages: GeneratedImage[] = data.images.map((url: string, index: number) => ({
      id: `${Date.now()}-${index}`,
      url,
      prompt: imageConfig.prompt,
      createdAt: new Date().toISOString()
    }))
    
    generatedImages.value = [...generatedImages.value, ...newImages]
    
    ElMessage.success(`成功生成 ${newImages.length} 张图像`)
    
  } catch (error) {
    console.error('生成图像失败:', error)
    ElMessage.error('生成图像失败，请稍后重试')
  } finally {
    isGenerating.value = false
  }
}

const downloadImage = (image: GeneratedImage) => {
  const link = document.createElement('a')
  link.href = image.url
  link.download = `ai-image-${image.id}.png`
  link.click()
  ElMessage.success('开始下载图像')
}

const editImage = (image: GeneratedImage) => {
  // 这里可以实现图像编辑功能
  ElMessage.info('图像编辑功能开发中...')
}

const clearResults = () => {
  generatedImages.value = []
}

const loadHistory = async () => {
  try {
    const response = await fetch('/api/image/history')
    if (response.ok) {
      const data = await response.json()
      history.value = data.history
    }
  } catch (error) {
    console.error('加载历史记录失败:', error)
  }
}

const loadHistoryItem = (item: HistoryItem) => {
  imageConfig.prompt = item.prompt
  ElMessage.info('已加载历史配置')
}

const formatTime = (timestamp: string) => {
  return dayjs(timestamp).format('MM-DD HH:mm')
}
</script>

<style scoped>
.image-page {
  min-height: calc(100vh - 120px);
  background: #f5f5f5;
  padding: 20px 0;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.image-generator {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 30px;
  margin-bottom: 30px;
}

.config-card {
  height: fit-content;
}

.result-card {
  min-height: 500px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.generating-status {
  text-align: center;
  padding: 60px 0;
  color: #666;
}

.generating-status .el-icon {
  font-size: 48px;
  margin-bottom: 20px;
  color: #409eff;
}

.empty-result {
  text-align: center;
  padding: 60px 0;
  color: #999;
}

.empty-result .el-icon {
  margin-bottom: 20px;
  color: #ddd;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.image-item {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.image-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.image-container {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-actions {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 10px;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-container:hover .image-actions {
  opacity: 1;
}

.image-info {
  padding: 12px;
}

.image-prompt {
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-time {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.history-section {
  margin-top: 30px;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.history-item {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.history-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.history-item img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.history-info {
  padding: 10px;
}

.history-prompt {
  font-size: 12px;
  color: #333;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-time {
  font-size: 11px;
  color: #999;
  margin: 0;
}

@media (max-width: 1024px) {
  .image-generator {
    grid-template-columns: 1fr;
  }
  
  .config-card {
    max-width: 600px;
    margin: 0 auto;
  }
}

@media (max-width: 768px) {
  .image-grid {
    grid-template-columns: 1fr;
  }
  
  .history-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>