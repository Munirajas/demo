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
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";

import { ToolbarPlugin } from "./toolbarPlugin";
import type { RichTextEditorProps } from "./interfaces";
import "./richtexteditor.css";

const editorNodes = [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode];

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
        {onChange && <OnChangePlugin onChange={handleChange} />}
      </LexicalComposer>
    </div>
  );
}
