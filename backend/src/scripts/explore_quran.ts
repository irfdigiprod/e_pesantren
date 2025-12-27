import { Database } from "bun:sqlite";

const db = new Database("data/quran.db", { readonly: true });

// Test new calculation for Al-Mursalat 1-50
console.log("=== Testing New Calculation: Al-Mursalat 1-50 ===\n");

const startInfo = db
  .query(
    `
  SELECT id, page, line_start, line_end
  FROM quran 
  WHERE sora = 77 AND aya_no = 1
`
  )
  .get() as any;

const endInfo = db
  .query(
    `
  SELECT id, page, line_start, line_end
  FROM quran 
  WHERE sora = 77 AND aya_no = 50
`
  )
  .get() as any;

console.log("Start ayat:");
console.log(startInfo);
console.log("\nEnd ayat:");
console.log(endInfo);

// New calculation
let totalPages: number;

if (startInfo.page === endInfo.page) {
  const linesUsed = endInfo.line_end - startInfo.line_start + 1;
  totalPages = Math.round((linesUsed / 15) * 100) / 100;
  console.log(
    `\nSame page calculation: ${linesUsed} lines / 15 = ${totalPages}`
  );
} else {
  const linesOnFirstPage = 15 - startInfo.line_start + 1;
  const linesOnLastPage = endInfo.line_end;
  const fullPagesBetween = endInfo.page - startInfo.page - 1;

  totalPages =
    Math.round(
      (linesOnFirstPage / 15 + fullPagesBetween + linesOnLastPage / 15) * 100
    ) / 100;

  console.log(`\nDifferent pages calculation:`);
  console.log(
    `  Lines on first page (page ${startInfo.page}): line ${
      startInfo.line_start
    } to 15 = ${linesOnFirstPage} lines = ${(linesOnFirstPage / 15).toFixed(
      2
    )} pages`
  );
  console.log(`  Full pages between: ${fullPagesBetween}`);
  console.log(
    `  Lines on last page (page ${endInfo.page}): line 1 to ${
      endInfo.line_end
    } = ${linesOnLastPage} lines = ${(linesOnLastPage / 15).toFixed(2)} pages`
  );
  console.log(`  Total: ${totalPages} pages`);
}

console.log(`\n✅ Result: ${totalPages} pages`);
console.log(`Expected: ~1.5 pages`);

db.close();
