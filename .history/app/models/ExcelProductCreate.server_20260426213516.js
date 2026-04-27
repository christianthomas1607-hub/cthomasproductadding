import { authenticate } from "../shopify.server";
import XLSX from "xlsx";

export async function excelProductCreateAction({ request, formData }) {
  const { admin } = await authenticate.admin(request);


// formData contains everything submitted from your <form>.

  // "file" is the name of your <input type="file" name="file">.

  // This line extracts the uploaded file as a Blob (browser file object).

  const file = formData.get("file");

  //   If the user submitted the form without selecting a file, file will be null.

  // In that case, we stop the action and return an error object.
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

  const createdProducts = [];

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
            title: `${row.title}`,
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

    const json = await response.json();
    createdProducts.push(json.data.productCreate.product);
  }
  return { products: createdProducts };
}
