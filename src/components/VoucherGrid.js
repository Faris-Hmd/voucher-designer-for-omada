import VoucherCard from "./VoucherCard";

export default function VoucherGrid({
  vouchers,
  ssid,
  gb,
  duration,
  showTraffic,
  preset,
}) {
  const pageSize = preset ? preset.pageSize : 108;
  const pages = [];

  for (let i = 0; i < vouchers.length; i += pageSize) {
    pages.push(vouchers.slice(i, i + pageSize));
  }

  return (
    <div className="voucher-preview-pages">
      {pages.map((pageVouchers, pageIndex) => (
        <div
          key={pageIndex}
          className="a4-page"
          style={
            preset
              ? {
                  gridTemplateColumns: `repeat(${preset.cols}, 1fr)`,
                  gridTemplateRows: `repeat(${preset.rows}, 1fr)`,
                }
              : {}
          }
        >
          {pageVouchers.map((voucher, idx) => (
            <VoucherCard
              key={idx}
              index={pageIndex * pageSize + idx + 1}
              voucher={voucher}
              ssid={ssid}
              gb={gb}
              duration={duration}
              showTraffic={showTraffic}
              preset={preset}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
