<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { deptApi, doctorApi } from '../../api'
import type { Department, Doctor } from '../../api/types'

const loading = ref(false)
const rows = ref<Doctor[]>([])
const total = ref(0)
const query = reactive({ page: 1, size: 10, keyword: '', deptId: undefined as number | undefined })
const depts = ref<Department[]>([])

const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()
const editingId = ref<number | null>(null)
const form = reactive({ doctorName: '', doctorTitle: '', deptId: undefined as number | undefined, isActive: 0 })

const rules: FormRules = {
  doctorName: [{ required: true, message: '请输入医生姓名', trigger: 'blur' }],
  deptId: [{ required: true, message: '请选择所属科室', trigger: 'change' }]
}

async function load() {
  loading.value = true
  const res = await doctorApi.page(query).catch(() => null)
  loading.value = false
  if (!res) return
  rows.value = res.data.data.items
  total.value = res.data.data.total
}

function openCreate() {
  editingId.value = null
  Object.assign(form, { doctorName: '', doctorTitle: '', deptId: undefined, isActive: 0 })
  dialogVisible.value = true
}

function openEdit(row: Doctor) {
  editingId.value = row.id
  Object.assign(form, {
    doctorName: row.doctorName ?? '',
    doctorTitle: row.doctorTitle ?? '',
    deptId: row.deptId ?? undefined,
    isActive: row.isActive ?? 0
  })
  dialogVisible.value = true
}

async function save() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  const res = editingId.value
    ? await doctorApi.update(editingId.value, form).catch(() => null)
    : await doctorApi.create(form).catch(() => null)
  saving.value = false
  if (!res) return
  ElMessage.success(res.data.message)
  dialogVisible.value = false
  load()
}

async function remove(row: Doctor) {
  await ElMessageBox.confirm(`确定删除医生「${row.doctorName}」吗？`, '删除确认', { type: 'warning' })
  const res = await doctorApi.remove(row.id).catch(() => null)
  if (!res) return
  ElMessage.success('删除成功')
  load()
}

onMounted(async () => {
  load()
  const res = await deptApi.all().catch(() => null)
  if (res) depts.value = res.data.data
})
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm p-5">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <el-input v-model="query.keyword" placeholder="搜索姓名 / 职称" clearable class="w-56" @keyup.enter="query.page = 1; load()" @clear="query.page = 1; load()" />
        <el-select v-model="query.deptId" placeholder="按科室筛选" clearable class="w-44" @change="query.page = 1; load()">
          <el-option v-for="d in depts" :key="d.id" :label="d.deptName" :value="d.id" />
        </el-select>
        <el-button type="primary" plain @click="query.page = 1; load()"><el-icon class="mr-1"><Search /></el-icon>查询</el-button>
      </div>
      <el-button type="primary" @click="openCreate"><el-icon class="mr-1"><Plus /></el-icon>新增医生</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" stripe class="w-full">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="doctorName" label="姓名" min-width="110" />
      <el-table-column prop="doctorTitle" label="职称" min-width="120">
        <template #default="{ row }">{{ row.doctorTitle || '-' }}</template>
      </el-table-column>
      <el-table-column prop="deptName" label="所属科室" min-width="120">
        <template #default="{ row }">{{ row.deptName || '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.isActive === 0 ? 'success' : 'info'">{{ row.isActive === 0 ? '在职' : '离职' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="flex justify-end mt-4">
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.size"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @change="load"
      />
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑医生' : '新增医生'" width="480px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="姓名" prop="doctorName">
          <el-input v-model="form.doctorName" maxlength="50" placeholder="请输入医生姓名" />
        </el-form-item>
        <el-form-item label="职称">
          <el-select v-model="form.doctorTitle" placeholder="请选择职称" clearable class="w-full">
            <el-option v-for="t in ['主任医师', '副主任医师', '主治医师', '住院医师']" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属科室" prop="deptId">
          <el-select v-model="form.deptId" placeholder="请选择科室" class="w-full">
            <el-option v-for="d in depts" :key="d.id" :label="d.deptName" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否在职">
          <el-switch v-model="form.isActive" :active-value="0" :inactive-value="1" active-text="在职" inactive-text="离职" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
