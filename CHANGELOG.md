# A S TRADERS — Invoice Generator App

## Changelog & Implementation Details

---

## Tech Stack

- **React** 19.2.4 with **React Router** 7.13.2 (SPA mode)
- **TypeScript** 5.9.3 (strict mode)
- **Vite** 7.1.7 (build tool)
- **Tailwind CSS** 4.2.2 (v4 `@theme` directive)
- **Framer Motion** 12.38.0 (animations)
- **jsPDF** 4.2.1 + **jspdf-autotable** 5.0.7 (PDF generation)
- **Docker** support included

---

## Project Structure

```
app/
├── types/index.ts          # TypeScript interfaces (Customer, InvoiceItem, InvoiceData, ToastMessage)
├── data/constants.ts       # Company info, 13 customers, 5 items, tax rates, terms
├── lib/
│   ├── storage.ts          # localStorage helpers (customers, bill numbers)
│   ├── helpers.ts          # numberToWords, formatDate, formatCurrency
│   ├── pdfGenerator.ts     # jsPDF-based A4 invoice PDF generation
│   ├── googleDrive.ts      # Google Drive OAuth2 upload (currently disabled)
│   └── localSave.ts        # File System Access API save (dead code)
├── components/
│   ├── InvoiceApp.tsx      # Main form component (all business logic)
│   ├── InvoicePreview.tsx  # Preview modal matching PDF layout
│   └── Toast.tsx           # Toast notification system with retry support
├── routes/home.tsx         # Home route rendering InvoiceApp
├── root.tsx                # Root layout with ToastProvider
└── app.css                 # Custom styles, gradient background, scrollbar
```

---

## Features Implemented

### 1. Customer Management
- Dropdown selector with 13 pre-configured customers
- Auto-fills GSTIN and address on selection
- Inline edit/save for address and GSTIN fields
- Changes persist to localStorage across sessions

### 2. Invoice Details
- **Bill No.** — Auto-incremented, editable, persists last used number
- **Date** — Date picker, defaults to today
- **Dispatched Through** — Alphanumeric input with validation
- **Payment Terms** — Dropdown (Cash / UPI/Bank Transfer)
- **E-Way Bill No.** — Optional text field

### 3. Items & Calculations
- Searchable item dropdown (5 chemical products with HSN codes)
- Qty (Kg) and Rate/Kg inputs with 0.01 step precision
- Auto-calculated: Amount per item, Subtotal, CGST @9%, SGST @9%, Total
- Amount in words (Indian number system — Crore, Lakh, Thousand)
- Animated item add/remove with Framer Motion

### 4. PDF Generation
- Professional A4 invoice with navy/white color scheme
- Sections: Header → Company → Buyer/Invoice Details → Items Table → Tax Summary → Bank Details → Terms → Signature → Disclaimer
- Filename format: `{CustomerName}_{BillNo}_Invoice_{MON}_{YEAR}.pdf`
- Auto-clears form after successful generation

### 5. WhatsApp Sharing
- Web Share API with actual PDF file attachment (if supported)
- Fallback to `wa.me` URL with invoice message text

### 6. Invoice Preview
- Modal preview matching PDF layout before generation
- Animated entry/exit (spring physics)
- Generate PDF button directly from preview

### 7. Toast Notifications
- Color-coded: success (green), error (red), info (blue)
- Auto-dismiss after 4 seconds
- Retry button on error toasts
- Animated stacking (top-right corner)

### 8. Form Validation
- Customer must be selected
- At least one item required
- All items must have positive qty and rate
- Reset button disabled when form is empty

---

## Company & Data Details

**Company:** A S TRADERS  
**Address:** No. 09, Hosakerehalli Main Road, Byatarayanapura New Extension, Bengaluru – 560026  
**Mobile:** 9886940990 | **GSTIN:** 29BDBPN1930P1Z6  
**Bank:** Canara Bank, Chandra Layout | **A/C:** 120037360636 | **IFSC:** CNRB0002614

**Products:** LABSA (3402), CAUSTIC SODA FLAKES (2815), SODA ASH (2836), SODIUM SULPHATE (2833), SOAP LIQUID/OIL (3401)

