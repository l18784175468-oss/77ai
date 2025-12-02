<template>
  <div class="code-page">
    <div class="container">
      <h2 class="page-title">AI代码助手</h2>
      
      <div class="code-assistant">
        <div class="editor-panel">
          <el-card class="editor-card">
            <template #header>
              <div class="card-header">
                <span>代码编辑器</span>
                <div class="editor-actions">
                  <el-select v-model="codeConfig.language" placeholder="选择语言" style="width: 120px">
                    <el-option
                      v-for="lang in languages"
                      :key="lang.value"
                      :label="lang.label"
                      :value="lang.value"
                    />
                  </el-select>
                  <el-button type="primary" @click="formatCode">
                    <el-icon><DocumentCopy /></el-icon>
                    格式化
                  </el-button>
                </div>
              </div>
            </template>
            
            <div class="code-editor">
              <el-input
                v-model="codeContent"
                type="textarea"
                :rows="20"
                placeholder="在此输入或粘贴您的代码..."
                class="code-textarea"
              />
            </div>
            
            <div class="editor-footer">
              <div class="action-buttons">
                <el-button @click="clearCode">清空</el-button>
                <el-button @click="loadExample">加载示例</el-button>
                <el-button type="primary" @click="analyzeCode" :disabled="!codeContent.trim()">
                  <el-icon><DataAnalysis /></el-icon>
                  分析代码
                </el-button>
              </div>
            </div>
          </el-card>
        </div>
        
        <div class="assistant-panel">
          <el-card class="assistant-card">
            <template #header>
              <div class="card-header">
                <span>AI助手</span>
                <el-select v-model="selectedModel" placeholder="选择模型" style="width: 150px">
                  <el-option
                    v-for="model in availableModels"
                    :key="model.id"
                    :label="model.name"
                    :value="model.id"
                  />
                </el-select>
              </div>
            </template>
            
            <div class="assistant-tabs">
              <el-tabs v-model="activeTab" @tab-click="handleTabClick">
                <el-tab-pane label="代码解释" name="explain">
                  <div class="tab-content">
                    <div v-if="isAnalyzing" class="loading-content">
                      <el-icon class="is-loading"><Loading /></el-icon>
                      <p>正在分析代码...</p>
                    </div>
                    <div v-else-if="codeExplanation" class="explanation-content">
                      <div class="explanation-text" v-html="formatExplanation(codeExplanation)"></div>
                    </div>
                    <div v-else class="empty-content">
                      <el-icon size="48"><DocumentCopy /></el-icon>
                      <p>请先分析代码以获取解释</p>
                    </div>
                  </div>
                </el-tab-pane>
                
                <el-tab-pane label="代码优化" name="optimize">
                  <div class="tab-content">
                    <div v-if="optimizedCode" class="optimized-content">
                      <div class="optimized-header">
                        <h4>优化建议</h4>
                        <el-button type="text" @click="applyOptimization">
                          <el-icon><Check /></el-icon>
                          应用优化
                        </el-button>
                      </div>
                      <pre class="optimized-code">{{ optimizedCode }}</pre>
                    </div>
                    <div v-else class="empty-content">
                      <el-icon size="48"><Tools /></el-icon>
                      <p>请先分析代码以获取优化建议</p>
                    </div>
                  </div>
                </el-tab-pane>
                
                <el-tab-pane label="错误检测" name="errors">
                  <div class="tab-content">
                    <div v-if="codeErrors.length > 0" class="errors-content">
                      <div 
                        v-for="(error, index) in codeErrors" 
                        :key="index"
                        class="error-item"
                      >
                        <div class="error-type" :class="error.severity">
                          {{ error.type }}
                        </div>
                        <div class="error-message">{{ error.message }}</div>
                        <div class="error-line">行 {{ error.line }}</div>
                      </div>
                    </div>
                    <div v-else class="empty-content">
                      <el-icon size="48"><CircleCheck /></el-icon>
                      <p>未发现错误或请先分析代码</p>
                    </div>
                  </div>
                </el-tab-pane>
                
                <el-tab-pane label="代码生成" name="generate">
                  <div class="tab-content">
                    <el-input
                      v-model="generationPrompt"
                      type="textarea"
                      :rows="3"
                      placeholder="描述您想要生成的代码功能..."
                      style="margin-bottom: 15px"
                    />
                    <el-button 
                      type="primary" 
                      @click="generateCode"
                      :disabled="!generationPrompt.trim() || isGenerating"
                      :loading="isGenerating"
                    >
                      <el-icon><Magic /></el-icon>
                      生成代码
                    </el-button>
                    
                    <div v-if="generatedCode" class="generated-content">
                      <div class="generated-header">
                        <h4>生成的代码</h4>
                        <el-button type="text" @click="copyGeneratedCode">
                          <el-icon><CopyDocument /></el-icon>
                          复制
                        </el-button>
                      </div>
                      <pre class="generated-code">{{ generatedCode }}</pre>
                    </div>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  DocumentCopy, 
  DataAnalysis, 
  Loading, 
  Check, 
  Tools, 
  CircleCheck, 
  Magic, 
  CopyDocument 
} from '@element-plus/icons-vue'

