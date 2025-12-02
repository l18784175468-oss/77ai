import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: '首页'
    }
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('@/views/Chat.vue'),
    meta: {
      title: 'AI聊天',
      requiresAuth: true
    }
  },
  {
    path: '/image',
    name: 'Image',
    component: () => import('@/views/Image.vue'),
    meta: {
      title: '图像生成',
      requiresAuth: true
    }
  },
  {
    path: '/code',
    name: 'Code',
    component: () => import('@/views/Code.vue'),
    meta: {
      title: '代码助手',
      requiresAuth: true
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    meta: {
      title: '设置',
      requiresAuth: true
    }
  },
  {
    path: '/custom-ai',
    name: 'CustomAI',
    component: () => import('@/views/CustomAI.vue'),
    meta: {
      title: '自定义AI',
      requiresAuth: true
    }
  },
  {
    path: '/subscription',
    name: 'Subscription',
    component: () => import('@/views/Subscription.vue'),
    meta: {
      title: '订阅计划',
      requiresAuth: true
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: {
      title: '个人资料',
      requiresAuth: true
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      title: '登录',
      hideForAuth: true
    }
  },
  {
    path: '/signup',
    name: 'Signup',
    component: () => import('@/views/Signup.vue'),
    meta: {
      title: '注册',
      hideForAuth: true
    }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/ForgotPassword.vue'),
    meta: {
      title: '忘记密码',
      hideForAuth: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫，用于设置页面标题和认证检查
router.beforeEach((to, from, next) => {
  if (to.meta?.title) {
    document.title = `${to.meta.title} - AI Web Framework`
  }

  // 检查认证状态
  const token = localStorage.getItem('auth_token')
  const requiresAuth = to.meta?.requiresAuth
  const hideForAuth = to.meta?.hideForAuth

  if (requiresAuth && !token) {
    next('/login')
  } else if (hideForAuth && token) {
    next('/')
  } else {
    next()
  }
})

export default router