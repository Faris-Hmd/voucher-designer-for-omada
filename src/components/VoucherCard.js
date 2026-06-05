import { friendlyDuration, friendlyTraffic } from "../utils/presets";

export default function VoucherCard({
  index,
  voucher,
  ssid,
  gb,
  duration,
  showTraffic,
  preset,
}) {
  let code = "N/A";
  if (typeof voucher === "string") {
    code = voucher;
  } else if (typeof voucher === "object" && voucher !== null) {
    if (voucher["Voucher Code"]) code = String(voucher["Voucher Code"]);
    else if (voucher.pin) code = String(voucher.pin);
    else if (voucher.code) code = String(voucher.code);
    else if (voucher.password) code = String(voucher.password);
    else if (voucher.username) code = String(voucher.username);
    else {
      const values = Object.values(voucher);
      if (values.length > 0) {
        code = String(values[0]);
      }
    }
  }

  // Auto-detect duration from individual voucher object
  let cardDuration = duration;
  if (typeof voucher === "object" && voucher !== null) {
    const dKey = Object.keys(voucher).find(k => k.toLowerCase() === "duration");
    if (dKey && voucher[dKey] !== undefined && voucher[dKey] !== "") {
      cardDuration = friendlyDuration(voucher[dKey]);
    }
  }
  const isNumericDuration = !isNaN(parseFloat(cardDuration)) && isFinite(cardDuration);
  const displayDuration = isNumericDuration ? `${cardDuration} يوم` : cardDuration;

  // Auto-detect traffic limit from individual voucher object
  let cardGb = gb;
  if (typeof voucher === "object" && voucher !== null) {
    const tKey = Object.keys(voucher).find(
      k => k.toLowerCase() === "traffic limit" || k.toLowerCase() === "trafficlimit" || k.toLowerCase() === "traffic_limit"
    );
    if (tKey && voucher[tKey] !== undefined && voucher[tKey] !== "") {
      cardGb = friendlyTraffic(voucher[tKey]);
    }
  }

  const isUnlimited =
    String(cardGb).trim() === "0" ||
    String(cardGb).trim().toLowerCase() === "unlimited" ||
    String(cardGb).trim() === "غير محدود" ||
    String(cardGb).trim() === "";
  const displayGb = isUnlimited ? "غير محدود" : String(cardGb).trim();
  const hasUnit = displayGb.toLowerCase().includes("gb") || displayGb.toLowerCase().includes("mb") || displayGb.toLowerCase().includes("kb");
  const gbSuffix = isUnlimited || hasUnit ? "" : "GB";

  const activePreset = preset || {
    fontSizeIndex: "6.5px",
    fontSizeSsid: "8.5px",
    fontSizePin: "13px",
    fontSizeInfo: "10px",
    paddingCard: "0mm",
    gapCard: "2px",
    pinPadding: "1px 4px",
    iconSize: 10,
  };

  return (
    <div
      className="voucher-card"
      dir="rtl"
      style={{
        padding: activePreset.paddingCard,
      }}
    >
      <div
        className="card-content"
        style={{
          gap: activePreset.gapCard,
        }}
      >
        <div
          className="card-ssid"
          style={{
            fontSize: activePreset.fontSizeSsid,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={activePreset.iconSize}
            height={activePreset.iconSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              marginLeft: "4px",
              display: "inline-block",
              verticalAlign: "middle",
            }}
          >
            <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
            <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
            <line x1="12" y1="20" x2="12.01" y2="20"></line>
          </svg>
          <span style={{ verticalAlign: "middle" }}>{ssid}</span>
        </div>
        <div
          className="card-pin"
          dir="ltr"
          style={{
            fontSize: activePreset.fontSizePin,
            padding: activePreset.pinPadding,
          }}
        >
          {code}
        </div>
        <div
          className="card-info"
          style={{
            fontSize: activePreset.fontSizeInfo,
          }}
        >
          <span>{displayDuration}</span>
          {showTraffic && (
            <>
              <span style={{ margin: "0 3px" }}>•</span>
              <span>
                {displayGb}
                {gbSuffix && (
                  <span
                    style={{ marginLeft: "2px", fontFamily: "sans-serif" }}
                    dir="ltr"
                  >
                    {gbSuffix}
                  </span>
                )}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
