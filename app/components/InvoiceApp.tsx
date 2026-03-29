import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ITEMS, CGST_RATE, SGST_RATE, COMPANY } from "~/data/constants";
import {
  getCustomers,
  updateCustomer,
  getNextBillNumber,
  saveBillNumber,
} from "~/lib/storage";
import { formatCurrency, numberToWords } from "~/lib/helpers";
import type { Customer, InvoiceItem, InvoiceData } from "~/types";
import InvoicePreview from "./InvoicePreview";
import { useToast } from "./Toast";

export default function InvoiceApp() {
  // Customer state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [isAddressEditable, setIsAddressEditable] = useState(false);
  const [isGstinEditable, setIsGstinEditable] = useState(false);

  // Invoice details
  const [billNo, setBillNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dispatchedThrough, setDispatchedThrough] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [ewayBillNo, setEwayBillNo] = useState("");

  // Items
  const [selectedItems, setSelectedItems] = useState<InvoiceItem[]>([]);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [itemSearch, setItemSearch] = useState("");

  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const itemDropdownRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  // Initialize client-side state
  useEffect(() => {
    setCustomers(getCustomers());
    setBillNo(getNextBillNumber());
    setInvoiceDate(new Date().toISOString().split("T")[0]);
  }, []);

  // Close item dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        itemDropdownRef.current &&
        !itemDropdownRef.current.contains(e.target as Node)
      ) {
        setShowItemDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Customer selection
  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setCustomerAddress(customer.address);
      setCustomerGstin(customer.gstin);
      setIsAddressEditable(false);
      setIsGstinEditable(false);
    } else {
      setCustomerAddress("");
      setCustomerGstin("");
    }
  };

  // Save edits to localStorage
  const handleSaveAddress = () => {
    if (selectedCustomerId) {
      const updated = updateCustomer(selectedCustomerId, {
        address: customerAddress,
      });
      setCustomers(updated);
      addToast({ type: "info", message: "Address updated for future invoices" });
    }
    setIsAddressEditable(false);
  };

  const handleSaveGstin = () => {
    if (selectedCustomerId) {
      const updated = updateCustomer(selectedCustomerId, {
        gstin: customerGstin,
      });
      setCustomers(updated);
      addToast({ type: "info", message: "GSTIN updated for future invoices" });
    }
    setIsGstinEditable(false);
  };

  // Item management
  const addItem = (itemId: string) => {
    const item = ITEMS.find((i) => i.id === itemId);
    if (item && !selectedItems.find((i) => i.id === itemId)) {
      setSelectedItems((prev) => [...prev, { ...item, qty: 0, rate: 0 }]);
    }
  };

  const removeItem = (itemId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const updateItemQty = (itemId: string, qty: number) => {
    setSelectedItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, qty: Math.max(0, qty) } : i))
    );
  };

  const updateItemRate = (itemId: string, rate: number) => {
    setSelectedItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, rate: Math.max(0, rate) } : i))
    );
  };

  // Calculations
  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.qty * item.rate,
    0
  );
  const cgstAmount = subtotal * CGST_RATE;
  const sgstAmount = subtotal * SGST_RATE;
  const totalAmount = subtotal + cgstAmount + sgstAmount;

  // Available items (not yet selected), filtered by search
  const availableItems = ITEMS.filter(
    (item) =>
      !selectedItems.find((si) => si.id === item.id) &&
      item.name.toLowerCase().includes(itemSearch.toLowerCase())
  );

  // Build invoice data
  const getInvoiceData = (): InvoiceData | null => {
    const customer = customers.find((c) => c.id === selectedCustomerId);
    if (!customer) return null;
    return {
      customer: {
        ...customer,
        address: customerAddress,
        gstin: customerGstin,
      },
      billNo,
      date: invoiceDate,
      dispatchedThrough,
      paymentTerms,
      ewayBillNo,
      items: selectedItems,
    };
  };

  // Validation
  const validate = (): string | null => {
    if (!selectedCustomerId) return "Please select a customer";
    if (selectedItems.length === 0) return "Please add at least one item";
    if (selectedItems.some((i) => i.rate <= 0))
      return "Please enter rate for all items";
    if (selectedItems.some((i) => i.qty <= 0))
      return "Please enter valid quantity for all items";
    return null;
  };

  // Preview
  const handlePreview = () => {
    const error = validate();
    if (error) {
      addToast({ type: "error", message: error });
      return;
    }
    setShowPreview(true);
  };

  // Generate PDF
  const handleGenerate = async () => {
    const error = validate();
    if (error) {
      addToast({ type: "error", message: error });
      return;
    }

    setIsGenerating(true);
    try {
      const data = getInvoiceData()!;
      const { generateInvoicePDF } = await import("~/lib/pdfGenerator");
      const doc = generateInvoicePDF(data);

      const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
      const now = new Date();
      const monthStr = months[now.getMonth()];
      const yearStr = now.getFullYear();
      const fileName = `${data.customer.name}_${data.billNo}_Invoice_${monthStr}_${yearStr}.pdf`;

      // Save locally (default browser download)
      doc.save(fileName);
      addToast({ type: "success", message: `Invoice saved: ${fileName}` });

      // Commit bill number
      saveBillNumber(billNo);
      setBillNo(getNextBillNumber());

      // Get blob for sharing
      const pdfBlob = doc.output("blob");
      // tryUploadAndShare(pdfBlob, fileName, data.customer.name);
      shareViaWhatsApp(pdfBlob, fileName);

      // Clear the form after successful generation
      resetForm();
    } catch (err: any) {
      console.error("PDF generation error:", err);
      addToast({
        type: "error",
        message: "Failed to generate PDF: " + (err.message || "Unknown error"),
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // const tryUploadAndShare = async (
  //   pdfBlob: Blob,
  //   fileName: string,
  //   customerName: string
  // ) => {
  //   try {
  //     const { uploadToGoogleDrive } = await import("~/lib/googleDrive");
  //     const result = await uploadToGoogleDrive(pdfBlob, fileName, customerName);
  //     if (result.success && result.link) {
  //       addToast({ type: "success", message: "Uploaded to Google Drive!" });
  //     } else {
  //       throw new Error(result.error || "Upload failed");
  //     }
  //   } catch (err: any) {
  //     addToast({
  //       type: "error",
  //       message: `Drive upload failed: ${err.message}`,
  //       onRetry: () => tryUploadAndShare(pdfBlob, fileName, customerName),
  //     });
  //   }
  //   shareViaWhatsApp(pdfBlob, fileName);
  // };

  const shareViaWhatsApp = async (pdfBlob: Blob, fileName: string) => {
    const customer = customers.find((c) => c.id === selectedCustomerId);
    const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });

    // Try Web Share API with file attachment
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          title: `Invoice #${billNo}`,
          text: `Invoice for ${customer?.name || "Customer"}`,
          files: [pdfFile],
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to WhatsApp web link
      }
    }

    // Fallback: open WhatsApp with text (no file attachment possible via URL)
    const msg = `Invoice #${billNo} for ${customer?.name || "Customer"}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Dispatched through validation (alphanumeric + spaces only)
  const handleDispatchedChange = (value: string) => {
    if (/^[a-zA-Z0-9 ]*$/.test(value)) {
      setDispatchedThrough(value);
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedCustomerId("");
    setCustomerAddress("");
    setCustomerGstin("");
    setIsAddressEditable(false);
    setIsGstinEditable(false);
    setDispatchedThrough("");
    setPaymentTerms("");
    setEwayBillNo("");
    setSelectedItems([]);
    setInvoiceDate(new Date().toISOString().split("T")[0]);
  };

  // Check if form is empty (for disabling reset)
  const isFormEmpty =
    !selectedCustomerId &&
    !dispatchedThrough &&
    !paymentTerms &&
    !ewayBillNo &&
    selectedItems.length === 0;

  return (
    <div className="min-h-screen py-6 px-4 md:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-navy-900">
          {COMPANY.name}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Invoice Generator</p>
      </motion.div>

      {/* Main Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
        className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      >
        {/* Section 1: Customer Details */}
        <div className="p-6 md:p-8 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
              1
            </span>
            Customer Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Dropdown */}
            <div className="md:col-span-2">
              <label className="label-text">Customer / Buyer Name</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="input-field"
              >
                <option value="">-- Select Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="label-text">Address</label>
              <div className="flex items-start gap-2">
                <textarea
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  readOnly={!isAddressEditable}
                  placeholder="Select a customer to auto-fill"
                  rows={2}
                  className={`input-field flex-1 resize-none ${!isAddressEditable ? "bg-gray-50 cursor-not-allowed" : "bg-white"}`}
                />
                {selectedCustomerId && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (isAddressEditable) {
                        handleSaveAddress();
                      } else {
                        setIsAddressEditable(true);
                      }
                    }}
                    className={`mt-1 p-2 rounded-lg transition-colors ${
                      isAddressEditable
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                    title={isAddressEditable ? "Save" : "Edit"}
                  >
                    {isAddressEditable ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    )}
                  </motion.button>
                )}
              </div>
            </div>

            {/* GSTIN */}
            <div className="md:col-span-2">
              <label className="label-text">Party's GST No.</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value)}
                  readOnly={!isGstinEditable}
                  placeholder="Select a customer to auto-fill"
                  className={`input-field flex-1 ${!isGstinEditable ? "bg-gray-50 cursor-not-allowed" : "bg-white"}`}
                />
                {selectedCustomerId && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (isGstinEditable) {
                        handleSaveGstin();
                      } else {
                        setIsGstinEditable(true);
                      }
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      isGstinEditable
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                    title={isGstinEditable ? "Save" : "Edit"}
                  >
                    {isGstinEditable ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Invoice Details */}
        <div className="p-6 md:p-8 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
              2
            </span>
            Invoice Details
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="label-text">Bill No.</label>
              <input
                type="number"
                value={billNo}
                onChange={(e) => setBillNo(e.target.value)}
                className="input-field font-semibold text-indigo-600"
              />
            </div>
            <div>
              <label className="label-text">Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-text">Dispatched Through</label>
              <input
                type="text"
                value={dispatchedThrough}
                onChange={(e) => handleDispatchedChange(e.target.value)}
                placeholder="Vehicle Number"
                className="input-field"
              />
            </div>
            <div>
              <label className="label-text">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="input-field"
              >
                <option value="">-- Select --</option>
                <option value="Cash">Cash</option>
                <option value="UPI/Bank Transfer">UPI/Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="label-text">E-Way Bill No.</label>
              <input
                type="text"
                value={ewayBillNo}
                onChange={(e) => setEwayBillNo(e.target.value)}
                placeholder="Optional"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Items */}
        <div className="p-6 md:p-8 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
              3
            </span>
            Items
          </h2>

          {/* Item Selector */}
          <div ref={itemDropdownRef} className="relative mb-4">
            <button
              onClick={() => setShowItemDropdown(!showItemDropdown)}
              className="w-full md:w-auto px-4 py-2.5 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 transition-colors font-medium text-sm flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Items ({ITEMS.length - selectedItems.length} available)
            </button>

            <AnimatePresence>
              {showItemDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-30 top-full mt-2 w-full md:w-96 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
                >
                  <div className="p-3 border-b border-gray-100">
                    <input
                      type="text"
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      placeholder="Search items..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {availableItems.length === 0 ? (
                      <div className="p-4 text-center text-gray-400 text-sm">
                        No items available
                      </div>
                    ) : (
                      availableItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => addItem(item.id)}
                          className="w-full px-4 py-2.5 text-left hover:bg-indigo-50 transition-colors flex justify-between items-center text-sm border-b border-gray-50 last:border-0"
                        >
                          <span className="font-medium text-gray-700">
                            {item.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            HSN: {item.hsn}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Items Table */}
          {selectedItems.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="px-3 py-2.5 text-left font-semibold rounded-tl-lg w-10">
                      #
                    </th>
                    <th className="px-3 py-2.5 text-left font-semibold">
                      Item
                    </th>
                    <th className="px-3 py-2.5 text-center font-semibold w-20">
                      HSN
                    </th>
                    <th className="px-3 py-2.5 text-center font-semibold w-28">
                      Qty (Kg)
                    </th>
                    <th className="px-3 py-2.5 text-center font-semibold w-28">
                      Rate/Kg (₹)
                    </th>
                    <th className="px-3 py-2.5 text-right font-semibold w-28">
                      Amount (₹)
                    </th>
                    <th className="px-3 py-2.5 rounded-tr-lg w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {selectedItems.map((item, index) => (
                      <motion.tr
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-b border-gray-100 hover:bg-gray-50/50"
                      >
                        <td className="px-3 py-2.5 text-gray-400 font-medium">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-gray-700">
                          {item.name}
                        </td>
                        <td className="px-3 py-2.5 text-center text-gray-500">
                          {item.hsn}
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="number"
                            value={item.qty || ""}
                            onChange={(e) =>
                              updateItemQty(
                                item.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            min="0.01"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="number"
                            value={item.rate || ""}
                            onChange={(e) =>
                              updateItemRate(
                                item.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-gray-700">
                          ₹{formatCurrency(item.qty * item.rate)}
                        </td>
                        <td className="px-3 py-2.5">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}

          {selectedItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-10 text-gray-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-sm">No items added yet. Click "Add Items" to get started.</p>
            </motion.div>
          )}
        </div>

        {/* Section 4: Summary */}
        {selectedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 md:p-8 border-b border-gray-100 bg-linear-to-r from-gray-50/50 to-indigo-50/30"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                4
              </span>
              Summary
            </h2>
            <div className="flex justify-end">
              <div className="w-full md:w-80 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>CGST @ 9%</span>
                  <span>₹{formatCurrency(cgstAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>SGST @ 9%</span>
                  <span>₹{formatCurrency(sgstAmount)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold text-indigo-700">
                    <span>Total Amount</span>
                    <span>₹{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
                <div className="pt-1">
                  <p className="text-xs text-gray-500 italic">
                    {numberToWords(totalAmount)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Section 5: Actions */}
        <div className="p-6 md:p-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <motion.button
            whileHover={isFormEmpty ? {} : { scale: 1.02 }}
            whileTap={isFormEmpty ? {} : { scale: 0.98 }}
            onClick={resetForm}
            disabled={isFormEmpty}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors underline underline-offset-2 disabled:opacity-30 disabled:cursor-not-allowed disabled:no-underline"
          >
            Reset Form
          </motion.button>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handlePreview}
              className="px-6 py-2.5 bg-white border-2 border-indigo-200 text-indigo-600 rounded-xl font-semibold text-sm hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
            >
              Preview Invoice
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                  </svg>
                  Generate PDF
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center mt-6 text-xs text-gray-400"
      >
        {COMPANY.name} &middot; {COMPANY.mobile} &middot; GSTIN: {COMPANY.gstin}
      </motion.div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && getInvoiceData() && (
          <InvoicePreview
            data={getInvoiceData()!}
            onClose={() => setShowPreview(false)}
            onGenerate={() => {
              setShowPreview(false);
              handleGenerate();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
