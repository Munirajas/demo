# RichTextEditor — Lexical Component (Full Code + Change Log)

A reusable, Storybook-ready rich text editor built on **Lexical**, structured the same way as your existing `accordion` component (component folder + `interfaces.ts` + `index.ts`, separate `stories/` folder).

## Summary of changes across this conversation

**Round 1 — initial component**
- Built `RichTextEditor` on Lexical
- Toolbar: undo/redo, block type, bold/italic/underline/strikethrough, lists, link
- Files: `richtexteditor.tsx`, `toolbarPlugin.tsx`, `interfaces.ts`, `index.ts`, `richtexteditor.css`, Storybook `stories/`

**Round 2 — expanded toolbar (Slate.js reference)**
- Added inline code, code block, text alignment, indent/outdent, image insert
- New files: `imageNode.tsx`, `imagesPlugin.tsx`

**Round 3 — packaging**
- Combined everything into one readable file instead of a CDN-based standalone HTML, which didn't load reliably

**Round 4 (this file) — react-draft-wysiwyg parity**
You compared our toolbar screenshot against react-draft-wysiwyg's and asked for the same look, order, and options, plus flagged that bullet/numbered lists didn't look right. Two things changed:

1. **Root cause of the list bug found and fixed.** Lexical was already creating correct `<ul>/<ol>/<li>` markup — the bullets/numbers just weren't rendering. This happens when a CSS reset (e.g. Tailwind's Preflight) strips default `list-style` from every `<ul>`/`<ol>` on the page. `richtexteditor.css` now explicitly re-declares `list-style-type` (disc/decimal, with circle/square and lower-alpha/lower-roman for nested levels), scoped to `.rte-content` only, so it can't leak into or conflict with the rest of your app.
2. **Toolbar rebuilt to mirror react-draft-wysiwyg's layout, in the same order:**
   - **Row 1** (inline + block/font controls): Bold, Italic, Underline, Strikethrough, Inline code, **Superscript**, **Subscript** *(new)*, Block type dropdown, **Font size dropdown** *(new)*, **Font family dropdown** *(new)*
   - **Row 2** (list/align/insert): Bulleted list, Numbered list, Indent, Outdent, Align left/center/right/justify, **Text color picker** *(new)*, Link, **Unlink** *(new)*, Image, **Clear formatting** *(new)*
   - **Row 3**: Undo, Redo
   - Font size/family/color use Lexical's `$patchStyleText` (`@lexical/selection`) to write inline CSS styles onto the selected text — no new packages required.
   - **Not included:** react-draft-wysiwyg's emoji picker and "embed" tool. Both need a fair amount of extra UI (an emoji grid, an oEmbed/iframe resolver) — say the word if you want either added next.

---

## Required packages

```bash
npm install lexical @lexical/react @lexical/rich-text @lexical/list @lexical/link @lexical/html @lexical/selection @lexical/utils @lexical/code
```
_(unchanged from last round — font size/family/color reuse `@lexical/selection`, already installed)_

## Folder structure

```
src/components/richtexteditor/
  richtexteditor.tsx
  toolbarPlugin.tsx
  imageNode.tsx
  imagesPlugin.tsx
  richtexteditor.css
  interfaces.ts
  index.ts

src/stories/richtexteditor/
  richtexteditor.stories.tsx
  data.ts
```

## Next.js note

Lexical touches `document`/`window`, so mark usages as client-side:

```tsx
"use client";
import { RichTextEditor } from "@/components/richtexteditor";
```
Pages Router: wrap with `next/dynamic` and `{ ssr: false }`.

---

## Full code

### `README.md`
_Setup notes_

```markdown
# RichTextEditor (Lexical)

## 1. Install packages
```bash
npm install lexical @lexical/react @lexical/rich-text @lexical/list @lexical/link @lexical/html @lexical/selection @lexical/utils @lexical/code
```

## 2. Folder placement
Match your existing `accordion` structure:

```
src/components/richtexteditor/
  richtexteditor.tsx
  toolbarPlugin.tsx
  imageNode.tsx
  imagesPlugin.tsx
  richtexteditor.css
  interfaces.ts
  index.ts

src/stories/richtexteditor/
  richtexteditor.stories.tsx
  data.ts
