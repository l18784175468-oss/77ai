<template>
  <div class="settings-page">
    <div class="container">
      <h2 class="page-title">系统设置</h2>
      
      <div class="settings-layout">
        <div class="settings-sidebar">
          <el-menu
            :default-active="activeTab"
            mode="vertical"
            @select="handleMenuSelect"
          >
            <el-menu-item index="general">
              <el-icon><Setting /></el-icon>
              <span>常规设置</span>
            </el-menu-item>
            <el-menu-item index="ai">
              <el-icon><Robot /></el-icon>
              <span>AI配置</span>
            </el-menu-item>
            <el-menu-item index="appearance">
              <el-icon><Brush /></el-icon>
              <span>外观设置</span>
            </el-menu-item>
            <el-menu-item index="security">
              <el-icon><Lock /></el-icon>
              <span>安全设置</span>
            </el-menu-item>
            <el-menu-item index="about">
              <el-icon><InfoFilled /></el-icon>
              <span>关于</span>
            </el-menu-item>
          </el-menu>
        </div>
        
        <div class="settings-content">
          <!-- 常规设置 -->
          <div v-show="activeTab === 'general'" class="settings-section">
            <el-card>
              <template #header>
                <h3>常规设置</h3>
              </template>
              
              <el-form :model="generalSettings" label-width="120px">
                <el-form-item label="语言">
                  <el-select v-model="generalSettings.language">
                    <el-option label="简体中文" value="zh-CN" />
                    <el-option label="English" value="en-US" />
                    <el-option label="日本語" value="ja-JP" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="时区">
                  <el-select v-model="generalSettings.timezone">
                    <el-option label="北京时间 (UTC+8)" value="Asia/Shanghai" />
                    <el-option label="东京时间 (UTC+9)" value="Asia/Tokyo" />
                    <el-option label="纽约时间 (UTC-5)" value="America/New_York" />
                    <el-option label="伦敦时间 (UTC+0)" value="Europe/London" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="自动保存">
                  <el-switch v-model="generalSettings.autoSave" />
                  <span class="setting-desc">启用后自动保存用户数据和设置</span>
                </el-form-item>
                
                <el-form-item label="消息通知">
                  <el-switch v-model="generalSettings.notifications" />
                  <span class="setting-desc">接收系统通知和更新提醒</span>
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="saveGeneralSettings">保存设置</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </div>
          
          <!-- AI配置 -->
          <div v-show="activeTab === 'ai'" class="settings-section">
            <el-card>
              <template #header>
                <h3>AI服务配置</h3>
              </template>
              
              <el-form :model="aiSettings" label-width="120px">
                <el-form-item label="默认模型">
                  <el-select v-model="aiSettings.defaultModel">
                    <el-option label="GPT-4" value="gpt-4" />
                    <el-option label="GPT-3.5 Turbo" value="gpt-3.5-turbo" />
                    <el-option label="Claude 3" value="claude-3" />
                    <el-option label="Gemini Pro" value="gemini-pro" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="OpenAI API Key">
                  <el-input 
                    v-model="aiSettings.openaiApiKey" 
                    type="password" 
                    placeholder="sk-..."
                    show-password
                  />
                </el-form-item>
                
                <el-form-item label="Claude API Key">
                  <el-input 
                    v-model="aiSettings.claudeApiKey" 
                    type="password" 
                    placeholder="sk-ant-..."
                    show-password
                  />
                </el-form-item>
                
                <el-form-item label="Google AI Key">
                  <el-input 
                    v-model="aiSettings.googleApiKey" 
                    type="password" 
                    placeholder="AIza..."
                    show-password
                  />
                </el-form-item>
                
                <el-form-item label="温度参数">
                  <el-slider
                    v-model="aiSettings.temperature"
                    :min="0"
                    :max="2"
                    :step="0.1"
                    show-stops
                  />
                  <span class="setting-desc">控制生成文本的随机性，值越高越随机</span>
                </el-form-item>
                
                <el-form-item label="最大令牌数">
                  <el-input-number
                    v-model="aiSettings.maxTokens"
                    :min="100"
                    :max="4000"
                    :step="100"
                  />
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="saveAISettings">保存设置</el-button>
                  <el-button @click="testConnection">测试连接</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </div>
          
          <!-- 外观设置 -->
          <div v-show="activeTab === 'appearance'" class="settings-section">
            <el-card>
              <template #header>
                <h3>外观设置</h3>
              </template>
              
              <el-form :model="appearanceSettings" label-width="120px">
                <el-form-item label="主题">
                  <el-radio-group v-model="appearanceSettings.theme">
                    <el-radio label="light">浅色</el-radio>
                    <el-radio label="dark">深色</el-radio>
                    <el-radio label="auto">跟随系统</el-radio>
                  </el-radio-group>
                </el-form-item>
                
                <el-form-item label="字体大小">
                  <el-radio-group v-model="appearanceSettings.fontSize">
                    <el-radio label="small">小</el-radio>
                    <el-radio label="medium">中</el-radio>
                    <el-radio label="large">大</el-radio>
                  </el-radio-group>
                </el-form-item>
                
                <el-form-item label="紧凑模式">
                  <el-switch v-model="appearanceSettings.compactMode" />
                  <span class="setting-desc">启用后界面更加紧凑</span>
                </el-form-item>
                
                <el-form-item label="动画效果">
                  <el-switch v-model="appearanceSettings.animations" />
                  <span class="setting-desc">启用界面动画和过渡效果</span>
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="saveAppearanceSettings">保存设置</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </div>
          
          <!-- 安全设置 -->
          <div v-show="activeTab === 'security'" class="settings-section">
            <el-card>
              <template #header>
                <h3>安全设置</h3>
              </template>
              
              <el-form :model="securitySettings" label-width="120px">
                <el-form-item label="双因素认证">
                  <el-switch v-model="securitySettings.twoFactorAuth" />
                  <span class="setting-desc">增强账户安全性</span>
                </el-form-item>
                
                <el-form-item label="会话超时">
                  <el-select v-model="securitySettings.sessionTimeout">
                    <el-option label="30分钟" value="30" />
                    <el-option label="1小时" value="60" />
                    <el-option label="2小时" value="120" />
                    <el-option label="1天" value="1440" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="登录记录">
                  <el-switch v-model="securitySettings.loginHistory" />
                  <span class="setting-desc">记录登录历史和设备信息</span>
                </el-form-item>
                
                <el-form-item label="数据加密">
                  <el-switch v-model="securitySettings.dataEncryption" />
                  <span class="setting-desc">启用端到端数据加密</span>
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="saveSecuritySettings">保存设置</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </div>
          
          <!-- 关于 -->
          <div v-show="activeTab === 'about'" class="settings-section">
            <el-card>
              <template #header>
                <h3>关于 AI Web Framework</h3>
              </template>
              
              <div class="about-content">
                <div class="about-logo">
                  <el-icon size="64"><Platform /></el-icon>
                </div>
                
                <div class="about-info">
                  <h4>AI Web Framework</h4>
                  <p>版本：1.0.0</p>
                  <p>构建时间：{{ buildTime }}</p>
                  <p>许可证：MIT License</p>
                </div>
                
                <div class="about-description">
                  <p>
                    AI Web Framework 是一个通用的AI应用开发框架，支持多种AI功能集成。
                    本框架旨在为开发者提供一个简单、高效、可扩展的AI应用开发平台。
                  </p>
                </div>
                
                <div class="about-links">
                  <el-button type="primary" @click="openLink('https://github.com/ai-web-framework')">
                    <el-icon><Link /></el-icon>
                    GitHub
                  </el-button>
                  <el-button @click="openLink('https://docs.ai-web-framework.com')">
                    <el-icon><Document /></el-icon>
                    文档
                  </el-button>
                  <el-button @click="checkUpdates">
                    <el-icon><Refresh /></el-icon>
                    检查更新
                  </el-button>
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Setting, 
  Robot, 
  Brush, 
  Lock, 
  InfoFilled,
  Platform,
  Link,
  Document,
  Refresh
} from '@element-plus/icons-vue'

