import http, { ApiResult, PageResult } from './http'
import type {
  Dashboard, Department, DepartmentType, Doctor, Drug, DrugStock, LoginUser,
  Patient, PayRecord, Prescription, PrescriptionDetail, Registration, Visit
} from './types'

export interface PageParams {
  page: number
  size: number
  keyword?: string
}

// ---------- 认证 ----------
export const authApi = {
  login: (username: string, password: string) =>
    http.post<ApiResult<LoginUser>>('/auth/login', { username, password })
}

// ---------- 科室 ----------
export const deptApi = {
  page: (params: PageParams) => http.get<ApiResult<PageResult<Department>>>('/departments', { params }),
  all: () => http.get<ApiResult<Department[]>>('/departments/all'),
  types: () => http.get<ApiResult<DepartmentType[]>>('/departments/types'),
  create: (data: Partial<Department>) => http.post<ApiResult<Department>>('/departments', data),
  update: (id: number, data: Partial<Department>) => http.put<ApiResult<Department>>(`/departments/${id}`, data),
  remove: (id: number) => http.delete<ApiResult<null>>(`/departments/${id}`)
}

// ---------- 医生 ----------
export const doctorApi = {
  page: (params: PageParams & { deptId?: number }) =>
    http.get<ApiResult<PageResult<Doctor>>>('/doctors', { params }),
  list: (deptId?: number) => http.get<ApiResult<Doctor[]>>('/doctors/list', { params: { deptId } }),
  create: (data: Partial<Doctor>) => http.post<ApiResult<Doctor>>('/doctors', data),
  update: (id: number, data: Partial<Doctor>) => http.put<ApiResult<Doctor>>(`/doctors/${id}`, data),
  remove: (id: number) => http.delete<ApiResult<null>>(`/doctors/${id}`)
}

// ---------- 患者 ----------
export const patientApi = {
  page: (params: PageParams) => http.get<ApiResult<PageResult<Patient>>>('/patients', { params }),
  detail: (id: number) => http.get<ApiResult<Patient>>(`/patients/${id}`),
  create: (data: Partial<Patient>) => http.post<ApiResult<Patient>>('/patients', data),
  update: (id: number, data: Partial<Patient>) => http.put<ApiResult<Patient>>(`/patients/${id}`, data),
  remove: (id: number) => http.delete<ApiResult<null>>(`/patients/${id}`)
}

// ---------- 挂号 ----------
export const regApi = {
  page: (params: PageParams & { status?: number; date?: string }) =>
    http.get<ApiResult<PageResult<Registration>>>('/registrations', { params }),
  queue: (doctorId?: number) => http.get<ApiResult<Registration[]>>('/registrations/queue', { params: { doctorId } }),
  create: (data: { patientId: number; deptId: number; doctorId: number; regType: number }) =>
    http.post<ApiResult<Registration>>('/registrations', data),
  cancel: (id: number) => http.post<ApiResult<null>>(`/registrations/${id}/cancel`)
}

// ---------- 就诊 ----------
export const visitApi = {
  page: (params: PageParams) => http.get<ApiResult<PageResult<Visit>>>('/visits', { params }),
  detail: (id: number) => http.get<ApiResult<Visit>>(`/visits/${id}`),
  start: (regId: number) => http.post<ApiResult<Visit>>('/visits', { regId }),
  saveRecord: (id: number, data: { visitComplaint?: string; visitDiagnosis?: string }) =>
    http.put<ApiResult<Visit>>(`/visits/${id}`, data)
}

// ---------- 处方 ----------
export const presApi = {
  page: (params: PageParams & { status?: number }) =>
    http.get<ApiResult<PageResult<Prescription>>>('/prescriptions', { params }),
  detail: (id: number) => http.get<ApiResult<PrescriptionDetail>>(`/prescriptions/${id}`),
  create: (data: { visitId: number; items: { drugId: number; quantity: number }[] }) =>
    http.post<ApiResult<PrescriptionDetail>>('/prescriptions', data)
}

// ---------- 药品与库存 ----------
export const drugApi = {
  page: (params: PageParams) => http.get<ApiResult<PageResult<Drug>>>('/drugs', { params }),
  all: () => http.get<ApiResult<Drug[]>>('/drugs/all'),
  create: (data: Partial<Drug>) => http.post<ApiResult<Drug>>('/drugs', data),
  update: (id: number, data: Partial<Drug>) => http.put<ApiResult<Drug>>(`/drugs/${id}`, data),
  remove: (id: number) => http.delete<ApiResult<null>>(`/drugs/${id}`),
  stocks: (drugId: number) => http.get<ApiResult<DrugStock[]>>(`/drugs/${drugId}/stocks`),
  addStock: (drugId: number, data: { quantity: number; batchNo?: string; expireDate?: string }) =>
    http.post<ApiResult<DrugStock>>(`/drugs/${drugId}/stocks`, data),
  updateStock: (stockId: number, data: { quantity: number; batchNo?: string; expireDate?: string }) =>
    http.put<ApiResult<DrugStock>>(`/drugs/stocks/${stockId}`, data)
}

// ---------- 收费 ----------
export const billingApi = {
  records: (params: PageParams) => http.get<ApiResult<PageResult<PayRecord>>>('/billing/records', { params }),
  charge: (presId: number, payType: number) => http.post<ApiResult<PayRecord>>('/billing/charge', { presId, payType }),
  refund: (presId: number, reason?: string) => http.post<ApiResult<null>>('/billing/refund', { presId, reason }),
  dispense: (presId: number, operator?: string) => http.post<ApiResult<null>>('/billing/dispense', { presId, operator })
}

// ---------- 统计 ----------
export const statsApi = {
  dashboard: () => http.get<ApiResult<Dashboard>>('/stats/dashboard')
}
