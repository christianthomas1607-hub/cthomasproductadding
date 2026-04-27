import { authenticate } from "../shopify.server";
import XLSX from "xlsx";


export async function excelProductCreateAction({ request }) {
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file) {
    return { error: "No file uploaded" };
  }

  // Convert file to buffer
  const buffer = await file.arrayBuffer();

  // Parse Excel
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  // rows is now an array of objects like:
  // [{ title: "Product A", price: 10, barcode: "123" }, ...]

  for (const row of rows) {
    const response = await admin.graphql(
      `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
            demoInfo: metafield(namespace: "$app", key: "demo_info") {
              jsonValue
            }
          }
        }
      }`,
      {
        variables: {
          product: {
            title: `${row.title} title`,
            metafields: [
              {
                namespace: "$app",
                key: "demo_info",
                value: "Created by React Router Template",
              },
            ],
          },
        },
      },
    );

    
  }
}
