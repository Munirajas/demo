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
  | "quote";
