import { motion } from "framer-motion";
import { COMPANY, CGST_RATE, SGST_RATE } from "~/data/constants";
import { formatDate, formatCurrency, numberToWords } from "~/lib/helpers";
import type { InvoiceData } from "~/types";

interface Props {
  data: InvoiceData;
  onClose: () => void;
  onGenerate: () => void;
}

export default function InvoicePreview({ data, onClose, onGenerate }: Props) {
  const subtotal = data.items.reduce(
    (sum, item) => sum + item.qty * item.rate,
    0
  );
  const cgst = subtotal * CGST_RATE;
  const sgst = subtotal * SGST_RATE;
  const total = subtotal + cgst + sgst;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.93, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 30 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-[210mm] bg-white shadow-2xl rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Invoice Content */}
        <div className="p-6 md:p-8">
          <div className="border-2 border-[#1e3a5f]">
            {/* Header */}
            <div className="bg-[#1e3a5f] text-white text-center py-3">
              <h1 className="text-xl font-bold tracking-wide">TAX INVOICE</h1>
              <p className="text-[10px] italic opacity-80 mt-0.5">
                ({COMPANY.tagline})
              </p>
            </div>

            {/* Company Details */}
            <div className="bg-[#f5f7fa] text-center py-3 px-4 border-b border-[#1e3a5f]">
              <h2 className="text-lg font-bold text-[#1e3a5f]">
                {COMPANY.name}
              </h2>
              <p className="text-[11px] text-gray-600 mt-0.5">
                {COMPANY.address}
              </p>
              <p className="text-[11px] text-gray-600">
                Mobile: {COMPANY.mobile} &nbsp;|&nbsp; GSTIN: {COMPANY.gstin}
              </p>
            </div>

            {/* Buyer + Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-[#1e3a5f]">
              {/* Left - Buyer */}
              <div className="p-3 md:border-r border-b md:border-b-0 border-[#1e3a5f]/30">
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex gap-1">
                    <span className="font-bold text-[#1e3a5f] w-24 shrink-0">
                      Buyer Name:
                    </span>
                    <span className="text-gray-700">
                      {data.customer.name}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <span className="font-bold text-[#1e3a5f] w-24 shrink-0">
                      Address:
                    </span>
                    <span className="text-gray-700">
                      {data.customer.address}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <span className="font-bold text-[#1e3a5f] w-24 shrink-0">
                      Party's GST No:
                    </span>
                    <span className="text-gray-700">
                      {data.customer.gstin}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right - Invoice Info */}
              <div className="p-3">
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex gap-1">
                    <span className="font-bold text-[#1e3a5f] w-24 shrink-0">
                      Bill No:
                    </span>
                    <span className="text-gray-700">{data.billNo}</span>
                  </div>
                  <div className="flex gap-1">
                    <span className="font-bold text-[#1e3a5f] w-24 shrink-0">
                      Date:
                    </span>
                    <span className="text-gray-700">
                      {formatDate(data.date)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <span className="font-bold text-[#1e3a5f] w-24 shrink-0">
                      Dispatched:
                    </span>
                    <span className="text-gray-700">
                      {data.dispatchedThrough || "-"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <span className="font-bold text-[#1e3a5f] w-24 shrink-0">
                      Payment:
                    </span>
                    <span className="text-gray-700">
                      {data.paymentTerms || "-"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <span className="font-bold text-[#1e3a5f] w-24 shrink-0">
                      E-Way Bill:
                    </span>
                    <span className="text-gray-700">
                      {data.ewayBillNo || "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="border-b border-[#1e3a5f] overflow-x-auto">
              <table className="w-full text-[11px] min-w-[420px]">
                <thead>
                  <tr className="bg-[#1e3a5f] text-white">
                    <th className="py-2 px-1.5 text-center font-semibold w-8">
                      Sr.
                    </th>
                    <th className="py-2 px-1.5 text-left font-semibold">
                      Particulars
                    </th>
                    <th className="py-2 px-1.5 text-center font-semibold w-12">
                      HSN
                    </th>
                    <th className="py-2 px-1.5 text-center font-semibold w-20 whitespace-nowrap">
                      Qty
                    </th>
                    <th className="py-2 px-1.5 text-right font-semibold w-24 whitespace-nowrap">
                      Rate
                    </th>
                    <th className="py-2 px-1.5 text-right font-semibold w-28 whitespace-nowrap">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, i) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-200 last:border-0"
                    >
                      <td className="py-1.5 px-1.5 text-center text-gray-500">
                        {i + 1}
                      </td>
                      <td className="py-1.5 px-1.5 text-gray-700 break-words">
                        {item.name}
                      </td>
                      <td className="py-1.5 px-1.5 text-center text-gray-500">
                        {item.hsn}
                      </td>
                      <td className="py-1.5 px-1.5 text-center whitespace-nowrap">
                        {item.qty.toFixed(2)} Kg
                      </td>
                      <td className="py-1.5 px-1.5 text-right whitespace-nowrap">
                        {formatCurrency(item.rate)}
                      </td>
                      <td className="py-1.5 px-1.5 text-right font-medium whitespace-nowrap">
                        {formatCurrency(item.qty * item.rate)}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>

            {/* Subtotal + Tax Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-b border-[#1e3a5f]">
              <div className="p-3 md:border-r border-b md:border-b-0 border-[#1e3a5f]/30">
                <p className="text-[10px] font-bold text-[#1e3a5f] mb-1">
                  Amount (in words):
                </p>
                <p className="text-[10px] italic text-gray-600">
                  {numberToWords(total)}
                </p>
              </div>
              <div className="p-3 space-y-1 text-[11px]">
                <div className="flex justify-between -mx-3 px-3 py-1">
                  <span className="font-bold text-[#1e3a5f]">Subtotal</span>
                  <span className="font-bold text-[#1e3a5f]">Rs. {formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    CGST @ {(CGST_RATE * 100).toFixed(0)}%
                  </span>
                  <span>Rs. {formatCurrency(cgst)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    SGST @ {(SGST_RATE * 100).toFixed(0)}%
                  </span>
                  <span>Rs. {formatCurrency(sgst)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-200 font-bold text-[#1e3a5f] text-xs">
                  <span>Total Amount</span>
                  <span>Rs. {formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-[#f5f7fa] p-3 border-b border-[#1e3a5f] text-[10px]">
              <p className="font-bold text-[#1e3a5f] mb-1.5">Bank Details</p>
              <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-gray-600">
                <p><span className="font-semibold text-[#1e3a5f]">A/C Name:</span> {COMPANY.bank.accountName}</p>
                <p><span className="font-semibold text-[#1e3a5f]">A/C No:</span> {COMPANY.bank.accountNumber}</p>
                <p><span className="font-semibold text-[#1e3a5f]">IFSC Code:</span> {COMPANY.bank.ifsc}</p>
                <p><span className="font-semibold text-[#1e3a5f]">Bank:</span> {COMPANY.bank.bankName}</p>
                <p><span className="font-semibold text-[#1e3a5f]">Branch:</span> {COMPANY.bank.branch}</p>
              </div>
            </div>

            {/* Terms */}
            <div className="p-3 border-b border-[#1e3a5f] text-[9px]">
              <p className="font-bold text-[#1e3a5f] mb-1 text-[10px]">
                Terms & Conditions:
              </p>
              <div className="space-y-0.5 text-gray-500">
                {COMPANY.terms.map((term, i) => (
                  <p key={i}>
                    {i + 1}. {term}
                  </p>
                ))}
              </div>
            </div>

            {/* Signature */}
            <div className="p-4 text-right">
              <p className="font-bold text-[#1e3a5f] text-sm">
                For {COMPANY.name}
              </p>
              <div className="mt-20">
                <p className="text-[10px] text-gray-500">
                  Authorized Signatory
                </p>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="py-2 text-center">
              <p className="text-[9px] italic text-gray-400">
                This is a computer generated invoice, no signature required.
              </p>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="sticky bottom-0 p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Close
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onGenerate}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                clipRule="evenodd"
              />
            </svg>
            Generate PDF
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
