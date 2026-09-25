export interface TemplateField {
  key: string;
  label: string;
  kind: 'text' | 'textarea' | 'number' | 'date' | 'select';
  required: boolean;
  options?: string[];
}
