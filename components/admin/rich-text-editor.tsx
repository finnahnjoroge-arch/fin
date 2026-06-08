"use client";

import Prose from "@/components/prose";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { AutoLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
    INSERT_ORDERED_LIST_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND,
    ListItemNode,
    ListNode,
} from "@lexical/list";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import {
    $createHeadingNode,
    $createQuoteNode,
    HeadingNode,
    HeadingTagType,
    QuoteNode,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import {
    $createParagraphNode,
    $getNodeByKey,
    $getRoot,
    $getSelection,
    $isRangeSelection,
    DecoratorNode,
    DOMConversionMap,
    DOMExportOutput,
    FORMAT_TEXT_COMMAND,
    LexicalEditor,
    NodeKey,
    SerializedLexicalNode,
    UNDO_COMMAND
} from "lexical";
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Bold,
    Code2,
    Eye,
    Heading1,
    Heading2,
    Heading3,
    Image as ImageIcon,
    Italic,
    Link,
    List,
    ListOrdered,
    Pencil,
    Pilcrow,
    Quote,
    Type,
    Underline,
    Undo2,
    Upload,
    Video,
    X,
} from "lucide-react";
import { ChangeEvent, ReactNode, useEffect, useRef, useState } from "react";

type ResizeDragState = {
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  direction: "right" | "bottom" | "corner";
};

type RichTextEditorProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
};

const editorTheme = {
  heading: {
    h1: "mb-3 text-3xl font-bold",
    h2: "mb-3 text-2xl font-bold",
    h3: "mb-2 text-xl font-semibold",
  },
  link: "text-blue-600 underline",
  list: {
    nested: {
      listitem: "list-none",
    },
    ol: "ml-6 list-decimal",
    ul: "ml-6 list-disc",
  },
  paragraph: "mb-2",
  quote:
    "border-l-4 border-neutral-300 pl-4 italic text-neutral-600 dark:border-neutral-700 dark:text-neutral-300",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
  },
};

type SerializedImageNode = SerializedLexicalNode & {
  src: string;
  alt: string;
  align: ImageAlignment;
  width?: number;
};

type ImageAlignment = "left" | "center" | "right";

type SerializedVideoNode = SerializedLexicalNode & {
  src: string;
};

