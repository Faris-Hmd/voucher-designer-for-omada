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
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("all");
  const [groupByUserGroup, setGroupByUserGroup] = useState(false);
  const [systemTheme, setSystemTheme] = useState("omada"); // 'omada' or 'ruijie'

  // States for imports
  const [importMode, setImportMode] = useState("single"); // 'single' or 'compare'
  const [singleFileVouchers, setSingleFileVouchers] = useState([]);
  const [oldFileVouchers, setOldFileVouchers] = useState([]);
  const [newFileVouchers, setNewFileVouchers] = useState([]);
  const [comparisonStats, setComparisonStats] = useState(null);

  const activePreset = LAYOUT_PRESETS[layoutPreset] || LAYOUT_PRESETS.large;

  // Helper to extract voucher code key from object
  const getVoucherCode = (voucher) => {
    if (!voucher) return "";
    if (typeof voucher === "string") return voucher;
    if (typeof voucher === "object") {
      if (voucher["Voucher code"]) return String(voucher["Voucher code"]);
      if (voucher["Voucher Code"]) return String(voucher["Voucher Code"]);
      if (voucher.pin) return String(voucher.pin);
      if (voucher.code) return String(voucher.code);
      if (voucher.password) return String(voucher.password);
      if (voucher.username) return String(voucher.username);
      const values = Object.values(voucher);
      if (values.length > 0) return String(values[0]);
    }
    return "";
  };

  // Helper to parse file
  const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
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
              reject(new Error("لم يتم العثور على مصفوفة كروت في ملف JSON."));
              return;
            }
            resolve(parsedList);
          } else if (ext === "xlsx" || ext === "xls" || ext === "csv") {
            const XLSX = await import("xlsx");

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
            resolve(jsonArray);
          } else {
            reject(new Error("أمتداد الملف غير مدعوم. الرجاء رفع JSON أو Excel."));
          }
        } catch (err) {
          reject(err);
        }
      };

      if (ext === "json") {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  };

  const autoDetectFields = (list) => {
    if (!list || list.length === 0) return;
    const first = list[0];
    if (typeof first !== "object" || first === null) return;

    // Auto-detect system brand theme based on columns
    const hasRuijieKeys = Object.keys(first).some(
      k => k.toLowerCase() === "period" || k.toLowerCase() === "traffic used/total"
    );
    if (hasRuijieKeys) {
      setSystemTheme("ruijie");
    } else {
      const hasOmadaKeys = Object.keys(first).some(
        k => k.toLowerCase() === "voucher code" && k === "Voucher Code"
      );
      if (hasOmadaKeys) {
        setSystemTheme("omada");
      }
    }

    // Detect duration (Period or Duration)
    const dKey = Object.keys(first).find(
      k => k.toLowerCase() === "duration" || k.toLowerCase() === "period"
    );
    if (dKey && first[dKey] !== undefined && first[dKey] !== "") {
      const detected = friendlyDuration(first[dKey]);
      if (detected) setDuration(detected);
    }

    // Detect traffic limit (Traffic Used/Total or Traffic Limit)
    const tKey = Object.keys(first).find(
      k => k.toLowerCase() === "traffic limit" || 
           k.toLowerCase() === "trafficlimit" || 
           k.toLowerCase() === "traffic_limit" ||
           k.toLowerCase() === "traffic used/total" ||
           k.toLowerCase() === "traffic_used_total"
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

  const handleSingleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await parseExcelFile(file);
      setSingleFileVouchers(data);
      setSelectedDurationFilter("all");
      setSelectedGroupFilter("all");
    } catch (err) {
      alert("حدث خطأ أثناء تحميل الملف: " + err.message);
    }
  };

  const handleOldFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await parseExcelFile(file);
      setOldFileVouchers(data);
    } catch (err) {
      alert("حدث خطأ أثناء تحميل الملف القديم: " + err.message);
    }
  };

  const handleNewFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await parseExcelFile(file);
      setNewFileVouchers(data);
      setSelectedDurationFilter("all");
      setSelectedGroupFilter("all");
    } catch (err) {
      alert("حدث خطأ أثناء تحميل الملف الجديد: " + err.message);
    }
  };

  // Sync vouchers based on import mode
  useEffect(() => {
    if (importMode === "single") {
      setVouchers(singleFileVouchers);
      setComparisonStats(null);
      if (singleFileVouchers.length > 0) {
        autoDetectFields(singleFileVouchers);
      }
    } else {
      if (newFileVouchers.length > 0) {
        const oldCodes = new Set(
          oldFileVouchers.map(v => getVoucherCode(v).trim().toLowerCase()).filter(Boolean)
        );
        const filtered = newFileVouchers.filter(v => {
          const code = getVoucherCode(v).trim().toLowerCase();
          return !oldCodes.has(code);
        });
        setVouchers(filtered);
        setComparisonStats({
          totalNew: newFileVouchers.length,
          excluded: newFileVouchers.length - filtered.length,
          printed: filtered.length
        });
        if (filtered.length > 0) {
          autoDetectFields(filtered);
        }
      } else {
        setVouchers([]);
        setComparisonStats(null);
      }
    }
  }, [importMode, singleFileVouchers, oldFileVouchers, newFileVouchers]);

  // Unique fields for dropdown filters
  const uniqueDurations = [...new Set(vouchers.map(v => {
    if (typeof v === "object" && v !== null) {
      const dKey = Object.keys(v).find(k => k.toLowerCase() === "duration" || k.toLowerCase() === "period");
      if (dKey && v[dKey] !== undefined && v[dKey] !== "") {
        return friendlyDuration(v[dKey]);
      }
    }
    return duration;
  }))];

  const uniqueGroups = [...new Set(vouchers.map(v => {
    if (typeof v === "object" && v !== null) {
      const gKey = Object.keys(v).find(k => k.toLowerCase() === "user group" || k.toLowerCase() === "user_group" || k.toLowerCase() === "usergroup");
      if (gKey && v[gKey] !== undefined && v[gKey] !== "") {
        return String(v[gKey]);
      }
    }
    return "";
  }).filter(Boolean))];

  // Filter vouchers
  const filteredVouchers = vouchers.filter(v => {
    let matchDuration = true;
    if (selectedDurationFilter !== "all") {
      let vDuration = duration;
      if (typeof v === "object" && v !== null) {
        const dKey = Object.keys(v).find(k => k.toLowerCase() === "duration" || k.toLowerCase() === "period");
        if (dKey && v[dKey] !== undefined && v[dKey] !== "") {
          vDuration = friendlyDuration(v[dKey]);
        }
      }
      matchDuration = (vDuration === selectedDurationFilter);
    }

    let matchGroup = true;
    if (selectedGroupFilter !== "all") {
      let vGroup = "أخرى";
      if (typeof v === "object" && v !== null) {
        const gKey = Object.keys(v).find(k => k.toLowerCase() === "user group" || k.toLowerCase() === "user_group" || k.toLowerCase() === "usergroup");
        if (gKey && v[gKey] !== undefined && v[gKey] !== "") {
          vGroup = String(v[gKey]);
        }
      }
      matchGroup = (vGroup === selectedGroupFilter);
    }

    return matchDuration && matchGroup;
  });

  // Grouping for print if checked
  const getVoucherUserGroup = (v) => {
    if (typeof v === "object" && v !== null) {
      const gKey = Object.keys(v).find(k => k.toLowerCase() === "user group" || k.toLowerCase() === "user_group" || k.toLowerCase() === "usergroup");
      if (gKey && v[gKey] !== undefined && v[gKey] !== "") {
        return String(v[gKey]);
      }
    }
    return "أخرى";
  };

  const groupedVouchers = {};
  if (groupByUserGroup) {
    filteredVouchers.forEach(v => {
      const grp = getVoucherUserGroup(v);
      if (!groupedVouchers[grp]) {
        groupedVouchers[grp] = [];
      }
      groupedVouchers[grp].push(v);
    });
  }

  // Update dynamic document title for print name
  useEffect(() => {
    const activeDuration = selectedDurationFilter === "all" ? duration : selectedDurationFilter;
    const activeGroup = selectedGroupFilter === "all" ? "" : ` - ${selectedGroupFilter}`;
    const sysName = systemTheme === "omada" ? "أومادا" : "رويجي";
    document.title = `${ssid} - ${sysName} - ${activeDuration}${activeGroup} - ${filteredVouchers.length} كرت`;
  }, [ssid, duration, selectedDurationFilter, selectedGroupFilter, filteredVouchers.length, systemTheme]);

  return (
    <div className={`app-container system-${systemTheme}`} dir="rtl">
      <header className="no-print header">
        <div className="header-content-wrapper">
          <div className="header-content">
            <h1>مصمم كروت الواي فاي</h1>
            <p>
              تصميم وطباعة كروت واي فاي احترافية على ورق A4 (Omada & Ruijie)
            </p>
          </div>
          <div className="system-selector">
            <button
              type="button"
              className={`system-tab ${systemTheme === "omada" ? "active" : ""}`}
              onClick={() => setSystemTheme("omada")}
            >
              TP-Link Omada
            </button>
            <button
              type="button"
              className={`system-tab ${systemTheme === "ruijie" ? "active" : ""}`}
              onClick={() => setSystemTheme("ruijie")}
            >
              Ruijie Reyee
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <section className="controls-section no-print">
          <div className="card-panel shadow-panel">
            <h2>إعدادات التصميم</h2>

            {/* Import Mode Toggle */}
            <div className="form-group">
              <label>طريقة استيراد الكروت</label>
              <div className="import-mode-tabs">
                <button
                  type="button"
                  className={`mode-tab ${importMode === "single" ? "active" : ""}`}
                  onClick={() => setImportMode("single")}
                >
                  ملف كروت واحد
                </button>
                <button
                  type="button"
                  className={`mode-tab ${importMode === "compare" ? "active" : ""}`}
                  onClick={() => setImportMode("compare")}
                >
                  مقارنة ملفين (تصفية القديم)
                </button>
              </div>
            </div>

            {/* Single File Upload */}
            {importMode === "single" && (
              <div className="form-group">
                <label htmlFor="file-upload">
                  رفع بيانات الكروت (Excel / JSON)
                </label>
                <input
                  type="file"
                  id="file-upload"
                  accept=".json, .xlsx, .xls, .csv"
                  onChange={handleSingleFileUpload}
                />
                <small>
                  قم برفع ملف الكروت — يدعم ملفات Omada و Ruijie
                </small>
              </div>
            )}

            {/* Comparison Dual-File Upload */}
            {importMode === "compare" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1rem" }}>
                <div className="form-group">
                  <label htmlFor="old-file-upload">
                    1. ملف الكروت القديمة (مرجع لاستبعاده)
                  </label>
                  <input
                    type="file"
                    id="old-file-upload"
                    accept=".json, .xlsx, .xls, .csv"
                    onChange={handleOldFileUpload}
                  />
                  <small style={{ color: "var(--text-muted)" }}>
                    سيتم قراءة الكروت من هذا الملف واستبعادها من الملف الجديد لمنع التكرار
                  </small>
                </div>
                <div className="form-group">
                  <label htmlFor="new-file-upload">
                    2. ملف الكروت الجديدة (المراد طباعتها)
                  </label>
                  <input
                    type="file"
                    id="new-file-upload"
                    accept=".json, .xlsx, .xls, .csv"
                    onChange={handleNewFileUpload}
                  />
                  <small style={{ color: "var(--accent)" }}>
                    سيتم طباعة كروت هذا الملف فقط بعد استبعاد الكروت المكررة الموجودة بالملف القديم
                  </small>
                </div>

                {comparisonStats && (
                  <div className={`comparison-stats ${comparisonStats.excluded > 0 ? "has-excluded" : ""}`}>
                    <div className="comparison-stat-item">
                      <span>إجمالي كروت الملف الجديد:</span>
                      <span className="highlight">{comparisonStats.totalNew} كرت</span>
                    </div>
                    <div className="comparison-stat-item">
                      <span>الكروت المستبعدة (المكررة):</span>
                      <span className="excluded">{comparisonStats.excluded} كرت</span>
                    </div>
                    <div className="comparison-stat-item">
                      <span>الكروت الصالحة للطباعة:</span>
                      <span className="success">{comparisonStats.printed} كرت</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="form-grid">
              {/* Duration Filter */}
              {uniqueDurations.length > 0 && vouchers.length > 0 && (
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
                    <option value="all">كل المدد المتاحة ({vouchers.length} كرت)</option>
                    {uniqueDurations.map((d) => {
                      const count = vouchers.filter(v => {
                        let vDuration = duration;
                        if (typeof v === "object" && v !== null) {
                          const dKey = Object.keys(v).find(k => k.toLowerCase() === "duration" || k.toLowerCase() === "period");
                          if (dKey && v[dKey] !== undefined && v[dKey] !== "") {
                            vDuration = friendlyDuration(v[dKey]);
                          }
                        }
                        return vDuration === d;
                      }).length;
                      return (
                        <option key={d} value={d}>
                          مدة {d} ({count} كرت)
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Profile Group Filter (only shows up if User Groups exist) */}
              {uniqueGroups.length > 0 && vouchers.length > 0 && (
                <div className="form-group full-width-field">
                  <label htmlFor="groupFilter" style={{ color: "var(--accent-light)", fontWeight: "bold" }}>
                    تصفية حسب مجموعة المستخدمين (User Group)
                  </label>
                  <select
                    id="groupFilter"
                    className="filter-select"
                    value={selectedGroupFilter}
                    onChange={(e) => setSelectedGroupFilter(e.target.value)}
                  >
                    <option value="all">كل المجموعات المتاحة</option>
                    {uniqueGroups.map((g) => {
                      const count = vouchers.filter(v => {
                        let vGroup = "أخرى";
                        if (typeof v === "object" && v !== null) {
                          const gKey = Object.keys(v).find(k => k.toLowerCase() === "user group" || k.toLowerCase() === "user_group" || k.toLowerCase() === "usergroup");
                          if (gKey && v[gKey] !== undefined && v[gKey] !== "") {
                            vGroup = String(v[gKey]);
                          }
                        }
                        return vGroup === g;
                      }).length;
                      return (
                        <option key={g} value={g}>
                          مجموعة {g} ({count} كرت)
                        </option>
                      );
                    })}
                  </select>
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

              {/* Group by Profile Group printing option (only shows if User Groups exist) */}
              {uniqueGroups.length > 0 && vouchers.length > 0 && (
                <div className="form-group full-width-field" style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="checkbox"
                      id="groupByUserGroup"
                      checked={groupByUserGroup}
                      onChange={(e) => setGroupByUserGroup(e.target.checked)}
                    />
                    <label htmlFor="groupByUserGroup" style={{ marginBottom: 0, cursor: "pointer", fontWeight: "bold", color: "var(--accent)" }}>
                      تقسيم الصفحات حسب مجموعة المستخدمين (User Group)
                    </label>
                  </div>
                  <small style={{ marginTop: "0.25rem" }}>
                    عند التفعيل، ستبدأ كل مجموعة مستخدمين (مثل: day, hour) في صفحة A4 جديدة بدلاً من دمجها.
                  </small>
                </div>
              )}
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
                  {groupByUserGroup && uniqueGroups.length > 0 ? (
                    Object.entries(groupedVouchers).map(([grp, list]) => (
                      <div className="stat-chip" key={grp}>
                        مجموعة {grp}: <span className="stat-value">{list.length} كرت ({Math.ceil(list.length / activePreset.pageSize)} صفحة)</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="stat-chip">
                        الصفحات: <span className="stat-value">{Math.ceil(filteredVouchers.length / activePreset.pageSize)} صفحة</span>
                      </div>
                      <div className="stat-chip">
                        لكل صفحة: <span className="stat-value">{activePreset.pageSize} كرت</span>
                      </div>
                    </>
                  )}
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
              {groupByUserGroup && uniqueGroups.length > 0 ? (
                Object.entries(groupedVouchers).map(([grp, list]) => (
                  <div key={grp} className="print-group-wrapper">
                    <h3 className="no-print group-header-preview">
                      مجموعة: {grp}
                      <span>العدد: {list.length} كرت</span>
                    </h3>
                    <VoucherGrid
                      vouchers={list}
                      ssid={ssid}
                      gb={unlimitedTraffic ? "غير محدود" : gb}
                      duration={duration}
                      showTraffic={showTraffic}
                      preset={activePreset}
                    />
                  </div>
                ))
              ) : (
                <VoucherGrid
                  vouchers={filteredVouchers}
                  ssid={ssid}
                  gb={unlimitedTraffic ? "غير محدود" : gb}
                  duration={duration}
                  showTraffic={showTraffic}
                  preset={activePreset}
                />
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
