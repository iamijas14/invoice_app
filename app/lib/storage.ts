import { DEFAULT_CUSTOMERS } from "~/data/constants";
import type { Customer } from "~/types";

const CUSTOMERS_KEY = "invoice_customers";
const BILL_NUMBER_KEY = "invoice_last_bill_number";

export function getCustomers(): Customer[] {
  if (typeof window === "undefined") return DEFAULT_CUSTOMERS;
  const stored = localStorage.getItem(CUSTOMERS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_CUSTOMERS;
    }
  }
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(DEFAULT_CUSTOMERS));
  return DEFAULT_CUSTOMERS;
}

export function updateCustomer(
  customerId: string,
  updates: Partial<Customer>
): Customer[] {
  const customers = getCustomers();
  const index = customers.findIndex((c) => c.id === customerId);
  if (index !== -1) {
    customers[index] = { ...customers[index], ...updates };
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  }
  return customers;
}

export function getNextBillNumber(): string {
  if (typeof window === "undefined") return "1";
  const last = localStorage.getItem(BILL_NUMBER_KEY);
  return last ? (parseInt(last, 10) + 1).toString() : "1";
}

export function saveBillNumber(num: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BILL_NUMBER_KEY, num);
}
