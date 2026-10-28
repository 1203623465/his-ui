<script setup lang="ts">
import { onMounted, ref } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { statsApi } from '../api'
import type { Dashboard } from '../api/types'

use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

const data = ref<Dashboard | null>(null)
const chartOption = ref({})

const cards = [
  { key: 'todayRegistrations', label: '今日挂号', icon: 'Ticket', color: 'from-[#2F6FED] to-[#3B82F6]', suffix: '单' },
  { key: 'pendingCharges', label: '待收费处方', icon: 'Wallet', color: 'from-[#E6A23C] to-[#F2C14E]', suffix: '张' },
  { key: 'todayRevenue', label: '今日收入', icon: 'TrendCharts', color: 'from-[#14B8A6] to-[#2DD4BF]', suffix: '元', money: true },
  { key: 'lowStockDrugs', label: '库存预警药品', icon: 'Warning', color: 'from-[#F56C6C] to-[#F89898]', suffix: '种' }
] as const

function formatMoney(v: number) {
  return v.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

onMounted(async () => {
  const res = await statsApi.dashboard().catch(() => null)
  if (!res) return
  data.value = res.data.data
  chartOption.value = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: {
      type: 'category',
      data: res.data.data.regTrend.map((x) => x.date),
      axisLine: { lineStyle: { color: '#DCDFE6' } }
    },
    yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: '#F0F2F5' } } },
    series: [
      {
        name: '挂号量',
        type: 'line',
        smooth: true,
        data: res.data.data.regTrend.map((x) => x.count),
        lineStyle: { width: 3, color: '#2F6FED' },
        itemStyle: { color: '#2F6FED' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(47,111,237,0.25)' },
              { offset: 1, color: 'rgba(47,111,237,0.02)' }
            ]
          }
        }
      }
    ]
  }
})
</script>

<template>
  <div v-loading="!data">
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <div
        v-for="card in cards"
        :key="card.key"
        class="rounded-xl bg-gradient-to-br p-5 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-default"
        :class="card.color"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm opacity-90">{{ card.label }}</span>
          <el-icon :size="22" class="opacity-80"><component :is="card.icon" /></el-icon>
        </div>
        <div class="mt-3 text-3xl font-semibold tracking-wide">
          {{ data ? ('money' in card && card.money ? formatMoney(data[card.key]) : data[card.key]) : '-' }}
          <span class="text-sm font-normal opacity-80 ml-1">{{ card.suffix }}</span>
        </div>
      </div>
    </div>

    <div class="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div class="xl:col-span-2 bg-white rounded-xl shadow-sm p-5">
        <h3 class="text-base font-medium text-gray-700 mb-2">近 7 日挂号趋势</h3>
        <v-chart v-if="data" :option="chartOption" autoresize class="h-72" />
      </div>
      <div class="bg-white rounded-xl shadow-sm p-5">
        <h3 class="text-base font-medium text-gray-700 mb-4">快捷入口</h3>
        <div class="flex flex-col gap-3">
          <router-link to="/registration" class="flex items-center p-3 rounded-lg border border-gray-100 hover:border-primary hover:bg-blue-50/50 transition-all group">
            <el-icon :size="20" class="text-primary"><Ticket /></el-icon>
            <div class="ml-3">
              <div class="text-sm font-medium text-gray-700 group-hover:text-primary">新建挂号</div>
              <div class="text-xs text-gray-400">为患者办理门诊挂号</div>
            </div>
          </router-link>
          <router-link to="/visits" class="flex items-center p-3 rounded-lg border border-gray-100 hover:border-teal hover:bg-teal-50/50 transition-all group">
            <el-icon :size="20" class="text-teal"><Notebook /></el-icon>
            <div class="ml-3">
              <div class="text-sm font-medium text-gray-700 group-hover:text-teal">门诊工作台</div>
              <div class="text-xs text-gray-400">接诊、病历与处方开具</div>
            </div>
          </router-link>
          <router-link to="/billing" class="flex items-center p-3 rounded-lg border border-gray-100 hover:border-orange-400 hover:bg-orange-50/50 transition-all group">
            <el-icon :size="20" class="text-orange-400"><Wallet /></el-icon>
            <div class="ml-3">
              <div class="text-sm font-medium text-gray-700 group-hover:text-orange-500">处方收费</div>
              <div class="text-xs text-gray-400">划价收费与退费处理</div>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
