<script setup lang="ts">
import { useRoute } from 'vue-router'

defineProps<{ collapsed?: boolean }>()

const route = useRoute()
</script>

<template>
  <div class="his-sidebar h-full flex flex-col bg-sidebar">
    <div class="flex items-center justify-center h-16 border-b border-white/10 shrink-0">
      <el-icon :size="26" color="#14B8A6"><FirstAidKit /></el-icon>
      <span v-if="!collapsed" class="ml-2 text-white font-semibold text-base tracking-wide">机器猫医疗 HIS</span>
    </div>
    <el-scrollbar class="flex-1">
      <el-menu :default-active="route.path" :collapse="collapsed" router class="px-2 pt-2">
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <template #title>首页仪表盘</template>
        </el-menu-item>
        <el-sub-menu index="base">
          <template #title>
            <el-icon><FolderOpened /></el-icon>
            <span>基础数据</span>
          </template>
          <el-menu-item index="/base/departments">科室管理</el-menu-item>
          <el-menu-item index="/base/doctors">医生管理</el-menu-item>
          <el-menu-item index="/base/patients">患者档案</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/registration">
          <el-icon><Ticket /></el-icon>
          <template #title>挂号管理</template>
        </el-menu-item>
        <el-menu-item index="/visits">
          <el-icon><Notebook /></el-icon>
          <template #title>门诊工作台</template>
        </el-menu-item>
        <el-menu-item index="/drugs">
          <el-icon><Box /></el-icon>
          <template #title>药品库存</template>
        </el-menu-item>
        <el-menu-item index="/billing">
          <el-icon><Wallet /></el-icon>
          <template #title>收费管理</template>
        </el-menu-item>
      </el-menu>
    </el-scrollbar>
  </div>
</template>
