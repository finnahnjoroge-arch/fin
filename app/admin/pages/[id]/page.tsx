import PageForm from "@/components/admin/page-form";
import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

async function getPage(id: string) {
  try {
    const db = await connectDB();
    return await db.collection("pages").findOne({ _id: new ObjectId(id) });
  } catch {
    return null;
  }
}

export default async function EditPagePage({ params }: EditPageProps) {
  const { id } = await params;
  const page = await getPage(id);

  if (!page) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Edit Page</h1>
        <p className="text-neutral-500">Page not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Page</h1>
      <PageForm
        initialData={{
          _id: page._id.toString(),
          title: page.title,
          slug: page.slug,
          content: page.content,
          status: page.status,
          sortOrder: page.sortOrder ?? 0,
          metaTitle: page.metaTitle,
          metaDescription: page.metaDescription,
        }}
      />
    </div>
  );
}
