import OpengraphImage from "components/opengraph-image";
import { getCollection } from "lib/storefront/categories";

export default async function Image({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection: slug } = await params;
  const collection = await getCollection(slug);
  const title = collection?.seo?.title || collection?.title;

  return await OpengraphImage({ title });
}
