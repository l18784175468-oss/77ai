<template>
  <div class="profile-container">
    <div class="page-header">
      <h1>个人资料</h1>
      <p>管理您的账户信息和偏好设置</p>
    </div>

    <div class="content-wrapper">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-form 
            ref="basicFormRef"
            :model="basicForm" 
            :rules="basicRules"
            label-width="120px"
            class="profile-form"
          >
            <el-form-item label="头像" prop="avatar">
              <div class="avatar-upload">
                <el-upload
                  class="avatar-uploader"
                  :show-file-list="false"
                  :before-upload="beforeAvatarUpload"
                  :on-success="handleAvatarSuccess"
                  action="/api/upload/avatar"
                  :headers="uploadHeaders"
                >
                  <img v-if="basicForm.avatar" :src="basicForm.avatar" class="avatar" />
                  <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
                </el-upload>
              </div>
            </el-form-item>
            
            <el-form-item label="用户名" prop="username">
              <el-input v-model="basicForm.username" disabled />
            </el-form-item>
            
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="basicForm.email" disabled />
            </el-form-item>
            
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="basicForm.nickname" placeholder="请输入昵称" />
            </el-form-item>
            
            <el-form-item label="个人简介" prop="bio">
              <el-input 
                v-model="basicForm.bio" 
                type="textarea" 
                :rows="4"
                placeholder="请输入个人简介"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="updateBasicInfo" :loading="updating.basic">
                保存基本信息
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 安全设置 -->
        <el-tab-pane label="安全设置" name="security">
          <el-form 
            ref="securityFormRef"
            :model="securityForm" 
            :rules="securityRules"
            label-width="120px"
            class="profile-form"
          >
            <el-form-item label="修改密码">
              <el-button type="primary" @click="showPasswordDialog = true">
                修改密码
              </el-button>
            </el-form-item>
            
            <el-form-item label="两步验证">
              <div class="security-item">
                <span class="security-label">两步验证状态：</span>
                <el-tag :type="userInfo.twoFactorEnabled ? 'success' : 'warning'">
                  {{ userInfo.twoFactorEnabled ? '已启用' : '未启用' }}
                </el-tag>
              </div>
              <el-button 
                :type="userInfo.twoFactorEnabled ? 'danger' : 'primary'"
                @click="toggleTwoFactor"
              >
                {{ userInfo.twoFactorEnabled ? '禁用' : '启用' }}两步验证
              </el-button>
            </el-form-item>
            
            <el-form-item label="登录历史">
              <el-button type="info" @click="showLoginHistory = true">
                查看登录历史
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 偏好设置 -->
        <el-tab-pane label="偏好设置" name="preferences">
          <el-form 
            ref="preferencesFormRef"
            :model="preferencesForm" 
            label-width="120px"
            class="profile-form"
          >
            <el-form-item label="语言">
              <el-select v-model="preferencesForm.language" placeholder="选择语言">
                <el-option label="简体中文" value="zh-CN" />
                <el-option label="English" value="en-US" />
                <el-option label="日本語" value="ja-JP" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="主题">
              <el-select v-model="preferencesForm.theme" placeholder="选择主题">
                <el-option label="浅色主题" value="light" />
                <el-option label="深色主题" value="dark" />
                <el-option label="跟随系统" value="auto" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="默认AI模型">
              <el-select v-model="preferencesForm.defaultModel" placeholder="选择默认AI模型">
                <el-option
                  v-for="model in availableModels"
                  :key="model.id"
                  :label="model.name"
                  :value="model.id"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="消息通知">
              <el-switch 
                v-model="preferencesForm.emailNotifications"
                active-text="开启"
                inactive-text="关闭"
              />
            </el-form-item>
            
            <el-form-item label="自动保存">
              <el-switch 
                v-model="preferencesForm.autoSave"
                active-text="开启"
                inactive-text="关闭"
              />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="updatePreferences" :loading="updating.preferences">
                保存偏好设置
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="showPasswordDialog" title="修改密码" width="400px">
      <el-form 
        ref="passwordFormRef"
        :model="passwordForm" 
        :rules="passwordRules"
        label-width="100px"
      >
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input 
            v-model="passwordForm.currentPassword" 
            type="password" 
            show-password
          />
        </el-form-item>
        
        <el-form-item label="新密码" prop="newPassword">
          <el-input 
            v-model="passwordForm.newPassword" 
            type="password" 
            show-password
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="passwordForm.confirmPassword" 
            type="password" 
            show-password
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="updatePassword" :loading="updating.password">
          确认修改
        </el-button>
      </template>
    </el-dialog>

    <!-- 登录历史对话框 -->
    <el-dialog v-model="showLoginHistory" title="登录历史" width="600px">
      <el-table :data="loginHistory" style="width: 100%">
        <el-table-column prop="time" label="时间" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.time) }}
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP地址" width="140" />
        <el-table-column prop="location" label="位置" />
        <el-table-column prop="device" label="设备" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'success' ? 'success' : 'danger'">
              {{ scope.row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useToast } from '@/composables/useToast'
import dayjs from 'dayjs'

interface UserInfo {
  id: string
  username: string
  email: string
  nickname: string
  avatar: string
  bio: string
  twoFactorEnabled: boolean
  createdAt: string
}

interface LoginHistory {
  time: string
  ip: string
  location: string
  device: string
  status: 'success' | 'failed'
}

const { showToast } = useToast()

const activeTab = ref('basic')
const updating = reactive({ basic: false, preferences: false, password: false })
const showPasswordDialog = ref(false)
const showLoginHistory = ref(false)

const userInfo = ref<UserInfo>({
  id: '',
  username: '',
  email: '',
  nickname: '',
  avatar: '',
  bio: '',
  twoFactorEnabled: false,
  createdAt: ''
})

const basicForm = reactive({
  nickname: '',
  bio: ''
})

const securityForm = reactive({})

const preferencesForm = reactive({
  language: 'zh-CN',
  theme: 'light',
  defaultModel: 'gpt-4-turbo',
  emailNotifications: true,
  autoSave: true
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const loginHistory = ref<LoginHistory[]>([])
const availableModels = ref([])

// 表单验证规则
const basicRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度在2-20个字符', trigger: 'blur' }
  ],
  bio: [
    { max: 200, message: '个人简介不能超过200个字符', trigger: 'blur' }
  ]
}

const securityRules = {}

const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '密码长度至少8个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 上传头像前的验证
const beforeAvatarUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('上传头像只能是图片格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('上传头像大小不能超过 2MB!')
    return false
  }
  return true
}

