<template>
  <div id="app">
    <el-container class="layout-container">
      <el-header class="header">
        <div class="header-content">
          <h1 class="logo">AI Web Framework</h1>
          <nav class="nav">
            <el-menu
              :default-active="activeIndex"
              mode="horizontal"
              :router="true"
              background-color="#545c64"
              text-color="#fff"
              active-text-color="#ffd04b"
            >
              <el-menu-item index="/">首页</el-menu-item>
              <el-menu-item index="/chat">AI聊天</el-menu-item>
              <el-menu-item index="/image">图像生成</el-menu-item>
              <el-menu-item index="/code">代码助手</el-menu-item>
              <el-menu-item index="/custom-ai">自定义AI</el-menu-item>
              <el-menu-item index="/subscription">订阅计划</el-menu-item>
              <el-menu-item index="/profile">个人资料</el-menu-item>
              <el-menu-item index="/settings">设置</el-menu-item>
            </el-menu>
          </nav>
        </div>
      </el-header>
      
      <el-main class="main">
        <router-view />
      </el-main>
      
      <el-footer class="footer">
        <p>&copy; 2024 AI Web Framework. All rights reserved.</p>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const activeIndex = computed(() => route.path)
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
}

.header {
  background-color: #545c64;
  padding: 0;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.logo {
  color: #fff;
  margin: 0;
  font-size: 1.5rem;
}

.nav {
  flex: 1;
  margin-left: 40px;
}

.main {
  background-color: #f5f5f5;
  min-height: calc(100vh - 120px);
}

.footer {
  background-color: #545c64;
  color: #fff;
  text-align: center;
  padding: 20px 0;
}

.footer p {
  margin: 0;
}
</style>