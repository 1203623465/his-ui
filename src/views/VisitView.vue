<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { drugApi, presApi, regApi, visitApi } from '../api'
import type { Drug, Registration, Visit } from '../api/types'

const activeTab = ref('queue')

// ----- 候诊队列 -----
const queueLoading = ref(false)
const queue = ref<Registration[]>([])

async function loadQueue() {
  queueLoading.value = true
  const res = await regApi.queue().catch(() => null)
  queueLoading.value = false
  if (res) queue.value = res.data.data
}

async function startVisit(row: Registration) {
  const res = await visitApi.start(row.id).catch(() => null)
  if (!res) return
  ElMessage.success(`已开始接诊：${row.patientName}`)
  loadQueue()
  loadVisits()
}

// ----- 就诊记录 -----
const visitLoading = ref(false)
const visits = ref<Visit[]>([])
const total = ref(0)
const query = reactive({ page: 1, size: 10, keyword: '' })

async function loadVisits() {
  visitLoading.value = true
  const res = await visitApi.page(query).catch(() => null)
  visitLoading.value = false
  if (!res) return
  visits.value = res.data.data.items
  total.value = res.data.data.total
}

// ----- 病历 -----
const recordVisible = ref(false)
const recordSaving = ref(false)
const currentVisit = ref<Visit | null>(null)
const record = reactive({ visitComplaint: '', visitDiagnosis: '' })

function openRecord(row: Visit) {
  currentVisit.value = row
  record.visitComplaint = row.visitComplaint ?? ''
  record.visitDiagnosis = row.visitDiagnosis ?? ''
  recordVisible.value = true
}

async function saveRecord() {
  if (!currentVisit.value) return
  recordSaving.value = true
  const res = await visitApi.saveRecord(currentVisit.value.id, record).catch(() => null)
  recordSaving.value = false
  if (!res) return
  ElMessage.success('病历已保存')
  recordVisible.value = false
  loadVisits()
}

// ----- 处方 -----
const presVisible = ref(false)
const presSaving = ref(false)
const presVisit = ref<Visit | null>(null)
const drugs = ref<Drug[]>([])
const presItems = ref<{ drugId: number | undefined; quantity: number }[]>([{ drugId: undefined, quantity: 1 }])

const presTotal = computed(() =>
  presItems.value.reduce((sum, item) => {
    const drug = drugs.value.find((d) => d.id === item.drugId)
    return sum + (drug?.drugPrice ?? 0) * (item.quantity || 0)
  }, 0)
)

async function openPres(row: Visit) {
  presVisit.value = row
  presItems.value = [{ drugId: undefined, quantity: 1 }]
  presVisible.value = true
  if (drugs.value.length === 0) {
    const res = await drugApi.all().catch(() => null)
    if (res) drugs.value = res.data.data
  }
}

async function savePres() {
  const items = presItems.value.filter((i) => i.drugId && i.quantity > 0)
  if (items.length === 0) {
    ElMessage.warning('请至少选择一条药品并填写数量')
    return
  }
  presSaving.value = true
  const res = await presApi
    .create({ visitId: presVisit.value!.id, items: items.map((i) => ({ drugId: i.drugId!, quantity: i.quantity })) })
    .catch(() => null)
  presSaving.value = false
  if (!res) return
  ElMessage.success(`处方开具成功，合计 ¥${res.data.data.totalAmount.toFixed(2)}`)
  presVisible.value = false
}

