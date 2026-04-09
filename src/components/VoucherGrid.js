import VoucherCard from "./VoucherCard";

export default function VoucherGrid({
  vouchers,
  ssid,
  gb,
  duration,
  showTraffic,
}) {
  const pageSize = 108; // 6x18 layout
  const pages = [];

  for (let i = 0; i < vouchers.length; i += pageSize) {
    pages.push(vouchers.slice(i, i + pageSize));
  }

  return (
    <div className="voucher-preview-pages">
      {pages.map((pageVouchers, pageIndex) => (
        <div key={pageIndex} className="a4-page">
          {pageVouchers.map((voucher, idx) => (
            <VoucherCard
              key={idx}
              index={pageIndex * pageSize + idx + 1}
              voucher={voucher}
              ssid={ssid}
              gb={gb}
              duration={duration}
              showTraffic={showTraffic}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
