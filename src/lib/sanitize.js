import DOMPurify from 'dompurify';

// Sanitize user-generated text to prevent XSS
// React's JSX escaping handles most cases, but this provides defense-in-depth
// for any future rich text rendering or dangerouslySetInnerHTML usage.
export const sanitize = (dirty) => {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

// Sanitize but allow basic formatting tags (for future rich text)
export const sanitizeRich = (dirty) => {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
    ALLOWED_ATTR: [],
  });
};
