import { type Components } from "react-markdown";

export const markdownComponents: Components = {
  p: ({ node: _, ...props }) => <p className="m-0" {...props} />,
  ul: ({ node: _, ...props }) => (
    <ul className="list-disc pl-4 m-0" {...props} />
  ),
  ol: ({ node: _, ...props }) => (
    <ol className="list-decimal pl-4 m-0" {...props} />
  ),
  li: ({ node: _, ...props }) => <li className="my-1" {...props} />,
  strong: ({ node: _, ...props }) => (
    <strong className="font-bold" {...props} />
  ),
  h1: ({ node: _, ...props }) => (
    <h1 className="text-xl font-bold mt-4 mb-2" {...props} />
  ),
  h2: ({ node: _, ...props }) => (
    <h2 className="text-lg font-bold mt-4 mb-2" {...props} />
  ),
  h3: ({ node: _, ...props }) => (
    <h3 className="text-base font-bold mt-4 mb-2" {...props} />
  ),

  // 1. The Wrapper: Styles the dark box for big code blocks
  pre: ({ node: _, ...props }) => (
    <pre
      className="bg-slate-900 text-slate-50 p-3 rounded-lg overflow-x-auto text-xs my-2"
      {...props}
    />
  ),

  // 2. The Text: Differentiates between inline code and block code
  code: ({ node: _, className, children, ...props }) => {
    // v9 logic: If it has a language class or newlines, it's a block. Otherwise, it's inline.
    const isBlock =
      /language-(\w+)/.exec(className || "") || String(children).includes("\n");

    return isBlock ? (
      // Block code just gets passed through (the <pre> tag above handles the dark box styling)
      <code className={className} {...props}>
        {children}
      </code>
    ) : (
      // Inline code gets the special gray background with rose text
      <code
        className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-rose-600 dark:text-rose-400 font-mono text-xs"
        {...props}
      >
        {children}
      </code>
    );
  },
};