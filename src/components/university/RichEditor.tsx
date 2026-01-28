import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { ImageResize } from './extensions/ImageResizeExtension';
import { useEffect, useCallback } from 'react';
import EditorToolbar from './EditorToolbar';
import BubbleMenuComponent from './BubbleMenuComponent';
import './RichEditor.css';
import './extensions/ImageResizeNodeView.css';
import Color from '@tiptap/extension-color';

interface RichEditorProps {
	value: string;
	onChange: (content: string) => void;
	placeholder?: string;
	uploadImageUrl?: string;
	uploadToken?: string;
	maxImageSize?: number;
	onFocus?: () => void;
	className?: string;
	readonly?: boolean;
	darkMode?: boolean;
	onDarkModeToggle?: (dark: boolean) => void;
}


const RichEditor: React.FC<RichEditorProps> = ({
	value,
	onChange,
	placeholder = 'Type "/" for commands...',
	uploadImageUrl,
	uploadToken,
	maxImageSize = 5 * 1024 * 1024,
	onFocus,
	className = '',
	readonly = false,
	darkMode = false,
	onDarkModeToggle,
}) => {
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: {
					levels: [1, 2, 3],
				},
				bulletList: {
					keepMarks: true,
					keepAttributes: false,
				},
				orderedList: {
					keepMarks: true,
					keepAttributes: false,
				},
			}),
			ImageResize.configure({
				inline: true,
				allowBase64: false,
				HTMLAttributes: {
					class: 'editor-image',
				},
			}),
			Placeholder.configure({
				placeholder,
				showOnlyWhenEditable: true,
			}),
			Underline,
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					class: 'editor-link',
				},
			}),
			TextAlign.configure({
				types: ['heading', 'paragraph'],
			}),
			TextStyle,
			FontFamily.configure({
				types: ['textStyle'],
			}),
			Color.configure({
				types: ['textStyle'],
			}),
		],
		content: value,
		editable: !readonly,
		onUpdate: ({ editor }) => {
			const html = editor.getHTML();
			onChange(html);
		},
		editorProps: {
			attributes: {
				class: 'prose-editor',
			},
		},
	});

	// Sync external value changes
	useEffect(() => {
		if (editor && value !== editor.getHTML()) {
			editor.commands.setContent(value, { emitUpdate: false });
		}
	}, [value, editor]);

	// Handle focus callback
	useEffect(() => {
		if (!editor || !onFocus) return;

		const handleFocus = () => {
			onFocus();
		};

		editor.on('focus', handleFocus);
		return () => {
			editor.off('focus', handleFocus);
		};
	}, [editor, onFocus]);

	// Image upload handler
	const handleImageUpload = useCallback(async (file: File): Promise<string> => {
		if (!uploadImageUrl || !uploadToken) {
			throw new Error('Image upload not configured');
		}

		if (!file.type.startsWith('image/')) {
			throw new Error('Please upload an image file');
		}

		if (file.size > maxImageSize) {
			const maxSizeMB = maxImageSize / (1024 * 1024);
			throw new Error(`Image size must be less than ${maxSizeMB}MB`);
		}

		const formData = new FormData();
		formData.append('image', file);

		const response = await fetch(uploadImageUrl, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${uploadToken}`,
			},
			body: formData,
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || 'Failed to upload image');
		}

		const data = await response.json();
		const baseUrl = uploadImageUrl.replace('/api/editor/upload-image', '').replace('/api/courses/upload-quill-image', '');
		return `${baseUrl}${data.url}`;
	}, [uploadImageUrl, uploadToken, maxImageSize]);

	if (!editor) {
		return (
			<div className="rich-editor-container loading">
				<div className="rich-editor-loading">
					<div className="loading-spinner"></div>
					<p>Loading editor...</p>
				</div>
			</div>
		);
	}

	return (
		<div className={`rich-editor-container ${className}`}>
			{/* Bubble Menu - appears on text selection */}
			{editor && (
				<BubbleMenuComponent editor={editor} />
			)}

			{editor && (
				<EditorToolbar editor={editor} onImageUpload={handleImageUpload} />
			)}
			{/* Side Toolbar - appears when line is focused */}

			{/* Main Editor Content */}
			<div className="rich-editor-wrapper">
				{/* @ts-ignore - TipTap EditorContent type compatibility issue with React 18 */}
				<EditorContent editor={editor} className="rich-editor-content" />
			</div>
		</div>
	);
};

export default RichEditor;

