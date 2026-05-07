export function inlineGraphQL(mutation, variables) {
  const prettyVars = JSON.stringify(variables, null, 2);

  return `
${mutation}

# Variables:
${prettyVars}
  `;
}

function toGraphQLInput(value) {
  if (Array.isArray(value)) {
    return `[${value.map((v) => toGraphQLInput(v)).join(", ")}]`;
  }

  if (value && typeof value === "object") {
    return `{ ${Object.entries(value)
      .map(([k, v]) => `${k}: ${toGraphQLInput(v)}`)
      .join(", ")} }`;
  }

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  return String(value);
}

export function inlineProductCreate(mutation, variables) {
  const gqlInput = toGraphQLInput(variables.product);

  // Remove the ($product: ProductCreateInput!) block
  const cleaned = mutation.replace(/\([^\)]*\)/, "");

  // Replace product: $product with product: { ... }
  return cleaned.replace(/product:\s*\$product/, `product: ${gqlInput}`);
}

export function inlineVariantsMutation(mutation, variables) {
  const gqlProductId = JSON.stringify(variables.productId);
  const gqlVariants = toGraphQLInput(variables.variants);

  // Remove variable definitions
  let cleaned = mutation.replace(/\([^\)]*\)/, "");

  // Replace the call with inline args
  cleaned = cleaned.replace(
    /productVariantsBulkCreate\s*\(/,
    `productVariantsBulkCreate(productId: ${gqlProductId}, variants: ${gqlVariants}, `,
  );

  // Remove any leftover $variables
  cleaned = cleaned.replace(/\$[a-zA-Z0-9_]+/g, "");

  return cleaned;
}
