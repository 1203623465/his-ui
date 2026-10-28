<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { patientApi } from '../../api'
import type { Patient } from '../../api/types'

const loading = ref(false)
const rows = ref<Patient[]>([])
const total = ref(0)
const query = reactive({ page: 1, size: 10, keyword: '' })

const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()
const editingId = ref<number | null>(null)
const form = reactive({
  patientName: '',
  patientSex: 0,
  patientBirthday: undefined as string | undefined,
  patientIdno: '',
  patientPhone: '',
  patientAddress: ''
})

const rules: FormRules = {
  patientName: [{ required: true, message: '请输入患者姓名', trigger: 'blur' }],
  patientIdno: [
    { pattern: /^\d{17}[\dXx]$/, message: '身份证号格式不正确', trigger: 'blur' }
  ],
  patientPhone: [
    { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' }
  ]
}

function sexText(v: number | null) {
  return v === 1 ? '男' : v === 2 ? '女' : '未设置'
}

function fmtDate(v: string | null) {
  return v ? v.slice(0, 10) : '-'
}

async function load() {
  loading.value = true
  const res = await patientApi.page(query).catch(() => null)
  loading.value = false
  if (!res) return
  rows.value = res.data.data.items
  total.value = res.data.data.total
}

function openCreate() {
  editingId.value = null
  Object.assign(form, { patientName: '', patientSex: 0, patientBirthday: undefined, patientIdno: '', patientPhone: '', patientAddress: '' })
  dialogVisible.value = true
}

function openEdit(row: Patient) {
  editingId.value = row.id
  Object.assign(form, {
    patientName: row.patientName ?? '',
    patientSex: row.patientSex ?? 0,
    patientBirthday: row.patientBirthday ? row.patientBirthday.slice(0, 10) : undefined,
    patientIdno: row.patientIdno?.trim() ?? '',
    patientPhone: row.patientPhone ?? '',
    patientAddress: row.patientAddress ?? ''
  })
  dialogVisible.value = true
}

async function save() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  const payload = {
    ...form,
    patientIdno: form.patientIdno || null,
    patientPhone: form.patientPhone || null,
    patientAddress: form.patientAddress || null,
    patientBirthday: form.patientBirthday || null
  }
  const res = editingId.value
    ? await patientApi.update(editingId.value, payload).catch(() => null)
    : await patientApi.create(payload).catch(() => null)
  saving.value = false
  if (!res) return
  ElMessage.success(res.data.message)
  dialogVisible.value = false
  load()
}

async function remove(row: Patient) {
  await ElMessageBox.confirm(`确定删除患者「${row.patientName}」的档案吗？`, '删除确认', { type: 'warning' })
  const res = await patientApi.remove(row.id).catch(() => null)
  if (!res) return
  ElMessage.success('删除成功')
  load()
}

onMounted(load)
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm p-5">
    <div class="flex items-center justify-between mb-4">
      <el-input v-model="query.keyword" placeholder="搜索姓名 / 手机号 / 身份证号" clearable class="w-72" @keyup.enter="query.page = 1; load()" @clear="query.page = 1; load()">
        <template #append>
          <el-button @click="query.page = 1; load()"><el-icon><Search /></el-icon></el-button>
        </template>
      </el-input>
      <el-button type="primary" @click="openCreate"><el-icon class="mr-1"><Plus /></el-icon>新建档案</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" stripe class="w-full">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="patientName" label="姓名" min-width="100" />
      <el-table-column label="性别" width="90">
        <template #default="{ row }">
          <el-tag :type="row.patientSex === 1 ? 'primary' : row.patientSex === 2 ? 'danger' : 'info'" effect="plain">
            {{ sexText(row.patientSex) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="出生日期" width="120">
        <template #default="{ row }">{{ fmtDate(row.patientBirthday) }}</template>
      </el-table-column>
      <el-table-column prop="patientIdno" label="身份证号" min-width="180">
        <template #default="{ row }">{{ row.patientIdno?.trim() || '-' }}</template>
      </el-table-column>
      <el-table-column prop="patientPhone" label="手机号" width="130">
        <template #default="{ row }">{{ row.patientPhone || '-' }}</template>
      </el-table-column>
      <el-table-column prop="patientAddress" label="地址" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">{{ row.patientAddress || '-' }}</template>
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

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑患者档案' : '新建患者档案'" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="姓名" prop="patientName">
          <el-input v-model="form.patientName" maxlength="50" placeholder="请输入患者姓名" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="form.patientSex">
            <el-radio :value="1">男</el-radio>
            <el-radio :value="2">女</el-radio>
            <el-radio :value="0">未设置</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="出生日期">
          <el-date-picker v-model="form.patientBirthday" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" class="w-full" />
        </el-form-item>
        <el-form-item label="身份证号" prop="patientIdno">
          <el-input v-model="form.patientIdno" maxlength="18" placeholder="18 位身份证号（选填）" />
        </el-form-item>
        <el-form-item label="手机号" prop="patientPhone">
          <el-input v-model="form.patientPhone" maxlength="11" placeholder="11 位手机号（选填）" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.patientAddress" maxlength="50" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
