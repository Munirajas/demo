# RichTextEditor (Lexical)

## 1. Install packages
```bash
npm install lexical @lexical/react @lexical/rich-text @lexical/list @lexical/link @lexical/html @lexical/selection @lexical/utils
```

## 2. Folder placement
Match your existing `accordion` structure:

```
src/components/richtexteditor/
  richtexteditor.tsx
  toolbarPlugin.tsx
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

## 4. Usage
```tsx
<RichTextEditor
  placeholder="Write something..."
  onChange={({ html, text }) => console.log(html, text)}
/>
```
