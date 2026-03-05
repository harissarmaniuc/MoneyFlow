/**
 * Parse Google Vision OCR text into structured receipt fields.
 * Returns { amount, merchant, date } — any field may be null if not found.
 */
function parseReceiptText(fullText) {
  const lines = fullText.split('\n').map((l) => l.trim()).filter(Boolean);

  // --- Amount: find largest "total" value ---
  const amountPatterns = [
    /(?:grand\s*total|total\s*due|amount\s*due|total\s*amount|total)[:\s*]*\$?\s*([\d,]+\.\d{2})/i,
    /(?:subtotal|sub-total)[:\s*]*\$?\s*([\d,]+\.\d{2})/i,
    /\$\s*([\d,]+\.\d{2})/g,
  ];

  let amount = null;
  for (const pattern of amountPatterns) {
    if (pattern.global) {
      // collect all dollar amounts, take the largest
      const matches = [...fullText.matchAll(pattern)];
      if (matches.length) {
        const values = matches.map((m) => parseFloat(m[1].replace(/,/g, '')));
        amount = Math.max(...values);
        break;
      }
    } else {
      const m = fullText.match(pattern);
      if (m) { amount = parseFloat(m[1].replace(/,/g, '')); break; }
    }
  }

  // --- Merchant: first non-trivial line (skip lines that look like addresses/dates) ---
  const skipPatterns = [
    /^\d+[\s,]/,          // starts with number (address)
    /\d{4}/,              // contains year
    /receipt|invoice|order|transaction|thank|welcome|cashier/i,
  ];
  let merchant = null;
  for (const line of lines.slice(0, 5)) {
    if (line.length >= 3 && !skipPatterns.some((p) => p.test(line))) {
      merchant = line;
      break;
    }
  }

  // --- Date: look for common date formats ---
  const datePatterns = [
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/,
    /\b([A-Za-z]{3,9}\.?\s+\d{1,2},?\s+\d{4})\b/,
    /\b(\d{4}[\/\-]\d{2}[\/\-]\d{2})\b/,
  ];
  let date = null;
  for (const pattern of datePatterns) {
    const m = fullText.match(pattern);
    if (m) {
      const parsed = new Date(m[1]);
      if (!isNaN(parsed)) { date = parsed.toISOString().split('T')[0]; break; }
    }
  }

  return { amount: amount || null, merchant: merchant || null, date: date || null };
}

module.exports = { parseReceiptText };
