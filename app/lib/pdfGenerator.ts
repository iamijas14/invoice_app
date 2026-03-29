import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { COMPANY, CGST_RATE, SGST_RATE } from "~/data/constants";
import { numberToWords, formatDate, formatCurrency } from "~/lib/helpers";
import type { InvoiceData } from "~/types";

export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  const contentWidth = pageWidth - 2 * margin;
  const rightEdge = margin + contentWidth;

  const navy: [number, number, number] = [30, 58, 95];
  const dark: [number, number, number] = [51, 51, 51];
  const lightBg: [number, number, number] = [245, 247, 250];
  const white: [number, number, number] = [255, 255, 255];

  let y = margin;

  // ── HEADER BAR ──
  doc.setFillColor(...navy);
  doc.rect(margin, y, contentWidth, 18, "F");
  doc.setTextColor(...white);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", pageWidth / 2, y + 8, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(`(${COMPANY.tagline})`, pageWidth / 2, y + 14, { align: "center" });
  y += 18;

  // ── COMPANY DETAILS ──
  doc.setFillColor(...lightBg);
  doc.rect(margin, y, contentWidth, 18, "F");
  doc.setTextColor(...navy);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY.name, pageWidth / 2, y + 6, { align: "center" });
  doc.setTextColor(...dark);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const compAddrLines = doc.splitTextToSize(COMPANY.address, contentWidth - 20);
  doc.text(compAddrLines, pageWidth / 2, y + 11, { align: "center" });
  doc.text(`Mobile: ${COMPANY.mobile}  |  GSTIN: ${COMPANY.gstin}`, pageWidth / 2, y + 15, { align: "center" });
  y += 18;

  // ── DIVIDER ──
  doc.setDrawColor(...navy);
  doc.setLineWidth(0.5);
  doc.line(margin, y, rightEdge, y);

  // ── BUYER + INVOICE DETAILS ──
  y += 1;
  const detailsStartY = y;
  const colMid = margin + contentWidth * 0.5;
  const leftLabelX = margin + 4;
  const leftValueX = margin + 32;
  const leftMaxW = colMid - leftValueX - 4;
  const rightLabelX = colMid + 4;
  const rightValueX = colMid + 32;
  const rightMaxW = rightEdge - rightValueX - 3;

  const ROW_H = 6;

  const drawLeft = (label: string, value: string, yPos: number): number => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...navy);
    doc.text(label, leftLabelX, yPos);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...dark);
    const lines = doc.splitTextToSize(value || "-", leftMaxW);
    doc.text(lines, leftValueX, yPos);
    return lines.length;
  };

  const drawRight = (label: string, value: string, yPos: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...navy);
    doc.text(label, rightLabelX, yPos);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...dark);
    const lines = doc.splitTextToSize(value || "-", rightMaxW);
    doc.text(lines, rightValueX, yPos);
  };

  let ly = detailsStartY + ROW_H;
  drawLeft("Buyer Name:", data.customer.name, ly);
  ly += ROW_H;
  const addrCount = drawLeft("Address:", data.customer.address, ly);
  ly += Math.max(ROW_H, addrCount * 4);
  drawLeft("Party's GST No:", data.customer.gstin, ly);
  ly += ROW_H;

  let ry = detailsStartY + ROW_H;
  drawRight("Bill No:", data.billNo.toString(), ry);
  ry += ROW_H;
  drawRight("Date:", formatDate(data.date), ry);
  ry += ROW_H;
  drawRight("Dispatched:", data.dispatchedThrough, ry);
  ry += ROW_H;
  drawRight("Payment:", data.paymentTerms, ry);
  ry += ROW_H;
  drawRight("E-Way Bill:", data.ewayBillNo, ry);
  ry += ROW_H;

  const detailsEndY = Math.max(ly, ry);
  doc.setDrawColor(188, 196, 207);
  doc.setLineWidth(0.2);
  doc.line(colMid, detailsStartY, colMid, detailsEndY);
  y = detailsEndY + 1;

  // ── TABLE DIVIDER ──
  doc.setDrawColor(...navy);
  doc.setLineWidth(0.5);
  doc.line(margin, y, rightEdge, y);
  y += 0.5;

  // ── ITEMS TABLE ──
  const subtotal = data.items.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const cgst = subtotal * CGST_RATE;
  const sgst = subtotal * SGST_RATE;
  const total = subtotal + cgst + sgst;

  const tableBody = data.items.map((item, i) => [
    (i + 1).toString(),
    item.name,
    item.hsn,
    item.qty.toFixed(2) + " Kg",
    formatCurrency(item.rate),
    formatCurrency(item.qty * item.rate),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Sr.", "Particulars", "HSN", "Qty", "Rate/Kg", "Amount (Rs.)"]],
    body: tableBody,
    foot: [],
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    theme: "grid",
    styles: {
      overflow: "linebreak",
      cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
      fontSize: 9,
      lineColor: [200, 200, 200],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: navy,
      textColor: white,
      fontSize: 9,
      fontStyle: "bold",
      halign: "center",
      cellPadding: 3,
    },
    bodyStyles: { textColor: dark },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: "auto", halign: "left" },
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: 24, halign: "center" },
      4: { cellWidth: 26, halign: "right" },
      5: { cellWidth: 30, halign: "right" },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 1;

  // ── TAX SUMMARY SECTION ──
  doc.setDrawColor(...navy);
  doc.setLineWidth(0.5);
  doc.line(margin, y, rightEdge, y);

  const taxSectionY = y;
  const TAX_H = 28;

  // Left side: Amount in words
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...navy);
  doc.text("Amount (in words):", leftLabelX, taxSectionY + 7);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(...dark);
  const wordsLines = doc.splitTextToSize(numberToWords(total), colMid - margin - 8);
  doc.text(wordsLines, leftLabelX, taxSectionY + 13);

  // Right side: Tax breakdown
  const taxLabelX = colMid + 4;
  const taxValueX = rightEdge - 4;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...navy);
  doc.text("Subtotal", taxLabelX, taxSectionY + 6);
  doc.text("Rs. " + formatCurrency(subtotal), taxValueX, taxSectionY + 6, { align: "right" });

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...dark);
  doc.text(`CGST @ ${(CGST_RATE * 100).toFixed(0)}%:`, taxLabelX, taxSectionY + 12);
  doc.text("Rs. " + formatCurrency(cgst), taxValueX, taxSectionY + 12, { align: "right" });

  doc.text(`SGST @ ${(SGST_RATE * 100).toFixed(0)}%:`, taxLabelX, taxSectionY + 18);
  doc.text("Rs. " + formatCurrency(sgst), taxValueX, taxSectionY + 18, { align: "right" });

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(taxLabelX, taxSectionY + 20, taxValueX, taxSectionY + 20);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...navy);
  doc.text("Total Amount:", taxLabelX, taxSectionY + 25);
  doc.text("Rs. " + formatCurrency(total), taxValueX, taxSectionY + 25, { align: "right" });

  // Vertical divider
  doc.setDrawColor(188, 196, 207);
  doc.setLineWidth(0.2);
  doc.line(colMid, taxSectionY, colMid, taxSectionY + TAX_H);

  y = taxSectionY + TAX_H;

  // ── BANK DETAILS ──
  doc.setDrawColor(...navy);
  doc.setLineWidth(0.5);
  doc.line(margin, y, rightEdge, y);
  doc.setFillColor(...lightBg);
  doc.rect(margin, y, contentWidth, 20, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...navy);
  doc.text("Bank Details", margin + 4, y + 5);

  const bankY = y + 10;
  doc.setFontSize(8.5);
  const colW = (contentWidth - 8) / 3;
  const bankCols = [
    { label: "A/C Name:", value: COMPANY.bank.accountName },
    { label: "A/C No:", value: COMPANY.bank.accountNumber },
    { label: "IFSC Code:", value: COMPANY.bank.ifsc },
    { label: "Bank:", value: COMPANY.bank.bankName },
    { label: "Branch:", value: COMPANY.bank.branch },
  ];
  let bankRowY = bankY;
  bankCols.forEach((item, i) => {
    const col = i % 3;
    if (i > 0 && col === 0) bankRowY += 5;
    const x = margin + 4 + col * colW;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...navy);
    doc.text(item.label, x, bankRowY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...dark);
    doc.text(item.value, x + 20, bankRowY);
  });
  y += 20;

  // ── TERMS & CONDITIONS ──
  doc.setDrawColor(...navy);
  doc.setLineWidth(0.5);
  doc.line(margin, y, rightEdge, y);
  y += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...navy);
  doc.text("Terms & Conditions:", margin + 4, y);
  y += 5;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  COMPANY.terms.forEach((term, i) => {
    const tLines = doc.splitTextToSize(`${i + 1}. ${term}`, contentWidth - 10);
    doc.text(tLines, margin + 4, y);
    y += 4 * tLines.length;
  });
  y += 2;
  doc.setDrawColor(...navy);
  doc.setLineWidth(0.5);
  doc.line(margin, y, rightEdge, y);

  // ── SIGNATURE ──
  y += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...navy);
  doc.text(`For ${COMPANY.name}`, rightEdge - 4, y, { align: "right" });
  y += 25;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...dark);
  doc.text("Authorized Signatory", rightEdge - 4, y, { align: "right" });

  // ── DISCLAIMER ──
  y += 8;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(120, 120, 120);
  doc.text("This is a computer generated invoice, no signature required.", pageWidth / 2, y, { align: "center" });
  y += 5;

  // ── OUTER BORDER ──
  doc.setDrawColor(...navy);
  doc.setLineWidth(0.5);
  doc.rect(margin, margin, contentWidth, y - margin);

  return doc;
}
