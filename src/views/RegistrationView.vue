<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deptApi, doctorApi, patientApi, regApi } from '../api'
import type { Department, Doctor, Patient, Registration } from '../api/types'

const REG_FEE: Record<number, number> = { 1: 10, 2: 30 }

// ----- 挂号表单 -----
const patients = ref<Patient[]>([])
const patientLoading = ref(false)
const depts = ref<Department[]>([])
const doctors = ref<Doctor[]>([])
const submitting = ref(false)
const form = reactive({
  patientId: undefined as number | undefined,
  deptId: undefined as number | undefined,
  doctorId: undefined as number | undefined,
  regType: 1
})

const regFee = computed(() => REG_FEE[form.regType] ?? 0)

async function searchPatients(keyword: string) {
  patientLoading.value = true
  const res = await patientApi.page({ page: 1, size: 20, keyword }).catch(() => null)
  patientLoading.value = false
  if (res) patients.value = res.data.data.items
}

async function onDeptChange() {
  form.doctorId = undefined
  doctors.value = []
  if (!form.deptId) return
  const res = await doctorApi.list(form.deptId).catch(() => null)
  if (res) doctors.value = res.data.data
}

async function submit() {
  if (!form.patientId || !form.deptId || !form.doctorId) {
    ElMessage.warning('请完整选择患者、科室与医生')
    return
  }
  submitting.value = true
  const res = await regApi
    .create({ patientId: form.patientId, deptId: form.deptId, doctorId: form.doctorId, regType: form.regType })
    .catch(() => null)
  submitting.value = false
  if (!res) return
  ElMessage.success(`挂号成功，挂号费 ¥${res.data.data.regFee}`)
  form.patientId = undefined
  form.doctorId = undefined
  query.page = 1
  loadRecords()
}

// ----- 挂号记录 -----
const loading = ref(false)
const rows = ref<Registration[]>([])
const total = ref(0)
const query = reactive({ page: 1, size: 10, keyword: '', status: undefined as number | undefined, date: undefined as string | undefined })

async function loadRecords() {
  loading.value = true
  const res = await regApi.page({ ...query, date: query.date || undefined }).catch(() => null)
  loading.value = false
  if (!res) return
  rows.value = res.data.data.items
  total.value = res.data.data.total
}

function statusTag(status: number | null) {
  if (status === 1) return { type: 'primary' as const, text: '已挂号' }
  if (status === 2) return { type: 'success' as const, text: '已就诊' }
  return { type: 'info' as const, text: '已退号' }
}

async function cancelReg(row: Registration) {
  await ElMessageBox.confirm(`确定为患者「${row.patientName}」退号吗？`, '退号确认', { type: 'warning' })
  const res = await regApi.cancel(row.id).catch(() => null)
  if (!res) return
  ElMessage.success('退号成功')
  loadRecords()
}

onMounted(async () => {
  searchPatients('')
  loadRecords()
  const res = await deptApi.all().catch(() => null)
  if (res) depts.value = res.data.data
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="bg-white rounded-xl shadow-sm p-5">
      <h3 class="text-base font-medium text-gray-700 mb-4 flex items-center">
        <el-icon class="mr-2 text-primary"><Ticket /></el-icon>新建挂号
      </h3>
      <el-form inline @submit.prevent>
        <el-form-item label="患者">
          <el-select
            v-model="form.patientId"
            filterable
            remote
            :remote-method="searchPatients"
            :loading="patientLoading"
            placeholder="输入姓名 / 手机号检索"
            class="!w-64"
          >
            <el-option v-for="p in patients" :key="p.id" :label="`${p.patientName}（${p.patientPhone || '无电话'}）`" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="科室">
          <el-select v-model="form.deptId" placeholder="选择科室" class="!w-44" @change="onDeptChange">
            <el-option v-for="d in depts" :key="d.id" :label="d.deptName" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="医生">
          <el-select v-model="form.doctorId" placeholder="选择医生" class="!w-52" :disabled="!form.deptId">
            <el-option v-for="d in doctors" :key="d.id" :label="`${d.doctorName}（${d.doctorTitle || '医师'}）`" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="号别">
          <el-radio-group v-model="form.regType">
            <el-radio-button :value="1">普通号 ¥10</el-radio-button>
            <el-radio-button :value="2">专家号 ¥30</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" class="!px-8" @click="submit">
            确认挂号（¥{{ regFee.toFixed(2) }}）
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-5">
      <div class="flex items-center gap-3 mb-4">
        <el-input v-model="query.keyword" placeholder="按患者姓名搜索" clearable class="w-56" @keyup.enter="query.page = 1; loadRecords()" @clear="query.page = 1; loadRecords()" />
        <el-select v-model="query.status" placeholder="挂号状态" clearable class="w-36" @change="query.page = 1; loadRecords()">
          <el-option label="已挂号" :value="1" />
          <el-option label="已就诊" :value="2" />
          <el-option label="已退号" :value="3" />
        </el-select>
        <el-date-picker v-model="query.date" type="date" value-format="YYYY-MM-DD" placeholder="挂号日期" class="!w-40" @change="query.page = 1; loadRecords()" />
        <el-button type="primary" plain @click="query.page = 1; loadRecords()"><el-icon class="mr-1"><Search /></el-icon>查询</el-button>
      </div>

      <el-table v-loading="loading" :data="rows" stripe class="w-full">
        <el-table-column prop="id" label="挂号号" width="90" />
        <el-table-column prop="patientName" label="患者" min-width="100" />
        <el-table-column prop="deptName" label="科室" min-width="100" />
        <el-table-column prop="doctorName" label="医生" min-width="100" />
        <el-table-column label="号别" width="90">
          <template #default="{ row }">
            <el-tag :type="row.regType === 2 ? 'warning' : 'primary'" effect="plain">{{ row.regType === 2 ? '专家' : '普通' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="挂号费" width="100">
          <template #default="{ row }">¥{{ row.regFee?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="挂号时间" width="170">
          <template #default="{ row }">{{ row.regTime?.replace('T', ' ').slice(0, 19) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.regStatus).type">{{ statusTag(row.regStatus).text }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.regStatus === 1" link type="danger" @click="cancelReg(row)">退号</el-button>
            <span v-else class="text-gray-300">-</span>
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
          @change="loadRecords"
        />
      </div>
    </div>
  </div>
</template>
