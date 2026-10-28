<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { drugApi } from '../api'
import type { Drug, DrugStock } from '../api/types'

const LOW_STOCK = 50

const loading = ref(false)
const rows = ref<Drug[]>([])
const total = ref(0)
const query = reactive({ page: 1, size: 10, keyword: '' })

const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()
const editingId = ref<number | null>(null)
const form = reactive({ drugName: '', drugSpec: '', drugUnit: '', drugPrice: 0, isActive: 1 })

const rules: FormRules = {
  drugName: [{ required: true, message: '请输入药品名称', trigger: 'blur' }],
  drugPrice: [{ required: true, message: '请输入单价', trigger: 'blur' }]
}

// ----- 库存抽屉 -----
const drawerVisible = ref(false)
const stockLoading = ref(false)
const currentDrug = ref<Drug | null>(null)
const stocks = ref<DrugStock[]>([])
const stockForm = reactive({ quantity: 100, batchNo: '', expireDate: undefined as string | undefined })
const stockSaving = ref(false)

async function load() {
  loading.value = true
  const res = await drugApi.page(query).catch(() => null)
  loading.value = false
  if (!res) return
  rows.value = res.data.data.items
  total.value = res.data.data.total
}

function openCreate() {
  editingId.value = null
  Object.assign(form, { drugName: '', drugSpec: '', drugUnit: '盒', drugPrice: 0, isActive: 1 })
  dialogVisible.value = true
}

function openEdit(row: Drug) {
  editingId.value = row.id
  Object.assign(form, {
    drugName: row.drugName ?? '',
    drugSpec: row.drugSpec ?? '',
    drugUnit: row.drugUnit ?? '',
    drugPrice: row.drugPrice ?? 0,
    isActive: row.isActive ?? 1
  })
  dialogVisible.value = true
}

async function save() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  const res = editingId.value
    ? await drugApi.update(editingId.value, form).catch(() => null)
    : await drugApi.create(form).catch(() => null)
  saving.value = false
  if (!res) return
  ElMessage.success(res.data.message)
  dialogVisible.value = false
  load()
}

async function remove(row: Drug) {
  await ElMessageBox.confirm(`确定删除药品「${row.drugName}」吗？其库存批次将一并删除。`, '删除确认', { type: 'warning' })
  const res = await drugApi.remove(row.id).catch(() => null)
  if (!res) return
  ElMessage.success('删除成功')
  load()
}

async function openStocks(row: Drug) {
  currentDrug.value = row
  drawerVisible.value = true
  Object.assign(stockForm, { quantity: 100, batchNo: '', expireDate: undefined })
  stockLoading.value = true
  const res = await drugApi.stocks(row.id).catch(() => null)
  stockLoading.value = false
  if (res) stocks.value = res.data.data
}

async function addStock() {
  if (!currentDrug.value) return
  stockSaving.value = true
  const res = await drugApi
    .addStock(currentDrug.value.id, { quantity: stockForm.quantity, batchNo: stockForm.batchNo || undefined, expireDate: stockForm.expireDate || undefined })
    .catch(() => null)
  stockSaving.value = false
  if (!res) return
  ElMessage.success('入库成功')
  openStocks(currentDrug.value)
  load()
}

async function adjustStock(stock: DrugStock) {
  const { value } = await ElMessageBox.prompt('请输入调整后的库存数量', `调整批次 ${stock.batchNo || stock.id}`, {
    inputValue: String(stock.quantity ?? 0),
    inputPattern: /^\d+(\.\d+)?$/,
    inputErrorMessage: '请输入合法数字'
  })
  const res = await drugApi
    .updateStock(stock.id, { quantity: Number(value), batchNo: stock.batchNo ?? undefined, expireDate: stock.expireDate ?? undefined })
    .catch(() => null)
  if (!res) return
  ElMessage.success('库存已调整')
  openStocks(currentDrug.value!)
  load()
}

onMounted(load)
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm p-5">
    <div class="flex items-center justify-between mb-4">
      <el-input v-model="query.keyword" placeholder="搜索药品名称" clearable class="w-64" @keyup.enter="query.page = 1; load()" @clear="query.page = 1; load()">
        <template #append>
          <el-button @click="query.page = 1; load()"><el-icon><Search /></el-icon></el-button>
        </template>
      </el-input>
      <el-button type="primary" @click="openCreate"><el-icon class="mr-1"><Plus /></el-icon>新增药品</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" stripe class="w-full">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="drugName" label="药品名称" min-width="150" />
      <el-table-column prop="drugSpec" label="规格" min-width="120">
        <template #default="{ row }">{{ row.drugSpec || '-' }}</template>
      </el-table-column>
      <el-table-column prop="drugUnit" label="单位" width="70" />
      <el-table-column label="单价" width="100">
        <template #default="{ row }">¥{{ row.drugPrice?.toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="库存" width="110">
        <template #default="{ row }">
          <span :class="row.totalStock < LOW_STOCK ? 'text-red-500 font-semibold' : 'text-gray-700'">
            {{ row.totalStock }}
          </span>
          <el-tag v-if="row.totalStock < LOW_STOCK" type="danger" size="small" class="ml-1">预警</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.isActive === 1 ? 'success' : 'info'">{{ row.isActive === 1 ? '已启用' : '未启用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="190" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openStocks(row)">库存</el-button>
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="flex justify-end mt-4">
      <el-pagination v-model:current-page="query.page" v-model:page-size="query.size" :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @change="load" />
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑药品' : '新增药品'" width="480px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="药品名称" prop="drugName">
          <el-input v-model="form.drugName" maxlength="100" placeholder="如：阿莫西林胶囊" />
        </el-form-item>
        <el-form-item label="规格">
          <el-input v-model="form.drugSpec" maxlength="50" placeholder="如：0.25g×24粒" />
        </el-form-item>
        <el-form-item label="单位">
          <el-select v-model="form.drugUnit" class="w-full" allow-create filterable default-first-option>
            <el-option v-for="u in ['盒', '瓶', '支', '袋', '片']" :key="u" :label="u" :value="u" />
          </el-select>
        </el-form-item>
        <el-form-item label="单价" prop="drugPrice">
          <el-input-number v-model="form.drugPrice" :min="0" :precision="2" :step="1" class="!w-full" />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="form.isActive" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="drawerVisible" :title="`库存管理 - ${currentDrug?.drugName}`" size="520px">
      <div class="flex items-end gap-3 mb-5 pb-5 border-b border-gray-100">
        <el-input-number v-model="stockForm.quantity" :min="1" :precision="0" class="!w-32" />
        <el-input v-model="stockForm.batchNo" placeholder="批号（选填）" class="!w-36" maxlength="30" />
        <el-date-picker v-model="stockForm.expireDate" type="date" value-format="YYYY-MM-DD" placeholder="效期" class="!w-40" />
        <el-button type="primary" :loading="stockSaving" @click="addStock">入库</el-button>
      </div>
      <el-table v-loading="stockLoading" :data="stocks" size="small" stripe>
        <el-table-column prop="batchNo" label="批号" min-width="110">
          <template #default="{ row }">{{ row.batchNo || '-' }}</template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="90" />
        <el-table-column label="效期" width="110">
          <template #default="{ row }">{{ row.expireDate?.slice(0, 10) || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button link type="primary" @click="adjustStock(row)">调整</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-drawer>
  </div>
</template>
