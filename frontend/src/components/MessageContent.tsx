import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MessageContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none prose-table:text-xs prose-th:bg-gray-50 prose-th:px-2 prose-th:py-1 prose-td:px-2 prose-td:py-1 prose-td:border prose-th:border">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