```

## 3. Next.js note
Lexical touches `document`/`window` (link prompts, DOM parsing for initial HTML), so import it client-side only:

```tsx
"use client";
import { RichTextEditor } from "@/components/richtexteditor";
```

If you use the Pages Router instead of App Router, wrap usages with `next/dynamic` and `{ ssr: false }`.

## 4. What's in the toolbar
Undo/redo · block type (paragraph, H1–H3, quote, code block) · bold, italic, underline, strikethrough, inline code · align left/center/right/justify · bullet/numbered list · indent/outdent · link · image insert (base64 for demo purposes — swap the `FileReader` step in `toolbarPlugin.tsx` for an upload call to use real hosted URLs in production).

## 5. Usage
```tsx
<RichTextEditor
  placeholder="Write something..."
  onChange={({ html, text }) => console.log(html, text)}
/>
```
```

### `interfaces.ts`
_Component prop types_

```typescript
export interface RichTextEditorProps {
  /** Placeholder text shown when the editor is empty */
  placeholder?: string;
  /** Initial editor content as an HTML string (optional) */
  initialHtml?: string;
  /** Disables editing and hides the toolbar */
  disabled?: boolean;
  /** Fires on every content change, giving back HTML + plain text */
  onChange?: (value: { html: string; text: string }) => void;
  /** Minimum height of the editable area (px or any CSS unit) */
  minHeight?: string;
  /** Optional className passed to the outer wrapper for layout control */
  className?: string;
}

export type ToolbarBlockType =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "bullet"
  | "number"
  | "quote"
  | "code";
```

### `imageNode.tsx`
_Custom Lexical image node_

```tsx
import type {
  LexicalCommand,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { DecoratorNode, createCommand } from "lexical";

export interface ImagePayload {
  src: string;
  altText: string;
  key?: NodeKey;
}

export type SerializedImageNode = Spread<
  {
    src: string;
    altText: string;
    type: "image";
    version: 1;
  },
  SerializedLexicalNode
>;

function ImageComponent({ src, altText }: { src: string; altText: string }) {
  return <img src={src} alt={altText} className="rte-image" />;
}

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__altText, node.__key);
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return $createImageNode({
      src: serializedNode.src,
      altText: serializedNode.altText,
    });
  }

  exportJSON(): SerializedImageNode {
    return {
      src: this.__src,
      altText: this.__altText,
      type: "image",
      version: 1,
    };
  }

  constructor(src: string, altText: string, key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__altText = altText;
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    div.className = "rte-image-wrapper";
    return div;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    return <ImageComponent src={this.__src} altText={this.__altText} />;
  }
}

export function $createImageNode({ src, altText, key }: ImagePayload): ImageNode {
  return new ImageNode(src, altText, key);
}

export function $isImageNode(
  node: LexicalNode | null | undefined
): node is ImageNode {
  return node instanceof ImageNode;
}

export const INSERT_IMAGE_COMMAND: LexicalCommand<ImagePayload> = createCommand(
  "INSERT_IMAGE_COMMAND"
);
```

### `imagesPlugin.tsx`
_Registers the image insert command_

```tsx
import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $insertNodes, COMMAND_PRIORITY_EDITOR } from "lexical";
import { $createImageNode, INSERT_IMAGE_COMMAND, ImageNode } from "./imageNode";

export function ImagesPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error("ImagesPlugin: ImageNode is not registered on the editor");
    }

    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        const imageNode = $createImageNode(payload);
        $insertNodes([imageNode]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
```

### `toolbarPlugin.tsx`
_Toolbar UI + formatting logic — REWRITTEN this round to match react-draft-wysiwyg's layout, order, and add its missing options_

```tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  COMMAND_PRIORITY_LOW,
} from "lexical";
import {
  $isListNode,
  ListNode,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import {
  $isHeadingNode,
  $createHeadingNode,
  $createQuoteNode,
} from "@lexical/rich-text";
import { $createCodeNode, $isCodeNode } from "@lexical/code";
import { $setBlocksType, $patchStyleText } from "@lexical/selection";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";

import { INSERT_IMAGE_COMMAND } from "./imageNode";
import type { ToolbarBlockType } from "./interfaces";

const LOW_PRIORITY = COMMAND_PRIORITY_LOW;

const FONT_SIZE_OPTIONS = ["12px", "14px", "15px", "16px", "18px", "20px", "24px", "28px", "32px"];
const FONT_FAMILY_OPTIONS = ["Arial", "Georgia", "Impact", "Tahoma", "Times New Roman", "Verdana"];

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [blockType, setBlockType] = useState<ToolbarBlockType>("paragraph");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    setIsBold(selection.hasFormat("bold"));
    setIsItalic(selection.hasFormat("italic"));
    setIsUnderline(selection.hasFormat("underline"));
    setIsStrikethrough(selection.hasFormat("strikethrough"));
    setIsCode(selection.hasFormat("code"));
    setIsSuperscript(selection.hasFormat("superscript"));
    setIsSubscript(selection.hasFormat("subscript"));

    const anchorNode = selection.anchor.getNode();
    const targetNode =
      anchorNode.getKey() === "root"
        ? anchorNode
        : $findMatchingParent(anchorNode, (e) => {
            const parent = e.getParent();
            return parent !== null && parent.getKey() === "root";
          }) ?? anchorNode;

    const element = targetNode.getTopLevelElementOrThrow
      ? targetNode.getTopLevelElementOrThrow()
      : targetNode;

    if ($isListNode(element)) {
      const parentList = $findMatchingParent(anchorNode, $isListNode) as
        | ListNode
        | null;
      const type = parentList ? parentList.getListType() : element.getListType();
      setBlockType(type === "bullet" ? "bullet" : "number");
    } else if ($isHeadingNode(element)) {
      setBlockType(element.getTag() as ToolbarBlockType);
    } else if ($isCodeNode(element)) {
      setBlockType("code");
    } else {
      const type = (element as any).getType?.();
      setBlockType(type === "quote" ? "quote" : "paragraph");
    }
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => updateToolbar());
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        LOW_PRIORITY
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        LOW_PRIORITY
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        LOW_PRIORITY
      )
    );
  }, [editor, updateToolbar]);

  const formatHeading = (tag: "h1" | "h2" | "h3") => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(tag));
      }
    });
  };

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  };

  const formatCodeBlock = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createCodeNode());
      }
    });
  };

  const applyFontSize = (value: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, { "font-size": value });
      }
    });
  };

  const applyFontFamily = (value: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, { "font-family": value });
      }
    });
  };

  const applyColor = (value: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, { color: value });
      }
    });
  };

  const clearFormatting = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      ["bold", "italic", "underline", "strikethrough", "code", "superscript", "subscript"].forEach(
        (format) => {
          if (selection.hasFormat(format as any)) {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, format as any);
          }
        }
      );
      $patchStyleText(selection, {
        "font-size": "",
        "font-family": "",
        color: "",
      });
      $setBlocksType(selection, () => $createParagraphNode());
    });
  };

  const insertLink = () => {
    const url = window.prompt("Enter URL");
    if (!url) return;
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
  };

  const removeLink = () => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
  };

  const handleImageButtonClick = () => fileInputRef.current?.click();

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
        src: reader.result as string,
        altText: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const Divider = () => <span className="rte-toolbar__divider" />;

  return (
    <div className="rte-toolbar" role="toolbar" aria-label="Text formatting">
      {/* Row 1: inline styles + block type + font controls (matches react-draft-wysiwyg row 1) */}
      <div className="rte-toolbar__row">
        <button
          type="button"
          aria-label="Bold"
          aria-pressed={isBold}
          className={`rte-toolbar__btn ${isBold ? "is-active" : ""}`}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          aria-label="Italic"
          aria-pressed={isItalic}
          className={`rte-toolbar__btn ${isItalic ? "is-active" : ""}`}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          aria-label="Underline"
          aria-pressed={isUnderline}
          className={`rte-toolbar__btn ${isUnderline ? "is-active" : ""}`}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        >
          <u>U</u>
        </button>
        <button
          type="button"
          aria-label="Strikethrough"
          aria-pressed={isStrikethrough}
          className={`rte-toolbar__btn ${isStrikethrough ? "is-active" : ""}`}
          onClick={() =>
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
          }
        >
          <s>S</s>
        </button>
        <button
          type="button"
          aria-label="Inline code"
          aria-pressed={isCode}
          className={`rte-toolbar__btn ${isCode ? "is-active" : ""}`}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
        >
          {"{}"}
        </button>
        <button
          type="button"
          aria-label="Superscript"
          aria-pressed={isSuperscript}
          className={`rte-toolbar__btn ${isSuperscript ? "is-active" : ""}`}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "superscript")}
        >
          X²
        </button>
        <button
          type="button"
          aria-label="Subscript"
          aria-pressed={isSubscript}
          className={`rte-toolbar__btn ${isSubscript ? "is-active" : ""}`}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "subscript")}
        >
          X₂
        </button>

        <Divider />

        <select
          aria-label="Block type"
          className="rte-toolbar__select"
          value={blockType}
          onChange={(e) => {
            const value = e.target.value as ToolbarBlockType;
            if (value === "paragraph") formatParagraph();
            else if (value === "h1" || value === "h2" || value === "h3")
              formatHeading(value);
            else if (value === "quote") formatQuote();
            else if (value === "code") formatCodeBlock();
          }}
        >
          <option value="paragraph">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="quote">Quote</option>
          <option value="code">Code block</option>
        </select>

        <select
          aria-label="Font size"
          className="rte-toolbar__select rte-toolbar__select--sm"
          defaultValue="16px"
          onChange={(e) => applyFontSize(e.target.value)}
        >
          {FONT_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size.replace("px", "")}
            </option>
          ))}
        </select>

        <select
          aria-label="Font family"
          className="rte-toolbar__select"
          defaultValue=""
          onChange={(e) => applyFontFamily(e.target.value)}
        >
          <option value="">Font</option>
          {FONT_FAMILY_OPTIONS.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
      </div>

      {/* Row 2: list / indent / align / insert tools (matches react-draft-wysiwyg row 2) */}
      <div className="rte-toolbar__row">
        <button
          type="button"
          aria-label="Bulleted list"
          aria-pressed={blockType === "bullet"}
          className={`rte-toolbar__btn ${blockType === "bullet" ? "is-active" : ""}`}
          onClick={() =>
            blockType === "bullet"
              ? editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
              : editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
          }
        >
          • List
        </button>
        <button
          type="button"
          aria-label="Numbered list"
          aria-pressed={blockType === "number"}
          className={`rte-toolbar__btn ${blockType === "number" ? "is-active" : ""}`}
          onClick={() =>
            blockType === "number"
              ? editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
              : editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
          }
        >
          1. List
        </button>
        <button
          type="button"
          aria-label="Indent"
          className="rte-toolbar__btn"
          onClick={() => editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)}
        >
          ⇥
        </button>
        <button
          type="button"
          aria-label="Outdent"
          className="rte-toolbar__btn"
          onClick={() => editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)}
        >
          ⇤
        </button>

        <Divider />

        <button
          type="button"
          aria-label="Align left"
          className="rte-toolbar__btn"
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")}
        >
          ⯇≡
        </button>
        <button
          type="button"
          aria-label="Align center"
          className="rte-toolbar__btn"
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")}
        >
          ≡
        </button>
        <button
          type="button"
          aria-label="Align right"
          className="rte-toolbar__btn"
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")}
        >
          ≡⯈
        </button>
        <button
          type="button"
          aria-label="Justify"
          className="rte-toolbar__btn"
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify")}
        >
          ☰
        </button>

        <Divider />

        <label className="rte-toolbar__color" aria-label="Text color">
          <span aria-hidden="true">A</span>
          <input
            type="color"
            defaultValue="#101828"
            onChange={(e) => applyColor(e.target.value)}
          />
        </label>
        <button
          type="button"
          aria-label="Insert link"
          className="rte-toolbar__btn"
          onClick={insertLink}
        >
          🔗
        </button>
        <button
          type="button"
          aria-label="Remove link"
          className="rte-toolbar__btn"
          onClick={removeLink}
        >
          ⛓️‍💥
        </button>
        <button
          type="button"
          aria-label="Insert image"
          className="rte-toolbar__btn"
          onClick={handleImageButtonClick}
        >
          🖼
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="rte-hidden-input"
          onChange={handleImageFileChange}
        />
        <button
          type="button"
          aria-label="Clear formatting"
          className="rte-toolbar__btn"
          onClick={clearFormatting}
        >
          🧹
        </button>
      </div>

      {/* Row 3: undo/redo (matches react-draft-wysiwyg row 3) */}
      <div className="rte-toolbar__row">
        <button
          type="button"
          aria-label="Undo"
          disabled={!canUndo}
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
          className="rte-toolbar__btn"
        >
          ↺
        </button>
        <button
          type="button"
          aria-label="Redo"
          disabled={!canRedo}
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
          className="rte-toolbar__btn"
        >
          ↻
        </button>
      </div>
    </div>
  );
}
```

