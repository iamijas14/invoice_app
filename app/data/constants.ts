import type { Customer } from "~/types";

export const COMPANY = {
  name: "A S TRADERS",
  tagline: "Subject to Bangalore Jurisdiction Only",
  address:
    "No. 09, Hosakerehalli Main Road, Byatarayanapura New Extension, Bengaluru – 560026",
  mobile: "9886940990",
  gstin: "29BDBPN1930P1Z6",
  bank: {
    accountName: "A S TRADERS",
    accountNumber: "120037360636",
    ifsc: "CNRB0002614",
    bankName: "Canara Bank",
    branch: "Chandra Layout",
  },
  terms: [
    "Our responsibility ceases once the goods leave our godown or are handed over to the carriers",
    "Goods once sold will not be taken back or exchanged",
    "Subject to Bangalore Jurisdiction",
    "E. & O.E.",
    "We are not responsible for the quality of your end product using our product as raw material — use only after lab tests",
    "Not for medical use",
    "Keep away from children",
  ],
};

export const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    name: "A R PLASTICS",
    gstin: "29AEZPR9412G1ZN",
    address: "114, 5th Cross, Azeez Sait Industrial Area, Nayandahalli, Bengaluru Urban, Karnataka, 560039",
  },
  {
    id: "cust-2",
    name: "SRI BALAJI POLYMERS",
    gstin: "29ACHPC6926E1ZN",
    address: "41, Muthachari Industrial Estate, Nayandahalli, Mysore Road, Bengaluru Urban, Karnataka, 560040",
  },
  {
    id: "cust-3",
    name: "SRI BHAVANI POLYMERS",
    gstin: "29CISPB5810K1ZW",
    address: "No 19, Muthachari Industrial Estate Industrial Area, Mysore Road Nayandahalli Bangalore, Bengaluru Urban, Karnataka, 560039",
  },
  {
    id: "cust-4",
    name: "K S PLASTICS",
    gstin: "29BCIPS8158J1ZQ",
    address: "No 9, Nayandahalli Industrial Estate, Mysore Road Cross Bangalore, Bengaluru Urban, Karnataka, 560039",
  },
  {
    id: "cust-5",
    name: "P E A S PLASTICS",
    gstin: "29AJFPP4626B2Z9",
    address: "No 226, Nayandahalli, Railway Station Road, Mysore Road, Bangalore, Bengaluru Urban, Karnataka, 560039",
  },
  {
    id: "cust-6",
    name: "A ONE TRADERS",
    gstin: "29AMAPP4105D1ZF",
    address: "No.124, Azeez Sait Industrial Area, Nayandahalli Post, Bengaluru Urban, Karnataka, 560039",
  },
  {
    id: "cust-7",
    name: "SUDIKSHA ENTERPRISES",
    gstin: "29AQKPJ4696D1ZF",
    address: "No.553, 6th Main, 7th Cross, Kengeri Satellite Town, Bengaluru Urban, Karnataka, 560060",
  },
  {
    id: "cust-8",
    name: "METRO PLAST",
    gstin: "29ATLPS3473K1ZV",
    address: "42/1, Hanumanthappa Layout, Mysore Road, Bangalore, Bengaluru Urban, Karnataka, 560039",
  },
  {
    id: "cust-9",
    name: "S.L.N VIBRO FINISHERS",
    gstin: "29ADWFS2484D1ZG",
    address: "No.332, 1/1, Behind LVK Garments, 4th Cross, 1st Stage, Peenya Industrial Estate, Bengaluru, Bengaluru Urban, Karnataka, 560058",
  },
  {
    id: "cust-10",
    name: "S K PLASTICS",
    gstin: "29AKKPK4238J2ZQ",
    address: "No 11, Mysore Road, Kengeri Hobli, Thagachaguppe Village, Bangalore, Bengaluru Urban, Karnataka, 560074",
  },
  {
    id: "cust-11",
    name: "R B ENTERPRISES",
    gstin: "29ADRPB7880R2ZD",
    address: "No 34/3, Nayandanahalli West, Chandra Layout, Bengaluru Urban, Karnataka, 560039",
  },
  {
    id: "cust-12",
    name: "SANGAMESHWARA STORE",
    gstin: "29CKUPM2623P1Z8",
    address: "No 3315 E Southu No 13 20 60, 17 Ward, Ahamed Pura Street Kollegal Town, Chamarajanagara, Karnataka, 571440",
  },
  {
    id: "cust-13",
    name: "SUPREME PLASTIC INDUSTRIES",
    gstin: "29ADQPJ0408E1ZO",
    address: "114/9 Ranganatha Colony, Mysore Road Cross, Bangalore, Bengaluru Urban, Karnataka, 560039",
  },
];

export const ITEMS = [
  { id: "item-1", name: "LABSA", hsn: "3402" },
  { id: "item-2", name: "CAUSTIC SODA FLAKES", hsn: "2815" },
  { id: "item-3", name: "SODA ASH", hsn: "2836" },
  { id: "item-4", name: "SODIUM SULPHATE", hsn: "2833" },
  { id: "item-5", name: "SOAP LIQUID/OIL", hsn: "3401" },
];

export const CGST_RATE = 0.09;
export const SGST_RATE = 0.09;
