"use client";

import { useState, useEffect } from "react";
import VoucherGrid from "../components/VoucherGrid";
import VoucherCard from "../components/VoucherCard";
import { LAYOUT_PRESETS, friendlyDuration, friendlyTraffic } from "../utils/presets";

export default function Home() {
  const [vouchers, setVouchers] = useState([]);
  const [ssid, setSsid] = useState("شبكة واي فاي");
  const [gb, setGb] = useState("10");
  const [duration, setDuration] = useState("1 يوم");
  const [showTraffic, setShowTraffic] = useState(false);
  const [unlimitedTraffic, setUnlimitedTraffic] = useState(false);
  const [layoutPreset, setLayoutPreset] = useState("large");
  const [selectedDurationFilter, setSelectedDurationFilter] = useState("all");

  const activePreset = LAYOUT_PRESETS[layoutPreset] || LAYOUT_PRESETS.large;

  const uniqueDurations = typeof window !== "undefined" ? [...new Set(vouchers.map(v => {
    if (typeof v === "object" && v !== null) {
      const dKey = Object.keys(v).find(k => k.toLowerCase() === "duration");
      if (dKey && v[dKey] !== undefined && v[dKey] !== "") {
        return friendlyDuration(v[dKey]);
      }
    }
    return duration;
  }))] : [];

  const filteredVouchers = vouchers.filter(v => {
    if (selectedDurationFilter === "all") return true;
    let vDuration = duration;
    if (typeof v === "object" && v !== null) {
      const dKey = Object.keys(v).find(k => k.toLowerCase() === "duration");
      if (dKey && v[dKey] !== undefined && v[dKey] !== "") {
        vDuration = friendlyDuration(v[dKey]);
      }
    }
    return vDuration === selectedDurationFilter;
  });

  // تحديث عنوان الصفحة ليكون الاسم الافتراضي لملف PDF عند الطباعة
  useEffect(() => {
    const activeDuration = selectedDurationFilter === "all" ? duration : selectedDurationFilter;
    document.title = `${ssid} - ${activeDuration} - ${filteredVouchers.length} كرت`;
  }, [ssid, duration, selectedDurationFilter, filteredVouchers.length]);

  const autoDetectFields = (list) => {
    if (!list || list.length === 0) return;
    const first = list[0];
    if (typeof first !== "object" || first === null) return;

    // Detect duration
    const dKey = Object.keys(first).find(k => k.toLowerCase() === "duration");
    if (dKey && first[dKey] !== undefined && first[dKey] !== "") {
      const detected = friendlyDuration(first[dKey]);
      if (detected) setDuration(detected);
    }

    // Detect traffic limit
    const tKey = Object.keys(first).find(
      k => k.toLowerCase() === "traffic limit" || k.toLowerCase() === "trafficlimit" || k.toLowerCase() === "traffic_limit"
    );
    if (tKey) {
      const val = first[tKey];
      const detected = friendlyTraffic(val);
      if (detected === "غير محدود") {
        setUnlimitedTraffic(true);
      } else {
        setUnlimitedTraffic(false);
        setGb(detected);
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedDurationFilter("all");
    const ext = file.name.split(".").pop().toLowerCase();
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        if (ext === "json") {
          const json = JSON.parse(event.target.result);
          let parsedList = [];
          if (Array.isArray(json)) {
            parsedList = json;
          } else if (json.vouchers && Array.isArray(json.vouchers)) {
            parsedList = json.vouchers;
          } else {
            alert("لم يتم العثور على مصفوفة كروت في ملف JSON.");
            return;
          }
          setVouchers(parsedList);
          autoDetectFields(parsedList);
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
          autoDetectFields(jsonArray);
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
          <h1>مصمم الكروت</h1>
          <p>
            تصميم وطباعة كروت واي فاي احترافية على ورق A4
          </p>
        </div>
      </header>

      <main className="main-content">
        <section className="controls-section no-print">
          <div className="card-panel shadow-panel">
            <h2>إعدادات التصميم</h2>

            <div className="form-group">
              <label htmlFor="file-upload">
                رفع بيانات الكروت (Excel / JSON)
              </label>
              <input
                type="file"
                id="file-upload"
                accept=".json, .xlsx, .xls, .csv"
                onChange={handleFileUpload}
              />
              <small>
                يدعم ملفات Excel (.xlsx) و JSON — سيتم استخراج الكروت تلقائياً
              </small>
            </div>

            <div className="form-grid">
              {uniqueDurations.length > 1 && (
                <div className="form-group full-width-field">
                  <label htmlFor="durationFilter" style={{ color: "var(--accent-light)", fontWeight: "bold" }}>
                    تصفية حسب المدة
                  </label>
                  <select
                    id="durationFilter"
                    className="filter-select"
                    value={selectedDurationFilter}
                    onChange={(e) => setSelectedDurationFilter(e.target.value)}
                  >
                    <option value="all">كل الفئات المتاحة ({vouchers.length} كرت)</option>
                    {uniqueDurations.map((d) => {
                      const count = vouchers.filter(v => {
                        let vDuration = duration;
                        if (typeof v === "object" && v !== null) {
                          const dKey = Object.keys(v).find(k => k.toLowerCase() === "duration");
                          if (dKey && v[dKey] !== undefined && v[dKey] !== "") {
                            vDuration = friendlyDuration(v[dKey]);
                          }
                        }
                        return vDuration === d;
                      }).length;
                      return (
                        <option key={d} value={d}>
                          فئة {d} ({count} كرت)
                        </option>
                      );
                    })}
                  </select>
                  <small>
                    تحديد فئة معينة سيطبع هذه الفئة فقط
                  </small>
                </div>
              )}

              <div className="form-group full-width-field">
                <label htmlFor="layoutPreset">حجم الكروت</label>
                <select
                  id="layoutPreset"
                  value={layoutPreset}
                  onChange={(e) => setLayoutPreset(e.target.value)}
                >
                  {Object.values(LAYOUT_PRESETS).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width-field">
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
                <label htmlFor="duration">المدة</label>
                <input
                  type="text"
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="مثال: 30 يوم"
                />
              </div>

              <div className="form-group">
                <label htmlFor="gb">البيانات (جيجا)</label>
                <input
                  type="number"
                  id="gb"
                  value={gb}
                  onChange={(e) => setGb(e.target.value)}
                  placeholder="مثال: 10"
                  disabled={unlimitedTraffic}
                  style={{
                    opacity: unlimitedTraffic ? 0.35 : 1,
                  }}
                />
              </div>

              <div className="form-group checkboxes-row">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    id="showTraffic"
                    checked={showTraffic}
                    onChange={(e) => setShowTraffic(e.target.checked)}
                  />
                  <label htmlFor="showTraffic" style={{ marginBottom: 0, cursor: "pointer" }}>
                    إظهار سعة البيانات
                  </label>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    id="unlimitedTraffic"
                    checked={unlimitedTraffic}
                    onChange={(e) => setUnlimitedTraffic(e.target.checked)}
                  />
                  <label htmlFor="unlimitedTraffic" style={{ marginBottom: 0, cursor: "pointer" }}>
                    ترافيك غير محدود
                  </label>
                </div>
              </div>
            </div>

            <button className="btn-primary" onClick={() => window.print()}>
              طباعة / حفظ كملف PDF
            </button>
          </div>
        </section>

        <section className="preview-section">
          {filteredVouchers.length > 0 ? (
            <div className="no-print">
              <div className="instructions">
                <h3>معاينة الطباعة</h3>
                <div className="stats-bar">
                  <div className="stat-chip">
                    العدد: <span className="stat-value">{filteredVouchers.length} كرت</span>
                  </div>
                  <div className="stat-chip">
                    الصفحات: <span className="stat-value">{Math.ceil(filteredVouchers.length / activePreset.pageSize)} صفحة</span>
                  </div>
                  <div className="stat-chip">
                    لكل صفحة: <span className="stat-value">{activePreset.pageSize} كرت</span>
                  </div>
                </div>
              </div>
              <div className="example-card-wrapper">
                <p className="example-label">نموذج الكرت</p>
                <div className="example-card-container">
                  <VoucherCard
                    index={1}
                    voucher={filteredVouchers[0]}
                    ssid={ssid}
                    gb={unlimitedTraffic ? "غير محدود" : gb}
                    duration={duration}
                    showTraffic={showTraffic}
                    preset={activePreset}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state no-print">
              <div className="empty-icon">—</div>
              <h3>لا يوجد كروت للمعاينة</h3>
              <p>قم برفع ملف الكروت لمعاينة التصميم هنا</p>
            </div>
          )}

          {/* Full grid hidden on screen, only visible during print */}
          {filteredVouchers.length > 0 && (
            <div className="print-only-grid">
              <VoucherGrid
                vouchers={filteredVouchers}
                ssid={ssid}
                gb={unlimitedTraffic ? "غير محدود" : gb}
                duration={duration}
                showTraffic={showTraffic}
                preset={activePreset}
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
