import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import CitationChip from "./CitationChip";
import type { SourceDocument } from "../../types";

interface Props {
  content: string;
  sources: SourceDocument[];
  isStreaming?: boolean;
}

/**
 * Turns bare "[1]" / "[2]" markers the LLM writes into markdown links pointing
 * at a fake "citation:N" href, which the custom `a` renderer below turns into
 * a <CitationChip/>. Code fences are left untouched so citation-looking
 * brackets inside example code never get rewritten.
 */
function injectCitationLinks(markdown: string): string {
  const segments = markdown.split(/(```[\s\S]*?```)/g);
  return segments
    .map((segment) =>
      segment.startsWith("```")
        ? segment
        : segment.replace(/\[(\d{1,2})\]/g, (_match, n) => `[${n}](citation:${n})`)
    )
    .join("");
}

export default function AnswerDisplay({ content, sources, isStreaming = false }: Props) {
  const processed = injectCitationLinks(content);

  return (
    <div className="prose-answer">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children, ...props }) {
            if (href?.startsWith("citation:")) {
              const idx = parseInt(href.replace("citation:", ""), 10);
              return <CitationChip index={idx} source={sources[idx - 1]} />;
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            );
          },
          code(props) {
            const { className, children } = props;
            const match = /language-(\w+)/.exec(className ?? "");
            if (!match) {
              return <code className={className}>{children}</code>;
            }
            return (
              <SyntaxHighlighter
                language={match[1]}
                style={oneDark}
                customStyle={{
                  borderRadius: "10px",
                  fontSize: "0.85em",
                  margin: "0.75em 0",
                  border: "1px solid var(--color-border)",
                }}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            );
          },
        }}
      >
        {processed}
      </ReactMarkdown>
      {isStreaming && <span className="streaming-caret" aria-hidden="true" />}
    </div>
  );
}