function ResizableImage({
  src,
  alt,
  align,
  width,
  nodeKey,
}: {
  src: string;
  alt: string;
  align: ImageAlignment;
  width?: number;
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();
  const [selected, setSelected] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const resizeDragRef = useRef<ResizeDragState | null>(null);
  const alignmentStyle =
    align === "center"
      ? { marginLeft: "auto", marginRight: "auto" }
      : align === "right"
        ? { marginLeft: "auto", marginRight: 0 }
        : { marginLeft: 0, marginRight: "auto" };

  const updateImage = (next: Partial<{ alt: string; align: ImageAlignment; width: number }>) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node instanceof ImageNode) {
        node.setImageOptions(next);
      }
    });
  };

  const editAltText = () => {
    const nextAlt = window.prompt("Image alt text", alt);
    if (nextAlt === null) return;
    updateImage({ alt: nextAlt });
  };

  useEffect(() => {
    if (!selected) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setSelected(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [selected]);

  const startResize = (direction: ResizeDragState["direction"], event: React.PointerEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;
    resizeDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
      direction,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const resizeImage = (event: React.PointerEvent<HTMLSpanElement>) => {
    const drag = resizeDragRef.current;
    if (!drag) return;
    event.preventDefault();
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    const aspectRatio = drag.startWidth / drag.startHeight;
    const nextWidth = Math.max(80, Math.round(drag.direction === "bottom" ? drag.startWidth + deltaY * aspectRatio : drag.startWidth + deltaX));
    updateImage({ width: nextWidth });
  };

  const stopResize = (event: React.PointerEvent<HTMLSpanElement>) => {
    if (!resizeDragRef.current) return;
    resizeDragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <span ref={containerRef} className="relative my-3 block max-w-full">
      {selected ? (
        <span className="absolute -top-11 left-0 z-10 flex items-center gap-1 rounded border border-neutral-300 bg-white p-1 shadow-md dark:border-neutral-700 dark:bg-neutral-900">
          <button type="button" className="rounded p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800" title="Align left" onClick={() => updateImage({ align: "left" })}>
            <AlignLeft className="h-4 w-4" />
          </button>
          <button type="button" className="rounded p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800" title="Align center" onClick={() => updateImage({ align: "center" })}>
            <AlignCenter className="h-4 w-4" />
          </button>
          <button type="button" className="rounded p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800" title="Align right" onClick={() => updateImage({ align: "right" })}>
            <AlignRight className="h-4 w-4" />
          </button>
          <button type="button" className="rounded p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800" title="Edit alt text" onClick={editAltText}>
            <Pencil className="h-4 w-4" />
          </button>
          <button type="button" className="rounded p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800" title="Close image tools" onClick={() => setSelected(false)}>
            <X className="h-4 w-4" />
          </button>
        </span>
      ) : null}
      <span
        className={`relative block w-fit max-w-full p-1 ${selected ? "border border-dashed border-blue-400" : "border border-transparent"}`}
        style={alignmentStyle}
        onClick={() => setSelected(true)}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          className="block h-auto max-h-[520px] max-w-full object-contain"
          style={width ? { width, height: "auto" } : undefined}
        />
        {selected ? (
          <>
            <span
              className="absolute -right-1 top-1/2 h-3 w-3 -translate-y-1/2 cursor-ew-resize rounded-full border border-white bg-blue-500 shadow"
              onPointerDown={(event) => startResize("right", event)}
              onPointerMove={resizeImage}
              onPointerUp={stopResize}
            />
            <span
              className="absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 translate-y-1/2 cursor-ns-resize rounded-full border border-white bg-blue-500 shadow"
              onPointerDown={(event) => startResize("bottom", event)}
              onPointerMove={resizeImage}
              onPointerUp={stopResize}
            />
            <span
              className="absolute -bottom-1 -right-1 h-3 w-3 cursor-nwse-resize rounded-full border border-white bg-blue-500 shadow"
              onPointerDown={(event) => startResize("corner", event)}
              onPointerMove={resizeImage}
              onPointerUp={stopResize}
            />
          </>
        ) : null}
      </span>
    </span>
  );
}

function ResizableVideo({ src }: { src: string }) {
  return (
    <span className="my-3 inline-block max-w-full resize overflow-auto border border-dashed border-blue-400 p-1 align-middle">
      <video src={src} controls playsInline preload="metadata" className="block h-auto max-h-[520px] max-w-full" />
    </span>
  );
}

class ImageNode extends DecoratorNode<ReactNode> {
  __src: string;
  __alt: string;
  __align: ImageAlignment;
  __width?: number;

  static getType(): string {
    return "rich-text-image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__alt, node.__align, node.__width, node.__key);
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return new ImageNode(serializedNode.src, serializedNode.alt, serializedNode.align || "left", serializedNode.width);
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (node: Node) => ({
        conversion: () => {
          const element = node as HTMLImageElement;
          const align = element.dataset.align === "center" || element.dataset.align === "right" ? element.dataset.align : "left";
          const width = element.width || undefined;
          return { node: $createImageNode(element.src, element.alt || "", align, width) };
        },
        priority: 1,
      }),
    };
  }

  constructor(src: string, alt = "", align: ImageAlignment = "left", width?: number, key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__alt = alt;
    this.__align = align;
    this.__width = width;
  }

  createDOM(): HTMLElement {
    const span = document.createElement("span");
    span.style.display = "inline-block";
    span.style.maxWidth = "100%";
    return span;
  }

  updateDOM(): false {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const image = document.createElement("img");
    const alignmentStyle =
      this.__align === "center"
        ? "display:block;margin-left:auto;margin-right:auto;"
        : this.__align === "right"
          ? "display:block;margin-left:auto;margin-right:0;"
          : "display:block;margin-left:0;margin-right:auto;";
    image.setAttribute("src", this.__src);
    image.setAttribute("alt", this.__alt);
    image.setAttribute("data-align", this.__align);
    if (this.__width) image.setAttribute("width", String(this.__width));
    image.setAttribute("style", `${alignmentStyle}${this.__width ? `width:${this.__width}px;` : ""}height:auto;max-width:100%;`);
    return { element: image };
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      type: "rich-text-image",
      version: 1,
      src: this.__src,
      alt: this.__alt,
      align: this.__align,
      width: this.__width,
    };
  }

  setImageOptions(options: Partial<{ alt: string; align: ImageAlignment; width: number }>): void {
    const writable = this.getWritable();
    if (options.alt !== undefined) writable.__alt = options.alt;
    if (options.align !== undefined) writable.__align = options.align;
    if (options.width !== undefined) writable.__width = options.width;
  }

  decorate(): ReactNode {
    return <ResizableImage src={this.__src} alt={this.__alt} align={this.__align} width={this.__width} nodeKey={this.__key} />;
  }
}

