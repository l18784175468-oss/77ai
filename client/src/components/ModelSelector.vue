<template>
  <div class="model-selector">
    <el-select
      v-model="selectedModel"
      placeholder="选择AI模型"
      @change="handleModelChange"
      :disabled="disabled"
    >
      <el-option-group
        v-for="provider in modelProviders"
        :key="provider.name"
        :label="provider.name"
      >
        <el-option
          v-for="model in provider.models"
          :key="model.id"
          :label="model.name"
          :value="model.id"
        >
          <div class="model-option">
            <span class="model-name">{{ model.name }}</span>
            <span class="model-provider">{{ provider.name }}</span>
            <el-tag
              v-if="model.supportsStreaming"
              type="success"
              size="small"
              class="model-tag"
            >
              流式
            </el-tag>
          </div>
        </el-option>
      </el-option-group>
    </el-select>
    
    <div v-if="selectedModelInfo" class="model-info">
      <div class="model-details">
        <h4>{{ selectedModelInfo.name }}</h4>
        <p class="model-description">{{ selectedModelInfo.description }}</p>
        <div class="model-specs">
          <div class="spec-item">
            <span class="spec-label">提供商:</span>
            <span class="spec-value">{{ getProviderName(selectedModelInfo.provider) }}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">最大令牌:</span>
            <span class="spec-value">{{ selectedModelInfo.maxTokens.toLocaleString() }}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">流式支持:</span>
            <span class="spec-value">
              <el-tag :type="selectedModelInfo.supportsStreaming ? 'success' : 'info'" size="small">
                {{ selectedModelInfo.supportsStreaming ? '支持' : '不支持' }}
              </el-tag>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

interface AIModel {
  id: string
  name: string
  provider: string
  maxTokens: number
  supportsStreaming: boolean
  description?: string
}

interface ModelProvider {
  name: string
  models: AIModel[]
}

interface Props {
  model?: string
  disabled?: boolean
}

interface Emits {
  (e: 'update:model', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedModel = ref(props.model || '')

const modelProviders: ModelProvider[] = [
  {
    name: 'OpenAI',
    models: [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        maxTokens: 8192,
        supportsStreaming: true,
        description: '最先进的GPT模型，具有出色的推理和创造能力。'
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        maxTokens: 4096,
        supportsStreaming: true,
        description: '快速且高效的模型，适合大多数任务。'
      }
    ]
  },
  {
    name: 'Anthropic',
    models: [
      {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        provider: 'anthropic',
        maxTokens: 4096,
        supportsStreaming: false,
        description: '平衡了性能、速度和成本的高端模型。'
      },
      {
        id: 'claude-3-haiku',
        name: 'Claude 3 Haiku',
        provider: 'anthropic',
        maxTokens: 4096,
        supportsStreaming: false,
        description: '快速且响应迅速的模型，适合实时应用。'
      }
    ]
  },
  {
    name: 'Google',
    models: [
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'google',
        maxTokens: 2048,
        supportsStreaming: false,
        description: 'Google的多模态AI模型，支持文本和图像。'
      }
    ]
  }
]

const selectedModelInfo = computed(() => {
  for (const provider of modelProviders) {
    const model = provider.models.find(m => m.id === selectedModel.value)
    if (model) {
      return model
    }
  }
  return null
})

const getProviderName = (provider: string) => {
  const providerMap: { [key: string]: string } = {
    'openai': 'OpenAI',
    'anthropic': 'Anthropic',
    'google': 'Google'
  }
  return providerMap[provider] || provider
}

const handleModelChange = (value: string) => {
  selectedModel.value = value
  emit('update:model', value)
}

// 监听外部模型变化
watch(() => props.model, (newValue) => {
  if (newValue && newValue !== selectedModel.value) {
    selectedModel.value = newValue
  }
})

onMounted(() => {
  if (props.model) {
    selectedModel.value = props.model
  }
})
</script>

<style scoped>
.model-selector {
  width: 100%;
}

.model-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.model-name {
  font-weight: 500;
}

.model-provider {
  font-size: 12px;
  color: #999;
}

.model-tag {
  margin-left: 8px;
}

.model-info {
  margin-top: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.model-details h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 16px;
}

.model-description {
  margin: 0 0 15px 0;
  color: #666;
  line-height: 1.5;
}

.model-specs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.spec-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
}

.spec-item:last-child {
  border-bottom: none;
}

.spec-label {
  font-weight: 500;
  color: #333;
}

.spec-value {
  color: #666;
}

@media (max-width: 768px) {
  .model-specs {
    grid-template-columns: 1fr;
  }
}
</style>