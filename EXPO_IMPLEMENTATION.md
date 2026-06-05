# دليل تطوير تطبيق الهاتف (Expo React Native Android App)

هذا الدليل يوضح كيفية بناء تطبيق هاتف لنظام أندرويد متوافق بالكامل مع نظام تصميم وتوليد الكروت الحالي باستخدام **Expo** و **React Native**.

---

## 1. بنية التطبيق على الهاتف (Mobile Architecture)

بما أن الهواتف لا تحتوي على خيار "طباعة الصفحة" التلقائي للمتصفح بنفس الطريقة، سنستخدم استراتيجية **توليد ملف HTML ديناميكي** داخل التطبيق وتمريره إلى مكتبة الطباعة الأصلية لنظام أندرويد لتوليد ملف PDF بأبعاد A4 دقيقة ومطابقة تماماً لتصميم الويب.

### المكتبات الأساسية المطلوبة:
- **`expo-document-picker`**: لفتح واختيار ملفات Excel (XLSX/XLS) أو JSON من الهاتف.
- **`expo-file-system`**: لقراءة محتوى الملفات المرفوعة كـ Base64 أو نصوص.
- **`xlsx`**: لتحليل وفك ملفات Excel على الهاتف.
- **`expo-print`**: لتوليد ملف PDF من كود HTML/CSS وطباعته مباشرة باستخدام حوار الطباعة الأصلي في أندرويد.
- **`expo-sharing`**: لمشاركة ملف الـ PDF الناتج عبر واتساب أو حفظه في ملفات الهاتف.

---

## 2. إعداد المشروع وتثبيت المكتبات

قم بإنشاء مشروع Expo جديد في مجلد مستقل واتباع الخطوات التالية:

```bash
# إنشاء مشروع إكسبو جديد
npx create-expo-app@latest VoucherDesignerApp --template blank

# الدخول للمشروع
cd VoucherDesignerApp

# تثبيت المكتبات الأساسية
npx expo install expo-document-picker expo-file-system expo-print expo-sharing xlsx
```

---

## 3. منطق قراءة وتحليل الملفات (File Parsing)

في React Native، عند اختيار ملف باستخدام `expo-document-picker` نحصل على مسار محلي (`uri`). سنقوم بقراءة هذا المسار باستخدام `expo-file-system` بصيغة `base64` ثم تحليله عبر مكتبة `xlsx`.

إليك كود معالجة الملفات المرفوعة:

```javascript
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import XLSX from 'xlsx';

// دالة اختيار وتحليل الملف
const handlePickDocument = async (setVouchers, autoDetectFields) => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
        'application/vnd.ms-excel', // xls
        'application/json',
        'text/csv'
      ],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) return;

    const file = result.assets[0];
    const fileUri = file.uri;
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension === 'json') {
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      const json = JSON.parse(fileContent);
      let list = Array.isArray(json) ? json : (json.vouchers || []);
      setVouchers(list);
      autoDetectFields(list);
    } else {
      // قراءة ملف Excel كـ base64
      const fileContentBase64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const workbook = XLSX.read(fileContentBase64, { type: 'base64' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonArray = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      
      setVouchers(jsonArray);
      autoDetectFields(jsonArray);
    }
  } catch (error) {
    console.error("Error reading file:", error);
    alert("حدث خطأ أثناء تحميل وقراءة الملف.");
  }
};
```

---

## 4. توليد كود HTML متوافق مع طباعة A4

سنقوم بتمرير كود HTML مدمج به التنسيقات (CSS) إلى مكتبة `expo-print`. 

