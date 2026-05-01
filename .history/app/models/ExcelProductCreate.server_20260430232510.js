import { authenticate } from "../shopify.server";
import { excelReader } from "../excel-reader/ExcelReader";
import {
  itemNameTransform,
  colorsTransform,
  sizesTransform,
} from "../utilities/transformers/transformer";

export async function excelProductCreateAction({ request, formData }) {
  const { admin } = await authenticate.admin(request);

  //formData contains everything submitted from your <form>.
  //"file" is the name of your <input type="file" name="file">.
  //This line extracts the uploaded file as a Blob (browser file object).
  const file = formData.get("file");

  //If the user submitted the form without selecting a file, file will be null.
  //In that case, we stop the action and return an error object.
  if (!file) {
    return { error: "No file uploaded" };
  }

  const rows = await excelReader(file);

  const createdProducts = [];

  for (const row of rows) {
    const itemName = await itemNameTransform(row.Item);
    console.log(itemName);

    const itemSku = await itemNameTransform(row.SKU);
    console.log(sku);

    const colorsTransformedArray = await colorsTransform(row.Color);

    const sizesTransformedArray = await sizesTransform(row.Sizes);

    const colorsValuesArray = [];

    for (const color of colorsTransformedArray) {
      colorsValuesArray.push({
        name: color,
      });
    }

    const sizeValuesArray = [];

    for (const size of sizesTransformedArray) {
      sizeValuesArray.push({
        name: size,
      });
    }
    //What they both look like:
    //values: [{ name: "Red" }, { name: "Green" }, { name: "Blue" }],

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
                values: colorsValuesArray,
              },
              {
                name: "Size",
                values: sizeValuesArray,
              },
            ],
          },
        },
      },
    );

    const responseJson = await response.json();
    const product = responseJson.data.productCreate.product;

    const variantsArray = [];

    for (const color of colorsTransformedArray) {
      for (const size of sizesTransformedArray) {
        variantsArray.push({
          price: 0.0,
          sku: sku,
          optionValues: [
            { optionName: "Color", name: color },
            { optionName: "Size", name: size },
          ],
        });
      }
    }
    //What it looks like:
    // variants: [
    // {
    //   price: 4.99,
    //   optionValues: [
    //     { name: "Red", optionName: "Color" },
    //     { name: "Small", optionName: "Size" },
    //   ],
    // },
    // {
    //   price: 4.99,
    //   optionValues: [
    //     { name: "Red", optionName: "Color" },
    //     { name: "Medium", optionName: "Size" },
    //   ],
    // },
    // {
    //   price: 4.99,
    //   optionValues: [
    //     { name: "Red", optionName: "Color" },
    //     { name: "Large", optionName: "Size" },
    //   ],
    // }
    // ],

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
          variants: variantsArray,
        },
      },
    );

    await responseOptions.json();

    createdProducts.push(responseJson.data.productCreate.product);
  }
  return { products: createdProducts };
}
