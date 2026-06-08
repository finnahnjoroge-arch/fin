import BlogForm from "@/components/admin/blog-form";
import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let blog = null;
  try {
    const db = await connectDB();
    blog = await db.collection("blogs").findOne({ _id: new ObjectId(id) });
  } catch {
    blog = null;
  }

  if (!blog) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Edit Blog</h1>
        <p className="text-neutral-500">Blog not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Blog</h1>
      <BlogForm
        initialData={{
          _id: blog._id.toString(),
          title: blog.title || "",
          slug: blog.slug || "",
          excerpt: blog.excerpt || "",
          content: blog.content || "",
          featuredImage: blog.featuredImage || "",
          status: blog.status || "draft",
          author: blog.author || "",
          metaTitle: blog.metaTitle || "",
          metaDescription: blog.metaDescription || "",
          publishedAt: blog.publishedAt?.toISOString?.() || blog.publishedAt || "",
        }}
      />
    </div>
  );
}
