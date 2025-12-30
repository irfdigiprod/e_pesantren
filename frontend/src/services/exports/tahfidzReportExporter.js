import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

/**
 * Export Tahfidz Report to Excel
 * @param {Object} data - The report data
 * @param {string} data.semester
 * @param {string} data.academicYear
 * @param {Object} data.student
 * @param {Array} data.upkExams - Array of 8 items (or max available)
 * @param {string|number} data.avgUPK
 * @param {Array} data.ukjExams
 * @param {string|number} data.avgUKJ
 * @param {string|number} data.uaScore
 * @param {string|number} data.sulukScore
 * @param {string|number} data.finalScore
 * @param {string} data.tercapaiLabel
 * @param {Array} data.madingData
 * @param {string|number} data.targetHafalan
 * @param {string|number} data.totalHafalan
 * @param {string} data.jumlahJuz
 * @param {string} data.keteranganHafalan
 * @param {Object} data.attendance
 * @param {string} data.notes
 * @param {string} data.tahfidzHeadNameDisplay
 * @param {string} data.cityName
 * @param {string} data.currentDate
 */
export async function exportTahfidzReportToExcel(data) {
  const {
    semester,
    academicYear,
    student,
    upkExams,
    avgUPK,
    ukjExams,
    avgUKJ,
    uaScore,
    sulukScore,
    finalScore,
    tercapaiLabel,
    madingData,
    targetHafalan,
    totalHafalan,
    jumlahJuz,
    keteranganHafalan,
    attendance,
    notes,
    tahfidzHeadNameDisplay,
    cityName,
    currentDate,
  } = data;

  if (!student) return;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Rapor Tahfidz");

  // Page setup
  worksheet.pageSetup = {
    paperSize: 9, // A4
    orientation: "portrait",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    margins: {
      left: 0.6,
      right: 0.6,
      top: 0.6,
      bottom: 0.6,
      header: 0,
      footer: 0,
    },
    horizontalCentered: true,
  };

  worksheet.headerFooter = {
    oddHeader: "",
    oddFooter: "",
    evenHeader: "",
    evenFooter: "",
    firstHeader: "",
    firstFooter: "",
  };

  // Column setup - 23 columns (A-W)
  const cols = [];
  for (let i = 0; i < 23; i++) cols.push({ width: 5.5 });
  worksheet.columns = cols;

  // Helpers
  const addBorder = (cell) => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  };

  const centerStyle = { vertical: "middle", horizontal: "center" };
  const leftStyle = { vertical: "middle", horizontal: "left" };
  const boldFont = { bold: true, name: "Arial", size: 10 };
  const normalFont = { name: "Arial", size: 10 };
  const titleFont = { bold: true, name: "Arial", size: 12 };
  const smallBoldFont = { bold: true, name: "Arial", size: 7 }; // For Keterangan

  // --- HEADER IMAGE (Rows 1-9) ---
  try {
    // Note: Fetching from public folder. Ensure this path is accessible.
    // In Vue component it was fetch("/images/tahfidz-header.png")
    const imageResponse = await fetch("/images/tahfidz-header.png");
    if (imageResponse.ok) {
      const imageBuffer = await imageResponse.arrayBuffer();
      const imageId = workbook.addImage({
        buffer: imageBuffer,
        extension: "png",
      });
      worksheet.addImage(imageId, {
        tl: { col: 0, row: 0 },
        br: { col: 23, row: 9 }, // Span A1:W9
        editAs: "oneCell",
      });
    }
  } catch (e) {
    console.error("Failed to load header image:", e);
  }

  let r = 11;

  // --- TITLE ---
  worksheet.mergeCells(`A${r}:W${r}`);
  worksheet.getCell(`A${r}`).value = `RAPOR TAHFIZH SEMESTER ${semester}`;
  worksheet.getCell(`A${r}`).font = titleFont;
  worksheet.getCell(`A${r}`).alignment = centerStyle;
  r++;

  worksheet.mergeCells(`A${r}:W${r}`);
  worksheet.getCell(`A${r}`).value = `Tahun Ajaran ${academicYear}`;
  worksheet.getCell(`A${r}`).font = boldFont;
  worksheet.getCell(`A${r}`).alignment = centerStyle;
  r += 2;

  // --- STUDENT INFO ---
  // Left side
  worksheet.mergeCells(`A${r}:B${r}`);
  worksheet.getCell(`A${r}`).value = "Nama";
  worksheet.getCell(`A${r}`).font = boldFont;
  worksheet.getCell(`A${r}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`A${r}`));

  worksheet.mergeCells(`C${r}:K${r}`);
  worksheet.getCell(`C${r}`).value = student.fullName;
  worksheet.getCell(`C${r}`).font = boldFont;
  addBorder(worksheet.getCell(`C${r}`));

  // Right side
  worksheet.mergeCells(`M${r}:N${r}`);
  worksheet.getCell(`M${r}`).value = "NISN";
  worksheet.getCell(`M${r}`).font = boldFont;
  worksheet.getCell(`M${r}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`M${r}`));

  worksheet.mergeCells(`O${r}:W${r}`);
  worksheet.getCell(`O${r}`).value = student.nis || "-";
  worksheet.getCell(`O${r}`).font = normalFont;
  addBorder(worksheet.getCell(`O${r}`));
  r++;

  // Halaqoh / Kelas
  worksheet.mergeCells(`A${r}:B${r}`);
  worksheet.getCell(`A${r}`).value = "Halaqoh";
  worksheet.getCell(`A${r}`).font = boldFont;
  worksheet.getCell(`A${r}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`A${r}`));

  worksheet.mergeCells(`C${r}:K${r}`);
  worksheet.getCell(`C${r}`).value = student.halaqah || "-";
  worksheet.getCell(`C${r}`).font = normalFont;
  addBorder(worksheet.getCell(`C${r}`));

  worksheet.mergeCells(`M${r}:N${r}`);
  worksheet.getCell(`M${r}`).value = "Kelas";
  worksheet.getCell(`M${r}`).font = boldFont;
  worksheet.getCell(`M${r}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`M${r}`));

  worksheet.mergeCells(`O${r}:W${r}`);
  worksheet.getCell(`O${r}`).value = student.className || "-";
  worksheet.getCell(`O${r}`).font = normalFont;
  addBorder(worksheet.getCell(`O${r}`));
  r += 2;

  // --- UPK SECTION TITLE ---
  worksheet.mergeCells(`A${r}:W${r}`);
  worksheet.getCell(`A${r}`).value = "Ujian Pekanan (UPK)";
  worksheet.getCell(`A${r}`).font = boldFont;
  worksheet.getCell(`A${r}`).alignment = centerStyle;
  r++;

  // UPK Header
  const upkHeaders = ["No", "Kode", "Halaman", "Nilai", "Predikat"];
  const upkLeftCols = ["A", "B:C", "D:H", "I", "J:K"];
  const upkRightCols = ["M", "N:O", "P:T", "U", "V:W"];

  for (let i = 0; i < upkHeaders.length; i++) {
    const leftCol = upkLeftCols[i];
    const rightCol = upkRightCols[i];

    if (leftCol.includes(":")) {
      worksheet.mergeCells(
        `${leftCol.split(":")[0]}${r}:${leftCol.split(":")[1]}${r}`
      );
    }
    const cellL = worksheet.getCell(`${leftCol.split(":")[0]}${r}`);
    cellL.value = upkHeaders[i];
    cellL.font = boldFont;
    cellL.alignment = centerStyle;
    cellL.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF3F4F6" },
    };
    addBorder(cellL);

    if (rightCol.includes(":")) {
      worksheet.mergeCells(
        `${rightCol.split(":")[0]}${r}:${rightCol.split(":")[1]}${r}`
      );
    }
    const cellR = worksheet.getCell(`${rightCol.split(":")[0]}${r}`);
    cellR.value = upkHeaders[i];
    cellR.font = boldFont;
    cellR.alignment = centerStyle;
    cellR.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF3F4F6" },
    };
    addBorder(cellR);
  }
  r++;

  // UPK Data (4 rows each side)
  // Ensure upkExams has at least 8 items (filled with null if not) or more if data exists
  const fullUpkExams = [...(upkExams || [])];
  // We want minimum 4 rows (8 items). If more, we expand.
  // One row holds 2 items (Left & Right).
  const minRows = 4;
  const neededRows = Math.max(minRows, Math.ceil(fullUpkExams.length / 2));

  // Pad array to needed size * 2
  while (fullUpkExams.length < neededRows * 2) fullUpkExams.push(null);

  for (let i = 0; i < neededRows; i++) {
    const leftExam = fullUpkExams[i] || {};
    const rightExam = fullUpkExams[i + 4] || {};

    // Left side
    worksheet.getCell(`A${r}`).value = i + 1;
    worksheet.getCell(`A${r}`).alignment = centerStyle;
    addBorder(worksheet.getCell(`A${r}`));

    worksheet.mergeCells(`B${r}:C${r}`);
    worksheet.getCell(`B${r}`).value = getExamCode(leftExam);
    worksheet.getCell(`B${r}`).alignment = centerStyle;
    addBorder(worksheet.getCell(`B${r}`));

    worksheet.mergeCells(`D${r}:H${r}`);
    worksheet.getCell(`D${r}`).value = getPageRange(leftExam);
    worksheet.getCell(`D${r}`).alignment = centerStyle;
    addBorder(worksheet.getCell(`D${r}`));

    worksheet.getCell(`I${r}`).value = leftExam.finalScore || "-";
    worksheet.getCell(`I${r}`).alignment = centerStyle;
    addBorder(worksheet.getCell(`I${r}`));

    worksheet.mergeCells(`J${r}:K${r}`);
    worksheet.getCell(`J${r}`).value = getPredicate(leftExam.finalScore);
    worksheet.getCell(`J${r}`).alignment = centerStyle;
    addBorder(worksheet.getCell(`J${r}`));

    // Right side
    worksheet.getCell(`M${r}`).value = i + 5;
    worksheet.getCell(`M${r}`).alignment = centerStyle;
    addBorder(worksheet.getCell(`M${r}`));

    worksheet.mergeCells(`N${r}:O${r}`);
    worksheet.getCell(`N${r}`).value = getExamCode(rightExam);
    worksheet.getCell(`N${r}`).alignment = centerStyle;
    addBorder(worksheet.getCell(`N${r}`));

    worksheet.mergeCells(`P${r}:T${r}`);
    worksheet.getCell(`P${r}`).value = getPageRange(rightExam);
    worksheet.getCell(`P${r}`).alignment = centerStyle;
    addBorder(worksheet.getCell(`P${r}`));

    worksheet.getCell(`U${r}`).value = rightExam.finalScore || "-";
    worksheet.getCell(`U${r}`).alignment = centerStyle;
    addBorder(worksheet.getCell(`U${r}`));

    worksheet.mergeCells(`V${r}:W${r}`);
    worksheet.getCell(`V${r}`).value = getPredicate(rightExam.finalScore);
    worksheet.getCell(`V${r}`).alignment = centerStyle;
    addBorder(worksheet.getCell(`V${r}`));

    r++;
  }

  // UPK Summary
  worksheet.mergeCells(`A${r}:C${r}`);
  worksheet.getCell(`A${r}`).value = "Nilai";
  worksheet.getCell(`A${r}`).font = boldFont;
  worksheet.getCell(`A${r}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`A${r}`));

  worksheet.mergeCells(`D${r}:K${r}`);
  worksheet.getCell(`D${r}`).value = avgUPK;
  worksheet.getCell(`D${r}`).font = boldFont;
  worksheet.getCell(`D${r}`).alignment = centerStyle;
  addBorder(worksheet.getCell(`D${r}`));

  worksheet.mergeCells(`M${r}:O${r}`);
  worksheet.getCell(`M${r}`).value = "Predikat";
  worksheet.getCell(`M${r}`).font = boldFont;
  worksheet.getCell(`M${r}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`M${r}`));

  worksheet.mergeCells(`P${r}:W${r}`);
  worksheet.getCell(`P${r}`).value = getPredicate(avgUPK);
  worksheet.getCell(`P${r}`).font = boldFont;
  worksheet.getCell(`P${r}`).alignment = centerStyle;
  addBorder(worksheet.getCell(`P${r}`));
  r += 2;

  // --- UKJ SECTION ---
  worksheet.mergeCells(`A${r}:W${r}`);
  worksheet.getCell(`A${r}`).value = "Ujian Kenaikan Juz (UKJ)";
  worksheet.getCell(`A${r}`).font = boldFont;
  worksheet.getCell(`A${r}`).alignment = centerStyle;
  r++;

  const ukjJuzRow1 = Array.from({ length: 21 }, (_, i) => i + 1);
  const ukjJuzRow2 = Array.from({ length: 9 }, (_, i) => i + 22);

  // Helper for UKJ Helpers
  const getUkjScore = (juz) => {
    const exam = ukjExams.find((e) => e.juz == juz);
    return exam ? exam.finalScore : "";
  };
  const getUkjPredicateHelper = (juz) => {
    const exam = ukjExams.find((e) => e.juz == juz);
    return exam ? getPredicate(exam.finalScore) : "";
  };
  const rincianJuz = (() => {
    const juzNumbers = ukjExams.map((e) => e.juz).filter(Boolean);
    return juzNumbers.length > 0 ? juzNumbers.join(", ") : "-";
  })();

  // Row 1: Juz Numbers 1-21 (Start Col C=3)
  worksheet.mergeCells(`A${r}:B${r}`);
  worksheet.getCell(`A${r}`).value = "Juz";
  worksheet.getCell(`A${r}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`A${r}`));

  for (let i = 0; i < 21; i++) {
    const cell = worksheet.getRow(r).getCell(i + 3); // Start C (3)
    cell.value = ukjJuzRow1[i];
    cell.alignment = centerStyle;
    addBorder(cell);
  }
  r++;

  // Row 2: Nilai 1-21
  worksheet.mergeCells(`A${r}:B${r}`);
  worksheet.getCell(`A${r}`).value = "Nilai";
  worksheet.getCell(`A${r}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`A${r}`));

  for (let i = 0; i < 21; i++) {
    const cell = worksheet.getRow(r).getCell(i + 3);
    cell.value = getUkjScore(ukjJuzRow1[i]);
    cell.alignment = centerStyle;
    addBorder(cell);
  }
  r++;

  // Row 3: Predikat 1-21
  worksheet.mergeCells(`A${r}:B${r}`);
  worksheet.getCell(`A${r}`).value = "Predikat";
  worksheet.getCell(`A${r}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`A${r}`));

  for (let i = 0; i < 21; i++) {
    const cell = worksheet.getRow(r).getCell(i + 3);
    cell.value = getUkjPredicateHelper(ukjJuzRow1[i]);
    cell.alignment = centerStyle;
    addBorder(cell);
  }
  r += 2; // Spacer

  // Row 4: Juz 22-30 (Cols C-K) + Rincian Juz (Cols M-N Label, O-W Value)
  worksheet.mergeCells(`A${r}:B${r}`);
  worksheet.getCell(`A${r}`).value = "Juz";
  worksheet.getCell(`A${r}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`A${r}`));

  for (let i = 0; i < 9; i++) {
    const cell = worksheet.getRow(r).getCell(i + 3); // Start C (3)
    cell.value = ukjJuzRow2[i];
    cell.alignment = centerStyle;
    addBorder(cell);
  }

  // Rincian Juz (Label M-N, Value O-W)
  worksheet.mergeCells(`M${r}:N${r}`);
  const rincianHeader = worksheet.getCell(`M${r}`);
  rincianHeader.value = "Rincian Juz";
  rincianHeader.font = boldFont;
  rincianHeader.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(rincianHeader);

  worksheet.mergeCells(`O${r}:W${r}`);
  const rincianValue = worksheet.getCell(`O${r}`);
  rincianValue.value = rincianJuz;
  rincianValue.alignment = centerStyle;
  addBorder(rincianValue);
  r++;

  // Row 5: Nilai 22-30 + Nilai Summary
  worksheet.mergeCells(`A${r}:B${r}`);
  worksheet.getCell(`A${r}`).value = "Nilai";
  worksheet.getCell(`A${r}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`A${r}`));

  for (let i = 0; i < 9; i++) {
    const cell = worksheet.getRow(r).getCell(i + 3);
    cell.value = getUkjScore(ukjJuzRow2[i]);
    cell.alignment = centerStyle;
    addBorder(cell);
  }

  worksheet.mergeCells(`M${r}:N${r}`);
  const nilaiHeader = worksheet.getCell(`M${r}`);
  nilaiHeader.value = "Nilai UKJ";
  nilaiHeader.font = boldFont;
  nilaiHeader.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(nilaiHeader);

  worksheet.mergeCells(`O${r}:W${r}`);
  const nilaiValue = worksheet.getCell(`O${r}`);
  nilaiValue.value = avgUKJ;
  nilaiValue.font = boldFont;
  nilaiValue.alignment = centerStyle;
  addBorder(nilaiValue);
  r++;

  // Row 6: Predikat 22-30 + Predikat Summary
  worksheet.mergeCells(`A${r}:B${r}`);
  worksheet.getCell(`A${r}`).value = "Predikat";
  worksheet.getCell(`A${r}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`A${r}`));

  for (let i = 0; i < 9; i++) {
    const cell = worksheet.getRow(r).getCell(i + 3);
    cell.value = getUkjPredicateHelper(ukjJuzRow2[i]);
    cell.alignment = centerStyle;
    addBorder(cell);
  }

  worksheet.mergeCells(`M${r}:N${r}`);
  const predHeader = worksheet.getCell(`M${r}`);
  predHeader.value = "Predikat UKJ";
  predHeader.font = boldFont;
  predHeader.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(predHeader);

  worksheet.mergeCells(`O${r}:W${r}`);
  const predValue = worksheet.getCell(`O${r}`);
  predValue.value = getPredicate(avgUKJ);
  predValue.alignment = centerStyle;
  addBorder(predValue);
  r += 2;

  // --- FOOTER SECTION: Mading, Total, Kehadiran ---
  // Title for Mading
  worksheet.mergeCells(`A${r}:K${r}`);
  worksheet.getCell(`A${r}`).value = "Mading Hafalan";
  worksheet.getCell(`A${r}`).font = boldFont;
  worksheet.getCell(`A${r}`).alignment = centerStyle;
  r++;

  const startMadingR = r;

  // 1. Mading Hafalan (A, B-D, E-G, H-K)
  worksheet.getCell(`A${r}`).value = "No";
  worksheet.getCell(`A${r}`).font = boldFont;
  worksheet.getCell(`A${r}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`A${r}`));

  worksheet.mergeCells(`B${r}:D${r}`);
  worksheet.getCell(`B${r}`).value = "Bulan";
  worksheet.getCell(`B${r}`).font = boldFont;
  worksheet.getCell(`B${r}`).alignment = centerStyle;
  worksheet.getCell(`B${r}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`B${r}`));

  worksheet.mergeCells(`E${r}:G${r}`);
  worksheet.getCell(`E${r}`).value = "Jumlah Halaman";
  worksheet.getCell(`E${r}`).font = boldFont;
  worksheet.getCell(`E${r}`).alignment = centerStyle;
  worksheet.getCell(`E${r}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`E${r}`));

  worksheet.mergeCells(`H${r}:K${r}`);
  worksheet.getCell(`H${r}`).value = "Juz";
  worksheet.getCell(`H${r}`).font = boldFont;
  worksheet.getCell(`H${r}`).alignment = centerStyle;
  worksheet.getCell(`H${r}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`H${r}`));

  // Data
  const madingList = madingData || [];
  let mR = r + 1;
  if (madingList.length === 0) {
    madingList.push({ bulan: "-", halaman: "-", juz: "-" });
  }

  madingList.forEach((m, idx) => {
    worksheet.getCell(`A${mR}`).value = idx + 1;
    worksheet.getCell(`A${mR}`).alignment = centerStyle;
    addBorder(worksheet.getCell(`A${mR}`));

    worksheet.mergeCells(`B${mR}:D${mR}`);
    worksheet.getCell(`B${mR}`).value = m.bulan;
    worksheet.getCell(`B${mR}`).alignment = centerStyle;
    addBorder(worksheet.getCell(`B${mR}`));

    worksheet.mergeCells(`E${mR}:G${mR}`);
    worksheet.getCell(`E${mR}`).value = m.halaman;
    worksheet.getCell(`E${mR}`).alignment = centerStyle;
    addBorder(worksheet.getCell(`E${mR}`));

    worksheet.mergeCells(`H${mR}:K${mR}`);
    worksheet.getCell(`H${mR}`).value = m.juz;
    worksheet.getCell(`H${mR}`).alignment = centerStyle;
    addBorder(worksheet.getCell(`H${mR}`));
    mR++;
  });

  let maxR = mR;

  // 2. Total Hafalan (Header M-R, Label M-O, Value P-R)
  let tR = startMadingR;
  worksheet.mergeCells(`M${tR}:R${tR}`);
  worksheet.getCell(`M${tR}`).value = "Total Hafalan";
  worksheet.getCell(`M${tR}`).font = boldFont;
  worksheet.getCell(`M${tR}`).alignment = centerStyle;
  worksheet.getCell(`M${tR}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`M${tR}`));
  tR++;

  // Target
  worksheet.mergeCells(`M${tR}:O${tR}`);
  worksheet.getCell(`M${tR}`).value = "Target Minimal";
  worksheet.getCell(`M${tR}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`M${tR}`));

  worksheet.mergeCells(`P${tR}:R${tR}`);
  worksheet.getCell(`P${tR}`).value = targetHafalan || 50;
  worksheet.getCell(`P${tR}`).alignment = centerStyle;
  addBorder(worksheet.getCell(`P${tR}`));
  tR++;

  // Jumlah Halaman
  worksheet.mergeCells(`M${tR}:O${tR}`);
  worksheet.getCell(`M${tR}`).value = "Jumlah Halaman";
  worksheet.getCell(`M${tR}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`M${tR}`));

  worksheet.mergeCells(`P${tR}:R${tR}`);
  worksheet.getCell(`P${tR}`).value = totalHafalan;
  worksheet.getCell(`P${tR}`).alignment = centerStyle;
  addBorder(worksheet.getCell(`P${tR}`));
  tR++;

  // Jumlah Juz
  worksheet.mergeCells(`M${tR}:O${tR}`);
  worksheet.getCell(`M${tR}`).value = "Jumlah Juz";
  worksheet.getCell(`M${tR}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`M${tR}`));

  worksheet.mergeCells(`P${tR}:R${tR}`);
  worksheet.getCell(`P${tR}`).value = jumlahJuz;
  worksheet.getCell(`P${tR}`).alignment = centerStyle;
  addBorder(worksheet.getCell(`P${tR}`));
  tR++;

  // Keterangan
  worksheet.mergeCells(`M${tR}:O${tR}`);
  worksheet.getCell(`M${tR}`).value = "Keterangan";
  worksheet.getCell(`M${tR}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`M${tR}`));

  worksheet.mergeCells(`P${tR}:R${tR}`);
  worksheet.getCell(`P${tR}`).value = keteranganHafalan;
  worksheet.getCell(`P${tR}`).alignment = centerStyle;
  worksheet.getCell(`P${tR}`).font = smallBoldFont;
  addBorder(worksheet.getCell(`P${tR}`));
  tR++;

  if (tR > maxR) maxR = tR;

  // 3. Kehadiran (Header T-W, Label T-U, Value V, Unit W)
  let kR = startMadingR;
  worksheet.mergeCells(`T${kR}:W${kR}`);
  worksheet.getCell(`T${kR}`).value = "Kehadiran";
  worksheet.getCell(`T${kR}`).font = boldFont;
  worksheet.getCell(`T${kR}`).alignment = centerStyle;
  worksheet.getCell(`T${kR}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`T${kR}`));
  kR++;

  // Sakit
  worksheet.mergeCells(`T${kR}:U${kR}`);
  worksheet.getCell(`T${kR}`).value = "Sakit";
  worksheet.getCell(`T${kR}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`T${kR}`));

  worksheet.getCell(`V${kR}`).value = attendance?.sakit || 0;
  worksheet.getCell(`V${kR}`).alignment = centerStyle;
  addBorder(worksheet.getCell(`V${kR}`));

  worksheet.getCell(`W${kR}`).value = "JPL";
  worksheet.getCell(`W${kR}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`W${kR}`));
  kR++;

  // Izin
  worksheet.mergeCells(`T${kR}:U${kR}`);
  worksheet.getCell(`T${kR}`).value = "Izin";
  worksheet.getCell(`T${kR}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`T${kR}`));

  worksheet.getCell(`V${kR}`).value = attendance?.izin || 0;
  worksheet.getCell(`V${kR}`).alignment = centerStyle;
  addBorder(worksheet.getCell(`V${kR}`));

  worksheet.getCell(`W${kR}`).value = "JPL";
  worksheet.getCell(`W${kR}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`W${kR}`));
  kR++;

  // Alpha
  worksheet.mergeCells(`T${kR}:U${kR}`);
  worksheet.getCell(`T${kR}`).value = "Alpha";
  worksheet.getCell(`T${kR}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`T${kR}`));

  worksheet.getCell(`V${kR}`).value = attendance?.alpha || 0;
  worksheet.getCell(`V${kR}`).alignment = centerStyle;
  addBorder(worksheet.getCell(`V${kR}`));

  worksheet.getCell(`W${kR}`).value = "JPL";
  worksheet.getCell(`W${kR}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`W${kR}`));
  kR++;

  if (kR > maxR) maxR = kR;

  r = maxR + 1;

  // --- CATATAN & NILAI AKHIR ---

  const nR = r;

  // Catatan (Cols A-Q, 6 rows)
  worksheet.mergeCells(`A${r}:Q${r}`);
  worksheet.getCell(`A${r}`).value = "Catatan";
  worksheet.getCell(`A${r}`).font = boldFont;
  worksheet.getCell(`A${r}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`A${r}`));

  // Note content body (next 5 rows to make total 6 rows including header? Or 6 rows of content?
  // User says: "kotak catatan merged dari a-q dengan 6 row ke bawah." matches header + content or just content.
  // Usually Header 1 row + Content 5 rows.
  // Let's do Header at `r`, Content `r+1` to `r+6` (extended).

  worksheet.mergeCells(`A${r + 1}:Q${r + 6}`);
  const noteCell = worksheet.getCell(`A${r + 1}`);
  noteCell.value = notes || "-";
  noteCell.alignment = { vertical: "top", horizontal: "left", wrapText: true };
  addBorder(noteCell);

  // Nilai Akhir (Right side - Cols S-W)
  // "total nilai akhir : UPK : s-t, UKJ : s-t, UA: s-t, Suluk: s-t, Nilai Akhir : s-t. isinya masing-masing menempati u-w. tercapai : merged s-w."
  // It seems "Total Nilai Akhir" is the block title? Or just the list?
  // Let's add block title "Total Nilai Akhir" first for clarity, or just start with items if space is tight?
  // Previous code had title "Total Nilai Akhir". I will keep it.

  let fR = nR;
  worksheet.mergeCells(`S${fR}:W${fR}`);
  worksheet.getCell(`S${fR}`).value = "Total Nilai Akhir";
  worksheet.getCell(`S${fR}`).font = boldFont;
  worksheet.getCell(`S${fR}`).alignment = centerStyle;
  worksheet.getCell(`S${fR}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`S${fR}`));
  fR++;

  // UPK
  worksheet.mergeCells(`S${fR}:T${fR}`);
  worksheet.getCell(`S${fR}`).value = "UPK";
  worksheet.getCell(`S${fR}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`S${fR}`));

  worksheet.mergeCells(`U${fR}:W${fR}`);
  worksheet.getCell(`U${fR}`).value = avgUPK;
  worksheet.getCell(`U${fR}`).alignment = centerStyle;
  addBorder(worksheet.getCell(`U${fR}`));
  fR++;

  // UKJ
  worksheet.mergeCells(`S${fR}:T${fR}`);
  worksheet.getCell(`S${fR}`).value = "UKJ";
  worksheet.getCell(`S${fR}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`S${fR}`));

  worksheet.mergeCells(`U${fR}:W${fR}`);
  worksheet.getCell(`U${fR}`).value = avgUKJ;
  worksheet.getCell(`U${fR}`).alignment = centerStyle;
  addBorder(worksheet.getCell(`U${fR}`));
  fR++;

  // UA
  worksheet.mergeCells(`S${fR}:T${fR}`);
  worksheet.getCell(`S${fR}`).value = "UA";
  worksheet.getCell(`S${fR}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`S${fR}`));

  worksheet.mergeCells(`U${fR}:W${fR}`);
  worksheet.getCell(`U${fR}`).value = uaScore || "-";
  worksheet.getCell(`U${fR}`).alignment = centerStyle;
  addBorder(worksheet.getCell(`U${fR}`));
  fR++;

  // Suluk
  worksheet.mergeCells(`S${fR}:T${fR}`);
  worksheet.getCell(`S${fR}`).value = "Suluk";
  worksheet.getCell(`S${fR}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`S${fR}`));

  worksheet.mergeCells(`U${fR}:W${fR}`);
  worksheet.getCell(`U${fR}`).value = sulukScore;
  worksheet.getCell(`U${fR}`).alignment = centerStyle;
  addBorder(worksheet.getCell(`U${fR}`));
  fR++;

  // Nilai Akhir
  worksheet.mergeCells(`S${fR}:T${fR}`);
  worksheet.getCell(`S${fR}`).value = "Nilai Akhir";
  worksheet.getCell(`S${fR}`).font = boldFont;
  worksheet.getCell(`S${fR}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  addBorder(worksheet.getCell(`S${fR}`));

  worksheet.mergeCells(`U${fR}:W${fR}`);
  worksheet.getCell(`U${fR}`).value = finalScore;
  worksheet.getCell(`U${fR}`).font = boldFont;
  worksheet.getCell(`U${fR}`).alignment = centerStyle;
  addBorder(worksheet.getCell(`U${fR}`));
  fR++;

  // Tercapai
  worksheet.mergeCells(`S${fR}:W${fR}`);
  worksheet.getCell(`S${fR}`).value = tercapaiLabel;
  worksheet.getCell(`S${fR}`).font = boldFont;
  worksheet.getCell(`S${fR}`).alignment = centerStyle;
  addBorder(worksheet.getCell(`S${fR}`));
  fR++;

  // Adjust final r
  r = Math.max(r + 7, fR + 2);

  // --- SIGNATURES ---
  // 3 columns: Orang tua, Ketua Tahfidz, Wali Kelas
  // A-G, H-N, O-U.

  const sR = r;
  // Col 1: Orang tua
  worksheet.mergeCells(`A${sR}:G${sR}`);
  worksheet.getCell(`A${sR}`).value = "Mengetahui,";
  worksheet.getCell(`A${sR}`).alignment = centerStyle;

  worksheet.mergeCells(`A${sR + 1}:G${sR + 1}`);
  worksheet.getCell(`A${sR + 1}`).value = "Orang tua";
  worksheet.getCell(`A${sR + 1}`).alignment = centerStyle;

  worksheet.mergeCells(`A${sR + 6}:G${sR + 6}`);
  worksheet.getCell(`A${sR + 6}`).value = "( ............................... )";
  worksheet.getCell(`A${sR + 6}`).alignment = centerStyle;

  // Col 2: Ketua Tahfidz
  worksheet.mergeCells(`H${sR}:N${sR}`);
  worksheet.getCell(`H${sR}`).value = "Mengetahui,";
  worksheet.getCell(`H${sR}`).alignment = centerStyle;

  worksheet.mergeCells(`H${sR + 1}:N${sR + 1}`);
  worksheet.getCell(`H${sR + 1}`).value = "Ketua Bagian Tahfidz";
  worksheet.getCell(`H${sR + 1}`).alignment = centerStyle;

  worksheet.mergeCells(`H${sR + 6}:N${sR + 6}`);
  worksheet.getCell(`H${sR + 6}`).value =
    tahfidzHeadNameDisplay || "...............................";
  worksheet.getCell(`H${sR + 6}`).alignment = centerStyle;
  worksheet.getCell(`H${sR + 6}`).font = boldFont;

  // Col 3: Wali Kelas
  worksheet.mergeCells(`O${sR}:U${sR}`);
  worksheet.getCell(`O${sR}`).value = `${
    cityName || "..........."
  }, ${currentDate}`;
  worksheet.getCell(`O${sR}`).alignment = centerStyle;

  worksheet.mergeCells(`O${sR + 1}:U${sR + 1}`);
  worksheet.getCell(`O${sR + 1}`).value = "Wali Kelas";
  worksheet.getCell(`O${sR + 1}`).alignment = centerStyle;

  worksheet.mergeCells(`O${sR + 6}:U${sR + 6}`);
  worksheet.getCell(`O${sR + 6}`).value =
    student.homeroomTeacher || "...............................";
  worksheet.getCell(`O${sR + 6}`).alignment = centerStyle;
  worksheet.getCell(`O${sR + 6}`).font = boldFont;

  // Save file
  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `Rapor_Tahfidz_${student.fullName.replace(
    /\s+/g,
    "_"
  )}_${semester}_${academicYear.replace("/", "-")}.xlsx`;
  saveAs(new Blob([buffer]), fileName);
}

// Helper functions needed inside exporter (copied from component)
function getExamCode(exam) {
  if (!exam || !exam.id) return "-";
  if (exam.examCode) return exam.examCode;
  const dateStr = exam.date || exam.examDate;
  if (dateStr) {
    const d = new Date(dateStr);
    const month = d.toLocaleString("id-ID", { month: "short" }).toUpperCase();
    const week = Math.ceil(d.getDate() / 7);
    return `${month}(${week})`;
  }
  return `EX-${exam.id}`;
}

function getPageRange(exam) {
  if (!exam) return "-";
  if (exam.startPage && exam.endPage)
    return `${exam.startPage}-${exam.endPage}`;
  return "-";
}

function getPredicate(score) {
  if (score === null || score === undefined || score === "") return "-";
  const s = Number(score);
  if (isNaN(s)) return "-";
  if (s >= 90) return "A+";
  if (s >= 80) return "A";
  if (s >= 70) return "B+";
  if (s >= 65) return "B";
  return "C";
}