### `richtexteditor.tsx`
_Main editor component_

```tsx
import { $getRoot, $insertNodes, EditorState, LexicalEditor } from "lexical";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { CodeNode } from "@lexical/code";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";

import { ToolbarPlugin } from "./toolbarPlugin";
import { ImageNode } from "./imageNode";
import { ImagesPlugin } from "./imagesPlugin";
import type { RichTextEditorProps } from "./interfaces";
import "./richtexteditor.css";

const editorNodes = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  CodeNode,
  ImageNode,
];

export function RichTextEditor({
  placeholder = "Start typing...",
  initialHtml,
  disabled = false,
  onChange,
  minHeight = "160px",
  className = "",
}: RichTextEditorProps) {
  const initialConfig = {
    namespace: "RichTextEditor",
    nodes: editorNodes,
    editable: !disabled,
    onError(error: Error) {
      throw error;
    },
    editorState: initialHtml
      ? (editor: LexicalEditor) => {
          const parser = new DOMParser();
          const dom = parser.parseFromString(initialHtml, "text/html");
          const nodes = $generateNodesFromDOM(editor, dom);
          $getRoot().select();
          $insertNodes(nodes);
        }
      : undefined,
  };

  const handleChange = (editorState: EditorState, editor: LexicalEditor) => {
    if (!onChange) return;
    editorState.read(() => {
      const html = $generateHtmlFromNodes(editor, null);
      const text = $getRoot().getTextContent();
      onChange({ html, text });
    });
  };

  return (
    <div className={`rte ${className}`}>
      <LexicalComposer initialConfig={initialConfig}>
        {!disabled && <ToolbarPlugin />}
        <div className="rte-editor" style={{ minHeight }}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="rte-content" aria-placeholder={placeholder} />
            }
            placeholder={<div className="rte-placeholder">{placeholder}</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <ImagesPlugin />
        {onChange && <OnChangePlugin onChange={handleChange} />}
      </LexicalComposer>
    </div>
  );
}
```

