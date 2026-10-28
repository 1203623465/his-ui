<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import { authApi } from '../api'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  const res = await authApi.login(form.username, form.password).catch(() => null)
  loading.value = false
  if (!res) return
  auth.setUser(res.data.data)
  ElMessage.success(`欢迎回来，${res.data.data.displayName}`)
  router.push('/dashboard')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1F2D3D] via-[#2F6FED] to-[#14B8A6] relative overflow-hidden">
    <div class="absolute w-96 h-96 rounded-full bg-white/10 -top-20 -left-20 blur-3xl"></div>
    <div class="absolute w-80 h-80 rounded-full bg-teal-300/20 bottom-10 right-10 blur-3xl"></div>

    <div class="relative w-full max-w-[400px] mx-4 rounded-2xl bg-white/85 backdrop-blur-xl shadow-2xl p-6 sm:p-10 animate-fade-in">
      <div class="flex flex-col items-center mb-8">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-teal flex items-center justify-center shadow-lg shadow-primary/30">
          <el-icon :size="34" color="#fff"><FirstAidKit /></el-icon>
        </div>
        <h1 class="mt-4 text-[22px] font-semibold text-gray-800">机器猫医疗 HIS</h1>
        <p class="mt-1 text-sm text-gray-500">医院信息管理系统 · 演示环境</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" size="large" @keyup.enter="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="请输入账号" clearable>
            <template #prefix><el-icon><User /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password>
            <template #prefix><el-icon><Lock /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-button
          type="primary"
          class="w-full !h-11 !text-base !rounded-lg shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow"
          :loading="loading"
          @click="handleLogin"
        >
          登 录
        </el-button>
      </el-form>

      <p class="mt-6 text-center text-xs text-gray-400">演示系统：任意账号密码均可登录</p>
    </div>
  </div>
</template>
