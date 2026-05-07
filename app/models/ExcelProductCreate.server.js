import { authenticate } from "../shopify.server";
import { excelReader } from "../excel-reader/ExcelReader";
import {
  itemNameTransform,
  vendorTransform,
  colorsTransform,
  sizesTransform,
} from "../utilities/transformers/Transformer.js";

import {
  buildProductCreateMutation,
  buildProductVariantsBulkCreateMutation,
} from "../graphql-builders/productCreateBuilder.js";

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

    const vendor = await vendorTransform(row.Vendor);

    const colors = await colorsTransform(row.Color);

    const sizes = await sizesTransform(row.Sizes);

    const { mutation, variables } = buildProductCreateMutation({
      title: itemName,
      vendor,
      colors,
      sizes,
    });
    //What they both look like:
    //values: [{ name: "Red" }, { name: "Green" }, { name: "Blue" }],

    const response = await admin.graphql(mutation, { variables });

    const responseJson = await response.json();
    const product = responseJson.data.productCreate.product;

    // 2️⃣ Build and send productVariantsBulkCreate mutation
    const {
      mutation: variantsMutation,
      variables: variantsVariables,
      variants,
    } = buildProductVariantsBulkCreateMutation({
      productId: product.id,
      colors,
      sizes,
      sku: row.SKU,
      price: 0.0,
    });

    const responseOptions = await admin.graphql(variantsMutation, {
      variables: variantsVariables,
    });

    await responseOptions.json();

    // 3️⃣ Push everything you want to show in the UI
    createdProducts.push({
      product,
      productCreateMutation: mutation,
      productCreateVariables: variables,
      variantsMutation,
      variantsVariables,
      variants,
    });
  }
  return { products: createdProducts };
}
