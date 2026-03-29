import type { Route } from "./+types/home";
import InvoiceApp from "~/components/InvoiceApp";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "A S TRADERS - Invoice Generator" },
    { name: "description", content: "Generate GST Tax Invoices" },
  ];
}

export default function Home() {
  return <InvoiceApp />;
}
