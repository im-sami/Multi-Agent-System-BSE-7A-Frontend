import { type Message, type AssessmentResponse } from "@/types";
import { Bot, User, AlertTriangle, Clock } from "lucide-react";
import AssessmentPreview from "@/components/agents/assessment-preview";
import TypingIndicator from "@/components/typing-indicator";

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
 * Handles: **bold**, *italic*, `code`, ```code blocks```, bullet points, headers, links, horizontal rules
 */
function renderMarkdown(text: string): JSX.Element {
  const elements: JSX.Element[] = [];
  let keyIdx = 0;
  
  // First, handle fenced code blocks (```code```)
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  const parts: { type: 'text' | 'code'; content: string; language?: string }[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text before the code block
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    // Add the code block
    parts.push({ type: 'code', content: match[2].trim(), language: match[1] || undefined });
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after the last code block
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }
  
  // If no code blocks found, treat entire text as regular text
  if (parts.length === 0) {
    parts.push({ type: 'text', content: text });
  }
  
  parts.forEach((part, partIdx) => {
    if (part.type === 'code') {
      // Render code block with syntax highlighting styling
      elements.push(
        <div key={`codeblock-${partIdx}`} className="my-3 rounded-lg overflow-hidden">
          {part.language && (
            <div className="bg-black/40 px-3 py-1 text-xs text-muted-foreground font-mono border-b border-white/10">
              {part.language}
            </div>
          )}
          <pre className="bg-black/30 p-3 overflow-x-auto">
            <code className="text-xs font-mono whitespace-pre text-green-300/90">{part.content}</code>
          </pre>
        </div>
      );
    } else {
      // Render regular text with line-by-line processing
      const lines = part.content.split('\n');
      
      lines.forEach((line, lineIdx) => {
        const lineKey = `${partIdx}-${lineIdx}`;
        
        // Horizontal rule
        if (line.match(/^---+$/)) {
          elements.push(<hr key={lineKey} className="my-2 border-current opacity-20" />);
          return;
        }
        
        // Headers
        if (line.startsWith('### ')) {
          elements.push(<h3 key={lineKey} className="font-semibold text-sm mt-2 mb-1">{renderInlineMarkdown(line.slice(4))}</h3>);
          return;
        }
        if (line.startsWith('## ')) {
          elements.push(<h2 key={lineKey} className="font-semibold text-base mt-3 mb-1">{renderInlineMarkdown(line.slice(3))}</h2>);
          return;
        }
        if (line.startsWith('# ')) {
          elements.push(<h1 key={lineKey} className="font-bold text-lg mt-3 mb-2">{renderInlineMarkdown(line.slice(2))}</h1>);
          return;
        }
        
        // Bullet points
        if (line.match(/^[\s]*[•\-\*]\s/)) {
          const content = line.replace(/^[\s]*[•\-\*]\s/, '');
          elements.push(
            <div key={lineKey} className="flex items-start gap-2 ml-2">
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
            <div key={lineKey} className="flex items-start gap-2 ml-2">
              <span className="text-current opacity-60 min-w-[1.2em]">{numberedMatch[1]}.</span>
              <span>{renderInlineMarkdown(numberedMatch[2])}</span>
            </div>
          );
          return;
        }
        
        // Empty lines
        if (line.trim() === '') {
          elements.push(<div key={lineKey} className="h-2" />);
          return;
        }
        
        // Regular paragraph with inline formatting
        elements.push(<p key={lineKey} className="text-sm">{renderInlineMarkdown(line)}</p>);
      });
    }
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
      result.push(<code key={`c${keyIdx++}`} className="bg-black/30 px-1.5 py-0.5 rounded text-xs font-mono text-green-300/90 border border-white/10">{codeMatch[2]}</code>);
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
  const isLoading = message.type === "loading";

  // Show typing indicator for loading messages
  if (isLoading) {
    return <TypingIndicator />;
  }

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
          {(message.metadata?.executionTime || message.timestamp) && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-muted/30 text-xs text-muted-foreground flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {message.metadata?.executionTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatExecutionTime(message.metadata.executionTime)}</span>
                  </span>
                )}
                {message.metadata?.agentTrace && Array.isArray(message.metadata.agentTrace) && message.metadata.agentTrace.length > 0 && (
                  <span className="flex items-center gap-1">
                    <span>•</span>
                    <span>{message.metadata.agentTrace[message.metadata.agentTrace.length - 1]}</span>
                  </span>
                )}
              </div>
              <span>{formatTimestamp(message.timestamp)}</span>
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
        <div className="mt-2 pt-2 border-t border-current/10 text-xs opacity-70 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {message.metadata && message.metadata.executionTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatExecutionTime(message.metadata.executionTime)}</span>
              </span>
            )}
            {message.metadata && Array.isArray(message.metadata.agentTrace) && message.metadata.agentTrace.length > 0 && (
              <span className="flex items-center gap-1">
                <span>•</span>
                <span>{message.metadata.agentTrace[message.metadata.agentTrace.length - 1]}</span>
              </span>
            )}
          </div>
          <span>{formatTimestamp(message.timestamp)}</span>
        </div>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-primary/20 text-primary">
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}
