import { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
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
import { $setBlocksType } from "@lexical/selection";
import { $createParagraphNode, $getNodeByKey } from "lexical";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";

import type { ToolbarBlockType } from "./interfaces";

const LOW_PRIORITY = COMMAND_PRIORITY_LOW;

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [blockType, setBlockType] = useState<ToolbarBlockType>("paragraph");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    setIsBold(selection.hasFormat("bold"));
    setIsItalic(selection.hasFormat("italic"));
    setIsUnderline(selection.hasFormat("underline"));
    setIsStrikethrough(selection.hasFormat("strikethrough"));

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

  const insertLink = () => {
    const url = window.prompt("Enter URL");
    if (!url) return;
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
  };

  const Divider = () => <span className="rte-toolbar__divider" />;

  return (
    <div className="rte-toolbar" role="toolbar" aria-label="Text formatting">
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
        }}
      >
        <option value="paragraph">Normal</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="quote">Quote</option>
      </select>

      <Divider />

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

      <Divider />

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

      <Divider />

      <button
        type="button"
        aria-label="Insert link"
        className="rte-toolbar__btn"
        onClick={insertLink}
      >
        🔗
      </button>
    </div>
  );
}
