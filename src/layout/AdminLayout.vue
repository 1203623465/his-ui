<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import SideMenu from './SideMenu.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const collapsed = ref(false)
const drawerVisible = ref(false)
const isMobile = ref(false)

const asideWidth = computed(() => (collapsed.value ? '64px' : '220px'))

let mql: MediaQueryList | undefined

function handleMediaChange(e: MediaQueryList | MediaQueryListEvent) {
  isMobile.value = e.matches
  if (!e.matches) drawerVisible.value = false
}

onMounted(() => {
  mql = window.matchMedia('(max-width: 768px)')
  handleMediaChange(mql)
  mql.addEventListener('change', handleMediaChange)
})

onBeforeUnmount(() => {
  mql?.removeEventListener('change', handleMediaChange)
})

watch(() => route.path, () => {
  drawerVisible.value = false
})

function toggleNav() {
  if (isMobile.value) drawerVisible.value = true
  else collapsed.value = !collapsed.value
}

async function handleLogout() {
  await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' })
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <el-container class="h-screen">
    <el-aside v-if="!isMobile" :width="asideWidth" class="his-sidebar bg-sidebar transition-all duration-300 flex flex-col">
      <SideMenu :collapsed="collapsed" />
    </el-aside>

    <el-container class="min-w-0">
      <el-header class="bg-white shadow-sm flex items-center justify-between h-16 z-10">
        <div class="flex items-center min-w-0">
          <el-icon class="cursor-pointer hover:text-primary transition-colors shrink-0" :size="20" @click="toggleNav">
            <Menu v-if="isMobile" />
            <Expand v-else-if="collapsed" />
            <Fold v-else />
          </el-icon>
          <span class="ml-3 text-base font-medium text-gray-700 truncate">{{ route.meta.title }}</span>
        </div>
        <el-dropdown trigger="click">
          <div class="flex items-center cursor-pointer shrink-0">
            <el-avatar :size="32" class="bg-gradient-to-br from-primary to-teal">
              {{ auth.user?.displayName?.charAt(0) }}
            </el-avatar>
            <span class="ml-2 text-sm text-gray-700 hidden md:inline">{{ auth.user?.displayName }}</span>
            <el-icon class="ml-1 text-gray-400 hidden md:inline-flex"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item disabled>账号：{{ auth.user?.username }}</el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">
                <el-icon><SwitchButton /></el-icon>退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>

      <el-main class="bg-page p-2 md:p-4 overflow-auto">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>

    <el-drawer
      v-model="drawerVisible"
      direction="ltr"
      size="220px"
      :with-header="false"
      class="his-drawer"
    >
      <SideMenu />
    </el-drawer>
  </el-container>
</template>
