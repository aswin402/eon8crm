import { z } from "zod";

export const RoleEnum = z.enum(["SUPER_ADMIN", "ADMIN", "FINANCE", "PROJECT_MANAGER", "SALES", "ENGINEER", "USER", "GUEST"]);
export type Role = z.infer<typeof RoleEnum>;

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters").nullable(),
  role: RoleEnum,
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export type User = z.infer<typeof UserSchema>;

export const LoginFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormValues = z.infer<typeof LoginFormSchema>;

export const RegisterFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type RegisterFormValues = z.infer<typeof RegisterFormSchema>;

// Core CRM & ERP Domain Interfaces
export interface Client {
  id: string;
  clientNumber: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string | null;
  gstin?: string | null;
  stateCode?: string | null;
  billingAddress?: string | null;
  paymentTerms?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuotationItem {
  description: string;
  sacCode: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  shareToken?: string;
  clientId: string | null;
  leadId: string | null;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string | null;
  issueDate: string;
  validUntil: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  subTotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  isInterstate: boolean;
  notes: string | null;
  terms: string | null;
  items: QuotationItem[];
  convertedProjectId: string | null;
  convertedInvoiceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id?: string;
  description: string;
  sacCode?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  amount: number;
  tdsDeducted: number;
  paymentDate: string;
  paymentMethod: string;
  reference?: string | null;
  notes?: string | null;
  recordedBy?: {
    id: string;
    name: string;
  };
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client?: Client;
  projectId?: string | null;
  project?: {
    id: string;
    name: string;
  } | null;
  issueDate: string;
  dueDate: string;
  status: "DRAFT" | "SENT" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
  subTotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  paidAmount: number;
  notes?: string | null;
  terms?: string | null;
  items?: InvoiceItem[];
  payments?: PaymentRecord[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AgingBucketItem {
  amount: number;
  count: number;
}

export interface AgingSummary {
  totalOutstanding: number;
  totalOverdue: number;
  dso: number;
  buckets: {
    current: AgingBucketItem;
    overdue1to30: AgingBucketItem;
    overdue31to60: AgingBucketItem;
    overdue61to90: AgingBucketItem;
    overdue90Plus: AgingBucketItem;
  };
  totalUnpaidInvoices: number;
}

export interface DebtorInvoiceItem {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  daysOverdue: number;
  bucket: "CURRENT" | "1-30" | "31-60" | "61-90" | "90+";
  status: string;
  projectName?: string;
}

export interface DebtorEntry {
  client: Client;
  totalOutstanding: number;
  current: number;
  overdue1to30: number;
  overdue31to60: number;
  overdue61to90: number;
  overdue90Plus: number;
  totalOverdue: number;
  maxDaysOverdue: number;
  oldestDueDate: string;
  invoicesCount: number;
  invoices: DebtorInvoiceItem[];
}

export interface AgingReportResponse {
  summary: AgingSummary;
  debtors: DebtorEntry[];
  invoices: any[];
}

export interface DunningNotice {
  noticeReference: string;
  level: "LEVEL_1" | "LEVEL_2" | "LEVEL_3";
  title: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  invoiceNumber: string;
  clientName: string;
  contactPerson: string;
  email: string;
  daysOverdue: number;
  principalBalance: number;
  interestAmount: number;
  totalPayable: number;
  settlementDeadlineDays: number;
  letterBody: string;
  customRemarks?: string | null;
  generatedAt: string;
  bankDetails: {
    beneficiary: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    upiId: string;
  };
}
