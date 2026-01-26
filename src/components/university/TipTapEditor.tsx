import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useEffect } from 'react';
import TipTapToolbar from './TipTapToolbar';
// TipTap CSS - Add basic styling
import './TipTapEditor.css';

interface TipTapEditorProps {
	value: string;
	onChange: (content: string) => void;
	placeholder?: string;
	uploadImageUrl?: string;
	uploadToken?: string;
	maxImageSize?: number; // in bytes
	onFocus?: () => void;
	className?: string;
}

/**
 * TipTapEditor - A rich text editor component using TipTap
 * 
 * Features:
 * - Fully controlled component (value + onChange)
 * - Image upload to server (not base64)
 * - Safe cursor/selection handling
 * - No DOM manipulation issues
 */
const TipTapEditor: React.FC<TipTapEditorProps> = ({
	value,
	onChange,
	placeholder = 'Start typing...',
	uploadImageUrl,
	uploadToken,
	maxImageSize = 5 * 1024 * 1024, // 5MB default
	onFocus,
	className = '',
}) => {
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				// Configure which features to include
				heading: {
					levels: [1, 2, 3],
				},
			}),
			Image.configure({
				inline: true,
				allowBase64: false, // We don't want base64 images
			}),
		],
		content: value,
		onUpdate: ({ editor }) => {
			// Convert editor content to HTML string
			const html = editor.getHTML();
			onChange(html);
		},
		editorProps: {
			attributes: {
				class: 'focus:outline-none min-h-[200px] max-w-none px-4 py-3 prose prose-sm max-w-none',
				style: 'min-height: 300px;',
			},
		},
	});

	// Update editor content when value prop changes (but not from internal updates)
	useEffect(() => {
		if (editor && value !== editor.getHTML()) {
			editor.commands.setContent(value, false); // false = don't trigger onUpdate
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
	const handleImageUpload = async (file: File) => {
		if (!editor || !uploadImageUrl || !uploadToken) {
			console.error('Image upload not configured');
			return;
		}

		// Validate file type
		if (!file.type.startsWith('image/')) {
			throw new Error('Please upload an image file');
		}

		// Validate file size
		if (file.size > maxImageSize) {
			const maxSizeMB = maxImageSize / (1024 * 1024);
			throw new Error(`Image size must be less than ${maxSizeMB}MB`);
		}

		// Create FormData
		const formData = new FormData();
		formData.append('image', file);

		try {
			// Upload image to server
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
			// Construct full image URL
			// data.url is like "/uploads/courses/quill-images/quill-xxx.jpg"
			// We need to prepend the BASE_API
			const baseUrl = uploadImageUrl.replace('/api/courses/upload-quill-image', '');
			const imageUrl = `${baseUrl}${data.url}`;

			// Insert image at current cursor position
			// TipTap handles this safely without range errors - no DOM manipulation needed
			editor.chain().focus().setImage({ src: imageUrl }).run();
		} catch (error: any) {
			throw error;
		}
	};

	if (!editor) {
		return (
			<div className="border border-gray-300 rounded-md p-4 min-h-[300px] flex items-center justify-center">
				<p className="text-gray-500">Loading editor...</p>
			</div>
		);
	}

	return (
		<div className={`border border-gray-300 rounded-md overflow-hidden ${className}`} style={{ position: 'relative' }}>
			{/* Toolbar */}
			<TipTapToolbar editor={editor} onImageUpload={handleImageUpload} />

			{/* Editor Content */}
			<div className="bg-white" style={{ position: 'relative' }}>
				<EditorContent
					editor={editor}
					className="min-h-[300px] max-h-[500px] overflow-y-auto"
				/>
				{/* Placeholder */}
				{!editor.getText() && editor.isEmpty && (
					<div 
						className="absolute pointer-events-none text-gray-400 px-4 py-3"
						style={{ top: 0, left: 0 }}
					>
						{placeholder}
					</div>
				)}
			</div>
		</div>
	);
};

export default TipTapEditor;

