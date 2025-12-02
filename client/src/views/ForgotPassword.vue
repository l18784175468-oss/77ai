<template>
  <div class="forgot-password-page">
    <div class="forgot-password-container">
      <div class="forgot-password-card">
        <div class="forgot-password-header">
          <h1 class="forgot-password-title">忘记密码</h1>
          <p class="forgot-password-subtitle">输入您的邮箱地址，我们将发送重置链接</p>
        </div>
        
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          class="forgot-password-form"
          @submit.prevent="handleSubmit"
        >
          <el-form-item prop="email">
            <el-input
              v-model="form.email"
              type="email"
              placeholder="请输入邮箱地址"
              size="large"
              :prefix-icon="Message"
              clearable
            />
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="isLoading"
              @click="handleSubmit"
              class="submit-button"
            >
              发送重置链接
            </el-button>
          </el-form-item>
        </el-form>
        
        <div class="forgot-password-footer">
          <p>
            <router-link to="/login" class="back-link">
              <el-icon><ArrowLeft /></el-icon>
              返回登录
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import { Message, ArrowLeft } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const isLoading = ref(false)

const form = reactive({
  email: ''
})

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    isLoading.value = true
    const result = await userStore.forgotPassword(form.email)
    
    if (result.success) {
      ElMessage.success('重置链接已发送到您的邮箱')
      router.push('/login')
    } else {
      ElMessage.error(result.error || '发送失败')
    }
  } catch (error) {
    console.error('发送重置链接错误:', error)
    ElMessage.error('发送失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.forgot-password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.forgot-password-container {
  width: 100%;
  max-width: 400px;
}

.forgot-password-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 40px;
  backdrop-filter: blur(10px);
}

.forgot-password-header {
  text-align: center;
  margin-bottom: 30px;
}

.forgot-password-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin: 0 0 10px 0;
}

.forgot-password-subtitle {
  color: #666;
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
}

.forgot-password-form {
  margin-bottom: 30px;
}

.submit-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
}

.forgot-password-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

.forgot-password-footer p {
  margin: 0;
}

.back-link {
  color: #409eff;
  text-decoration: none;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .forgot-password-card {
    padding: 30px 20px;
  }
}
</style>