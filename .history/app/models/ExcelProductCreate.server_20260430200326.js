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

  // Shopify’s GraphQL API and the xlsx library expect binary data, not a browser File object.

  // file.arrayBuffer() reads the file into raw bytes.

  // buffer is now a low‑level representation of the file’s contents.
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
        status
      }
      userErrors {
        field
        message
      }
    }
      }`,
      {
        variables: {
          product: {
            title: `${row.title}`,
          },
        },
      },
    );

    const responseJson = await response.json();
    const product = responseJson.data.productCreate.product;

    const responseOptions = await admin.graphql(
      `#graphql
  mutation createOptions($productId: ID!, $options: [OptionCreateInput!]!, $variantStrategy: ProductOptionCreateVariantStrategy) {
    productOptionsCreate(productId: $productId, options: $options, variantStrategy: $variantStrategy) {
      userErrors {
        field
        message
        code
      }
      product {
        id
        variants(first: 10) {
          nodes {
            id
            title
            selectedOptions {
              name
              value
            }
          }
        }
        options {
          id
          name
          values
          position
          optionValues {
            id
            name
            hasVariants
          }
        }
      }
    }
  }`,
      {
        variables: {
          productId: product.id,
          options: [
            {
              name: "Color",
              position: 1,
              values: [
                {
                  name: "Blue",
                },
              ],
            },
          ],
        },
      },
    );

    await responseOptions.json();

    createdProducts.push(responseJson.data.productCreate.product);
  }
  return { products: createdProducts };
}