// 头像上传成功
const handleAvatarSuccess = (response: any) => {
  basicForm.avatar = response.data.url
  showToast('头像上传成功', 'success')
}

// 获取上传请求头
const uploadHeaders = {
  Authorization: `Bearer ${localStorage.getItem('auth_token')}`
}

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const response = await fetch('/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      userInfo.value = data.data
      
      // 填充表单
      basicForm.nickname = data.data.nickname || ''
      basicForm.bio = data.data.bio || ''
      basicForm.avatar = data.data.avatar || ''
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 获取可用模型
const fetchAvailableModels = async () => {
  try {
    const response = await fetch('/api/ai/models', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      availableModels.value = data.data || []
    }
  } catch (error) {
    console.error('获取可用模型失败:', error)
  }
}

// 更新基本信息
const updateBasicInfo = async () => {
  updating.basic = true
  
  try {
    const response = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(basicForm)
    })
    
    if (response.ok) {
      showToast('基本信息更新成功', 'success')
      await fetchUserInfo()
    } else {
      throw new Error('更新失败')
    }
  } catch (error: any) {
    console.error('更新基本信息失败:', error)
    showToast(error.message || '更新基本信息失败', 'error')
  } finally {
    updating.basic = false
  }
}

// 更新偏好设置
const updatePreferences = async () => {
  updating.preferences = true
  
  try {
    const response = await fetch('/api/settings/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(preferencesForm)
    })
    
    if (response.ok) {
      showToast('偏好设置更新成功', 'success')
    } else {
      throw new Error('更新失败')
    }
  } catch (error: any) {
    console.error('更新偏好设置失败:', error)
    showToast(error.message || '更新偏好设置失败', 'error')
  } finally {
    updating.preferences = false
  }
}

// 修改密码
const updatePassword = async () => {
  updating.password = true
  
  try {
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(passwordForm)
    })
    
    if (response.ok) {
      showToast('密码修改成功', 'success')
      showPasswordDialog.value = false
      
      // 重置表单
      passwordForm.currentPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
    } else {
      throw new Error('修改失败')
    }
  } catch (error: any) {
    console.error('修改密码失败:', error)
    showToast(error.message || '修改密码失败', 'error')
  } finally {
    updating.password = false
  }
}

// 切换两步验证
const toggleTwoFactor = async () => {
  try {
    const action = userInfo.value.twoFactorEnabled ? 'disable' : 'enable'
    
    await ElMessageBox.confirm(
      `确定要${userInfo.value.twoFactorEnabled ? '禁用' : '启用'}两步验证吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await fetch(`/api/auth/2fa/${action}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })
    
    if (response.ok) {
      showToast(`两步验证${userInfo.value.twoFactorEnabled ? '禁用' : '启用'}成功`, 'success')
      userInfo.value.twoFactorEnabled = !userInfo.value.twoFactorEnabled
    } else {
      throw new Error('操作失败')
    }
  } catch (error: any) {
    console.error('切换两步验证失败:', error)
    showToast(error.message || '操作失败', 'error')
  }
}

// 格式化时间
const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(async () => {
  await Promise.all([
    fetchUserInfo(),
    fetchAvailableModels()
  ])
})
</script>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
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

.profile-form {
  max-width: 500px;
  margin: 0 auto;
}

.avatar-upload {
  display: flex;
  justify-content: center;
}

.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}

.avatar-uploader:hover {
  border-color: #409eff;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
}

.avatar {
  width: 178px;
  height: 178px;
  display: block;
  border-radius: 6px;
  object-fit: cover;
}

.security-item {
  margin-bottom: 15px;
}

.security-label {
  margin-right: 10px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .profile-container {
    padding: 10px;
  }
  
  .content-wrapper {
    padding: 20px;
  }
  
  .profile-form {
    max-width: 100%;
  }
}
</style>