class VideoNode extends DecoratorNode<ReactNode> {
  __src: string;

  static getType(): string {
    return "rich-text-video";
  }

  static clone(node: VideoNode): VideoNode {
    return new VideoNode(node.__src, node.__key);
  }

  static importJSON(serializedNode: SerializedVideoNode): VideoNode {
    return new VideoNode(serializedNode.src);
  }

  static importDOM(): DOMConversionMap | null {
    return {
      video: (node: Node) => ({
        conversion: () => {
          const element = node as HTMLVideoElement;
          return { node: $createVideoNode(element.src) };
        },
        priority: 1,
      }),
    };
  }

  constructor(src: string, key?: NodeKey) {
    super(key);
    this.__src = src;
  }

  createDOM(): HTMLElement {
    const span = document.createElement("span");
    span.style.display = "inline-block";
    span.style.maxWidth = "100%";
    return span;
  }

  updateDOM(): false {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const video = document.createElement("video");
    video.setAttribute("src", this.__src);
    video.setAttribute("controls", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("preload", "metadata");
    video.setAttribute("style", "max-width:100%;height:auto;");
    return { element: video };
  }

  exportJSON(): SerializedVideoNode {
    return {
      ...super.exportJSON(),
      type: "rich-text-video",
      version: 1,
      src: this.__src,
    };
  }

  decorate(): ReactNode {
    return <ResizableVideo src={this.__src} />;
  }
}

function $createImageNode(src: string, alt = "", align: ImageAlignment = "left", width?: number): ImageNode {
  return new ImageNode(src, alt, align, width);
}

function $createVideoNode(src: string): VideoNode {
  return new VideoNode(src);
}

function HtmlInitializer({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext();
  const lastValue = useRef<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    if (lastValue.current === value) return;
    initialized.current = true;
    lastValue.current = value;

    editor.update(() => {
      const root = $getRoot();
      root.clear();

      if (!value.trim()) {
        root.append($createParagraphNode());
        return;
      }

      const parser = new DOMParser();
      const dom = parser.parseFromString(value, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);
      root.append(...nodes);
    });
  }, [editor, value]);

  return null;
}

