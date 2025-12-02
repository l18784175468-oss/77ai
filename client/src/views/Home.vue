<template>
  <div class="home">
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">欢迎使用 AI Web Framework</h1>
        <p class="hero-subtitle">通用AI应用开发框架，支持多种AI功能集成</p>
        <div class="hero-buttons">
          <el-button type="primary" size="large" @click="$router.push('/chat')">
            <el-icon><ChatDotRound /></el-icon>
            开始聊天
          </el-button>
          <el-button size="large" @click="$router.push('/image')">
            <el-icon><Picture /></el-icon>
            图像生成
          </el-button>
        </div>
      </div>
    </div>

    <div class="features-section">
      <div class="container">
        <h2 class="section-title">核心功能</h2>
        <div class="features-grid">
          <div class="feature-card" v-for="feature in features" :key="feature.id">
            <div class="feature-icon">
              <el-icon :size="48"><component :is="feature.icon" /></el-icon>
            </div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="stats-section">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-item" v-for="stat in stats" :key="stat.label">
            <div class="stat-number">{{ stat.number }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChatDotRound, Picture, DocumentCopy, Setting, Tools, DataAnalysis } from '@element-plus/icons-vue'

const features = ref([
  {
    id: 1,
    icon: ChatDotRound,
    title: 'AI聊天',
    description: '支持多种AI模型的智能对话系统，提供流畅的聊天体验'
  },
  {
    id: 2,
    icon: Picture,
    title: '图像生成',
    description: '基于AI的图像生成和编辑功能，创造独特的视觉内容'
  },
  {
    id: 3,
    icon: DocumentCopy,
    title: '代码助手',
    description: '智能代码生成、优化和解释，提升开发效率'
  },
  {
    id: 4,
    icon: Setting,
    title: '灵活配置',
    description: '支持多种AI服务配置，满足不同场景需求'
  },
  {
    id: 5,
    icon: Tools,
    title: '插件架构',
    description: '模块化设计，支持自定义插件扩展'
  },
  {
    id: 6,
    icon: DataAnalysis,
    title: '数据分析',
    description: '强大的数据处理和分析能力，洞察业务价值'
  }
])

const stats = ref([
  { number: '5+', label: 'AI模型支持' },
  { number: '10+', label: '功能模块' },
  { number: '99.9%', label: '可用性' },
  { number: '24/7', label: '技术支持' }
])
</script>

<style scoped>
.home {
  min-height: 100vh;
}

.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 100px 0;
  text-align: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 20px;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.25rem;
  margin-bottom: 40px;
  opacity: 0.9;
}

.hero-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.features-section {
  padding: 80px 0;
  background: white;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 600;
  margin-bottom: 60px;
  color: #333;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 40px;
}

.feature-card {
  text-align: center;
  padding: 40px 20px;
  border-radius: 12px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  color: #667eea;
  margin-bottom: 20px;
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 15px;
  color: #333;
}

.feature-description {
  font-size: 1rem;
  color: #666;
  line-height: 1.6;
}

.stats-section {
  background: #f8f9fa;
  padding: 60px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 40px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 3rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 1.1rem;
  color: #666;
  font-weight: 500;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1.1rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>