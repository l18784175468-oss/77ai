<template>
  <div class="signup-page">
    <div class="signup-container">
      <div class="signup-card">
        <div class="signup-header">
          <h1 class="signup-title">创建账户</h1>
          <p class="signup-subtitle">加入AI Web Framework</p>
        </div>
        
        <el-form
          ref="signupFormRef"
          :model="signupForm"
          :rules="signupRules"
          class="signup-form"
          @submit.prevent="handleSignup"
        >
          <el-form-item prop="username">
            <el-input
              v-model="signupForm.username"
              type="text"
              placeholder="用户名"
              size="large"
              :prefix-icon="User"
              clearable
            />
          </el-form-item>
          
          <el-form-item prop="email">
            <el-input
              v-model="signupForm.email"
              type="email"
              placeholder="邮箱地址"
              size="large"
              :prefix-icon="Message"
              clearable
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              v-model="signupForm.password"
              type="password"
              placeholder="密码"
              size="large"
              :prefix-icon="Lock"
              show-password
              clearable
            />
          </el-form-item>
          
          <el-form-item prop="confirmPassword">
            <el-input
              v-model="signupForm.confirmPassword"
              type="password"
              placeholder="确认密码"
              size="large"
              :prefix-icon="Lock"
              show-password
              clearable
              @keyup.enter="handleSignup"
            />
          </el-form-item>
          
          <el-form-item>
            <el-checkbox v-model="agreeTerms">
              我已阅读并同意
              <router-link to="/terms" class="terms-link">服务条款</router-link>
              和
              <router-link to="/privacy" class="terms-link">隐私政策</router-link>
            </el-checkbox>
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="isLoading"
              :disabled="!agreeTerms"
              @click="handleSignup"
              class="signup-button"
            >
              创建账户
            </el-button>
          </el-form-item>
        </el-form>
        
        <div class="signup-footer">
          <p>
            已有账户？
            <router-link to="/login" class="login-link">
              立即登录
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
import { User, Lock, Message } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const signupFormRef = ref<FormInstance>()
const isLoading = ref(false)
const agreeTerms = ref(false)

const signupForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value !== signupForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const signupRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名长度不能少于3位', trigger: 'blur' },
    { max: 20, message: '用户名长度不能超过20位', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
    { max: 50, message: '密码长度不能超过50位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleSignup = async () => {
  if (!signupFormRef.value || !agreeTerms.value) {
    ElMessage.warning('请先同意服务条款和隐私政策')
    return
  }
  
  try {
    await signupFormRef.value.validate()
    
    isLoading.value = true
    const result = await userStore.signup({
      username: signupForm.username,
      email: signupForm.email,
      password: signupForm.password
    })
    
    if (result.success) {
      ElMessage.success('注册成功，请查收邮箱验证邮件')
      router.push('/login')
    } else {
      ElMessage.error(result.error || '注册失败')
    }
  } catch (error) {
    console.error('注册错误:', error)
    ElMessage.error('注册失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.signup-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.signup-container {
  width: 100%;
  max-width: 450px;
}

.signup-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 40px;
  backdrop-filter: blur(10px);
}

.signup-header {
  text-align: center;
  margin-bottom: 30px;
}

.signup-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin: 0 0 10px 0;
}

.signup-subtitle {
  color: #666;
  margin: 0;
  font-size: 16px;
}

.signup-form {
  margin-bottom: 20px;
}

.terms-link {
  color: #409eff;
  text-decoration: none;
  font-size: 14px;
}

.terms-link:hover {
  text-decoration: underline;
}

.signup-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
}

.signup-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

.signup-footer p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.login-link {
  color: #409eff;
  text-decoration: none;
  font-weight: 500;
}

.login-link:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .signup-card {
    padding: 30px 20px;
  }
}
</style>