### `richtexteditor.css`
_Styles — REWRITTEN this round: 3-row toolbar layout + the list-style bug fix_

```css
.rte {
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  overflow: hidden;
  font-family: inherit;
  background: #fff;
}

.rte-toolbar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid #e4e7ec;
  background: #fbfbfc;
}

.rte-toolbar__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.rte-toolbar__btn {
  border: 1px solid #eef0f3;
  background: #fff;
  border-radius: 4px;
  padding: 4px 8px;
  min-width: 32px;
  height: 32px;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  color: #344054;
}

.rte-toolbar__btn:hover:not(:disabled) {
  border-color: #d0d5dd;
  background: #f5f6f8;
}

.rte-toolbar__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.rte-toolbar__btn.is-active {
  background: #e0e7ff;
  border-color: #a4b6fc;
  color: #3730a3;
}

.rte-toolbar__select {
  border: 1px solid #eef0f3;
  border-radius: 4px;
  padding: 4px 6px;
  height: 32px;
  font-size: 13px;
  background: #fff;
  color: #344054;
  min-width: 92px;
}

.rte-toolbar__select--sm {
  min-width: 56px;
}

.rte-toolbar__divider {
  width: 1px;
  height: 22px;
  background: #e4e7ec;
  margin: 0 4px;
}

.rte-toolbar__color {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  border: 1px solid #eef0f3;
  border-radius: 4px;
  height: 32px;
  padding: 0 6px;
  cursor: pointer;
  font-size: 13px;
  color: #344054;
}

.rte-toolbar__color input[type="color"] {
  width: 18px;
  height: 18px;
  border: none;
  padding: 0;
  background: none;
  cursor: pointer;
}

.rte-editor {
  position: relative;
  padding: 12px 14px;
}

.rte-content {
  outline: none;
  min-height: inherit;
  font-size: 14px;
  line-height: 1.6;
  color: #101828;
}

.rte-content h1 {
  font-size: 1.6em;
  font-weight: 700;
  margin: 0.4em 0;
}

.rte-content h2 {
  font-size: 1.3em;
  font-weight: 700;
  margin: 0.4em 0;
}

.rte-content h3 {
  font-size: 1.1em;
  font-weight: 600;
  margin: 0.4em 0;
}

.rte-content blockquote {
  border-left: 3px solid #d0d5dd;
  margin: 0.5em 0;
  padding-left: 12px;
  color: #475467;
  font-style: italic;
}

/*
  IMPORTANT: if your app uses Tailwind's Preflight (or any other CSS reset),
  it strips list-style from <ul>/<ol> globally. That silently breaks bullet
  and numbered lists -- Lexical still creates the correct <ul>/<ol>/<li>
  structure, the markers just aren't visible. These rules restore them
  scoped to the editor only.
*/
.rte-content ul,
.rte-content ol {
  padding-left: 1.4em;
  margin: 0.4em 0;
  list-style-position: outside;
}

.rte-content ul {
  list-style-type: disc;
}

.rte-content ol {
  list-style-type: decimal;
}

.rte-content ul ul {
  list-style-type: circle;
}

.rte-content ul ul ul {
  list-style-type: square;
}

.rte-content ol ol {
  list-style-type: lower-alpha;
}

.rte-content ol ol ol {
  list-style-type: lower-roman;
}

.rte-content li {
  margin: 0.15em 0;
}

.rte-content code {
  background: #f2f4f7;
  border-radius: 4px;
  padding: 0 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.9em;
}

.rte-content pre {
  background: #101828;
  color: #f2f4f7;
  border-radius: 8px;
  padding: 12px 14px;
  overflow-x: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.85em;
  line-height: 1.5;
  margin: 0.5em 0;
}

.rte-content a {
  color: #4338ca;
  text-decoration: underline;
}

.rte-image-wrapper {
  margin: 0.5em 0;
}

.rte-image {
  max-width: 100%;
  border-radius: 8px;
  display: block;
}

.rte-hidden-input {
  display: none;
}

.rte-placeholder {
  position: absolute;
  top: 12px;
  left: 14px;
  color: #98a2b3;
  font-size: 14px;
  pointer-events: none;
  user-select: none;
}
```

