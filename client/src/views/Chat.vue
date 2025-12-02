<template>
  <div class="chat-page">
    <div class="chat-container">
      <div class="chat-sidebar">
        <div class="sidebar-header">
          <h3>AI聊天</h3>
          <el-button type="primary" @click="createNewChat">
            <el-icon><Plus /></el-icon>
            新建对话
          </el-button>
        </div>
        <div class="chat-history">
          <div 
            v-for="chat in chatHistory" 
            :key="chat.id"
            class="chat-item"
            :class="{ active: currentChatId === chat.id }"
            @click="switchChat(chat.id)"
          >
            <div class="chat-title">{{ chat.title }}</div>
            <div class="chat-time">{{ formatTime(chat.updatedAt) }}</div>
          </div>
        </div>
      </div>
      
      <div class="chat-main">
        <div class="chat-header">
          <h3>{{ currentChat?.title || '新建对话' }}</h3>
          <div class="chat-actions">
            <el-select v-model="selectedModel" placeholder="选择模型" style="width: 300px">
              <el-option-group
                v-for="group in groupedModels"
                :key="group.label"
                :label="group.label"
              >
                <el-option
                  v-for="model in group.options"
                  :key="model.id"
                  :label="model.name"
                  :value="model.id"
                >
                  <div class="model-option">
                    <span class="model-name">{{ model.name }}</span>
                    <span class="model-provider">{{ model.provider }}</span>
                    <el-tag v-if="model.supportsStreaming" size="small" type="success">流式</el-tag>
                  </div>
                </el-option>
              </el-option-group>
            </el-select>
          </div>
        </div>
        
        <div class="chat-messages" ref="messagesContainer">
          <div 
            v-for="message in messages" 
            :key="message.id"
            class="message"
            :class="{ 'user-message': message.role === 'user', 'ai-message': message.role === 'assistant' }"
          >
            <div class="message-avatar">
              <el-icon v-if="message.role === 'user'"><User /></el-icon>
              <el-icon v-else><Robot /></el-icon>
            </div>
            <div class="message-content">
              <div class="message-text" v-html="formatMessage(message.content)"></div>
              <div class="message-time">{{ formatTime(message.timestamp) }}</div>
            </div>
          </div>
          <div v-if="isLoading" class="message ai-message">
            <div class="message-avatar">
              <el-icon><Robot /></el-icon>
            </div>
            <div class="message-content">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="chat-input">
          <div class="input-container">
            <el-input
              v-model="inputMessage"
              type="textarea"
              :rows="3"
              placeholder="输入您的消息..."
              @keydown.enter.prevent="sendMessage"
              :disabled="isLoading"
            />
            <el-button 
              type="primary" 
              @click="sendMessage"
              :disabled="!inputMessage.trim() || isLoading"
              class="send-button"
            >
              <el-icon><Send /></el-icon>
              发送
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, User, Robot, Send } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

interface Chat {
  id: string
  title: string
  updatedAt: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface AIModel {
  id: string
  name: string
  provider: string
  maxTokens?: number
  supportsStreaming?: boolean
  description?: string
}

const chatHistory = ref<Chat[]>([])
const currentChatId = ref<string>('')
const currentChat = ref<Chat | null>(null)
const messages = ref<Message[]>([])
const inputMessage = ref('')
const isLoading = ref(false)
const selectedModel = ref('gpt-4-turbo')
const messagesContainer = ref<HTMLElement>()

// 按提供商分组模型
const groupedModels = computed(() => {
  const groups: { [key: string]: AIModel[] } = {}
  
  availableModels.value.forEach(model => {
    const provider = model.provider.charAt(0).toUpperCase() + model.provider.slice(1)
    if (!groups[provider]) {
      groups[provider] = []
    }
    groups[provider].push(model)
  })
  
  return Object.keys(groups).map(provider => ({
    label: provider,
    options: groups[provider]
  }))
})
const availableModels = ref<AIModel[]>([])

// 加载可用模型
const loadModels = async () => {
  try {
    // 加载所有可用模型
    const response = await fetch('/api/ai/models', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      availableModels.value = data.data || []
    } else {
      // 使用默认模型作为后备
      availableModels.value = [
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', maxTokens: 128000, supportsStreaming: true, description: '最新的GPT-4模型，支持更长上下文' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', maxTokens: 4096, supportsStreaming: true, description: '快速高效的对话模型' },
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'anthropic', maxTokens: 4096, supportsStreaming: true, description: '平衡性能和速度的Claude模型' },
        { id: 'gemini-pro', name: 'Gemini Pro', provider: 'google', maxTokens: 32768, supportsStreaming: true, description: 'Google的多模态AI模型' }
      ]
    }
  } catch (error) {
    console.error('加载模型失败:', error)
    // 使用默认模型作为后备
    availableModels.value = [
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', maxTokens: 128000, supportsStreaming: true, description: '最新的GPT-4模型，支持更长上下文' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', maxTokens: 4096, supportsStreaming: true, description: '快速高效的对话模型' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'anthropic', maxTokens: 4096, supportsStreaming: true, description: '平衡性能和速度的Claude模型' },
      { id: 'gemini-pro', name: 'Gemini Pro', provider: 'google', maxTokens: 32768, supportsStreaming: true, description: 'Google的多模态AI模型' }
    ]
  }
}

