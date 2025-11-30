import { type Message, type AssessmentResponse } from "@/types";
import { Bot, User, AlertTriangle } from "lucide-react";
import AssessmentPreview from "@/components/agents/assessment-preview";

interface ChatMessageProps {
  message: Message & { metadata?: any };
}

/**
 * Format timestamp to human-readable 12-hour format in local timezone
 */
function formatTimestamp(timestamp: string | Date): string {
  // Handle various timestamp formats
  let date: Date;
  
  if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'string') {
    // If timestamp doesn't have timezone info, assume it's UTC and append Z
    let normalizedTimestamp = timestamp;
    if (!timestamp.endsWith('Z') && !timestamp.includes('+') && !timestamp.includes('-', 10)) {
      normalizedTimestamp = timestamp + 'Z';
    }
    date = new Date(normalizedTimestamp);
  } else {
    return '';
  }
  
  // Check for invalid date
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const now = new Date();
  
  // Compare dates in local timezone
  const isToday = date.getFullYear() === now.getFullYear() &&
                  date.getMonth() === now.getMonth() &&
                  date.getDate() === now.getDate();
  
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  if (isToday) {
    return timeStr;
  }
  
  // Show date if not today
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  
  return `${dateStr}, ${timeStr}`;
}

/**
 * Format execution time to human-readable format
 */
function formatExecutionTime(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Simple markdown renderer for chat messages
 * Handles: **bold**, *italic*, `code`, bullet points, headers, links, horizontal rules
 */
function renderMarkdown(text: string): JSX.Element {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  
  lines.forEach((line, lineIdx) => {
    // Horizontal rule
    if (line.match(/^---+$/)) {
      elements.push(<hr key={lineIdx} className="my-2 border-current opacity-20" />);
      return;
    }
    
    // Headers
    if (line.startsWith('### ')) {
      elements.push(<h3 key={lineIdx} className="font-semibold text-sm mt-2 mb-1">{renderInlineMarkdown(line.slice(4))}</h3>);
      return;
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={lineIdx} className="font-semibold text-base mt-3 mb-1">{renderInlineMarkdown(line.slice(3))}</h2>);
      return;
    }
    if (line.startsWith('# ')) {
      elements.push(<h1 key={lineIdx} className="font-bold text-lg mt-3 mb-2">{renderInlineMarkdown(line.slice(2))}</h1>);
      return;
    }
    
    // Bullet points
    if (line.match(/^[\s]*[•\-\*]\s/)) {
      const content = line.replace(/^[\s]*[•\-\*]\s/, '');
      elements.push(
        <div key={lineIdx} className="flex items-start gap-2 ml-2">
          <span className="text-current opacity-60">•</span>
          <span>{renderInlineMarkdown(content)}</span>
        </div>
      );
      return;
    }
    
    // Numbered lists
    const numberedMatch = line.match(/^(\d+)\.\s(.+)/);
    if (numberedMatch) {
      elements.push(
        <div key={lineIdx} className="flex items-start gap-2 ml-2">
          <span className="text-current opacity-60 min-w-[1.2em]">{numberedMatch[1]}.</span>
          <span>{renderInlineMarkdown(numberedMatch[2])}</span>
        </div>
      );
      return;
    }
    
    // Empty lines
    if (line.trim() === '') {
      elements.push(<div key={lineIdx} className="h-2" />);
      return;
    }
    
    // Regular paragraph with inline formatting
    elements.push(<p key={lineIdx} className="text-sm">{renderInlineMarkdown(line)}</p>);
  });
  
  return <div className="space-y-0.5">{elements}</div>;
}

/**
 * Renders inline markdown: **bold**, *italic*, `code`, [links](url)
 */
