const body = {
  studentId: 188,
  teacherId: 1,
  type: "ziyadah",
  isLate: false,
  startSurah: 1,
  startAyat: 1,
  startPage: 2,
  endSurah: 10,
  endAyat: 3,
  endPage: 36,
  totalLines: 36,
  totalPages: 2.4,
  juz: 1,
  fluency: "lancar",
  notes: "tes",
  depositDate: "2026-02-23T00:00:00.000Z"
};

fetch("http://localhost:3000/api/tahfidz/deposits", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body)
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
