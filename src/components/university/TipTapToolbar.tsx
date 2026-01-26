import { Editor } from '@tiptap/react';
import { MdFormatBold, MdFormatItalic, MdTitle, MdList, MdImage, MdFormatClear } from 'react-icons/md';
import { BiListOl } from 'react-icons/bi';
import Swal from 'sweetalert2';

interface TipTapToolbarProps {
	editor: Editor;
	onImageUpload: (file: File) => Promise<void>;
}

/**
 * TipTapToolbar - Custom toolbar for TipTap editor
 * 
 * Provides buttons for:
 * - Text formatting (Bold, Italic)
 * - Headings (H1, H2, H3)
 * - Lists (Bullet, Ordered)
 * - Image upload
 * - Clear formatting
 */
const TipTapToolbar: React.FC<TipTapToolbarProps> = ({ editor, onImageUpload }) => {
	if (!editor) {
		return null;
	}

	const handleImageClick = () => {
		const input = document.createElement('input');
		input.setAttribute('type', 'file');
		input.setAttribute('accept', 'image/*');
		input.click();

		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file) return;

			try {
				await onImageUpload(file);
			} catch (error: any) {
				Swal.fire({
					title: 'Upload failed',
					text: error.message || 'Failed to upload image. Please try again.',
					icon: 'error',
					confirmButtonColor: '#9c5100',
				});
			}
		};
	};

	return (
		<div className="flex items-center gap-1 p-2 border-b border-gray-300 bg-gray-50 flex-wrap">
			{/* Bold */}
			<button
				type="button"
				onClick={() => editor.chain().focus().toggleBold().run()}
				disabled={!editor.can().chain().focus().toggleBold().run()}
				className={`p-2 rounded hover:bg-gray-200 transition-colors ${
					editor.isActive('bold') ? 'bg-gray-300' : ''
				}`}
				title="Bold"
			>
				<MdFormatBold size={18} />
			</button>

			{/* Italic */}
			<button
				type="button"
				onClick={() => editor.chain().focus().toggleItalic().run()}
				disabled={!editor.can().chain().focus().toggleItalic().run()}
				className={`p-2 rounded hover:bg-gray-200 transition-colors ${
					editor.isActive('italic') ? 'bg-gray-300' : ''
				}`}
				title="Italic"
			>
				<MdFormatItalic size={18} />
			</button>

			<div className="w-px h-6 bg-gray-300 mx-1" />

			{/* Heading 1 */}
			<button
				type="button"
				onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
				className={`p-2 rounded hover:bg-gray-200 transition-colors ${
					editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''
				}`}
				title="Heading 1"
			>
				<MdTitle size={18} />
			</button>

			{/* Heading 2 */}
			<button
				type="button"
				onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
				className={`p-2 rounded hover:bg-gray-200 transition-colors ${
					editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''
				}`}
				title="Heading 2"
			>
				<span className="text-xs font-bold">H2</span>
			</button>

			{/* Heading 3 */}
			<button
				type="button"
				onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
				className={`p-2 rounded hover:bg-gray-200 transition-colors ${
					editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''
				}`}
				title="Heading 3"
			>
				<span className="text-xs font-bold">H3</span>
			</button>

			<div className="w-px h-6 bg-gray-300 mx-1" />

			{/* Bullet List */}
			<button
				type="button"
				onClick={() => editor.chain().focus().toggleBulletList().run()}
				className={`p-2 rounded hover:bg-gray-200 transition-colors ${
					editor.isActive('bulletList') ? 'bg-gray-300' : ''
				}`}
				title="Bullet List"
			>
				<MdList size={18} />
			</button>

			{/* Ordered List */}
			<button
				type="button"
				onClick={() => editor.chain().focus().toggleOrderedList().run()}
				className={`p-2 rounded hover:bg-gray-200 transition-colors ${
					editor.isActive('orderedList') ? 'bg-gray-300' : ''
				}`}
				title="Ordered List"
			>
				<BiListOl size={18} />
			</button>

			<div className="w-px h-6 bg-gray-300 mx-1" />

			{/* Image Upload */}
			<button
				type="button"
				onClick={handleImageClick}
				className="p-2 rounded hover:bg-gray-200 transition-colors"
				title="Insert Image"
			>
				<MdImage size={18} />
			</button>

			<div className="w-px h-6 bg-gray-300 mx-1" />

			{/* Clear Formatting */}
			<button
				type="button"
				onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
				className="p-2 rounded hover:bg-gray-200 transition-colors"
				title="Clear Formatting"
			>
				<MdFormatClear size={18} />
			</button>
		</div>
	);
};

export default TipTapToolbar;

