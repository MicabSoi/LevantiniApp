// Template renderer utility for flashcard layouts
export const renderTemplate = (template: string, fields: any): string => {
  if (!template || !fields) return template || '';
  
  // Replace {{fields.path}} with actual values from the fields object
  return template.replace(/\{\{fields\.([^}]+)\}\}/g, (match, path) => {
    try {
      // Split the path and traverse the fields object
      const pathParts = path.split('.');
      let value = fields;
      
      for (const part of pathParts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          return match; // Return original placeholder if path doesn't exist
        }
      }
      
      return value || '';
    } catch (error) {
      console.warn('Error rendering template path:', path, error);
      return match; // Return original placeholder on error
    }
  });
};

// Helper function to render both question and answer templates
export const renderCardLayout = (layout: any, fields: any) => {
  if (!layout || !fields) return { question: '', answer: '' };
  
  return {
    question: renderTemplate(layout.question || '', fields),
    answer: renderTemplate(layout.answer || '', fields)
  };
}; 