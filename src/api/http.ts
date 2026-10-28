import axios from 'axios'
import { ElMessage } from 'element-plus'

export interface ApiResult<T> {
  code: number
  message: string
  data: T
}

export interface PageResult<T> {
  total: number
  items: T[]
}

/**
 * Axios 实例封装：
 * - baseURL 指向 /api，开发期由 Vite proxy 代理到后端 http://localhost:5080
 * - 响应拦截器统一处理 { code, message, data } 结构：code !== 0 视为业务失败，
 *   弹出 ElMessage 错误提示并 reject（页面无需重复 try-catch 提示）
 * - 网络异常/超时统一提示"网络异常"，同时 console.error 记录详情
 */
const http = axios.create({
  baseURL: '/api',
  timeout: 15000
})

http.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResult<unknown>
    if (res && typeof res.code === 'number' && res.code !== 0) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message))
    }
    return response
  },
  (error) => {
    console.error(error)
    ElMessage.error(error.response?.data?.message || error.message || '网络异常')
    return Promise.reject(error)
  }
)

export default http
