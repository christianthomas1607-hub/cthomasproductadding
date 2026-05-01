import { authenticate } from "../shopify.server";
import { excelReader } from "../excel-reader/ExcelReader";
import { itemNameTransform, colorsTransform, sizesTransform } from "../utilities/transformers/transformer";

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

    const colorsTransformedArray = await colorsTransform(row.Color);
    
    const sizesTransformedArray = await sizesTransform(row.Sizes);

    const sizeMinMaxRange = row.Sizes;





    const colorsValuesArray = [];

    for (const color of colorsTransformedArray) {
      colorsValuesArray.push({
        name: color,
      });
    }

    const sizeValuesArray = [];

    for (let i = startIndex; i <= endIndex; i++) {
      sizeValuesArray.push({
        name: sizes[i],
      });
    }

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
              // ,
              // {
              //   name: "Color",
              //   values: [{ name: "Red" }, { name: "Green" }, { name: "Blue" }],
              // },
              // {
              //   name: "Size",
              //   values: [
              //     { name: "Small" },
              //     { name: "Medium" },
              //     { name: "Large" },
              //   ],
              // },
            ],
          },
        },
      },
    );

    const responseJson = await response.json();
    const product = responseJson.data.productCreate.product;

    const variantsArray = [];

    for (const color of colorsTransformedArray) {
      for (let i = startIndex; i <= endIndex; i++) {
        variantsArray.push({
          price: 4.99,
          optionValues: [
            { optionName: "Color", name: color },
            { optionName: "Size", name: sizes[i] },
          ],
        });
      }
    }

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
