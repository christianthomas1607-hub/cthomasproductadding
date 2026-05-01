export async function excelReader(file) {
  const buffer = await file.arrayBuffer();

  // Parse Excel
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);
}
