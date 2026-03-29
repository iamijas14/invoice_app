const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function convertGroup(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ones[n];
  if (n < 100)
    return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  return (
    ones[Math.floor(n / 100)] +
    " Hundred" +
    (n % 100 ? " and " + convertGroup(n % 100) : "")
  );
}

export function numberToWords(num: number): string {
  if (num === 0) return "Zero Rupees Only";

  const intPart = Math.floor(num);
  const paise = Math.round((num - intPart) * 100);

  // Indian number system: Crore (up to 99,99,99,99,999)
  const crore = Math.floor(intPart / 10000000);
  const lakh = Math.floor((intPart % 10000000) / 100000);
  const thousand = Math.floor((intPart % 100000) / 1000);
  const remainder = intPart % 1000;

  let words = "";
  if (crore) words += convertLargeIndian(crore) + " Crore ";
  if (lakh) words += convertGroup(lakh) + " Lakh ";
  if (thousand) words += convertGroup(thousand) + " Thousand ";
  if (remainder) words += convertGroup(remainder);

  words = words.trim() + " Rupees";
  if (paise) words += " and " + convertGroup(paise) + " Paise";
  words += " Only";

  return words;
}

function convertLargeIndian(n: number): string {
  if (n <= 999) return convertGroup(n);
  const thousands = Math.floor(n / 1000);
  const rem = n % 1000;
  let result = convertGroup(thousands) + " Thousand";
  if (rem) result += " " + convertGroup(rem);
  return result;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
