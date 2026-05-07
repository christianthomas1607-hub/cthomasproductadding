export function buildProductCreateMutation({ title, colors, sizes }) {
  const mutation = `#graphql
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
    }
  `;

  const variables = {
    product: {
      title,
      productOptions: [
        {
          name: "Color",
          values: colors.map((c) => ({ name: c })),
        },
        {
          name: "Size",
          values: sizes.map((s) => ({ name: s })),
        },
      ],
    },
  };

  return { mutation, variables };
}

export function buildProductVariantsBulkCreateMutation({
  productId,
  colors,
  sizes,
  sku,
  price = 0.0,
}) {
  const mutation = `#graphql
    mutation ProductVariantsCreate(
      $productId: ID!,
      $variants: [ProductVariantsBulkInput!]!
    ) {
      productVariantsBulkCreate(
        productId: $productId,
        strategy: REMOVE_STANDALONE_VARIANT,
        variants: $variants
      ) {
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
    }
  `;

  // Build the variants array dynamically
  const variants = [];

  for (const color of colors) {
    for (const size of sizes) {
      variants.push({
        price,
        optionValues: [
          { optionName: "Color", name: color },
          { optionName: "Size", name: size },
        ],
        inventoryItem: {
          sku,
        },
      });
    }
  }

  const variables = {
    productId,
    variants,
  };

  return { mutation, variables, variants };
}
