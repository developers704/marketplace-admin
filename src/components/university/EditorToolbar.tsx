import { Editor } from '@tiptap/core';
import {
  MdUndo,
  MdRedo,
  MdTitle,
  MdCode,
  MdList,
  MdFormatQuote,
  MdImage,
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdStrikethroughS,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatAlignJustify,
  MdFormatClear,
  MdLink,
  MdHorizontalRule,
  MdDarkMode,
  MdLightMode,
  MdFormatColorText,
} from 'react-icons/md';
import { BiListOl } from 'react-icons/bi';
import Swal from 'sweetalert2';
import { useState, useEffect } from 'react';

interface EditorToolbarProps {
	editor: Editor;
	onImageUpload: (file: File) => Promise<string>;
	darkMode?: boolean;
	onDarkModeToggle?: (dark: boolean) => void;
}

const FONT_FAMILIES = [
	{ label: 'Default', value: '' },
	{ label: 'Arial', value: 'Arial, sans-serif' },
	{ label: 'Helvetica', value: 'Helvetica, sans-serif' },
	{ label: 'Times New Roman', value: 'Times New Roman, serif' },
	{ label: 'Georgia', value: 'Georgia, serif' },
	{ label: 'Verdana', value: 'Verdana, sans-serif' },
	{ label: 'Courier New', value: 'Courier New, monospace' },
	{ label: 'Comic Sans MS', value: 'Comic Sans MS, cursive' },
	{ label: 'Impact', value: 'Impact, fantasy' },
	{ label: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
	{ label: 'Roboto', value: 'Roboto, sans-serif' },
	{ label: 'Open Sans', value: 'Open Sans, sans-serif' },
	{ label: 'Lato', value: 'Lato, sans-serif' },
	{ label: 'Montserrat', value: 'Montserrat, sans-serif' },
	{ label: 'Poppins', value: 'Poppins, sans-serif' },
	{ label: 'Playfair Display', value: 'Playfair Display, serif' },
	{ label: 'Merriweather', value: 'Merriweather, serif' },
	{ label: 'Source Sans Pro', value: 'Source Sans Pro, sans-serif' },
	{ label: 'Raleway', value: 'Raleway, sans-serif' },
	{ label: 'Ubuntu', value: 'Ubuntu, sans-serif' },
	{ label: 'Oswald', value: 'Oswald, sans-serif' },
	{ label: 'PT Sans', value: 'PT Sans, sans-serif' },
];

/**
 * EditorToolbar - Side toolbar for block-level actions
 * Appears when a line is focused, similar to Notion's block menu
 */
const EditorToolbar: React.FC<EditorToolbarProps> = ({ 
	editor, 
	onImageUpload,
	darkMode = false,
	onDarkModeToggle,
}) => {
	const [currentFontFamily, setCurrentFontFamily] = useState<string>('');
	
	// Update current font family when editor selection changes
	useEffect(() => {
		if (!editor) return;
		
		const updateFontFamily = () => {
			try {
				const attrs = editor.getAttributes('textStyle');
				const fontFamily = attrs?.fontFamily || '';
				setCurrentFontFamily(fontFamily);
			} catch (error) {
				console.error('Error getting font family:', error);
			}
		};
		
		// Listen to selection and transaction events
		editor.on('selectionUpdate', updateFontFamily);
		editor.on('transaction', updateFontFamily);
		editor.on('update', updateFontFamily);
		
		// Initial update
		updateFontFamily();
		
		return () => {
			editor.off('selectionUpdate', updateFontFamily);
			editor.off('transaction', updateFontFamily);
			editor.off('update', updateFontFamily);
		};
	}, [editor]);
	
	if (!editor) return null;

	const handleImageClick = () => {
		const input = document.createElement('input');
		input.setAttribute('type', 'file');
		input.setAttribute('accept', 'image/*');
		input.click();

		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file) return;

			try {
				const imageUrl = await onImageUpload(file);
				editor.chain().focus().setImage({ src: imageUrl, align: 'center' }).run();
			} catch (error: unknown) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
				Swal.fire({
					title: 'Upload failed',
					text: errorMessage,
					icon: 'error',
					confirmButtonColor: '#9c5100',
				});
			}
		};
	};

	return (
		<div className="editor-toolbar editor-toolbar-top">
			{/* Undo/Redo */}
			<div className="toolbar-group">
				<button
					type="button"
					onClick={() => editor.chain().focus().undo().run()}
					disabled={!editor.can().chain().focus().undo().run()}
					className="toolbar-button"
					title="Undo"
				>
					<MdUndo size={18} />
				</button>
				<button
					type="button"
					onClick={() => editor.chain().focus().redo().run()}
					disabled={!editor.can().chain().focus().redo().run()}
					className="toolbar-button"
					title="Redo"
				>
					<MdRedo size={18} />
				</button>
			</div>

			<div className="toolbar-divider" />

			{/* Text Formatting */}
			<div className="toolbar-group">
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleBold().run()}
					className={`toolbar-button ${editor.isActive('bold') ? 'is-active' : ''}`}
					title="Bold"
				>
					<MdFormatBold size={18} />
				</button>
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleItalic().run()}
					className={`toolbar-button ${editor.isActive('italic') ? 'is-active' : ''}`}
					title="Italic"
				>
					<MdFormatItalic size={18} />
				</button>
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleUnderline().run()}
					className={`toolbar-button ${editor.isActive('underline') ? 'is-active' : ''}`}
					title="Underline"
				>
					<MdFormatUnderlined size={18} />
				</button>
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleStrike().run()}
					className={`toolbar-button ${editor.isActive('strike') ? 'is-active' : ''}`}
					title="Strikethrough"
				>
					<MdStrikethroughS size={18} />
				</button>
			</div>

			<div className="toolbar-divider" />

			{/* Text Alignment */}
			<div className="toolbar-group">
				<button
					type="button"
					onClick={() => (editor.chain().focus() as any).setTextAlign('left').run()}
					className={`toolbar-button ${editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}`}
					title="Align left"
				>
					<MdFormatAlignLeft size={18} />
				</button>
				<button
					type="button"
					onClick={() => (editor.chain().focus() as any).setTextAlign('center').run()}
					className={`toolbar-button ${editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}`}
					title="Align center"
				>
					<MdFormatAlignCenter size={18} />
				</button>
				<button
					type="button"
					onClick={() => (editor.chain().focus() as any).setTextAlign('right').run()}
					className={`toolbar-button ${editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}`}
					title="Align right"
				>
					<MdFormatAlignRight size={18} />
				</button>
				<button
					type="button"
					onClick={() => (editor.chain().focus() as any).setTextAlign('justify').run()}
					className={`toolbar-button ${editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''}`}
					title="Justify"
				>
					<MdFormatAlignJustify size={18} />
				</button>
			</div>

			<div className="toolbar-divider" />

			{/* Headings */}
			<div className="toolbar-group">
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
					className={`toolbar-button ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
					title="Heading 1"
				>
					<MdTitle size={18} />
				</button>
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
					className={`toolbar-button ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
					title="Heading 2"
				>
					<span className="toolbar-text">H2</span>
				</button>
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
					className={`toolbar-button ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}
					title="Heading 3"
				>
					<span className="toolbar-text">H3</span>
				</button>
			</div>

			<div className="toolbar-divider" />

			{/* Lists */}
			<div className="toolbar-group">
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					className={`toolbar-button ${editor.isActive('bulletList') ? 'is-active' : ''}`}
					title="Bullet list"
				>
					<MdList size={18} />
				</button>
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					className={`toolbar-button ${editor.isActive('orderedList') ? 'is-active' : ''}`}
					title="Numbered list"
				>
					<BiListOl size={18} />
				</button>
			</div>

			<div className="toolbar-divider" />

			{/* Block Elements */}
			<div className="toolbar-group">
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleBlockquote().run()}
					className={`toolbar-button ${editor.isActive('blockquote') ? 'is-active' : ''}`}
					title="Quote"
				>
					<MdFormatQuote size={18} />
				</button>
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleCodeBlock().run()}
					className={`toolbar-button ${editor.isActive('codeBlock') ? 'is-active' : ''}`}
					title="Code block"
				>
					<MdCode size={18} />
				</button>
			</div>

			<div className="toolbar-divider" />

			{/* Links & Media */}
			<div className="toolbar-group">
				<button
					type="button"
					onClick={() => {
						const url = window.prompt('Enter URL:');
						if (url) {
							editor.chain().focus().setLink({ href: url }).run();
						}
					}}
					className={`toolbar-button ${editor.isActive('link') ? 'is-active' : ''}`}
					title="Add link"
				>
					<MdLink size={18} />
				</button>
				<button
					type="button"
					onClick={handleImageClick}
					className="toolbar-button"
					title="Insert image"
				>
					<MdImage size={18} />
				</button>
				<button
					type="button"
					onClick={() => editor.chain().focus().setHorizontalRule().run()}
					className="toolbar-button"
					title="Horizontal rule"
				>
					<MdHorizontalRule size={18} />
				</button>
			</div>

			<div className="toolbar-divider" />

			{/* Font Family */}
			<div className="toolbar-group toolbar-font-group">
				<select
					value={currentFontFamily}
					onChange={(e) => {
						const fontFamily = e.target.value;
						
						// Update local state immediately for UI feedback
						setCurrentFontFamily(fontFamily);
						
						// Apply font family to editor
						if (fontFamily && fontFamily.trim() !== '') {
							// Set font family - applies to selected text or next typed text
							(editor.chain().focus() as any).setFontFamily(fontFamily).run();
						} else {
							// Remove font family (reset to default)
							(editor.chain().focus() as any).unsetFontFamily().run();
						}
					}}
					className="toolbar-select"
					title="Font family"
					style={{ 
						fontFamily: currentFontFamily || 'inherit',
						minWidth: '160px'
					}}
				>
					{FONT_FAMILIES.map((font) => (
						<option 
							key={font.value} 
							value={font.value}
							style={{ fontFamily: font.value || 'inherit' }}
						>
							{font.label}
						</option>
					))}
				</select>
			</div>

			<div className="toolbar-divider" />

			{/* Text Color */}
			<div className="toolbar-group">
				<input
					type="color"
					onChange={(e) => {
						const color = e.target.value;
						(editor.chain().focus() as any).setColor(color).run();
					}}
					value={editor.getAttributes('textStyle').color || '#000000'}
					className="toolbar-color-input"
					title="Text color"
					onClick={(e) => e.stopPropagation()}
				/>
				<button
					type="button"
					onClick={() => {
						const currentColor = editor.getAttributes('textStyle').color || '#000000';
						const newColor = window.prompt('Enter color (hex, rgb, or name):', currentColor);
						if (newColor) {
							(editor.chain().focus() as any).setColor(newColor).run();
						}
					}}
					className="toolbar-button"
					title="Text color picker"
				>
					<MdFormatColorText size={18} />
				</button>
			</div>

			<div className="toolbar-divider" />

			{/* Clear Formatting */}
			<div className="toolbar-group">
				<button
					type="button"
					onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
					className="toolbar-button"
					title="Clear formatting"
				>
					<MdFormatClear size={18} />
				</button>
			</div>

			{/* Dark/Light Mode Toggle */}
			{onDarkModeToggle && (
				<>
					<div className="toolbar-divider" />
					<div className="toolbar-group">
						<button
							type="button"
							onClick={() => onDarkModeToggle(!darkMode)}
							className="toolbar-button"
							title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
						>
							{darkMode ? <MdLightMode size={18} /> : <MdDarkMode size={18} />}
						</button>
					</div>
				</>
			)}
		</div>
	);
};

export default EditorToolbar;

