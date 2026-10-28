<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { deptApi } from '../../api'
import type { Department, DepartmentType } from '../../api/types'

const loading = ref(false)
const rows = ref<Department[]>([])
const total = ref(0)
const query = reactive({ page: 1, size: 10, keyword: '' })
const types = ref<DepartmentType[]>([])

const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()
const editingId = ref<number | null>(null)
const form = reactive({ deptName: '', deptType: undefined as number | undefined, deptNote: '', isActive: 0 })

const rules: FormRules = {
  deptName: [{ required: true, message: '请输入科室名称', trigger: 'blur' }]
}

async function load() {
  loading.value = true
  const res = await deptApi.page(query).catch(() => null)
  loading.value = false
  if (!res) return
  rows.value = res.data.data.items
  total.value = res.data.data.total
}

function openCreate() {
  editingId.value = null
  Object.assign(form, { deptName: '', deptType: undefined, deptNote: '', isActive: 0 })
  dialogVisible.value = true
}

function openEdit(row: Department) {
  editingId.value = row.id
  Object.assign(form, {
    deptName: row.deptName ?? '',
    deptType: row.deptType ?? undefined,
    deptNote: row.deptNote ?? '',
    isActive: row.isActive ?? 0
  })
  dialogVisible.value = true
}

async function save() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  const res = editingId.value
    ? await deptApi.update(editingId.value, form).catch(() => null)
    : await deptApi.create(form).catch(() => null)
  saving.value = false
  if (!res) return
  ElMessage.success(res.data.message)
  dialogVisible.value = false
  load()
}

async function remove(row: Department) {
  await ElMessageBox.confirm(`确定删除科室「${row.deptName}」吗？`, '删除确认', { type: 'warning' })
  const res = await deptApi.remove(row.id).catch(() => null)
  if (!res) return
  ElMessage.success('删除成功')
  load()
}

onMounted(async () => {
  load()
  const res = await deptApi.types().catch(() => null)
  if (res) types.value = res.data.data
})
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm p-5">
    <div class="flex items-center justify-between mb-4">
      <el-input v-model="query.keyword" placeholder="搜索科室名称" clearable class="w-64" @keyup.enter="query.page = 1; load()" @clear="query.page = 1; load()">
        <template #append>
          <el-button @click="query.page = 1; load()"><el-icon><Search /></el-icon></el-button>
        </template>
      </el-input>
      <el-button type="primary" @click="openCreate"><el-icon class="mr-1"><Plus /></el-icon>新增科室</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" stripe class="w-full">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="deptName" label="科室名称" min-width="140" />
      <el-table-column prop="deptTypeName" label="科室类型" width="120">
        <template #default="{ row }">
          <el-tag v-if="row.deptTypeName" type="info" effect="plain">{{ row.deptTypeName }}</el-tag>
          <span v-else class="text-gray-400">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="deptNote" label="备注" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">{{ row.deptNote || '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.isActive === 0 ? 'success' : 'danger'">{{ row.isActive === 0 ? '启用' : '停用' }}</el-tag>
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

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑科室' : '新增科室'" width="480px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="科室名称" prop="deptName">
          <el-input v-model="form.deptName" placeholder="如：心血管内科" maxlength="50" />
        </el-form-item>
        <el-form-item label="科室类型">
          <el-select v-model="form.deptType" placeholder="请选择类型" clearable class="w-full">
            <el-option v-for="t in types" :key="t.id" :label="t.typeName" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.deptNote" type="textarea" :rows="2" maxlength="255" placeholder="选填" />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="form.isActive" :active-value="0" :inactive-value="1" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
