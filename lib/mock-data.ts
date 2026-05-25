// Mock data for the economic analysis platform

export interface Project {
  id: string
  name: string
  description: string
  initialInvestment: number
  periods: number
  discountRate: number
  status: "draft" | "analyzing" | "completed"
  createdAt: string
  updatedAt: string
  cashFlows: CashFlow[]
  results?: ProjectResults
}

export interface CashFlow {
  period: number
  inflow: number
  outflow: number
  netFlow: number
}

export interface ProjectResults {
  npv: number
  irr: number
  tmar: number
  benefitCostRatio: number
  paybackPeriod: number
  profitabilityIndex: number
  isViable: boolean
}

export interface VPNCalculationStep {
  period: number
  cashFlow: number
  discountFactor: number
  discountedValue: number
  accumulatedNPV: number
}

export interface TIRIteration {
  iteration: number
  rate: number
  npv: number
  derivative: number
  adjustment: number
  converged: boolean
}

// Sample projects
export const mockProjects: Project[] = [
  {
    id: "proj-001",
    name: "Solar Panel Installation",
    description: "Installation of solar panels for manufacturing facility to reduce energy costs",
    initialInvestment: 500000,
    periods: 10,
    discountRate: 0.12,
    status: "completed",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-20",
    cashFlows: [
      { period: 0, inflow: 0, outflow: 500000, netFlow: -500000 },
      { period: 1, inflow: 85000, outflow: 10000, netFlow: 75000 },
      { period: 2, inflow: 90000, outflow: 10000, netFlow: 80000 },
      { period: 3, inflow: 95000, outflow: 12000, netFlow: 83000 },
      { period: 4, inflow: 100000, outflow: 12000, netFlow: 88000 },
      { period: 5, inflow: 105000, outflow: 15000, netFlow: 90000 },
      { period: 6, inflow: 110000, outflow: 15000, netFlow: 95000 },
      { period: 7, inflow: 115000, outflow: 18000, netFlow: 97000 },
      { period: 8, inflow: 120000, outflow: 18000, netFlow: 102000 },
      { period: 9, inflow: 125000, outflow: 20000, netFlow: 105000 },
      { period: 10, inflow: 130000, outflow: 20000, netFlow: 110000 },
    ],
    results: {
      npv: 245830,
      irr: 0.187,
      tmar: 0.12,
      benefitCostRatio: 1.54,
      paybackPeriod: 5.2,
      profitabilityIndex: 1.49,
      isViable: true,
    },
  },
  {
    id: "proj-002",
    name: "Warehouse Automation",
    description: "Automated storage and retrieval system for improved logistics",
    initialInvestment: 1200000,
    periods: 8,
    discountRate: 0.15,
    status: "completed",
    createdAt: "2024-02-01",
    updatedAt: "2024-02-10",
    cashFlows: [
      { period: 0, inflow: 0, outflow: 1200000, netFlow: -1200000 },
      { period: 1, inflow: 280000, outflow: 50000, netFlow: 230000 },
      { period: 2, inflow: 320000, outflow: 55000, netFlow: 265000 },
      { period: 3, inflow: 350000, outflow: 60000, netFlow: 290000 },
      { period: 4, inflow: 380000, outflow: 65000, netFlow: 315000 },
      { period: 5, inflow: 400000, outflow: 70000, netFlow: 330000 },
      { period: 6, inflow: 420000, outflow: 75000, netFlow: 345000 },
      { period: 7, inflow: 440000, outflow: 80000, netFlow: 360000 },
      { period: 8, inflow: 460000, outflow: 85000, netFlow: 375000 },
    ],
    results: {
      npv: 389500,
      irr: 0.215,
      tmar: 0.15,
      benefitCostRatio: 1.32,
      paybackPeriod: 4.1,
      profitabilityIndex: 1.32,
      isViable: true,
    },
  },
  {
    id: "proj-003",
    name: "Office Renovation",
    description: "Modernization of office space for improved productivity",
    initialInvestment: 150000,
    periods: 5,
    discountRate: 0.10,
    status: "analyzing",
    createdAt: "2024-03-05",
    updatedAt: "2024-03-05",
    cashFlows: [
      { period: 0, inflow: 0, outflow: 150000, netFlow: -150000 },
      { period: 1, inflow: 35000, outflow: 5000, netFlow: 30000 },
      { period: 2, inflow: 40000, outflow: 5000, netFlow: 35000 },
      { period: 3, inflow: 45000, outflow: 6000, netFlow: 39000 },
      { period: 4, inflow: 48000, outflow: 6000, netFlow: 42000 },
      { period: 5, inflow: 50000, outflow: 7000, netFlow: 43000 },
    ],
    results: {
      npv: -8200,
      irr: 0.078,
      tmar: 0.10,
      benefitCostRatio: 0.95,
      paybackPeriod: 6.2,
      profitabilityIndex: 0.95,
      isViable: false,
    },
  },
  {
    id: "proj-004",
    name: "New Product Line",
    description: "Launch of eco-friendly product line targeting sustainable market",
    initialInvestment: 800000,
    periods: 7,
    discountRate: 0.14,
    status: "draft",
    createdAt: "2024-03-10",
    updatedAt: "2024-03-10",
    cashFlows: [
      { period: 0, inflow: 0, outflow: 800000, netFlow: -800000 },
      { period: 1, inflow: 150000, outflow: 30000, netFlow: 120000 },
      { period: 2, inflow: 200000, outflow: 35000, netFlow: 165000 },
      { period: 3, inflow: 250000, outflow: 40000, netFlow: 210000 },
      { period: 4, inflow: 300000, outflow: 45000, netFlow: 255000 },
      { period: 5, inflow: 320000, outflow: 50000, netFlow: 270000 },
      { period: 6, inflow: 340000, outflow: 55000, netFlow: 285000 },
      { period: 7, inflow: 360000, outflow: 60000, netFlow: 300000 },
    ],
    results: undefined,
  },
]

