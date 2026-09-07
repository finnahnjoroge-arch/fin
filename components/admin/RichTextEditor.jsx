"use client";

import GapCursor from "@tiptap/extension-gapcursor";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { TextSelection } from "@tiptap/pm/state";
import {
  EditorContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  Link as LinkUrlIcon,
  List,
  ListOrdered,
  Quote,
  Redo,
  Strikethrough,
  Trash2,
  Underline as UnderlineIcon,
  Undo,
  Upload,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

/*
 * Minimal paste cleaning – only remove caption wrappers
 * and unnecessary figure containers. Preserve all formatting.
 */
const cleanPastedHTML = (html) => {
  if (typeof window === "undefined") return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Remove figcaption and similar caption elements
  doc.querySelectorAll("figcaption").forEach((el) => el.remove());
  doc
    .querySelectorAll("[data-caption], [data-image-caption], .image-caption, .image-alt")
    .forEach((el) => el.remove());

  // Unwrap images from figure tags (keep the image itself)
  doc.querySelectorAll("img").forEach((img) => {
    img.removeAttribute("contenteditable");
    img.removeAttribute("draggable");

    const figure = img.closest("figure");
    if (figure) {
      const images = figure.querySelectorAll("img");
      if (images.length === 1) {
        figure.replaceWith(img);
      }
    }
  });

  // Unwrap simple wrappers that contain only an image and no text
  let changed = true;
  while (changed) {
    changed = false;
    const wrappers = Array.from(doc.body.querySelectorAll("div, p, span, section, article"));
    wrappers.forEach((wrapper) => {
      const images = wrapper.querySelectorAll("img");
      const text = wrapper.textContent?.trim() || "";
      if (images.length === 1 && !text && wrapper.children.length === 1 && wrapper.firstElementChild?.tagName === "IMG") {
        const img = wrapper.firstElementChild;
        if (img) {
          wrapper.replaceWith(img);
          changed = true;
        }
      }
    });
  }

  return doc.body.innerHTML;
};

/*
 * ------------------------------------------------------------
 * Custom Image Node View
 * ------------------------------------------------------------
 */

const ImageNodeView = ({
  node,
  updateAttributes,
  selected,
  deleteNode,
  getPos,
  editor,
}) => {
  const imageRef = useRef(null);
  const startResizeRef = useRef({ width: 0, x: 0 });

  const { src, alt, width, align } = node.attrs;
  const isSelected = selected === true;

  const handleImageClick = useCallback(
    (event) => {
      event.stopPropagation();
      if (editor && getPos) {
        const pos = getPos();
        editor.commands.setNodeSelection(pos);
        editor.commands.focus();
      }
    },
    [editor, getPos]
  );

  const startResize = (event) => {
    event.preventDefault();
    event.stopPropagation();
    startResizeRef.current = {
      width: imageRef.current?.offsetWidth || node.attrs.width || 400,
      x: event.clientX,
    };

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startResizeRef.current.x;
      const newWidth = Math.max(100, startResizeRef.current.width + deltaX);
      updateAttributes({ width: newWidth });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleDelete = (event) => {
    event.preventDefault();
    event.stopPropagation();
    deleteNode();
  };

  const handleAlign = (newAlign) => updateAttributes({ align: newAlign });

  const wrapperStyle = {
    display: "block",
    width: "100%",
    textAlign: align === "center" ? "center" : align === "right" ? "right" : "left",
  };

  const isActive = (alignment) =>
    (alignment === "left" && (!align || align === "left")) || align === alignment;

  return (
    <NodeViewWrapper
      as="div"
      style={{
        display: "block",
        position: "relative",
        margin: 0,
        padding: 0,
      }}
      contentEditable={false}
    >
      {isSelected && (
        <div
          style={{
            position: "absolute",
            top: "-2.5rem",
            left: align === "right" ? "auto" : align === "center" ? "50%" : "0",
            right: align === "right" ? "0" : "auto",
            transform: align === "center" ? "translateX(-50%)" : "none",
            zIndex: 20,
          }}
          className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
          onMouseDown={(event) => event.preventDefault()}
        >
          <button
            type="button"
            onClick={() => handleAlign("left")}
            className={`rounded p-1.5 ${
              isActive("left")
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
            }`}
            title="Align left"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleAlign("center")}
            className={`rounded p-1.5 ${
              isActive("center")
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
            }`}
            title="Align center"
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleAlign("right")}
            className={`rounded p-1.5 ${
              isActive("right")
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
            }`}
            title="Align right"
          >
            <AlignRight className="h-4 w-4" />
          </button>
          <div className="mx-1 h-4 w-px bg-neutral-200 dark:bg-neutral-600" />
          <button
            type="button"
            onClick={handleDelete}
            className="rounded p-1.5 text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
            title="Delete image"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      <div style={wrapperStyle}>
        <div
          style={{
            display: "inline-block",
            position: "relative",
            margin: 0,
            padding: 0,
          }}
          className={isSelected ? "rounded-md ring-2 ring-blue-500" : ""}
        >
          <img
            ref={imageRef}
            src={src}
            alt={alt || ""}
            draggable={false}
            onClick={handleImageClick}
            style={{
              width: width ? `${width}px` : "auto",
              maxWidth: "100%",
              height: "auto",
              display: "block",
              margin: 0,
              cursor: "pointer",
            }}
            className="rounded-md"
          />
          {isSelected && (
            <>
              <div
                onMouseDown={startResize}
                style={{
                  position: "absolute",
                  right: "-6px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "12px",
                  height: "24px",
                  cursor: "ew-resize",
                  zIndex: 10,
                }}
                className="rounded bg-blue-500 shadow-md hover:bg-blue-600"
                title="Resize image"
              />
              <div
                onMouseDown={startResize}
                style={{
                  position: "absolute",
                  right: "-6px",
                  bottom: "-6px",
                  width: "16px",
                  height: "16px",
                  cursor: "nwse-resize",
                  zIndex: 10,
                }}
                className="rounded-full bg-blue-500 shadow-md hover:bg-blue-600"
                title="Resize image"
              />
            </>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
};

/*
 * ------------------------------------------------------------
 * Custom Image Extension
 * ------------------------------------------------------------
 */

const CustomImage = Image.extend({
  group: "block",
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute("width");
          return width ? parseInt(width, 10) : null;
        },
        renderHTML: (attributes) => {
          return attributes.width ? { width: attributes.width } : {};
        },
      },
      align: {
        default: "left",
        parseHTML: (element) => element.getAttribute("data-align") || "left",
        renderHTML: (attributes) => ({ "data-align": attributes.align }),
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

/*
 * ------------------------------------------------------------
 * Rich Text Editor
 * ------------------------------------------------------------
 */

const RichTextEditor = ({
  value,
  onChange,
  placeholder = "Write something...",
  rows = 12,
}) => {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const editorWrapperRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      GapCursor,
      CustomImage.configure({ allowBase64: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      transformPastedHTML: (html) => cleanPastedHTML(html),
      // Smooth backspace – deletes image directly, sets cursor correctly
      handleKeyDown: (view, event) => {
        if (event.key === "Backspace") {
          const { state } = view;
          const { selection } = state;
          if (selection instanceof TextSelection) {
            const { $from } = selection;
            if ($from.parentOffset === 0) {
              const pos = $from.pos - 1;
              if (pos >= 0) {
                const node = state.doc.nodeAt(pos);
                if (node && node.type.name === "image") {
                  const tr = state.tr.delete(pos, pos + node.nodeSize);
                  const resolvedPos = tr.doc.resolve(Math.min(pos, tr.doc.content.size));
                  tr.setSelection(TextSelection.near(resolvedPos));
                  view.dispatch(tr);
                  event.preventDefault();
                  return true;
                }
              }
            }
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  // Click outside listener – deselects image if clicked outside
  useEffect(() => {
    if (!editor) return;
    const handleDocumentMouseDown = (event) => {
      const wrapper = editorWrapperRef.current;
      if (!wrapper) return;
      if (wrapper.contains(event.target)) return;
      if (editor.state.selection.node) {
        const position = Math.max(1, Math.min(editor.state.selection.from, editor.state.doc.content.size));
        editor.chain().setTextSelection(position).blur().run();
      } else {
        editor.commands.blur();
      }
    };
    document.addEventListener("mousedown", handleDocumentMouseDown);
    return () => document.removeEventListener("mousedown", handleDocumentMouseDown);
  }, [editor]);

  const handleEditorClick = useCallback(
    (event) => {
      const target = event.target;
      const linkElement = target.closest("a[href]");
      const imageElement = target.closest("img");
      if (imageElement) return;

      if (linkElement && editor) {
        event.preventDefault();
        event.stopPropagation();
        editor.commands.focus();
        const href = linkElement.getAttribute("href");
        try {
          const from = editor.state.doc.resolve(editor.view.posAtDOM(linkElement, 0)).pos;
          const to = editor.state.doc.resolve(editor.view.posAtDOM(linkElement, linkElement.childNodes.length)).pos;
          editor.chain().setTextSelection({ from, to }).run();
        } catch {
          // ignore
        }
        const action = window.prompt(`Link URL: ${href}\n\nEnter new URL to update, or leave empty to unlink:`, href);
        if (action === null) return;
        if (action === "") {
          editor.chain().focus().unsetLink().run();
        } else if (action !== href) {
          editor.chain().focus().setLink({ href: action }).run();
        }
      }
    },
    [editor]
  );

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Upload failed");
      }
      editor.chain().focus().setImage({ src: data.url }).run();
      setImageModalOpen(false);
      setImageUrl("");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const insertImageFromUrl = () => {
    if (!imageUrl.trim()) return;
    editor.chain().focus().setImage({ src: imageUrl.trim() }).run();
    setImageModalOpen(false);
    setImageUrl("");
  };

  if (!editor) return null;

  const ToolbarButton = ({ onClick, isActive, icon: Icon, title }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
        isActive
          ? "bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-white"
          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  const Divider = () => <div className="mx-1 h-6 w-px self-center bg-neutral-200 dark:bg-neutral-700" />;

  const toggleLink = () => {
    if (editor.isActive("link")) {
      const currentHref = editor.getAttributes("link").href;
      const action = window.prompt(`Current link: ${currentHref}\n\nEnter new URL to update, or leave empty to unlink:`, currentHref);
      if (action === null) return;
      if (action === "") {
        editor.chain().focus().unsetLink().run();
      } else {
        editor.chain().focus().setLink({ href: action }).run();
      }
    } else {
      const url = window.prompt("Enter URL");
      if (url) {
        editor.chain().focus().setLink({ href: url }).run();
      }
    }
  };

  return (
    <div ref={editorWrapperRef} className="overflow-hidden rounded-md border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
      {/* Sticky toolbar */}
      <div
        className="sticky top-0 z-30 border-b border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
      >
        <div className="flex flex-wrap items-center gap-1 bg-neutral-50 px-2 py-2 dark:bg-neutral-800">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} icon={Bold} title="Bold" />
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} icon={Italic} title="Italic" />
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} icon={UnderlineIcon} title="Underline" />
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} icon={Strikethrough} title="Strikethrough" />
          <Divider />
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive("heading", { level: 1 })} icon={Heading1} title="Heading 1" />
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive("heading", { level: 2 })} icon={Heading2} title="Heading 2" />
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive("heading", { level: 3 })} icon={Heading3} title="Heading 3" />
          <Divider />
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} icon={List} title="Bullet List" />
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} icon={ListOrdered} title="Ordered List" />
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} icon={Quote} title="Blockquote" />
          <Divider />
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} isActive={editor.isActive({ textAlign: "left" })} icon={AlignLeft} title="Align Left" />
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} isActive={editor.isActive({ textAlign: "center" })} icon={AlignCenter} title="Align Center" />
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} isActive={editor.isActive({ textAlign: "right" })} icon={AlignRight} title="Align Right" />
          <Divider />
          <ToolbarButton onClick={toggleLink} isActive={editor.isActive("link")} icon={LinkIcon} title={editor.isActive("link") ? "Edit/Unlink" : "Add Link"} />
          <ToolbarButton onClick={() => setImageModalOpen(true)} isActive={false} icon={ImageIcon} title="Add Image" />
          <Divider />
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} isActive={false} icon={Undo} title="Undo" />
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} isActive={false} icon={Redo} title="Redo" />
        </div>
      </div>

      <div className="relative" onClick={handleEditorClick}>
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none px-3 py-2 dark:prose-invert focus:outline-none [&_a]:cursor-text"
          style={{ minHeight: `${rows * 1.5}rem` }}
        />
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      {imageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-4 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Insert Image</h3>
              <button
                type="button"
                onClick={() => {
                  setImageModalOpen(false);
                  setImageUrl("");
                }}
                className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg border border-dashed border-neutral-300 p-4 dark:border-neutral-600">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full flex-col items-center justify-center gap-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                >
                  <Upload className="h-8 w-8" />
                  <span className="text-sm font-medium">{uploading ? "Uploading..." : "Click to upload from device"}</span>
                  <span className="text-xs text-neutral-400">Supports JPG, PNG, GIF, WebP</span>
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200 dark:border-neutral-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">Or paste URL</span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkUrlIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(event) => setImageUrl(event.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="h-10 w-full rounded-md border border-neutral-200 bg-white pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-500 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-400"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") insertImageFromUrl();
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={insertImageFromUrl}
                  disabled={!imageUrl.trim()}
                  className="h-10 rounded-md bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                >
                  Insert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;