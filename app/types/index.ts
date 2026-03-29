export interface Customer {
  id: string;
  name: string;
  gstin: string;
  address: string;
}

export interface InvoiceItem {
  id: string;
  name: string;
  hsn: string;
  qty: number;
  rate: number;
}

export interface InvoiceData {
  customer: Customer;
  billNo: string;
  date: string;
  dispatchedThrough: string;
  paymentTerms: string;
  ewayBillNo: string;
  items: InvoiceItem[];
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  onRetry?: () => void;
}
