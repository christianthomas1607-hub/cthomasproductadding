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
    const itemName = await stringTransform(row.Item);

    console.log(itemName);

    /* console.log(row.Color); */

    const colorsArray = row.Color.split(/\r?\n/);

    const colorsTransformedArray = [];

    for (const color of colorsArray) {
      const colorTransformed = await stringTransform(color);

      colorsTransformedArray.push(colorTransformed);
      console.log(`__Color:___${colorTransformed}__`);
    }

    const sizeMinMaxRange = row.Sizes;

    const sizes = [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "2XL",
      "3XL",
      "4XL",
      "5XL",
      "6XL",
    ];

    // 1. Split the range into min and max
    const [minSize, maxSize] = sizeMinMaxRange.split("-");

    // 2. Find their indexes in the sizes array
    const startIndex = sizes.indexOf(minSize.trim());
    const endIndex = sizes.indexOf(maxSize.trim());

    // 3. Loop through the range
    for (let i = startIndex; i <= endIndex; i++) {
      console.log(sizes[i]);
    }

    const response = await admin.graphql(
      `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
           product {
        id
        title
        status
        options {
          id
          name
          position
          optionValues {
            id
            name
            hasVariants
          }
        }

        variants(first: 240) {
        edges {
          node {
            id
            title
            price
          }
        }
      }
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
            title: `${itemName}`,
            productOptions: [
              {
                name: "Color",
                values: colorsTransformedArray.map((color) => ({ name: color })),
              },
              {
                name: "Size",
                values: [
                  // { name: "Small" },
                  // { name: "Medium" },
                  // { name: "Large" },
                  for (let i = startIndex; i <= endIndex; i++) {
                ],
              },
            ],
          },
        },
      },
    );

    const responseJson = await response.json();
    const product = responseJson.data.productCreate.product;

    const responseOptions = await admin.graphql(
      `#graphql
  mutation ProductVariantsCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkCreate(productId: $productId, strategy: REMOVE_STANDALONE_VARIANT, variants: $variants) {
      productVariants {
        id
        title
        selectedOptions {
          name
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }`,
      {
        variables: {
          productId: product.id,
          variants: [
            {
              price: 4.99,
              optionValues: [
                { name: "Red", optionName: "Color" },
                { name: "Small", optionName: "Size" },
              ],
            },
            {
              price: 4.99,
              optionValues: [
                { name: "Red", optionName: "Color" },
                { name: "Medium", optionName: "Size" },
              ],
            },
            {
              price: 4.99,
              optionValues: [
                { name: "Red", optionName: "Color" },
                { name: "Large", optionName: "Size" },
              ],
            },
            {
              price: 4.99,
              optionValues: [
                { name: "Green", optionName: "Color" },
                { name: "Small", optionName: "Size" },
              ],
            },
            {
              price: 4.99,
              optionValues: [
                { name: "Green", optionName: "Color" },
                { name: "Medium", optionName: "Size" },
              ],
            },
            {
              price: 4.99,
              optionValues: [
                { name: "Green", optionName: "Color" },
                { name: "Large", optionName: "Size" },
              ],
            },
            {
              price: 4.99,
              optionValues: [
                { name: "Blue", optionName: "Color" },
                { name: "Small", optionName: "Size" },
              ],
            },
            {
              price: 4.99,
              optionValues: [
                { name: "Blue", optionName: "Color" },
                { name: "Medium", optionName: "Size" },
              ],
            },
            {
              price: 4.99,
              optionValues: [
                { name: "Blue", optionName: "Color" },
                { name: "Large", optionName: "Size" },
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

//For making a string trimmed, titlecased
async function stringTransform(str) {
  return str
    .trim()
    .replace("  ", "")
    .replace(/\n/g, "") //Removes newline
    .replace(/[^a-zA-Z0-9 ]/g, "") //This strips punctuation, symbols, emojis—everything except letters and numbers:
    .toLowerCase()
    .split(" ") //Splits to array on a space
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) //Make first char uppercase and add chars that are after first char to the end of the first char.
    .join(" "); //Join each word back to being a full string again with space separating each word.
}
