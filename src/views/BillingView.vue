<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { billingApi, presApi } from '../api'
import type { PayRecord, Prescription, PrescriptionDetail } from '../api/types'

const activeTab = ref('pending')

// ----- 待收费处方 -----
const pendingLoading = ref(false)
const pending = ref<Prescription[]>([])
const pendingTotal = ref(0)
const pendingQuery = reactive({ page: 1, size: 10, keyword: '' })

async function loadPending() {
  pendingLoading.value = true
  const res = await presApi.page({ ...pendingQuery, status: 1 }).catch(() => null)
  pendingLoading.value = false
  if (!res) return
  pending.value = res.data.data.items
  pendingTotal.value = res.data.data.total
}

// ----- 收费弹窗 -----
const chargeVisible = ref(false)
const chargeSaving = ref(false)
const chargePres = ref<Prescription | null>(null)
const payType = ref(1)

function openCharge(row: Prescription) {
  chargePres.value = row
  payType.value = 1
  chargeVisible.value = true
}

async function doCharge() {
  if (!chargePres.value) return
  chargeSaving.value = true
  const res = await billingApi.charge(chargePres.value.id, payType.value).catch(() => null)
  chargeSaving.value = false
  if (!res) return
  ElMessage.success(`收费成功，发票号 ${res.data.data.invoiceNo}`)
  chargeVisible.value = false
  loadPending()
  loadRecords()
  loadPrescriptions()
}

// ----- 收费记录 -----
const recordLoading = ref(false)
const records = ref<PayRecord[]>([])
const recordTotal = ref(0)
const recordQuery = reactive({ page: 1, size: 10, keyword: '' })

async function loadRecords() {
  recordLoading.value = true
  const res = await billingApi.records(recordQuery).catch(() => null)
  recordLoading.value = false
  if (!res) return
  records.value = res.data.data.items
  recordTotal.value = res.data.data.total
}

function payTypeText(t: number | null) {
  return t === 1 ? '现金' : t === 2 ? '医保' : t === 3 ? '扫码' : '-'
}

// ----- 处方查询 -----
const presLoading = ref(false)
const prescriptions = ref<Prescription[]>([])
const presTotalCount = ref(0)
const presQuery = reactive({ page: 1, size: 10, keyword: '', status: undefined as number | undefined })

async function loadPrescriptions() {
  presLoading.value = true
  const res = await presApi.page(presQuery).catch(() => null)
  presLoading.value = false
  if (!res) return
  prescriptions.value = res.data.data.items
  presTotalCount.value = res.data.data.total
}

function presStatusTag(s: number | null) {
  const map: Record<number, { type: 'warning' | 'success' | 'primary' | 'info'; text: string }> = {
    1: { type: 'warning', text: '未收费' },
    2: { type: 'success', text: '已收费' },
    3: { type: 'primary', text: '已发药' },
    4: { type: 'info', text: '已退款' }
  }
  return map[s ?? 0] ?? { type: 'info' as const, text: '-' }
}

async function doRefund(row: Prescription) {
  const { value } = await ElMessageBox.prompt(`确认对处方 #${row.id}（¥${row.totalAmount.toFixed(2)}）退费？库存将自动回补。`, '退费确认', {
    type: 'warning',
    inputPlaceholder: '退费原因（选填）',
    confirmButtonText: '确认退费',
    cancelButtonText: '取消'
  })
  const res = await billingApi.refund(row.id, value || undefined).catch(() => null)
  if (!res) return
  ElMessage.success('退费成功')
  loadPrescriptions()
  loadRecords()
}

async function doDispense(row: Prescription) {
  await ElMessageBox.confirm(`确认对处方 #${row.id} 执行发药吗？`, '发药确认', { type: 'info' })
  const res = await billingApi.dispense(row.id, '窗口药师').catch(() => null)
  if (!res) return
  ElMessage.success('发药完成')
  loadPrescriptions()
}

// ----- 处方明细 -----
const detailVisible = ref(false)
const detail = ref<PrescriptionDetail | null>(null)

async function openDetail(row: Prescription) {
  const res = await presApi.detail(row.id).catch(() => null)
  if (!res) return
  detail.value = res.data.data
  detailVisible.value = true
}

