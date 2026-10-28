# client 前端项目文档

> 面向学习的 Vue 3 + TypeScript + Element Plus 后台管理系统前端。

---

## 一、这是什么

HIS 管理系统的**浏览器前端**：提供登录、仪表盘、科室/医生/患者、挂号、门诊、药品、收费等页面，通过 HTTP 调用后端 `His.Api` 的 RESTful API。

---

## 二、技术栈与依赖

| 依赖 | 作用 |
|---|---|
| Vue 3（`<script setup>` 组合式 API） | 视图框架 |
| TypeScript | 类型安全 |
| Vite 5 | 开发服务器 + 构建工具 |
| Element Plus | 后台 UI 组件库（表格/表单/弹窗/菜单等） |
| Vue Router 4 | 页面路由（history 模式） |
| Pinia | 全局状态管理（登录态） |
| Axios | HTTP 请求，统一封装 |
| Tailwind CSS | 原子化样式（布局/间距/配色） |
| ECharts（vue-echarts） | 仪表盘趋势图 |

---

## 三、目录结构（逐项说明）

```
client/
├── index.html                  # HTML 入口（标题等）
├── vite.config.ts              # Vite 配置：端口、allowedHosts、/api 代理到后端 5080
├── tailwind.config.js          # Tailwind 配置（自定义医疗主题色）
├── postcss.config.js           # PostCSS（tailwind + autoprefixer）
├── tsconfig*.json              # TypeScript 编译配置
├── .npmrc                      # 覆盖全局 omit=dev，确保 devDependencies 会安装
├── package.json                # 依赖清单与脚本（dev/build/preview）
└── src/
    ├── main.ts                 # 应用入口：注册 Pinia/Router/ElementPlus/图标/全局样式
    ├── App.vue                 # 根组件（仅 <router-view> 路由出口）
    ├── index.css               # 全局样式：Tailwind 指令 + 主题变量 + 侧边栏样式
    ├── api/                    # 后端接口封装层
    │   ├── http.ts             #   Axios 实例 + 响应拦截器（统一处理 code/message）
    │   ├── types.ts            #   TS 类型定义（与后端 DTO 一一对应）
    │   └── index.ts            #   各模块 API 函数（auth/dept/doctor/...）
    ├── router/
    │   └── index.ts            # 路由表 + 假登录守卫
    ├── stores/
    │   └── auth.ts             # Pinia 登录态（localStorage 持久化）
    ├── layout/
    │   └── AdminLayout.vue     # 后台布局：可折叠侧边栏 + 顶栏 + 内容区
    └── views/                  # 页面组件
        ├── LoginView.vue       #   登录页（玻璃拟态 + 渐变背景）
        ├── DashboardView.vue   #   仪表盘（统计卡片 + 趋势图 + 快捷入口）
        ├── RegistrationView.vue#   挂号管理
        ├── VisitView.vue       #   门诊工作台（队列/病历/开处方）
        ├── DrugView.vue        #   药品库存
        ├── BillingView.vue     #   收费管理
        └── base/               #   基础数据子目录
            ├── DepartmentView.vue  # 科室管理
            ├── DoctorView.vue      # 医生管理
            └── PatientView.vue     # 患者档案
```

---

## 四、核心机制讲解

### 1. 路由与假登录守卫（`router/index.ts`）

```
访问 /login ──未登录──▶ 进入登录页
访问 /dashboard 等 ──未登录──▶ 重定向到 /login
访问 /login ──已登录──▶ 重定向到 /dashboard
```

- 登录态存 `localStorage("his-user")`，守卫直接读它判断
- 页面标题随 `meta.title` 动态变化

### 2. Axios 统一封装（`api/http.ts`）

```
前端调用 API → http.ts 拦截响应：
  code === 0  → 正常返回
  code !== 0  → 弹出 ElMessage 错误提示 + reject（页面无需重复提示）
  网络异常    → 提示"网络异常"
```

开发期 `baseURL = '/api'`，由 `vite.config.ts` 的 proxy 转发到 `http://localhost:5080`，**前端代码里不出现后端地址**。

### 3. Pinia 登录态（`stores/auth.ts`）

`setUser()` 存用户信息并写 localStorage；`logout()` 清空；页面刷新时 `loadUser()` 自动恢复登录态。

### 4. 页面通用模式（学习重点）

以 `DepartmentView.vue` 为例，几乎所有 CRUD 页面都遵循：

```
<script setup> 中：
  ref 定义表格数据 rows/total/loading + 查询条件 query
  load() 调用 api.page() 拉数据
  openCreate()/openEdit() 打开弹窗
  save() 校验表单 → create/update → 关弹窗 → load() 刷新
  remove() 用 ElMessageBox 二次确认 → 删除 → load()
```

掌握了科室页，其余页面只是字段和接口不同。

### 5. 复杂页面设计

- **挂号页**：患者下拉用 `el-select` 的 `remote` 远程搜索（边输边查患者）
- **门诊工作台**：三个弹窗串联——病历弹窗、开处方弹窗（动态增删药品行、实时算合计）
- **收费页**：三个 Tab（待收费/收费记录/处方查询），状态决定按钮显隐（已收费才显示"退费/发药"）

---

## 五、路由与页面清单

| 路由 | 页面 | 功能 |
|---|---|---|
| /login | LoginView | 登录 |
| /dashboard | DashboardView | 统计卡片 + 趋势图 + 快捷入口 |
| /base/departments | DepartmentView | 科室 CRUD |
| /base/doctors | DoctorView | 医生 CRUD（按科室过滤） |
| /base/patients | PatientView | 患者 CRUD |
| /registration | RegistrationView | 挂号 + 退号 |
| /visits | VisitView | 候诊队列 + 病历 + 开处方 |
| /drugs | DrugView | 药品 CRUD + 库存批次 |
| /billing | BillingView | 收费/退费/发药 |

---

## 六、运行与构建

```bash
cd client
npm install          # 若全局配置了 omit=dev，项目 .npmrc 已覆盖
npm run dev          # http://localhost:5173（/api 已代理到 5080）
npm run build        # 生产构建，产物在 dist/
npm run preview      # 预览构建产物
```

> 开发时需**同时**启动后端（`cd ../His.Api && dotnet run`），否则接口 404。

---

## 七、学习路径建议

1. 先看 `main.ts` + `App.vue`：理解应用如何装配起来
2. 看 `router/index.ts` + `layout/AdminLayout.vue`：理解路由和后台骨架
3. 看 `api/http.ts` + `api/index.ts`：理解前端如何统一对接后端
4. 精读一个简单页面 `views/base/DepartmentView.vue`：掌握"表格+弹窗+分页"套路
5. 看 `views/VisitView.vue`：理解多弹窗、动态表单行、计算属性
6. 对照后端文档，走通一个完整业务流：挂号 → 接诊 → 开处方 → 收费
7. 动手：仿照现有页面新增一个模块（先加路由 + API 函数，再写页面）
