// Caption parser utility
export function parseCaption(caption: string): { code?: string; link?: string } {
  const result: { code?: string; link?: string } = {};
  
  if (!caption) return result;
  
  // Extract code (e.g., "comment: LINK" or "code: SPECIAL")
  const codeMatch = caption.match(/(?:comment|code):\s*([^\s\n]+)/i);
  if (codeMatch) {
    result.code = codeMatch[1].trim();
  }
  
  // Extract link (e.g., "link: calmer.social/page")
  const linkMatch = caption.match(/link:\s*([^\s\n]+)/i);
  if (linkMatch) {
    let link = linkMatch[1].trim();
    // Add https:// if no protocol
    if (!link.startsWith('http://') && !link.startsWith('https://')) {
      link = 'https://' + link;
    }
    result.link = link;
  }
  
  return result;
}