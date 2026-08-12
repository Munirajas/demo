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