const createNewChat = () => {
  const newChat: Chat = {
    id: Date.now().toString(),
    title: '新建对话',
    updatedAt: new Date().toISOString()
  }
  
  chatHistory.value.unshift(newChat)
  currentChatId.value = newChat.id
  currentChat.value = newChat
  messages.value = []
}

const switchChat = (chatId: string) => {
  currentChatId.value = chatId
  currentChat.value = chatHistory.value.find(chat => chat.id === chatId) || null
  // 这里应该加载对应聊天的消息历史
  messages.value = []
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return
  
  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: inputMessage.value,
    timestamp: new Date().toISOString()
  }
  
  messages.value.push(userMessage)
  
  // 更新聊天标题
  if (messages.value.length === 1 && currentChat.value) {
    currentChat.value.title = inputMessage.value.slice(0, 20) + (inputMessage.value.length > 20 ? '...' : '')
  }
  
  const messageContent = inputMessage.value
  inputMessage.value = ''
  isLoading.value = true
  
  // 滚动到底部
  await nextTick()
  scrollToBottom()
  
  try {
    // 检查是否是自定义模型
    const selectedModelData = availableModels.value.find(model => model.id === selectedModel.value)
    const isCustomModel = selectedModelData?.provider === 'custom'
    
    // 调用相应的API
    const apiUrl = isCustomModel ? '/api/custom-ai/chat' : '/api/chat'
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({
        message: messageContent,
        model: selectedModel.value,
        chatId: currentChatId.value
      })
    })
    
    if (!response.ok) {
      throw new Error('发送消息失败')
    }
    
    const data = await response.json()
    
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: data.message,
      timestamp: new Date().toISOString()
    }
    
    messages.value.push(aiMessage)
    
    // 更新聊天时间
    if (currentChat.value) {
      currentChat.value.updatedAt = new Date().toISOString()
    }
    
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败，请稍后重试')
  } finally {
    isLoading.value = false
    await nextTick()
    scrollToBottom()
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const formatTime = (timestamp: string) => {
  return dayjs(timestamp).format('HH:mm')
}

const formatMessage = (content: string) => {
  // 简单的markdown格式化
  return content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
}

onMounted(async () => {
  // 加载可用模型
  await loadModels()
  // 初始化时创建一个新聊天
  createNewChat()
})
</script>

<style scoped>
.chat-page {
  height: calc(100vh - 120px);
  background: #f5f5f5;
}

.chat-container {
  display: flex;
  height: 100%;
  max-width: 1400px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chat-sidebar {
  width: 300px;
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
}

.sidebar-header h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.chat-item {
  padding: 12px 15px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-bottom: 5px;
}

.chat-item:hover {
  background: #e9ecef;
}

.chat-item.active {
  background: #007bff;
  color: white;
}

.chat-title {
  font-weight: 500;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-time {
  font-size: 12px;
  opacity: 0.7;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-header {
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header h3 {
  margin: 0;
  color: #333;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #fafafa;
}

.message {
  display: flex;
  margin-bottom: 20px;
  align-items: flex-start;
}

.user-message {
  flex-direction: row-reverse;
}

.user-message .message-content {
  background: #007bff;
  color: white;
  margin-left: 12px;
  margin-right: 0;
}

.ai-message .message-content {
  background: white;
  border: 1px solid #e9ecef;
  margin-right: 12px;
  margin-left: 0;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-message .message-avatar {
  background: #007bff;
  color: white;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
}

.message-text {
  line-height: 1.5;
  word-wrap: break-word;
}

.message-time {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 5px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #999;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.chat-input {
  padding: 20px;
  border-top: 1px solid #e9ecef;
  background: white;
}

.input-container {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-container .el-textarea {
  flex: 1;
}

.send-button {
  height: 74px;
  padding: 0 20px;
}

.model-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.model-name {
  flex: 1;
  font-weight: 500;
}

.model-provider {
  font-size: 12px;
  color: #999;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .chat-container {
    flex-direction: column;
  }
  
  .chat-sidebar {
    width: 100%;
    height: 200px;
  }
  
  .message-content {
    max-width: 85%;
  }
}
</style>