export default function VoucherCard({
  voucher,
  ssid,
  gb,
  duration,
  showTraffic,
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

  const isNumericDuration = !isNaN(parseFloat(duration)) && isFinite(duration);
  const displayDuration = isNumericDuration ? `${duration} يوم` : duration;

  const isUnlimited =
    String(gb).trim() === "0" ||
    String(gb).trim().toLowerCase() === "unlimited" ||
    String(gb).trim() === "غير محدود" ||
    String(gb).trim() === "";
  const displayGb = isUnlimited ? "غير محدود" : String(gb).trim();
  const gbSuffix = isUnlimited ? "" : "GB";

  return (
    <div className="voucher-card" dir="rtl">
      <div className="card-content">
        <div className="card-ssid">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="10"
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
        <div className="card-pin" dir="ltr">
          {code}
        </div>
        <div className="card-info">
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
