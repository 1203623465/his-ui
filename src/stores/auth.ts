import { defineStore } from 'pinia'
import type { LoginUser } from '../api/types'

const STORAGE_KEY = 'his-user'

function loadUser(): LoginUser | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  const parsed = JSON.parse(raw) as LoginUser
  return parsed
}

/**
 * 登录态管理（假登录）：
 * - 登录成功后调用 setUser 持久化到 localStorage("his-user")
 * - 页面刷新时从 localStorage 恢复（loadUser），避免重复登录
 * - 路由守卫直接读取 localStorage 判断登录态，与本 store 数据同源
 * 注意：演示系统不做真实鉴权，不存储 token/密码。
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: loadUser() as LoginUser | null
  }),
  getters: {
    isLoggedIn: (state) => state.user !== null
  },
  actions: {
    setUser(user: LoginUser) {
      this.user = user
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    },
    logout() {
      this.user = null
      localStorage.removeItem(STORAGE_KEY)
    }
  }
})