// VPN Calculation steps for the Solar Panel project
export const mockVPNSteps: VPNCalculationStep[] = [
  { period: 0, cashFlow: -500000, discountFactor: 1.0000, discountedValue: -500000, accumulatedNPV: -500000 },
  { period: 1, cashFlow: 75000, discountFactor: 0.8929, discountedValue: 66964, accumulatedNPV: -433036 },
  { period: 2, cashFlow: 80000, discountFactor: 0.7972, discountedValue: 63776, accumulatedNPV: -369260 },
  { period: 3, cashFlow: 83000, discountFactor: 0.7118, discountedValue: 59079, accumulatedNPV: -310181 },
  { period: 4, cashFlow: 88000, discountFactor: 0.6355, discountedValue: 55924, accumulatedNPV: -254257 },
  { period: 5, cashFlow: 90000, discountFactor: 0.5674, discountedValue: 51066, accumulatedNPV: -203191 },
  { period: 6, cashFlow: 95000, discountFactor: 0.5066, discountedValue: 48127, accumulatedNPV: -155064 },
  { period: 7, cashFlow: 97000, discountFactor: 0.4523, discountedValue: 43873, accumulatedNPV: -111191 },
  { period: 8, cashFlow: 102000, discountFactor: 0.4039, discountedValue: 41198, accumulatedNPV: -69993 },
  { period: 9, cashFlow: 105000, discountFactor: 0.3606, discountedValue: 37863, accumulatedNPV: -32130 },
  { period: 10, cashFlow: 110000, discountFactor: 0.3220, discountedValue: 35420, accumulatedNPV: 3290 },
]

// TIR Iterations (Newton-Raphson method)
export const mockTIRIterations: TIRIteration[] = [
  { iteration: 1, rate: 0.10, npv: 89542, derivative: -2145678, adjustment: 0.0417, converged: false },
  { iteration: 2, rate: 0.1417, npv: 45230, derivative: -1876543, adjustment: 0.0241, converged: false },
  { iteration: 3, rate: 0.1658, npv: 18456, derivative: -1654321, adjustment: 0.0112, converged: false },
  { iteration: 4, rate: 0.1770, npv: 5234, derivative: -1543210, adjustment: 0.0034, converged: false },
  { iteration: 5, rate: 0.1804, npv: 1245, derivative: -1498765, adjustment: 0.0008, converged: false },
  { iteration: 6, rate: 0.1812, npv: 287, derivative: -1487654, adjustment: 0.0002, converged: false },
  { iteration: 7, rate: 0.1814, npv: 58, derivative: -1485432, adjustment: 0.00004, converged: false },
  { iteration: 8, rate: 0.1870, npv: 2, derivative: -1484321, adjustment: 0.000001, converged: true },
]