```javascript
const generateHtmlTemplate = (vouchers, ssid, duration, gb, showTraffic, preset) => {
  // توليد كروت HTML
  const cardsHtml = vouchers.map((v, idx) => {
    let code = "N/A";
    if (typeof v === "string") code = v;
    else if (typeof v === "object" && v !== null) {
      code = v["Voucher Code"] || v.pin || v.code || v.password || Object.values(v)[0] || "N/A";
    }

    // فك وتحديد البيانات والمدة لكل كرت
    let cardDuration = duration;
    let cardGb = gb;
    if (typeof v === "object" && v !== null) {
      const dKey = Object.keys(v).find(k => k.toLowerCase() === "duration");
      if (dKey && v[dKey]) cardDuration = friendlyDuration(v[dKey]);

      const tKey = Object.keys(v).find(k => k.toLowerCase() === "traffic limit" || k.toLowerCase() === "trafficlimit");
      if (tKey && v[tKey]) cardGb = friendlyTraffic(v[tKey]);
    }

    const isUnlimited = String(cardGb).trim() === "غير محدود" || String(cardGb).trim() === "0" || String(cardGb).trim() === "";
    const displayGb = isUnlimited ? "غير محدود" : String(cardGb).trim();
    const displayGbSuffix = isUnlimited ? "" : "GB";

    return `
      <div class="voucher-card">
        <div class="card-content" style="gap: ${preset.gapCard};">
          <div class="card-ssid" style="font-size: ${preset.fontSizeSsid};">
            <svg xmlns="http://www.w3.org/2000/svg" width="${preset.iconSize}" height="${preset.iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 4px; display: inline-block; vertical-align: middle;">
              <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
              <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
              <line x1="12" y1="20" x2="12.01" y2="20"></line>
            </svg>
            <span style="vertical-align: middle;">${ssid}</span>
          </div>
          <div class="card-pin" style="font-size: ${preset.fontSizePin}; padding: ${preset.pinPadding};">
            ${code}
          </div>
          <div class="card-info" style="font-size: ${preset.fontSizeInfo};">
            <span>${cardDuration}</span>
            ${showTraffic ? `
              <span style="margin: 0 3px;">•</span>
              <span>${displayGb} ${displayGbSuffix}</span>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // تقسيم الكروت إلى صفحات بناء على حجم الـ preset
  const pages = [];
  const pageSize = preset.pageSize;
  for (let i = 0; i < vouchers.length; i += pageSize) {
    const pageCards = vouchers.slice(i, i + pageSize);
    const pageHtml = pageCards.map((v, idx) => {
      // نفس منطق التوليد بالأعلى للكروت الفردية
      return cardsHtml; // تبسيط لتوليد المحتوى
    });
    
    pages.push(`
      <div class="a4-page" style="grid-template-columns: repeat(${preset.columns}, 1fr); grid-template-rows: repeat(${preset.rows}, 1fr);">
        ${pageHtml}
      </div>
    `);
  }

  // الكود الكامل لملف الطباعة
  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Inter', sans-serif;
          background: white;
        }
        .a4-page {
          width: 210mm;
          height: 297mm;
          box-sizing: border-box;
          padding: 10mm;
          display: grid;
          row-gap: 2mm;
          column-gap: 2mm;
          page-break-after: always;
          page-break-inside: avoid;
        }
        .voucher-card {
          position: relative;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          padding: 0mm;
          box-sizing: border-box;
          text-align: center;
          background: #fff;
          overflow: hidden;
        }
        .card-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
        }
        .card-ssid {
          font-weight: 700;
          color: #1e293b;
        }
        .card-pin {
          font-weight: 800;
          color: #0f172a;
          font-family: monospace;
          letter-spacing: 2px;
          margin: 4px 0;
        }
        .card-info {
          font-weight: 600;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          .a4-page {
            box-shadow: none;
            border: none;
            margin: 0;
          }
        }
      </style>
    </head>
    <body>
      ${pages.join('')}
    </body>
    </html>
  `;
};
```

---

## 5. منطق تنفيذ الطباعة ومشاركة الملف (PDF Generation & Printing)

مكتبة `expo-print` تسمح بتوليد ملف PDF وحفظه في ذاكرة مؤقتة، ثم يمكن مشاركته أو طباعته:

```javascript
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// دالة الطباعة المباشرة
const printPDF = async (htmlContent) => {
  try {
    await Print.printAsync({
      html: htmlContent,
    });
  } catch (error) {
    console.error("Print error:", error);
  }
};

// دالة توليد ملف PDF ومشاركته (مثال: إرساله للواتساب أو حفظه)
const sharePDF = async (htmlContent, fileName) => {
  try {
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
    });
    
    // إعادة تسمية الملف ليكون احترافياً
    const newUri = FileSystem.cacheDirectory + `${fileName}.pdf`;
    await FileSystem.moveAsync({
      from: uri,
      to: newUri
    });

    await Sharing.shareAsync(newUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'حفظ أو مشاركة ملف الكروت',
      UTI: 'com.adobe.pdf'
    });
  } catch (error) {
    console.error("Sharing error:", error);
  }
};
```

---

## 6. واجهة المستخدم المقترحة باستخدام React Native

إليك نموذج متكامل لواجهة شاشة واحدة (`App.js`) تقدم تحكماً كاملاً للمستخدم:

```jsx
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // تثبيت: npm install @react-native-picker/picker

