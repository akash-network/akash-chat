
interface MessageSection {
  type: 'thoughts' | 'regular' | 'image_generation';
  content: string;
  jobId?: string;
  prompt?: string;
  negative?: string;
} 

export const parseMessageContent = (content: string): MessageSection[] => {
  const sections: MessageSection[] = [];
  
  // Check if the message starts with <think> and is not yet complete
  if (content.startsWith('<think>') && !content.includes('</think>')) {
    // Handle incomplete thought section
    return [{
      type: 'thoughts',
      content: content.replace('<think>', '').trim()
    }];
  }

  // Parse image generation sections
  const imageGenRegex = /<image_generation>\s*jobId='([^']+)'\s*prompt='([^']+)'\s*negative='([^']*)'\s*<\/image_generation>/g;
  let lastIndex = 0;
  let match;

  while ((match = imageGenRegex.exec(content)) !== null) {
    // Add any text before the image generation section
    if (match.index > lastIndex) {
      sections.push({
        type: 'regular',
        content: content.slice(lastIndex, match.index)
      });
    }

    // Add the image generation section
    sections.push({
      type: 'image_generation',
      content: match[0],
      jobId: match[1],
      prompt: match[2],
      negative: match[3]
    });

    lastIndex = match.index + match[0].length;
  }

  // Parse thoughts sections
  const thoughtsRegex = /<think>([^]*?)<\/think>/g;
  while ((match = thoughtsRegex.exec(content)) !== null) {
    // Add any text before the thoughts section
    if (match.index > lastIndex) {
      sections.push({
        type: 'regular',
        content: content.slice(lastIndex, match.index)
      });
    }

    // Add the thoughts section
    sections.push({
      type: 'thoughts',
      content: match[1].trim()
    });

    lastIndex = match.index + match[0].length;
  }

  // Add any remaining text after the last section
  if (lastIndex < content.length) {
    sections.push({
      type: 'regular',
      content: content.slice(lastIndex)
    });
  }

  return sections;
}; 