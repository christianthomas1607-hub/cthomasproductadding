import { useFetcher } from "react-router";

import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { productCreateAction } from "../models/ProductCreate.server.js";
import { excelProductCreateAction } from "../models/ExcelProductCreate.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }) => {
  //   request is the HTTP POST request sent from your form.
  // formData() reads the body once and turns it into a FormData object.
  // This is where all your form fields live (including the uploaded file).
  const formData = await request.formData();

  //   Looks for <input name="file"> in the form.
  // If the user selected a file, file is a Blob (browser file object).
  // If they didn’t, file is null.
  const file = formData.get("file");

  if (file) {
    return excelProductCreateAction({ request, formData });
  }
  else {
    return productCreateAction({ request });
  }

};

export default function Index() {
  //   fetcher lets you submit forms without leaving the page.
  // It’s like fetch() but built into React Router.
  // It gives you:
  // fetcher.submit() → send data to your action
  // fetcher.state → "idle" | "submitting" | "loading"
  // fetcher.data → response from the server
  const fetcher = useFetcher();

  return (
    <s-page heading="Shopify app template">
      {/* method="post"
Tells the browser this form should send a POST request.

encType="multipart/form-data"
Required for file uploads.

Without this, the file won’t be included.

onSubmit={(e) => { ... }}
We override the default browser form submission.

e.preventDefault() stops the browser from doing a full page reload.

new FormData(e.currentTarget)
Extracts all fields (including the file) into a FormData object.

fetcher.submit(formData, { method: "post" })
Sends the form to your server without leaving the page.

This keeps App Bridge alive and avoids the “useContext is null” error. */}
      <form
        method="post"
        encType="multipart/form-data"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          fetcher.submit(formData, {
            method: "post",
            encType: "multipart/form-data",
          });
        }}
      >
        {/* Lets the user pick an Excel file.
        The name="file" must match formData.get("file"). */}
        <input type="file" name="file" accept=".xlsx,.xls" />
        <s-button type="submit">Upload Excel & Create Products</s-button>
      </form>

      {fetcher.data?.products && (
        <s-section heading="productCreate mutation"  style={{ margin: 1 }}>
          <s-stack direction="block" gap="base">
            <s-box
              padding="base"
              borderWidth="base"
              borderRadius="base"
              background="subdued"
            >
              <pre style={{ margin: 0 }}>
                <code>{JSON.stringify(fetcher.data.products, null, 2)}</code>
              </pre>
            </s-box>
          </s-stack>
        </s-section>
      )}

      <s-section slot="aside" heading="App template specs">
        <s-paragraph>
          <s-text>Framework: </s-text>
          <s-link href="https://reactrouter.com/" target="_blank">
            React Router
          </s-link>
        </s-paragraph>
        <s-paragraph>
          <s-text>Interface: </s-text>
          <s-link
            href="https://shopify.dev/docs/api/app-home/using-polaris-components"
            target="_blank"
          >
            Polaris web components
          </s-link>
        </s-paragraph>
        <s-paragraph>
          <s-text>API: </s-text>
          <s-link
            href="https://shopify.dev/docs/api/admin-graphql"
            target="_blank"
          >
            GraphQL
          </s-link>
        </s-paragraph>
        <s-paragraph>
          <s-text>Custom data: </s-text>
          <s-link
            href="https://shopify.dev/docs/apps/build/custom-data"
            target="_blank"
          >
            Metafields &amp; metaobjects
          </s-link>
        </s-paragraph>
        <s-paragraph>
          <s-text>Database: </s-text>
          <s-link href="https://www.prisma.io/" target="_blank">
            Prisma
          </s-link>
        </s-paragraph>
      </s-section>

    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
