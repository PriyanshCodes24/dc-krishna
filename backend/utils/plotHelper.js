function normalizePlotNo(raw = "") {
  const cleaned = String(raw)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const match = cleaned.match(/^([A-Z]+)0*(\d+)$/);
  if (!match) return cleaned;
  return `${match[1]}${parseInt(match[2], 10)}`; // "B-075" -> "B75", "A-05" -> "A5"
}

function isValidKrishnaFormat(normalizedPlot) {
  const match = normalizedPlot.match(/^([AB])(\d+)$/);
  if (!match) return false;
  const num = parseInt(match[2], 10);
  if (match[1] === "A") return num >= 1 && num <= 50;
  if (match[1] === "B") return num >= 1 && num <= 130;
  return false;
}

module.exports = { normalizePlotNo, isValidKrishnaFormat };
