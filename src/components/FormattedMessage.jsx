import React from 'react';

/**
 * Parses inline markdown: **bold**, *italic*, `code`
 */
function parseInline(text, isUser) {
  if (!text) return [];
  // Tokenize bold, italic, code
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  
  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong
          key={idx}
          className={isUser ? 'font-semibold text-white' : 'font-semibold text-[#8f3d42]'}
        >
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      return (
        <em
          key={idx}
          className={isUser ? 'italic text-white/95' : 'italic text-[#723135]'}
        >
          {token.slice(1, -1)}
        </em>
      );
    }
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code
          key={idx}
          className={`px-1.5 py-0.5 rounded font-mono text-xs ${
            isUser ? 'bg-black/20 text-white' : 'bg-black/5 text-[#8f3d42]'
          }`}
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    return <span key={idx}>{token}</span>;
  });
}

/**
 * FormattedMessage: Renders structured text with bold, italic, lists, and headers
 * without requiring heavy third-party markdown libraries or dangerouslySetInnerHTML.
 */
export default function FormattedMessage({ content, isUser = false }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let currentList = null;

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'ul') {
        elements.push(
          <ul
            key={`ul-${elements.length}`}
            className={`list-disc list-outside ml-4 space-y-1 my-1.5 ${
              isUser ? 'text-white' : 'text-[#2c2a28]'
            }`}
          >
            {currentList.items.map((item, i) => (
              <li key={i} className="leading-relaxed">
                {parseInline(item, isUser)}
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol
            key={`ol-${elements.length}`}
            className={`list-decimal list-outside ml-4 space-y-1 my-1.5 ${
              isUser ? 'text-white' : 'text-[#2c2a28]'
            }`}
          >
            {currentList.items.map((item, i) => (
              <li key={i} className="leading-relaxed">
                {parseInline(item, isUser)}
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    // Headers (### or ## or #)
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4
          key={`h4-${i}`}
          className={`font-serif font-bold text-sm mt-2 mb-1 ${
            isUser ? 'text-white' : 'text-[#2c2a28]'
          }`}
        >
          {parseInline(trimmed.slice(4), isUser)}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h3
          key={`h3-${i}`}
          className={`font-serif font-bold text-base mt-2 mb-1 ${
            isUser ? 'text-white' : 'text-[#8f3d42]'
          }`}
        >
          {parseInline(trimmed.replace(/^#+\s*/, ''), isUser)}
        </h3>
      );
      continue;
    }

    // Bullet lists (- or * followed by space, or •)
    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    // Numbered lists (1. or 1) )
    const numberedMatch = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
    if (numberedMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(numberedMatch[2]);
      continue;
    }

    // Regular line / paragraph
    flushList();
    elements.push(
      <p
        key={`p-${i}`}
        className={`leading-relaxed mb-1 last:mb-0 ${
          isUser ? 'text-white' : 'text-[#2c2a28]'
        }`}
      >
        {parseInline(rawLine, isUser)}
      </p>
    );
  }

  flushList();

  return <div className="space-y-1 text-sm">{elements}</div>;
}
