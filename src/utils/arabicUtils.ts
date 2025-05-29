/**
 * Removes diacritics (tashkeel) from Arabic text
 */
export const removeDiacritics = (text: string): string => {
  // Arabic diacritics Unicode ranges:
  // U+064B to U+065F (Arabic diacritics)
  // U+0670 (Arabic letter superscript alef)
  // U+06D6 to U+06ED (Arabic small high marks and other diacritics)
  return text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
};

/**
 * Formats Arabic text based on whether diacritics should be shown
 */
export const formatArabicText = (text: string, showDiacritics: boolean): string => {
  if (!text) return '';
  return showDiacritics ? text : removeDiacritics(text);
}; 