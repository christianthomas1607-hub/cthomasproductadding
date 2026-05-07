export function inlineGraphQL(mutation, variables) {
  const prettyVars = JSON.stringify(variables, null, 2);

  return `
${mutation}

# Variables:
${prettyVars}
  `;
}

export function inlineMutation(mutation, variables) {
  const gqlVars = toGraphQLInput(variables);

  return mutation.replace(
    /\(\$[^)]*\)/, // remove the ($product: ProductCreateInput!) part
    `(${Object.keys(variables)
      .map((k) => `${k}: ${toGraphQLInput(variables[k])}`)
      .join(", ")})`,
  );
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




function toGraphQLInputOptions(value) {
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

export function inlineMutationOptions(mutation, variables) {
  // Remove the ($productId: ID!, $variants: ...) block
  const cleaned = mutation.replace(/\([^\)]*\)/, "");

  // Build inline arguments
  const inlineArgs = Object.entries(variables)
    .map(([key, val]) => `${key}: ${toGraphQLInputOptions(val)}`)
    .join(", ");

  // Insert inline args into the mutation call
  return cleaned.replace(
    /productVariantsBulkCreate\s*\(/,
    `productVariantsBulkCreate(${inlineArgs}, `,
  );
}