onMounted(() => {
  loadPending()
  loadRecords()
  loadPrescriptions()
})
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm p-5">
    <el-tabs v-model="activeTab">
      <el-tab-pane name="pending">
        <template #label>
          待收费处方
          <el-badge v-if="pendingTotal" :value="pendingTotal" type="warning" class="ml-2" />
        </template>
        <el-table v-loading="pendingLoading" :data="pending" stripe class="w-full">
          <el-table-column prop="id" label="处方号" width="90" />
          <el-table-column prop="patientName" label="患者" min-width="110" />
          <el-table-column prop="doctorName" label="开方医生" min-width="110" />
          <el-table-column label="开方时间" width="170">
            <template #default="{ row }">{{ row.presTime?.replace('T', ' ').slice(0, 19) }}</template>
          </el-table-column>
          <el-table-column label="应收金额" width="120">
            <template #default="{ row }">
              <span class="text-orange-500 font-semibold">¥{{ row.totalAmount.toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="openCharge(row)">收费</el-button>
              <el-button link type="primary" @click="openDetail(row)">明细</el-button>
            </template>
          </el-table-column>
          <template #empty>暂无待收费处方</template>
        </el-table>
        <div class="flex justify-end mt-4">
          <el-pagination v-model:current-page="pendingQuery.page" v-model:page-size="pendingQuery.size" :total="pendingTotal" layout="total, prev, pager, next" @change="loadPending" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="收费记录" name="records">
        <div class="flex items-center mb-4">
          <el-input v-model="recordQuery.keyword" placeholder="按患者姓名搜索" clearable class="w-56" @keyup.enter="recordQuery.page = 1; loadRecords()" @clear="recordQuery.page = 1; loadRecords()">
            <template #append>
              <el-button @click="recordQuery.page = 1; loadRecords()"><el-icon><Search /></el-icon></el-button>
            </template>
          </el-input>
        </div>
        <el-table v-loading="recordLoading" :data="records" stripe class="w-full">
          <el-table-column prop="invoiceNo" label="发票号" min-width="170" />
          <el-table-column prop="patientName" label="患者" min-width="100" />
          <el-table-column label="金额" width="110">
            <template #default="{ row }">¥{{ row.totalAmount?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="支付方式" width="100">
            <template #default="{ row }">
              <el-tag effect="plain">{{ payTypeText(row.payType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="结算时间" width="170">
            <template #default="{ row }">{{ row.payTime?.replace('T', ' ').slice(0, 19) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.refunded ? 'info' : 'success'">{{ row.refunded ? '已退费' : '已收费' }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
        <div class="flex justify-end mt-4">
          <el-pagination v-model:current-page="recordQuery.page" v-model:page-size="recordQuery.size" :total="recordTotal" layout="total, prev, pager, next" @change="loadRecords" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="处方查询" name="prescriptions">
        <div class="flex items-center gap-3 mb-4">
          <el-input v-model="presQuery.keyword" placeholder="按患者姓名搜索" clearable class="w-56" @keyup.enter="presQuery.page = 1; loadPrescriptions()" @clear="presQuery.page = 1; loadPrescriptions()" />
          <el-select v-model="presQuery.status" placeholder="处方状态" clearable class="w-36" @change="presQuery.page = 1; loadPrescriptions()">
            <el-option label="未收费" :value="1" />
            <el-option label="已收费" :value="2" />
            <el-option label="已发药" :value="3" />
            <el-option label="已退款" :value="4" />
          </el-select>
        </div>
        <el-table v-loading="presLoading" :data="prescriptions" stripe class="w-full">
          <el-table-column prop="id" label="处方号" width="90" />
          <el-table-column prop="patientName" label="患者" min-width="100" />
          <el-table-column prop="doctorName" label="医生" min-width="100" />
          <el-table-column label="金额" width="110">
            <template #default="{ row }">¥{{ row.totalAmount.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="开方时间" width="170">
            <template #default="{ row }">{{ row.presTime?.replace('T', ' ').slice(0, 19) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="presStatusTag(row.presStatus).type">{{ presStatusTag(row.presStatus).text }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetail(row)">明细</el-button>
              <el-button v-if="row.presStatus === 2" link type="success" @click="doDispense(row)">发药</el-button>
              <el-button v-if="row.presStatus === 2" link type="danger" @click="doRefund(row)">退费</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="flex justify-end mt-4">
          <el-pagination v-model:current-page="presQuery.page" v-model:page-size="presQuery.size" :total="presTotalCount" layout="total, prev, pager, next" @change="loadPrescriptions" />
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="chargeVisible" :title="`处方收费 - ${chargePres?.patientName}`" width="420px" destroy-on-close>
      <div class="text-center py-4">
        <div class="text-sm text-gray-500">应收金额</div>
        <div class="text-4xl font-semibold text-orange-500 mt-2">¥{{ chargePres?.totalAmount.toFixed(2) }}</div>
      </div>
      <el-radio-group v-model="payType" class="flex justify-center">
        <el-radio-button :value="1">现金</el-radio-button>
        <el-radio-button :value="2">医保</el-radio-button>
        <el-radio-button :value="3">扫码</el-radio-button>
      </el-radio-group>
      <template #footer>
        <el-button @click="chargeVisible = false">取消</el-button>
        <el-button type="primary" :loading="chargeSaving" class="!px-8" @click="doCharge">确认收费</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" :title="`处方明细 #${detail?.id}`" width="640px" destroy-on-close>
      <div v-if="detail" class="mb-3 text-sm text-gray-500">
        患者：{{ detail.patientName }} ｜ 医生：{{ detail.doctorName }} ｜ 状态：
        <el-tag size="small" :type="presStatusTag(detail.presStatus).type">{{ presStatusTag(detail.presStatus).text }}</el-tag>
      </div>
      <el-table v-if="detail" :data="detail.items" stripe size="small">
        <el-table-column prop="drugName" label="药品" min-width="140" />
        <el-table-column prop="drugSpec" label="规格" min-width="110" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column label="单价" width="90">
          <template #default="{ row }">¥{{ row.unitPrice?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="小计" width="100">
          <template #default="{ row }">¥{{ row.amount?.toFixed(2) }}</template>
        </el-table-column>
      </el-table>
      <div class="text-right mt-4 text-base">
        合计：<span class="text-xl font-semibold text-orange-500">¥{{ detail?.totalAmount.toFixed(2) }}</span>
      </div>
    </el-dialog>
  </div>
</template>