export default function App() {
  const [vouchers, setVouchers] = useState([]);
  const [ssid, setSsid] = useState("شبكة واي فاي");
  const [gb, setGb] = useState("10");
  const [duration, setDuration] = useState("1 يوم");
  const [showTraffic, setShowTraffic] = useState(false);
  const [layoutPreset, setLayoutPreset] = useState("large");
  const [selectedFilter, setSelectedFilter] = useState("all");

  // الإعدادات المقترحة لطباعة الهاتف
  const presets = {
    large: { id: "large", label: "كبير (40 كرت/صفحة)", pageSize: 40, columns: 4, rows: 10, fontSizePin: '16px', fontSizeSsid: '10px', fontSizeInfo: '8px', gapCard: '2px', iconSize: 10 },
    medium: { id: "medium", label: "متوسط (60 كرت/صفحة)", pageSize: 60, columns: 5, rows: 12, fontSizePin: '13px', fontSizeSsid: '8.5px', fontSizeInfo: '7px', gapCard: '1.5px', iconSize: 8 },
    // باقي الأحجام ...
  };

  const activePreset = presets[layoutPreset];

  const handlePrint = () => {
    // تصفية الكروت حسب الفئة المحددة
    const filtered = vouchers.filter(v => {
      if (selectedFilter === "all") return true;
      // منطق فلترة المدة
      return true;
    });

    const html = generateHtmlTemplate(filtered, ssid, duration, gb, showTraffic, activePreset);
    const fileName = `${ssid} - ${duration} - ${filtered.length} كرت`;
    
    printPDF(html);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>مصمم كروت واي فاي</Text>
      
      <TouchableOpacity 
        style={styles.pickButton} 
        onPress={() => handlePickDocument(setVouchers, (list) => { /* منطق الفحص التلقائي */ })}
      >
        <Text style={styles.buttonText}>اختيار ملف الكروت (Excel / JSON)</Text>
      </TouchableOpacity>

      {vouchers.length > 0 && (
        <View style={styles.statsCard}>
          <Text style={styles.statsText}>إجمالي الكروت المحملة: {vouchers.length} كرت</Text>
          <Text style={styles.statsText}>عدد صفحات الطباعة: {Math.ceil(vouchers.length / activePreset.pageSize)} صفحة</Text>
        </View>
      )}

      {/* حقول الإدخال والخيارات */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>اسم الشبكة (SSID)</Text>
        <TextInput style={styles.input} value={ssid} onChangeText={setSsid} />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>المدة</Text>
        <TextInput style={styles.input} value={duration} onChangeText={setDuration} />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>سعة البيانات (جيجا)</Text>
        <TextInput style={styles.input} value={gb} onChangeText={setGb} />
      </View>

      <View style={styles.switchGroup}>
        <Text style={styles.label}>إظهار سعة البيانات</Text>
        <Switch value={showTraffic} onValueChange={setShowTraffic} />
      </View>

      <TouchableOpacity style={styles.printButton} onPress={handlePrint}>
        <Text style={styles.buttonText}>توليد ملف PDF والطباعة</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, alignItems: 'stretch' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginVertical: 20, color: '#0f172a' },
  pickButton: { backgroundColor: '#3b82f6', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  printButton: { backgroundColor: '#10b981', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  formGroup: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 5, textAlign: 'right' },
  input: { backgroundColor: 'white', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1', textAlign: 'right' },
  switchGroup: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  statsCard: { backgroundColor: '#eff6ff', padding: 15, borderRadius: 8, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#2563eb' },
  statsText: { fontSize: 14, color: '#1e40af', fontWeight: '600', textAlign: 'right', marginBottom: 5 }
});
```

---

## 7. تعليمات تجميع وبناء ملف الـ APK للأندرويد

للحصول على ملف تثبيت مباشرة لهاتف أندرويد (`.apk`)، سنستخدم خدمات **EAS Build** السحابية من Expo:

1. قم بتثبيت أداة EAS CLI عالمياً:
   ```bash
   npm install -g eas-cli
   ```
2. سجل دخولك بحساب Expo الخاص بك:
   ```bash
   eas login
   ```
3. قم بتهيئة إعدادات البناء السحابي في تطبيقك:
   ```bash
   eas build:configure
   ```
4. لتوليد ملف APK قابل للتثبيت مباشرة على الهواتف للتجربة والتشغيل، قم بإضافة إعدادات `preview` داخل ملف `eas.json` المتولد تلقائياً:
   ```json
   {
     "build": {
       "preview": {
         "android": {
           "buildType": "apk"
         }
       },
       "production": {}
     }
   }
   ```
5. قم بتشغيل أمر البناء للحصول على رابط تنزيل ملف الـ APK:
   ```bash
   eas build -p android --profile preview
   ```
   *سيقوم الخادم السحابي ببناء التطبيق وتوفير رابط تنزيل مباشر أو كود QR لتثبيت التطبيق على جهاز أندرويد الخاص بك فوراً.*