interface CodeConfig {
  language: string
}

interface CodeError {
  type: string
  message: string
  line: number
  severity: 'error' | 'warning' | 'info'
}

const codeConfig = reactive<CodeConfig>({
  language: 'javascript'
})

const languages = [
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'C++', value: 'cpp' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' }
]

const availableModels = [
  { id: 'gpt-4', name: 'GPT-4' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  { id: 'claude-3', name: 'Claude 3' },
  { id: 'codex', name: 'Codex' }
]

const codeContent = ref('')
const selectedModel = ref('gpt-4')
const activeTab = ref('explain')
const isAnalyzing = ref(false)
const isGenerating = ref(false)
const codeExplanation = ref('')
const optimizedCode = ref('')
const codeErrors = ref<CodeError[]>([])
const generationPrompt = ref('')
const generatedCode = ref('')

const analyzeCode = async () => {
  if (!codeContent.value.trim()) {
    ElMessage.warning('请先输入代码')
    return
  }
  
  isAnalyzing.value = true
  
  try {
    const response = await fetch('/api/code/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: codeContent.value,
        language: codeConfig.language,
        model: selectedModel.value
      })
    })
    
    if (!response.ok) {
      throw new Error('分析代码失败')
    }
    
    const data = await response.json()
    
    codeExplanation.value = data.explanation
    optimizedCode.value = data.optimized
    codeErrors.value = data.errors || []
    
    ElMessage.success('代码分析完成')
    
  } catch (error) {
    console.error('分析代码失败:', error)
    ElMessage.error('分析代码失败，请稍后重试')
  } finally {
    isAnalyzing.value = false
  }
}

const generateCode = async () => {
  if (!generationPrompt.value.trim()) {
    ElMessage.warning('请输入代码生成描述')
    return
  }
  
  isGenerating.value = true
  
  try {
    const response = await fetch('/api/code/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: generationPrompt.value,
        language: codeConfig.language,
        model: selectedModel.value
      })
    })
    
    if (!response.ok) {
      throw new Error('生成代码失败')
    }
    
    const data = await response.json()
    generatedCode.value = data.code
    
    ElMessage.success('代码生成完成')
    
  } catch (error) {
    console.error('生成代码失败:', error)
    ElMessage.error('生成代码失败，请稍后重试')
  } finally {
    isGenerating.value = false
  }
}

const formatCode = () => {
  // 这里应该调用代码格式化API或库
  ElMessage.info('代码格式化功能开发中...')
}

const clearCode = () => {
  codeContent.value = ''
  codeExplanation.value = ''
  optimizedCode.value = ''
  codeErrors.value = []
}

const loadExample = () => {
  const examples = {
    javascript: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));`,
    python: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(10))`,
    java: `public class Fibonacci {
    public static int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
    
    public static void main(String[] args) {
        System.out.println(fibonacci(10));
    }
}`
  }
  
  codeContent.value = examples[codeConfig.language as keyof typeof examples] || ''
}

const applyOptimization = () => {
  if (optimizedCode.value) {
    codeContent.value = optimizedCode.value
    ElMessage.success('已应用优化代码')
  }
}

const copyGeneratedCode = () => {
  if (generatedCode.value) {
    navigator.clipboard.writeText(generatedCode.value)
    ElMessage.success('代码已复制到剪贴板')
  }
}

const handleTabClick = (tab: any) => {
  // 可以在这里添加标签切换逻辑
}

const formatExplanation = (explanation: string) => {
  return explanation
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
}
</script>

<style scoped>
.code-page {
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

.code-assistant {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.editor-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.code-editor {
  margin-bottom: 15px;
}

.code-textarea :deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
}

.editor-footer {
  border-top: 1px solid #e9ecef;
  padding-top: 15px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.assistant-tabs {
  min-height: 400px;
}

.tab-content {
  min-height: 350px;
}

.loading-content {
  text-align: center;
  padding: 60px 0;
  color: #666;
}

.loading-content .el-icon {
  font-size: 48px;
  margin-bottom: 20px;
  color: #409eff;
}

.empty-content {
  text-align: center;
  padding: 60px 0;
  color: #999;
}

.empty-content .el-icon {
  margin-bottom: 20px;
  color: #ddd;
}

.explanation-content {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  line-height: 1.6;
}

.explanation-text {
  color: #333;
}

.optimized-content,
.generated-content {
  padding: 15px;
}

.optimized-header,
.generated-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.optimized-code,
.generated-code {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.errors-content {
  padding: 15px;
}

.error-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 10px;
  background: #fff;
}

.error-type {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  margin-right: 15px;
  min-width: 60px;
  text-align: center;
}

.error-type.error {
  background: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fbc4c4;
}

.error-type.warning {
  background: #fdf6ec;
  color: #e6a23c;
  border: 1px solid #f5dab1;
}

.error-type.info {
  background: #f4f4f5;
  color: #909399;
  border: 1px solid #d3d4d6;
}

.error-message {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.error-line {
  font-size: 12px;
  color: #999;
  margin-left: 15px;
}

@media (max-width: 1024px) {
  .code-assistant {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .editor-actions {
    flex-direction: column;
    gap: 5px;
  }
  
  .action-buttons {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>