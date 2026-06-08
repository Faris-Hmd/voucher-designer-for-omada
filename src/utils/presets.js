export const LAYOUT_PRESETS = {
  xlarge: {
    id: "xlarge",
    label: "كبير جداً (50 في الصفحة - 5×10)",
    cols: 5,
    rows: 10,
    pageSize: 50,
    fontSizeIndex: "9px",
    fontSizeSsid: "12px",
    fontSizePin: "22px",
    fontSizeInfo: "11px",
    paddingCard: "0mm",
    gapCard: "1px",
    pinPadding: "1px 2px",
    iconSize: 12,
  },
  large: {
    id: "large",
    label: "كبير (72 في الصفحة - 6×12)",
    cols: 6,
    rows: 12,
    pageSize: 72,
    fontSizeIndex: "8px",
    fontSizeSsid: "10.5px",
    fontSizePin: "18px",
    fontSizeInfo: "10.5px",
    paddingCard: "0mm",
    gapCard: "1px",
    pinPadding: "1px 2px",
    iconSize: 10,
  },
  medium: {
    id: "medium",
    label: "متوسط (98 في الصفحة - 7×14)",
    cols: 7,
    rows: 14,
    pageSize: 98,
    fontSizeIndex: "7.5px",
    fontSizeSsid: "9px",
    fontSizePin: "15px",
    fontSizeInfo: "9.5px",
    paddingCard: "0mm",
    gapCard: "0.5px",
    pinPadding: "1px 2px",
    iconSize: 9,
  },
  small: {
    id: "small",
    label: "صغير (144 في الصفحة - 8×18)",
    cols: 8,
    rows: 18,
    pageSize: 144,
    fontSizeIndex: "7px",
    fontSizeSsid: "8.5px",
    fontSizePin: "13px",
    fontSizeInfo: "8.5px",
    paddingCard: "0mm",
    gapCard: "0.5px",
    pinPadding: "0.5px 2px",
    iconSize: 9,
  },
  xsmall: {
    id: "xsmall",
    label: "صغير جداً (180 في الصفحة - 9×20)",
    cols: 9,
    rows: 20,
    pageSize: 180,
    fontSizeIndex: "6px",
    fontSizeSsid: "7.5px",
    fontSizePin: "11px",
    fontSizeInfo: "8px",
    paddingCard: "0mm",
    gapCard: "0.5px",
    pinPadding: "0.5px 2px",
    iconSize: 8,
  }
};

export function friendlyDuration(durationStr) {
  if (!durationStr) return "";
  const cleaned = String(durationStr).trim();
  const match = cleaned.match(/^(\d+(?:\.\d+)?)\s*(Hour|Day|Minute|Second|Week|Month)s?$/i);
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
  } else if (unit === "week") {
    hours = num * 168;
  } else if (unit === "month") {
    hours = num * 720;
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
  let cleaned = String(trafficStr).trim();
  if (cleaned.includes("/")) {
    cleaned = cleaned.split("/")[1].trim();
  }
  if (cleaned === "0" || cleaned.toLowerCase() === "unlimited" || cleaned === "") {
    return "غير محدود";
  }

  const numMatch = cleaned.match(/^(\d+(?:\.\d+)?)(?:\s*(MB|GB|KB|B))?$/i);
  if (!numMatch) return cleaned;

  const val = parseFloat(numMatch[1]);
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
