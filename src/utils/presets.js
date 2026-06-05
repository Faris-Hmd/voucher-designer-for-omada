export const LAYOUT_PRESETS = {
  xlarge: {
    id: "xlarge",
    label: "كبير جداً (24 في الصفحة - 3×8)",
    cols: 3,
    rows: 8,
    pageSize: 24,
    fontSizeIndex: "11px",
    fontSizeSsid: "14px",
    fontSizePin: "28px",
    fontSizeInfo: "13.5px",
    paddingCard: "4mm 2mm",
    gapCard: "4px",
    pinPadding: "4px 8px",
    iconSize: 14,
  },
  large: {
    id: "large",
    label: "كبير (40 في الصفحة - 4×10)",
    cols: 4,
    rows: 10,
    pageSize: 40,
    fontSizeIndex: "9px",
    fontSizeSsid: "12px",
    fontSizePin: "22px",
    fontSizeInfo: "12px",
    paddingCard: "3mm 2mm",
    gapCard: "3px",
    pinPadding: "3px 6px",
    iconSize: 12,
  },
  medium: {
    id: "medium",
    label: "متوسط (60 في الصفحة - 5×12)",
    cols: 5,
    rows: 12,
    pageSize: 60,
    fontSizeIndex: "8px",
    fontSizeSsid: "10px",
    fontSizePin: "18px",
    fontSizeInfo: "11px",
    paddingCard: "2mm 1mm",
    gapCard: "2px",
    pinPadding: "2px 5px",
    iconSize: 11,
  },
  small: {
    id: "small",
    label: "صغير (80 في الصفحة - 5×16)",
    cols: 5,
    rows: 16,
    pageSize: 80,
    fontSizeIndex: "7px",
    fontSizeSsid: "9px",
    fontSizePin: "16px",
    fontSizeInfo: "10px",
    paddingCard: "1.5mm 1mm",
    gapCard: "1px",
    pinPadding: "1px 4px",
    iconSize: 10,
  },
  xsmall: {
    id: "xsmall",
    label: "صغير جداً (108 في الصفحة - 6×18)",
    cols: 6,
    rows: 18,
    pageSize: 108,
    fontSizeIndex: "6.5px",
    fontSizeSsid: "8.5px",
    fontSizePin: "14px",
    fontSizeInfo: "10px",
    paddingCard: "0mm",
    gapCard: "2px",
    pinPadding: "1px 4px",
    iconSize: 10,
  }
};

export function friendlyDuration(durationStr) {
  if (!durationStr) return "";
  const cleaned = String(durationStr).trim();
  const match = cleaned.match(/^(\d+(?:\.\d+)?)\s*(Hour|Day|Minute|Second)s?$/i);
  if (!match) return cleaned;

  const num = parseFloat(match[1]);
  const unit = match[2].toLowerCase();

  // Convert to hours
  let hours = num;
  if (unit === "minute") {
    hours = num / 60;
  } else if (unit === "second") {
    hours = num / 3600;
  } else if (unit === "day") {
    hours = num * 24;
  }

  // Format based on hours
  // 1 month = 720 hours
  if (hours % 720 === 0) {
    const months = hours / 720;
    if (months === 1) return "شهر";
    if (months === 2) return "شهرين";
    if (months >= 3 && months <= 10) return `${months} أشهر`;
    return `${months} شهر`;
  }

  // 1 week = 168 hours
  if (hours % 168 === 0) {
    const weeks = hours / 168;
    if (weeks === 1) return "أسبوع";
    if (weeks === 2) return "أسبوعين";
    if (weeks >= 3 && weeks <= 10) return `${weeks} أسابيع`;
    return `${weeks} أسبوع`;
  }

  // 1 day = 24 hours
  if (hours % 24 === 0) {
    const days = hours / 24;
    if (days === 1) return "يوم";
    if (days === 2) return "يومين";
    if (days >= 3 && days <= 10) return `${days} أيام`;
    return `${days} يوم`;
  }

  // default to hours or minutes
  if (hours === 1) return "ساعة";
  if (hours === 2) return "ساعتين";
  if (hours >= 3 && hours <= 10) return `${hours} ساعات`;
  if (hours > 10 && Number.isInteger(hours)) return `${hours} ساعة`;

  // if hours has decimal, see if minutes is integer
  const minutes = hours * 60;
  if (Number.isInteger(minutes)) {
    if (minutes === 1) return "دقيقة";
    if (minutes === 2) return "دقيقتين";
    if (minutes >= 3 && minutes <= 10) return `${minutes} دقائق`;
    return `${minutes} دقيقة`;
  }

  return `${hours} ساعة`;
}

export function friendlyTraffic(trafficStr) {
  if (trafficStr === undefined || trafficStr === null) return "";
  const cleaned = String(trafficStr).trim();
  if (cleaned === "0" || cleaned.toLowerCase() === "unlimited" || cleaned === "") {
    return "غير محدود";
  }

  const numMatch = cleaned.match(/^(\d+)(?:\s*(MB|GB|KB|B))?$/i);
  if (!numMatch) return cleaned;

  const val = parseInt(numMatch[1], 10);
  const unit = numMatch[2] ? numMatch[2].toUpperCase() : "MB"; // Default is MB

  if (unit === "MB") {
    if (val >= 1024 && val % 1024 === 0) {
      return `${val / 1024}`;
    }
    return `${val} MB`;
  }

  if (unit === "GB") {
    return `${val}`;
  }

  return cleaned;
}
