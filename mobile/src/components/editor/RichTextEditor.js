import RichEditor from './RichEditor';

// Compatibility wrapper:
// Some screens import `RichTextEditor`, but the actual rich editor implementation
// lives in `RichEditor.js`. Re-export to avoid duplicated/buggy code.
export default RichEditor;