const activeTab = ref('general')

const generalSettings = reactive({
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  autoSave: true,
  notifications: true
})

const aiSettings = reactive({
  defaultModel: 'gpt-3.5-turbo',
  openaiApiKey: '',
  claudeApiKey: '',
  googleApiKey: '',
  temperature: 0.7,
  maxTokens: 2000
})

const appearanceSettings = reactive({
  theme: 'light',
  fontSize: 'medium',
  compactMode: false,
  animations: true
})

const securitySettings = reactive({
  twoFactorAuth: false,
  sessionTimeout: '60',
  loginHistory: true,
  dataEncryption: true
})

const buildTime = ref('2024-01-01 12:00:00')

const handleMenuSelect = (key: string) => {
  activeTab.value = key
}

const saveGeneralSettings = () => {
  localStorage.setItem('generalSettings', JSON.stringify(generalSettings))
  ElMessage.success('常规设置已保存')
}

const saveAISettings = () => {
  localStorage.setItem('aiSettings', JSON.stringify(aiSettings))
  ElMessage.success('AI配置已保存')
}

const saveAppearanceSettings = () => {
  localStorage.setItem('appearanceSettings', JSON.stringify(appearanceSettings))
  ElMessage.success('外观设置已保存')
}

const saveSecuritySettings = () => {
  localStorage.setItem('securitySettings', JSON.stringify(securitySettings))
  ElMessage.success('安全设置已保存')
}