### `index.ts`
_Barrel export_

```typescript
export { RichTextEditor } from "./richtexteditor";
export type { RichTextEditorProps } from "./interfaces";
```

### `data.ts`
_Sample content for Storybook stories_

```typescript
export const emptyContent = "";

export const sampleContent = `
  <h2>Welcome to the editor</h2>
  <p>This is a <strong>rich text</strong> editor built with <em>Lexical</em>. You can format text, add lists, headings, quotes and links.</p>
  <ul>
    <li>Bold, italic, underline, strikethrough</li>
    <li>Headings and paragraphs</li>
    <li>Bulleted and numbered lists</li>
  </ul>
  <blockquote>Edit this content directly in the toolbar above.</blockquote>
`;

export const disabledContent = `
  <p>This editor is <strong>read-only</strong> — the toolbar is hidden and editing is disabled.</p>
`;
```

### `richtexteditor.stories.tsx`
_Storybook 8 stories_

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { RichTextEditor } from "@/components/richtexteditor";
import { emptyContent, sampleContent, disabledContent } from "./data";

const meta: Meta<typeof RichTextEditor> = {
  title: "Components/RichTextEditor",
  component: RichTextEditor,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Lexical-based rich text editor with a toolbar covering the most common formatting needs: bold, italic, underline, strikethrough, headings, lists, quotes, links, and undo/redo.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: 480 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Start typing...",
    initialHtml: emptyContent,
  },
};

export const WithContent: Story = {
  args: {
    initialHtml: sampleContent,
  },
};

export const Disabled: Story = {
  args: {
    initialHtml: disabledContent,
    disabled: true,
  },
};

export const WithChangeHandler: Story = {
  args: {
    placeholder: "Type to see console output...",
    onChange: ({ html, text }) => {
      // eslint-disable-next-line no-console
      console.log({ html, text });
    },
  },
};

export const TallEditor: Story = {
  args: {
    initialHtml: sampleContent,
    minHeight: "320px",
  },
};
```
