import XLSX from "xlsx";

export async function excelReader(file) {
  // Shopify’s GraphQL API and the xlsx library expect binary data, not a browser File object.

  // file.arrayBuffer() reads the file into raw bytes.

  // buffer is now a low‑level representation of the file’s contents.
  // Convert file to buffer
  const buffer = await file.arrayBuffer();

  // Parse Excel
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);
  return rows;
}