onMounted(() => {
  loadQueue()
  loadVisits()
})
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm p-5">
    <el-tabs v-model="activeTab">
      <el-tab-pane name="queue">
        <template #label>
          候诊队列
          <el-badge v-if="queue.length" :value="queue.length" type="primary" class="ml-2" />
        </template>
        <el-table v-loading="queueLoading" :data="queue" stripe class="w-full">
          <el-table-column prop="id" label="挂号号" width="90" />
          <el-table-column prop="patientName" label="患者" min-width="110" />
          <el-table-column prop="deptName" label="科室" min-width="110" />
          <el-table-column prop="doctorName" label="医生" min-width="110" />
          <el-table-column label="号别" width="90">
            <template #default="{ row }">
              <el-tag :type="row.regType === 2 ? 'warning' : 'primary'" effect="plain">{{ row.regType === 2 ? '专家' : '普通' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="挂号时间" width="170">
            <template #default="{ row }">{{ row.regTime?.replace('T', ' ').slice(0, 19) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="110" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="startVisit(row)">接诊</el-button>
            </template>
          </el-table-column>
          <template #empty>暂无候诊患者</template>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="就诊记录" name="records">
        <div class="flex items-center mb-4">
          <el-input v-model="query.keyword" placeholder="按患者姓名搜索" clearable class="w-56" @keyup.enter="query.page = 1; loadVisits()" @clear="query.page = 1; loadVisits()">
            <template #append>
              <el-button @click="query.page = 1; loadVisits()"><el-icon><Search /></el-icon></el-button>
            </template>
          </el-input>
        </div>
        <el-table v-loading="visitLoading" :data="visits" stripe class="w-full">
          <el-table-column prop="id" label="就诊号" width="90" />
          <el-table-column prop="patientName" label="患者" min-width="100" />
          <el-table-column prop="doctorName" label="医生" min-width="100" />
          <el-table-column label="就诊时间" width="170">
            <template #default="{ row }">{{ row.visitTime?.replace('T', ' ').slice(0, 19) }}</template>
          </el-table-column>
          <el-table-column prop="visitComplaint" label="主诉" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">{{ row.visitComplaint || '-' }}</template>
          </el-table-column>
          <el-table-column prop="visitDiagnosis" label="诊断" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">{{ row.visitDiagnosis || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openRecord(row)">病历</el-button>
              <el-button link type="success" @click="openPres(row)">开处方</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="flex justify-end mt-4">
          <el-pagination v-model:current-page="query.page" v-model:page-size="query.size" :total="total" layout="total, prev, pager, next" @change="loadVisits" />
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="recordVisible" :title="`病历填写 - ${currentVisit?.patientName}`" width="560px" destroy-on-close>
      <el-form label-width="90px">
        <el-form-item label="主诉">
          <el-input v-model="record.visitComplaint" type="textarea" :rows="3" maxlength="300" show-word-limit placeholder="患者主要症状描述" />
        </el-form-item>
        <el-form-item label="诊断结论">
          <el-input v-model="record.visitDiagnosis" type="textarea" :rows="3" maxlength="300" show-word-limit placeholder="医生诊断结论" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="recordVisible = false">取消</el-button>
        <el-button type="primary" :loading="recordSaving" @click="saveRecord">保存病历</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="presVisible" :title="`开具处方 - ${presVisit?.patientName}`" width="720px" destroy-on-close>
      <div v-for="(item, idx) in presItems" :key="idx" class="flex items-center gap-3 mb-3">
        <el-select v-model="item.drugId" placeholder="选择药品" filterable class="flex-1">
          <el-option
            v-for="d in drugs"
            :key="d.id"
            :label="`${d.drugName} ${d.drugSpec || ''}（¥${d.drugPrice?.toFixed(2)}/${d.drugUnit}，库存${d.totalStock}）`"
            :value="d.id"
          />
        </el-select>
        <el-input-number v-model="item.quantity" :min="0.5" :step="1" :precision="1" class="!w-32" />
        <span class="text-sm text-gray-500 w-24 text-right">
          ¥{{ ((drugs.find((d) => d.id === item.drugId)?.drugPrice ?? 0) * (item.quantity || 0)).toFixed(2) }}
        </span>
        <el-button circle plain type="danger" :disabled="presItems.length === 1" @click="presItems.splice(idx, 1)">
          <el-icon><Minus /></el-icon>
        </el-button>
      </div>
      <el-button plain type="primary" class="w-full !border-dashed" @click="presItems.push({ drugId: undefined, quantity: 1 })">
        <el-icon class="mr-1"><Plus /></el-icon>添加药品
      </el-button>
      <div class="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
        <span class="text-base">合计金额：<span class="text-xl font-semibold text-orange-500">¥{{ presTotal.toFixed(2) }}</span></span>
        <div>
          <el-button @click="presVisible = false">取消</el-button>
          <el-button type="primary" :loading="presSaving" @click="savePres">开具处方</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>