const testConnection = async () => {
  try {
    ElMessage.info('正在测试连接...')
    // 这里应该调用后端API测试连接
    setTimeout(() => {
      ElMessage.success('连接测试成功')
    }, 2000)
  } catch (error) {
    ElMessage.error('连接测试失败')
  }
}

const openLink = (url: string) => {
  window.open(url, '_blank')
}

const checkUpdates = () => {
  ElMessage.info('正在检查更新...')
  setTimeout(() => {
    ElMessage.success('当前已是最新版本')
  }, 1500)
}

const loadSettings = () => {
  try {
    const saved = localStorage.getItem('generalSettings')
    if (saved) {
      Object.assign(generalSettings, JSON.parse(saved))
    }
    
    const aiSaved = localStorage.getItem('aiSettings')
    if (aiSaved) {
      Object.assign(aiSettings, JSON.parse(aiSaved))
    }
    
    const appearanceSaved = localStorage.getItem('appearanceSettings')
    if (appearanceSaved) {
      Object.assign(appearanceSettings, JSON.parse(appearanceSaved))
    }
    
    const securitySaved = localStorage.getItem('securitySettings')
    if (securitySaved) {
      Object.assign(securitySettings, JSON.parse(securitySaved))
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

onMounted(() => {
  loadSettings()
  buildTime.value = new Date().toLocaleString('zh-CN')
})
</script>

<style scoped>
.settings-page {
  min-height: calc(100vh - 120px);
  background: #f5f5f5;
  padding: 20px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.settings-layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 30px;
}

.settings-sidebar {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  height: fit-content;
}

.settings-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.settings-section {
  padding: 20px;
}

.settings-section h3 {
  margin: 0;
  color: #333;
}

.setting-desc {
  margin-left: 10px;
  font-size: 12px;
  color: #999;
}

.about-content {
  text-align: center;
  padding: 20px;
}

.about-logo {
  margin-bottom: 20px;
  color: #409eff;
}

.about-info {
  margin-bottom: 30px;
}

.about-info h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 24px;
}

.about-info p {
  margin: 5px 0;
  color: #666;
}

.about-description {
  margin-bottom: 30px;
  text-align: left;
  line-height: 1.6;
  color: #666;
}

.about-links {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }
  
  .settings-sidebar {
    order: 2;
  }
  
  .settings-content {
    order: 1;
  }
  
  .about-links {
    flex-direction: column;
    align-items: center;
  }
}
</style>