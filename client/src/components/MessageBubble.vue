<template>
  <div class="message-bubble" :class="{ [`message-bubble--${type}`]: type }">
    <div class="message-avatar">
      <el-icon v-if="type === 'user'"><User /></el-icon>
      <el-icon v-else><Robot /></el-icon>
    </div>
    <div class="message-content">
      <div class="message-text" v-html="formattedContent"></div>
      <div class="message-time">{{ formatTime(timestamp) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { User, Robot } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

interface Props {
  type: 'user' | 'assistant'
  content: string
  timestamp: string
}

const props = defineProps<Props>()

const formattedContent = computed(() => {
  return props.content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
})

const formatTime = (timestamp: string) => {
  return dayjs(timestamp).format('HH:mm')
}
</script>

<style scoped>
.message-bubble {
  display: flex;
  margin-bottom: 20px;
  align-items: flex-start;
  gap: 12px;
}

.message-bubble--user {
  flex-direction: row-reverse;
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
  color: #666;
}

.message-bubble--user .message-avatar {
  background: #409eff;
  color: white;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  position: relative;
}

.message-bubble--user .message-content {
  background: #409eff;
  color: white;
  margin-left: 12px;
  margin-right: 0;
}

.message-bubble--assistant .message-content {
  background: white;
  border: 1px solid #e9ecef;
  color: #333;
  margin-right: 12px;
  margin-left: 0;
}

.message-text {
  line-height: 1.5;
  word-wrap: break-word;
}

.message-text :deep(code) {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
}

.message-bubble--user .message-text :deep(code) {
  background: rgba(255, 255, 255, 0.2);
}

.message-time {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 5px;
}

.message-bubble--user .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.message-bubble--assistant .message-time {
  color: #999;
}

@media (max-width: 768px) {
  .message-content {
    max-width: 85%;
  }
}
</style>