function EditorToolbar() {
  const [editor] = useLexicalComposerContext();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [activeMedia, setActiveMedia] = useState<"image" | "video" | null>(
    null,
  );
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const formatBlock = (tag: HeadingTagType | "paragraph" | "quote") => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      if (tag === "paragraph") {
        $setBlocksType(selection, () => $createParagraphNode());
      } else if (tag === "quote") {
        $setBlocksType(selection, () => $createQuoteNode());
      } else {
        $setBlocksType(selection, () => $createHeadingNode(tag));
      }
    });
  };

  const insertLink = () => {
    const href = window.prompt("Link URL");
    if (!href) return;
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, href);
  };

  const insertHtml = (html: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const parser = new DOMParser();
      const dom = parser.parseFromString(html, "text/html");
      selection.insertNodes($generateNodesFromDOM(editor, dom));
    });
  };

  const insertMediaNode = (src: string, type: "image" | "video") => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      selection.insertNodes([
        type === "image" ? $createImageNode(src, "") : $createVideoNode(src),
        $createParagraphNode(),
      ]);
    });
  };

  const insertMediaByUrl = () => {
    if (!activeMedia || !mediaUrl.trim()) return;

    if (activeMedia === "image") {
      insertMediaNode(mediaUrl.trim(), "image");
    } else {
      insertMediaNode(mediaUrl.trim(), "video");
    }

    setMediaUrl("");
    setActiveMedia(null);
  };

  const uploadMedia = async (
    event: ChangeEvent<HTMLInputElement>,
    type: "image" | "video",
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Upload failed");
      }

      if (type === "image") {
        insertMediaNode(data.url, "image");
      } else {
        insertMediaNode(data.url, "video");
      }
      setActiveMedia(null);
      setMediaUrl("");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-1 border-b border-neutral-200 p-2 dark:border-neutral-700">
        <div className="flex flex-wrap items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => formatBlock("paragraph")}
            title="Paragraph"
          >
            <Pilcrow className="h-4 w-4" />
          </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => formatBlock("h1")}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => formatBlock("h2")}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => formatBlock("h3")}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() =>
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")
          }
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() =>
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
          }
          title="Bullet list"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() =>
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
          }
          title="Numbered list"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => formatBlock("quote")}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={insertLink}
          title="Link"
        >
          <Link className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() =>
            setActiveMedia(activeMedia === "image" ? null : "image")
          }
          title="Image"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() =>
            setActiveMedia(activeMedia === "video" ? null : "video")
          }
          title="Video"
        >
          <Video className="h-4 w-4" />
        </Button>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="ml-auto"
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
          title="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => uploadMedia(event, "image")}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(event) => uploadMedia(event, "video")}
        />
      </div>
      {activeMedia ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-4 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
                {activeMedia === "image" ? (
                  <ImageIcon className="h-4 w-4" />
                ) : (
                  <Video className="h-4 w-4" />
                )}
                Add {activeMedia === "image" ? "image" : "video"}
              </div>
              <button
                type="button"
                className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                onClick={() => {
                  setActiveMedia(null);
                  setMediaUrl("");
                }}
              >
                Close
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="url"
                value={mediaUrl}
                onChange={(event) => setMediaUrl(event.target.value)}
                placeholder={`Paste ${activeMedia === "image" ? "image" : "video"} URL`}
                className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-500 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-400"
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={insertMediaByUrl}
                  disabled={!mediaUrl.trim()}
                >
                  Insert URL
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    (activeMedia === "image"
                      ? imageInputRef
                      : videoInputRef
                    ).current?.click()
                  }
                  disabled={uploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload from device"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function HtmlChangePlugin({ onChange }: { onChange: (value: string) => void }) {
  const handleChange = (_editorState: unknown, editor: LexicalEditor) => {
    editor.getEditorState().read(() => {
      onChange($generateHtmlFromNodes(editor));
    });
  };

  return <OnChangePlugin onChange={handleChange} />;
}

export default function RichTextEditor({
  id,
  value,
  onChange,
  rows = 12,
  placeholder,
}: RichTextEditorProps) {
  const [mode, setMode] = useState<"visual" | "preview" | "html">("visual");
  const initialConfig = {
    namespace: id,
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      AutoLinkNode,
      ImageNode,
      VideoNode,
    ],
    onError(error: Error) {
      throw error;
    },
    theme: editorTheme,
  };

  return (
    <div className="overflow-hidden rounded-md border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
      {mode === "visual" && (
        <LexicalComposer initialConfig={initialConfig}>
          <EditorToolbar />
          <div className="relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  id={id}
                  className="prose prose-sm min-h-48 max-w-none px-3 py-2 outline-none dark:prose-invert"
                  aria-placeholder={placeholder || ""}
                  placeholder={
                    <div className="pointer-events-none absolute left-3 top-2 text-sm text-neutral-400">
                      {placeholder}
                    </div>
                  }
                />
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>
          <ListPlugin />
          <HistoryPlugin />
          <HtmlInitializer value={value} />
          <HtmlChangePlugin onChange={onChange} />
        </LexicalComposer>
      )}

      {mode === "preview" && (
        <div className="min-h-48 p-4">
          <Prose className="max-w-none" html={value} />
        </div>
      )}

      {mode === "html" && (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="min-h-48 rounded-none border-0 font-mono text-sm focus-visible:ring-0"
        />
      )}

      <div className="flex items-center justify-between border-t border-neutral-200 px-3 py-2 text-xs text-neutral-500 dark:border-neutral-700">
        <span>Write visually, preview output, or edit source HTML.</span>
        <div className="flex items-center gap-3 text-sm text-black dark:text-white">
          <button
            type="button"
            className="inline-flex items-center gap-1 hover:underline"
            onClick={() => setMode("visual")}
          >
            <Type className="h-4 w-4" />
            Visual
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 hover:underline"
            onClick={() => setMode("preview")}
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 hover:underline"
            onClick={() => setMode("html")}
          >
            <Code2 className="h-4 w-4" />
            HTML
          </button>
        </div>
      </div>
    </div>
  );
}
