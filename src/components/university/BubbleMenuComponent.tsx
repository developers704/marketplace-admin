import { Editor } from '@tiptap/core';
import { useEffect, useState } from 'react';
import { 
	MdFormatBold, 
	MdFormatItalic, 
	MdFormatUnderlined, 
	MdStrikethroughS,
	MdCode,
	MdLink,
	MdFormatClear
} from 'react-icons/md';

interface BubbleMenuComponentProps {
	editor: Editor;
}

/**
 * BubbleMenuComponent - Floating toolbar that appears on text selection
 * Similar to Notion's inline formatting menu
 * Custom implementation since BubbleMenu may not be available in all TipTap versions
 */
const BubbleMenuComponent: React.FC<BubbleMenuComponentProps> = ({ editor }) => {
	const [showMenu, setShowMenu] = useState(false);
	const [position, setPosition] = useState({ top: 0, left: 0 });

	useEffect(() => {
		if (!editor) return;

		const updateMenu = () => {
			const { state } = editor;
			const { selection } = state;
			const { from, to } = selection;

			// Only show menu if text is selected
			if (from !== to && !selection.empty) {
				try {
					const { $anchor } = selection;
					const domRange = editor.view.domAtPos($anchor.pos);
					
					// Get the DOM element (could be text node or element)
					const node = domRange.node;
					const element = node.nodeType === Node.TEXT_NODE 
						? (node.parentElement as HTMLElement)
						: (node as HTMLElement);
					
					if (element && element.getBoundingClientRect) {
						const rect = element.getBoundingClientRect();
						setPosition({
							top: rect.top - 50,
							left: rect.left + rect.width / 2,
						});
						setShowMenu(true);
					} else {
						setShowMenu(false);
					}
				} catch (error) {
					// Fallback: hide menu if position calculation fails
					setShowMenu(false);
				}
			} else {
				setShowMenu(false);
			}
		};

		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			if (!target.closest('.bubble-menu') && !target.closest('.prose-editor')) {
				setShowMenu(false);
			}
		};

		editor.on('selectionUpdate', updateMenu);
		editor.on('transaction', updateMenu);
		document.addEventListener('mousedown', handleClickOutside);

		return () => {
			editor.off('selectionUpdate', updateMenu);
			editor.off('transaction', updateMenu);
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [editor]);

	if (!editor || !showMenu) return null;

	return (
		<div
			className="bubble-menu"
			style={{
				position: 'fixed',
				top: `${position.top}px`,
				left: `${position.left}px`,
				transform: 'translateX(-50%)',
				zIndex: 1000,
			}}
		>
			<div className="bubble-menu-content">
				{/* Bold */}
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleBold().run()}
					className={`bubble-menu-button ${editor.isActive('bold') ? 'is-active' : ''}`}
					title="Bold"
				>
					<MdFormatBold size={18} />
				</button>

				{/* Italic */}
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleItalic().run()}
					className={`bubble-menu-button ${editor.isActive('italic') ? 'is-active' : ''}`}
					title="Italic"
				>
					<MdFormatItalic size={18} />
				</button>

				{/* Underline */}
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleUnderline().run()}
					className={`bubble-menu-button ${editor.isActive('underline') ? 'is-active' : ''}`}
					title="Underline"
				>
					<MdFormatUnderlined size={18} />
				</button>

				{/* Strikethrough */}
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleStrike().run()}
					className={`bubble-menu-button ${editor.isActive('strike') ? 'is-active' : ''}`}
					title="Strikethrough"
				>
					<MdStrikethroughS size={18} />
				</button>

				<div className="bubble-menu-divider" />

				{/* Code */}
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleCode().run()}
					className={`bubble-menu-button ${editor.isActive('code') ? 'is-active' : ''}`}
					title="Inline code"
				>
					<MdCode size={18} />
				</button>

				{/* Link */}
				<button
					type="button"
					onClick={() => {
						const url = window.prompt('Enter URL:');
						if (url) {
							editor.chain().focus().setLink({ href: url }).run();
						}
					}}
					className={`bubble-menu-button ${editor.isActive('link') ? 'is-active' : ''}`}
					title="Add link"
				>
					<MdLink size={18} />
				</button>

				<div className="bubble-menu-divider" />

				{/* Text Color - Disabled if Color extension not available */}
				{/* <button
					type="button"
					onClick={() => {
						const color = window.prompt('Enter color (e.g., #FF0000):', '#000000');
						if (color) {
							editor.chain().focus().setColor(color).run();
						}
					}}
					className="bubble-menu-button"
					title="Text color"
				>
					<MdFormatColorText size={18} />
				</button> */}

				{/* Clear Formatting */}
				<button
					type="button"
					onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
					className="bubble-menu-button"
					title="Clear formatting"
				>
					<MdFormatClear size={18} />
				</button>
			</div>
		</div>
	);
};

export default BubbleMenuComponent;

