"use client";

import { useState, useEffect } from "react";
import VoucherGrid from "../components/VoucherGrid";

export default function Home() {
  const [vouchers, setVouchers] = useState([]);
  const [ssid, setSsid] = useState("شبكة واي فاي");
  const [gb, setGb] = useState("10");
  const [duration, setDuration] = useState("1 يوم");
  const [showTraffic, setShowTraffic] = useState(true);
  const [unlimitedTraffic, setUnlimitedTraffic] = useState(false);

  // تحديث عنوان الصفحة ليكون الاسم الافتراضي لملف PDF عند الطباعة
  useEffect(() => {
    document.title = `${ssid} - ${duration}`;
  }, [ssid, duration]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        if (ext === "json") {
          const json = JSON.parse(event.target.result);
          if (Array.isArray(json)) {
            setVouchers(json);
          } else if (json.vouchers && Array.isArray(json.vouchers)) {
            setVouchers(json.vouchers);
          } else {
            alert("لم يتم العثور على مصفوفة قسائم في ملف JSON.");
          }
        } else if (ext === "xlsx" || ext === "xls" || ext === "csv") {
          const XLSX = await import("xlsx");

          // Temporary suppress console.error to avoid Next.js throwing a Dev Overlay Error
          // for harmless xlsx parsing warnings like "Bad uncompressed size" on system exports.
          const originalError = console.error;
          console.error = () => {};

          let jsonArray = [];
          try {
            const data = event.target.result;
            const workbook = XLSX.read(data, { type: "binary" });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            jsonArray = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          } finally {
            console.error = originalError;
          }

          setVouchers(jsonArray);
        } else {
          alert("أمتداد الملف غير مدعوم. الرجاء رفع JSON أو Excel.");
        }
      } catch (err) {
        alert("حدث خطأ أثناء تحميل الملف.");
        console.error(err);
      }
    };

    if (ext === "json") {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  return (
    <div className="app-container" dir="rtl">
      <header className="no-print header">
        <div className="header-content">
          <h1>مصمم القسائم</h1>
          <p>
            تصميم قسائم الواي فاي لطباعتها على ورق A4. أكمل الإعدادات بالأسفل.
          </p>
        </div>
      </header>

      <main className="main-content">
        <section className="controls-section no-print">
          <div className="card-panel shadow-panel">
            <h2>إعدادات التصميم</h2>

            <div className="form-group">
              <label htmlFor="file-upload">
                رفع بيانات القسائم (Excel / JSON)
              </label>
              <input
                type="file"
                id="file-upload"
                accept=".json, .xlsx, .xls, .csv"
                onChange={handleFileUpload}
              />
              <small>
                يدعم رفع ملفات Excel (.xlsx) أو ملفات JSON. سيتم استخراج القسائم
                مباشرة.
              </small>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="ssid">اسم الشبكة</label>
                <input
                  type="text"
                  id="ssid"
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                  placeholder="مثال: My WiFi Network"
                />
              </div>

              <div className="form-group">
                <label htmlFor="gb">البيانات (جيجا)</label>
                <input
                  type="text"
                  id="gb"
                  value={gb}
                  onChange={(e) => setGb(e.target.value)}
                  placeholder="مثال: 10"
                  disabled={unlimitedTraffic}
                  style={unlimitedTraffic ? { opacity: 0.5 } : {}}
                />
              </div>

              <div className="form-group">
                <label htmlFor="duration">المدة</label>
                <input
                  type="text"
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="مثال: 30 يوم"
                />
              </div>

              <div
                className="form-group"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginTop: "1.5rem",
                }}
              >
                <input
                  type="checkbox"
                  id="showTraffic"
                  checked={showTraffic}
                  onChange={(e) => setShowTraffic(e.target.checked)}
                />
                <label htmlFor="showTraffic" style={{ marginBottom: 0 }}>
                  إظهار سعة البيانات
                </label>
              </div>

              <div
                className="form-group"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginTop: "1.5rem",
                }}
              >
                <input
                  type="checkbox"
                  id="unlimitedTraffic"
                  checked={unlimitedTraffic}
                  onChange={(e) => setUnlimitedTraffic(e.target.checked)}
                />
                <label htmlFor="unlimitedTraffic" style={{ marginBottom: 0 }}>
                  ترافيك غير محدود
                </label>
              </div>
            </div>

            <button className="btn-primary" onClick={() => window.print()}>
              طباعة / حفظ كملف PDF
            </button>
          </div>
        </section>

        <section className="preview-section">
          {vouchers.length > 0 ? (
            <div className="instructions no-print">
              <h3>معاينة الطباعة</h3>
              <p>ستظهر صفحة واحدة فقط كنموذج هنا لتسريع الأداء.</p>
              <div
                style={{
                  marginTop: "0.5rem",
                  padding: "0.75rem",
                  background: "#eff6ff",
                  borderRadius: "8px",
                  color: "#1d4ed8",
                  fontWeight: "bold",
                }}
              >
                العدد الإجمالي: {vouchers.length} قسيمة | صفحات الطباعة:{" "}
                {Math.ceil(vouchers.length / 108)} صفحة | القسائم في كل صفحة:
                108
              </div>
            </div>
          ) : (
            <div className="empty-state no-print">
              <div className="empty-icon">📄</div>
              <h3>لا يوجد قسائم للمعاينة</h3>
              <p>قم برفع ملف القسائم لمعاينة تصميم البطاقة هنا.</p>
            </div>
          )}

          {vouchers.length > 0 && (
            <VoucherGrid
              vouchers={vouchers}
              ssid={ssid}
              gb={unlimitedTraffic ? "غير محدود" : gb}
              duration={duration}
              showTraffic={showTraffic}
            />
          )}
        </section>
      </main>
    </div>
  );
}
