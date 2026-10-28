export interface LoginUser {
  id: number
  username: string
  displayName: string
  role: string
}

export interface Department {
  id: number
  deptName: string | null
  deptType: number | null
  deptTypeName: string | null
  deptNote: string | null
  isActive: number | null
}

export interface DepartmentType {
  id: number
  typeName: string | null
}

export interface Doctor {
  id: number
  doctorName: string | null
  doctorTitle: string | null
  deptId: number | null
  deptName: string | null
  isActive: number | null
}

export interface Patient {
  id: number
  patientName: string | null
  patientSex: number | null
  patientBirthday: string | null
  patientIdno: string | null
  patientPhone: string | null
  patientAddress: string | null
  createTime: string | null
}

export interface Registration {
  id: number
  patientId: number | null
  patientName: string | null
  deptId: number | null
  deptName: string | null
  doctorId: number | null
  doctorName: string | null
  regType: number | null
  regTime: string | null
  regStatus: number | null
  regFee: number | null
}

export interface Visit {
  id: number
  patientId: number | null
  patientName: string | null
  regId: number | null
  doctorId: number | null
  doctorName: string | null
  visitTime: string | null
  visitComplaint: string | null
  visitDiagnosis: string | null
}

export interface Prescription {
  id: number
  visitId: number | null
  patientId: number | null
  patientName: string | null
  doctorId: number | null
  doctorName: string | null
  presTime: string | null
  presStatus: number | null
  totalAmount: number
}

export interface PrescriptionItem {
  id: number
  drugId: number | null
  drugName: string | null
  drugSpec: string | null
  drugUnit: string | null
  quantity: number | null
  unitPrice: number | null
  amount: number | null
}

export interface PrescriptionDetail extends Prescription {
  items: PrescriptionItem[]
}

export interface Drug {
  id: number
  drugName: string | null
  drugSpec: string | null
  drugUnit: string | null
  drugPrice: number | null
  isActive: number | null
  totalStock: number
}

export interface DrugStock {
  id: number
  drugId: number | null
  quantity: number | null
  batchNo: string | null
  expireDate: string | null
}

export interface PayRecord {
  id: number
  patientId: number | null
  patientName: string | null
  regId: number | null
  totalAmount: number | null
  payType: number | null
  invoiceNo: string | null
  payTime: string | null
  refunded: boolean
}

export interface DailyCount {
  date: string
  count: number
}

export interface Dashboard {
  todayRegistrations: number
  pendingCharges: number
  todayRevenue: number
  lowStockDrugs: number
  regTrend: DailyCount[]
}
