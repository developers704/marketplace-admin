import { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { useEffect, useRef, useState, useCallback } from 'react';
import { 
	MdFormatAlignLeft, 
	MdFormatAlignCenter, 
	MdFormatAlignRight,
	MdFullscreen,
} from 'react-icons/md';
import './ImageResizeNodeView.css';

interface ImageResizeNodeViewProps {
	node: ProseMirrorNode;
	updateAttributes: (attrs: Record<string, any>) => void;
	selected: boolean;
}

/**
 * ImageResizeNodeView - React component for image with resize handles
 * Provides Notion-style image resizing with drag handles and alignment toolbar
 */
export const ImageResizeNodeView: React.FC<ImageResizeNodeViewProps> = ({
	node,
	updateAttributes,
	selected,
}) => {
	const imageRef = useRef<HTMLImageElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [isResizing, setIsResizing] = useState(false);
	const [resizeHandle, setResizeHandle] = useState<string | null>(null);
	const [startPos, setStartPos] = useState({ x: 0, y: 0 });
	const [startSize, setStartSize] = useState({ width: 0, height: 0 });
	const [showToolbar, setShowToolbar] = useState(false);

	const { src, alt, title, width, height, align = 'center' } = node.attrs;

	// Handle image load to get natural dimensions
	const handleImageLoad = useCallback(() => {
		if (imageRef.current && !width && !height) {
			const naturalWidth = imageRef.current.naturalWidth;
			const naturalHeight = imageRef.current.naturalHeight;
			updateAttributes({
				width: naturalWidth,
				height: naturalHeight,
			});
		}
	}, [width, height, updateAttributes]);

	// Start resize
	const handleResizeStart = useCallback((e: React.MouseEvent, handle: string) => {
		e.preventDefault();
		e.stopPropagation();
		
		if (!imageRef.current) return;

		setIsResizing(true);
		setResizeHandle(handle);
		setStartPos({ x: e.clientX, y: e.clientY });
		
		const currentWidth = width || imageRef.current.naturalWidth;
		const currentHeight = height || imageRef.current.naturalHeight;
		setStartSize({ width: currentWidth, height: currentHeight });
	}, [width, height]);

	// Handle resize
	useEffect(() => {
		if (!isResizing || !resizeHandle || !imageRef.current) return;

		const handleMouseMove = (e: MouseEvent) => {
			const deltaX = e.clientX - startPos.x;
			
			const aspectRatio = startSize.width / startSize.height;
			let newWidth = startSize.width;
			let newHeight = startSize.height;

			// Calculate new dimensions based on handle
			switch (resizeHandle) {
				case 'se': // Southeast (bottom-right)
					newWidth = startSize.width + deltaX;
					newHeight = newWidth / aspectRatio;
					break;
				case 'sw': // Southwest (bottom-left)
					newWidth = startSize.width - deltaX;
					newHeight = newWidth / aspectRatio;
					break;
				case 'ne': // Northeast (top-right)
					newWidth = startSize.width + deltaX;
					newHeight = newWidth / aspectRatio;
					break;
				case 'nw': // Northwest (top-left)
					newWidth = startSize.width - deltaX;
					newHeight = newWidth / aspectRatio;
					break;
			}

			// Constrain minimum size
			const minSize = 50;
			newWidth = Math.max(minSize, newWidth);
			newHeight = Math.max(minSize, newHeight);

			updateAttributes({
				width: Math.round(newWidth),
				height: Math.round(newHeight),
			});
		};

		const handleMouseUp = () => {
			setIsResizing(false);
			setResizeHandle(null);
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);

		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};
	}, [isResizing, resizeHandle, startPos, startSize, updateAttributes]);

	// Show toolbar on image hover/select
	useEffect(() => {
		if (selected) {
			setShowToolbar(true);
		}
	}, [selected]);

	const handleAlign = useCallback((alignment: string) => {
		updateAttributes({ align: alignment });
	}, [updateAttributes]);

	const imageStyle: React.CSSProperties = {
		width: align === 'full' ? '100%' : (width ? `${width}px` : 'auto'),
		height: align === 'full' ? 'auto' : (height ? `${height}px` : 'auto'),
		maxWidth: '100%',
		display: 'block',
	};

	const containerStyle: React.CSSProperties = {
		textAlign: align === 'left' ? 'left' : align === 'right' ? 'right' : 'center',
		position: 'relative',
		display: align === 'full' ? 'block' : 'inline-block',
		width: align === 'full' ? '100%' : 'auto',
		margin: '1em 0',
	};

	return (
		<div
			ref={containerRef}
			className={`image-resize-container ${selected ? 'selected' : ''} ${isResizing ? 'resizing' : ''}`}
			style={containerStyle}
			data-align={align}
			onMouseEnter={() => setShowToolbar(true)}
			onMouseLeave={() => !selected && setShowToolbar(false)}
		>
			<img
				ref={imageRef}
				src={src}
				alt={alt || ''}
				title={title || alt || ''}
				style={imageStyle}
				onLoad={handleImageLoad}
				draggable={false}
				className="resizable-image"
			/>

			{/* Resize Handles */}
			{(selected || showToolbar) && (
				<>
					<div
						className="resize-handle resize-handle-nw"
						onMouseDown={(e) => handleResizeStart(e, 'nw')}
						style={{ cursor: 'nwse-resize' }}
					/>
					<div
						className="resize-handle resize-handle-ne"
						onMouseDown={(e) => handleResizeStart(e, 'ne')}
						style={{ cursor: 'nesw-resize' }}
					/>
					<div
						className="resize-handle resize-handle-sw"
						onMouseDown={(e) => handleResizeStart(e, 'sw')}
						style={{ cursor: 'nesw-resize' }}
					/>
					<div
						className="resize-handle resize-handle-se"
						onMouseDown={(e) => handleResizeStart(e, 'se')}
						style={{ cursor: 'nwse-resize' }}
					/>
				</>
			)}

			{/* Alignment Toolbar */}
			{(selected || showToolbar) && (
				<div className="image-toolbar">
					<button
						type="button"
						onClick={() => handleAlign('left')}
						className={`toolbar-button ${align === 'left' ? 'active' : ''}`}
						title="Align left"
					>
						<MdFormatAlignLeft size={16} />
					</button>
					<button
						type="button"
						onClick={() => handleAlign('center')}
						className={`toolbar-button ${align === 'center' ? 'active' : ''}`}
						title="Align center"
					>
						<MdFormatAlignCenter size={16} />
					</button>
					<button
						type="button"
						onClick={() => handleAlign('right')}
						className={`toolbar-button ${align === 'right' ? 'active' : ''}`}
						title="Align right"
					>
						<MdFormatAlignRight size={16} />
					</button>
					<button
						type="button"
						onClick={() => handleAlign('full')}
						className={`toolbar-button ${align === 'full' ? 'active' : ''}`}
						title="Full width"
					>
						<MdFullscreen size={16} />
					</button>
				</div>
			)}
		</div>
	);
};