// Chart data for VPN vs Discount Rate
export const npvVsRateData = [
  { rate: 0, npv: 425000 },
  { rate: 2, npv: 358000 },
  { rate: 4, npv: 298000 },
  { rate: 6, npv: 245000 },
  { rate: 8, npv: 198000 },
  { rate: 10, npv: 156000 },
  { rate: 12, npv: 118000 },
  { rate: 14, npv: 84000 },
  { rate: 16, npv: 54000 },
  { rate: 18, npv: 26000 },
  { rate: 18.7, npv: 0 },
  { rate: 20, npv: -2000 },
  { rate: 22, npv: -28000 },
  { rate: 24, npv: -52000 },
]

// Cash flow timeline data
export const cashFlowTimelineData = [
  { period: "Year 0", inflow: 0, outflow: -500000 },
  { period: "Year 1", inflow: 85000, outflow: -10000 },
  { period: "Year 2", inflow: 90000, outflow: -10000 },
  { period: "Year 3", inflow: 95000, outflow: -12000 },
  { period: "Year 4", inflow: 100000, outflow: -12000 },
  { period: "Year 5", inflow: 105000, outflow: -15000 },
  { period: "Year 6", inflow: 110000, outflow: -15000 },
  { period: "Year 7", inflow: 115000, outflow: -18000 },
  { period: "Year 8", inflow: 120000, outflow: -18000 },
  { period: "Year 9", inflow: 125000, outflow: -20000 },
  { period: "Year 10", inflow: 130000, outflow: -20000 },
]

// Benefit/Cost analysis data
export const benefitCostData = {
  benefits: [
    { category: "Energy Savings", amount: 450000, pvAmount: 298000 },
    { category: "Tax Incentives", amount: 75000, pvAmount: 52000 },
    { category: "Carbon Credits", amount: 35000, pvAmount: 24000 },
    { category: "Increased Property Value", amount: 50000, pvAmount: 35000 },
  ],
  costs: [
    { category: "Initial Investment", amount: 500000, pvAmount: 500000 },
    { category: "Maintenance", amount: 150000, pvAmount: 98000 },
    { category: "Insurance", amount: 25000, pvAmount: 17000 },
    { category: "Replacement Parts", amount: 30000, pvAmount: 19000 },
  ],
}

// Recent calculations for dashboard
export const recentCalculations = [
  { id: 1, project: "Solar Panel Installation", indicator: "NPV", value: "$245,830", date: "2024-03-15", status: "positive" },
  { id: 2, project: "Solar Panel Installation", indicator: "IRR", value: "18.7%", date: "2024-03-15", status: "positive" },
  { id: 3, project: "Warehouse Automation", indicator: "NPV", value: "$389,500", date: "2024-03-14", status: "positive" },
  { id: 4, project: "Office Renovation", indicator: "NPV", value: "-$8,200", date: "2024-03-13", status: "negative" },
  { id: 5, project: "Office Renovation", indicator: "IRR", value: "7.8%", date: "2024-03-13", status: "negative" },
]

// Financial evolution data (monthly)
export const financialEvolutionData = [
  { month: "Jan", npv: 180000, projectedNpv: 175000 },
  { month: "Feb", npv: 195000, projectedNpv: 190000 },
  { month: "Mar", npv: 210000, projectedNpv: 205000 },
  { month: "Apr", npv: 225000, projectedNpv: 220000 },
  { month: "May", npv: 235000, projectedNpv: 235000 },
  { month: "Jun", npv: 245830, projectedNpv: 250000 },
]