function renderInlineMarkdown(text: string): (string | JSX.Element)[] {
  const result: (string | JSX.Element)[] = [];
  let remaining = text;
  let keyIdx = 0;
  
  while (remaining.length > 0) {
    // Bold: **text** or __text__
    const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*/s) || remaining.match(/^(.*?)__(.+?)__/s);
    if (boldMatch) {
      if (boldMatch[1]) result.push(boldMatch[1]);
      result.push(<strong key={`b${keyIdx++}`} className="font-semibold">{boldMatch[2]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }
    
    // Italic: *text* or _text_ (but not inside words)
    const italicMatch = remaining.match(/^(.*?)\*([^*]+)\*/s) || remaining.match(/^(.*?)(?<!\w)_([^_]+)_(?!\w)/s);
    if (italicMatch) {
      if (italicMatch[1]) result.push(italicMatch[1]);
      result.push(<em key={`i${keyIdx++}`} className="italic">{italicMatch[2]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }
    
    // Inline code: `code`
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`/);
    if (codeMatch) {
      if (codeMatch[1]) result.push(codeMatch[1]);
      result.push(<code key={`c${keyIdx++}`} className="bg-black/20 px-1 py-0.5 rounded text-xs font-mono">{codeMatch[2]}</code>);
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }
    
    // Links: [text](url)
    const linkMatch = remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      if (linkMatch[1]) result.push(linkMatch[1]);
      result.push(
        <a key={`l${keyIdx++}`} href={linkMatch[3]} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
          {linkMatch[2]}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }
    
    // No more matches, add remaining text
    result.push(remaining);
    break;
  }
  
  return result;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.type === "user";
  const isError = message.type === "error";

  // Check if this is an assessment response
  let isAssessment = false;
  let assessmentData: AssessmentResponse | null = null;

  if (!isUser && typeof message.content === "string") {
    try {
      const parsed = JSON.parse(message.content);
      if (parsed.title && parsed.questions && Array.isArray(parsed.questions)) {
        isAssessment = true;
        assessmentData = parsed as AssessmentResponse;
      }
    } catch (e) {
      // Not an assessment, will render as text
    }
  }

  // Render assessment responses differently (full width, no bubble)
  if (isAssessment && assessmentData) {
    return (
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-accent text-accent-foreground">
          <Bot className="w-5 h-5" />
        </div>
        <div className="flex-1 max-w-full">
          <AssessmentPreview
            assessment={assessmentData}
            pdfPath={message.metadata?.pdf_path}
          />
          {message.metadata && message.metadata.executionTime && (
            <div className="mt-2 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground flex items-center gap-4">
              <span>⏱️ {formatExecutionTime(message.metadata.executionTime)}</span>
              {message.metadata.agentTrace &&
                Array.isArray(message.metadata.agentTrace) && (
                  <span>🔗 {message.metadata.agentTrace.join(" → ")}</span>
                )}
              <span className="ml-auto">{formatTimestamp(message.timestamp)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (typeof message.content === "string") {
      // Use markdown renderer for agent messages, plain text for user
      if (isUser) {
        return <p className="text-sm whitespace-pre-wrap">{message.content}</p>;
      }
      return renderMarkdown(message.content);
    }
    return (
      <p className="text-sm whitespace-pre-wrap">
        {JSON.stringify(message.content)}
      </p>
    );
  };

  const Icon = isUser ? User : isError ? AlertTriangle : Bot;

  return (
    <div
      className={`flex items-start gap-3 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && (
        <div
          className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
            isError
              ? "bg-destructive/20 text-destructive"
              : "bg-accent text-accent-foreground"
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div
        className={`max-w-xs lg:max-w-2xl px-4 py-2 rounded-lg ${
          isError
            ? "bg-destructive/10 border border-destructive/20 text-destructive-foreground"
            : isUser
            ? "bg-primary text-primary-foreground"
            : "bg-accent text-accent-foreground"
        }`}
      >
        {renderContent()}
        {message.metadata && message.metadata.executionTime && (
          <div className="mt-2 pt-2 border-t border-current/20 text-xs opacity-80">
            <div className="flex items-center gap-3 flex-wrap">
              <span>⏱️ {formatExecutionTime(message.metadata.executionTime)}</span>
              {Array.isArray(message.metadata.agentTrace) && (
                <span>🔗 {message.metadata.agentTrace.join(' → ')}</span>
              )}
            </div>
          </div>
        )}
        <p className="text-xs opacity-70 mt-1 text-right">
          {formatTimestamp(message.timestamp)}
        </p>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-primary/20 text-primary">
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}