**Tax:** CGST 9% + SGST 9% = 18% total

**13 Customers:** A R Plastics, Sri Balaji Polymers, Sri Bhavani Polymers, K S Plastics, P E A S Plastics, A-One Traders, Sudiksha Enterprises, Metro Plast, S.L.N.Vibro Finishers, S K Plastics, R B Enterprises, Sangameshwara Store, Supreme Plastic Industries

---

## Mobile Responsive Design

- Invoice detail fields: single column layout on mobile
- Items table: `min-w-[600px]` with horizontal scroll
- Buttons: full-width stacked vertically on mobile
- Preview: amount-in-words appears below tax summary on mobile
- Form card: no shadow/border/rounded on mobile (page appearance)
- Address textarea: `max-h-[100px]` on mobile
- All buttons centered text on mobile
- Touch-friendly tap targets (min 2.5rem height)

---

## Iterative Fixes & Changes

### Round 1 — Core Fixes
- Removed order number field from the form and type definitions
- Added payment terms dropdown (Cash / UPI/Bank Transfer)
- Item qty defaults to empty instead of 0
- Added disclaimer text at bottom of invoice
- Fixed preview responsive overflow with horizontal scroll
- Implemented local folder structure save (later simplified)
- Reset button disabled when form is empty
- Improved PDF visual layout and styling

### Round 2 — Alignment Fixes
- Subtotal/amount aligned with total in right column
- Bank details converted to column format layout

### Round 3 — Layout Refinements
- Bank details displayed in 3-per-row grid
- Increased signature-to-seal gap
- Subtotal positioned above CGST in right column

### Round 4 — PDF & Sharing
- Tightened PDF spacing for A4 page fit
- WhatsApp sharing attaches actual PDF file via Web Share API
- Simplified local save (removed folder picker, uses `doc.save()`)

### Round 5 — PDF Matching Preview
- Reverted gap reduction, increased all font sizes across PDF
- Proper spacing between all sections (no overlaps)
- Column split changed to 50/50 matching preview
- Labels matched between PDF and preview ("Party's GST No:")
- Divider colors matched (navy 30% opacity)
- Outer border thinned to match preview

### Round 6 — UI Cleanup
- Removed border line above disclaimer (both PDF and preview)
- Removed subtotal background color (both PDF and preview)

### Round 7 — Feature Toggles
- Google Drive upload feature commented out (available for re-enabling)

### Round 8 — Form Behavior
- Form auto-clears after successful PDF generation
- Preview table columns widened (Qty w-20, Rate w-24, Amount w-28) with `whitespace-nowrap`

### Round 9 — Data
- Replaced temporary customers with 13 actual customer records
- Replaced temporary items with 5 actual chemical products and HSN codes

### Round 10 — Filename & Bill No
- PDF filename includes month and year: `{Name}_{BillNo}_Invoice_{MON}_{YEAR}.pdf`
- Bill No. field made editable (was read-only)
- Bill No. allows empty value (string type instead of number)

### Round 11 — Amount in Words Fix
- Fixed `numberToWords` for large amounts (crore values > 999)
- Added `convertLargeIndian` helper for proper Indian number system conversion

### Round 12 — Mobile Responsive
- Invoice details: 1 field per row on mobile
- Items table: `min-w-[600px]` for proper column widths
- Bottom buttons: stacked vertically on mobile
- Preview: amount-in-words below tax summary on mobile (flex-col-reverse)
- Address field: `max-h-[100px]` on mobile
- Generate/Preview buttons: centered text, full width on mobile
- Form card: no shadow/border/rounded on mobile (page-like appearance)

---

## Disabled Features

### Google Drive Upload
- Fully implemented in `app/lib/googleDrive.ts`
- OAuth2 with Google Identity Services
- Creates folder hierarchy: `Invoice/{Year}/{Month}/`
- Commented out in InvoiceApp.tsx — uncomment `tryUploadAndShare` to re-enable
- Requires `VITE_GOOGLE_CLIENT_ID` in `.env`

### Local Folder Save
- Implementation in `app/lib/localSave.ts` (dead code, not imported)
- Used File System Access API for structured folder saving
- Replaced with simple `doc.save(fileName)` browser download
