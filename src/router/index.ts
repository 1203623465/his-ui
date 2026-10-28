import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { title: '登录' }
    },
    {
      path: '/',
      component: () => import('../layout/AdminLayout.vue'),
      redirect: '/dashboard',
      children: [
        { path: 'dashboard', component: () => import('../views/DashboardView.vue'), meta: { title: '首页仪表盘' } },
        { path: 'base/departments', component: () => import('../views/base/DepartmentView.vue'), meta: { title: '科室管理' } },
        { path: 'base/doctors', component: () => import('../views/base/DoctorView.vue'), meta: { title: '医生管理' } },
        { path: 'base/patients', component: () => import('../views/base/PatientView.vue'), meta: { title: '患者档案' } },
        { path: 'registration', component: () => import('../views/RegistrationView.vue'), meta: { title: '挂号管理' } },
        { path: 'visits', component: () => import('../views/VisitView.vue'), meta: { title: '门诊工作台' } },
        { path: 'drugs', component: () => import('../views/DrugView.vue'), meta: { title: '药品库存' } },
        { path: 'billing', component: () => import('../views/BillingView.vue'), meta: { title: '收费管理' } }
      ]
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
  ]
})

/**
 * 假登录路由守卫：
 * - 未登录访问任意后台页 → 重定向到 /login
 * - 已登录访问 /login → 重定向到 /dashboard
 * 登录态存于 localStorage("his-user")，与 Pinia auth store 保持同步；
 * 同时按路由 meta.title 动态设置浏览器标签页标题。
 */
router.beforeEach((to) => {
  const loggedIn = localStorage.getItem('his-user') !== null
  if (to.path === '/login' && loggedIn) {
    return '/dashboard'
  }
  if (to.path !== '/login' && !loggedIn) {
    return '/login'
  }
  document.title = to.meta.title ? `${to.meta.title as string} - 机器猫医疗 HIS` : '机器猫医疗 HIS 管理系统'
  return true
})

export default router
