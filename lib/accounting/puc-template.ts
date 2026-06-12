export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";

export interface PucAccountTemplate {
  code: string;
  name: string;
  account_type: AccountType;
  parent_code?: string;
}

/** Simplified PUC Colombia for micro-PYME */
export const DEFAULT_PUC_ACCOUNTS: PucAccountTemplate[] = [
  { code: "1105", name: "Caja", account_type: "asset" },
  { code: "1110", name: "Bancos", account_type: "asset", parent_code: "11" },
  { code: "1305", name: "Clientes", account_type: "asset" },
  { code: "2205", name: "Proveedores nacionales", account_type: "liability" },
  { code: "2365", name: "IVA por pagar", account_type: "liability" },
  { code: "2408", name: "IVA descontable", account_type: "asset" },
  { code: "3105", name: "Capital social", account_type: "equity" },
  { code: "4135", name: "Comercio al por mayor y al por menor", account_type: "income" },
  { code: "4210", name: "Ingresos por servicios", account_type: "income" },
  { code: "5105", name: "Gastos de personal", account_type: "expense" },
  { code: "5110", name: "Arrendamientos", account_type: "expense" },
  { code: "5120", name: "Seguros", account_type: "expense" },
  { code: "5135", name: "Servicios", account_type: "expense" },
  { code: "5195", name: "Gastos diversos", account_type: "expense" },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: "Ventas de productos", account_code: "4135" },
  { name: "Servicios prestados", account_code: "4210" },
  { name: "Otros ingresos", account_code: "4210" },
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Nómina y personal", account_code: "5105" },
  { name: "Arriendo", account_code: "5110" },
  { name: "Seguros", account_code: "5120" },
  { name: "Servicios públicos", account_code: "5135" },
  { name: "Insumos y materiales", account_code: "5195" },
  { name: "Otros gastos", account_code: "5195" },
];

export const ACCOUNT_CODES = {
  CASH: "1105",
  BANK: "1110",
  RECEIVABLES: "1305",
  PAYABLES: "2205",
  VAT_PAYABLE: "2365",
  VAT_RECEIVABLE: "2408",
  CAPITAL: "3105",
} as const;

export const DEFAULT_VAT_RATE = 0.19;
