import { authenticate } from "../shopify.server";

export async function action({ request }) {
    const { admin } = await authenticate.admin(request);
}