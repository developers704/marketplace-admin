import { Node, mergeAttributes } from '@tiptap/core';
import { Node as ProseMirrorNode } from '@tiptap/pm/model';
import ReactDOM from 'react-dom/client';
import { ImageResizeNodeView } from './ImageResizeNodeView';

export interface ImageOptions {
	inline: boolean;
	allowBase64: boolean;
	HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		imageResize: {
			setImage: (options: { src: string; alt?: string; title?: string; width?: number; height?: number; align?: string }) => ReturnType;
		};
	}
}

/**
 * Custom Image extension with resize support
 * Provides Notion-style image resizing with drag handles
 */
export const ImageResize = Node.create<ImageOptions>({
	name: 'image',

	addOptions() {
		return {
			inline: true,
			allowBase64: false,
			HTMLAttributes: {
				class: 'editor-image',
			},
		};
	},

	inline() {
		return this.options.inline;
	},

	group() {
		return this.options.inline ? 'inline' : 'block';
	},

	draggable: true,

	addAttributes() {
		return {
			src: {
				default: null,
			},
			alt: {
				default: null,
			},
			title: {
				default: null,
			},
			width: {
				default: null,
				parseHTML: (element) => {
					const width = element.getAttribute('width');
					return width ? parseInt(width, 10) : null;
				},
				renderHTML: (attributes) => {
					if (!attributes.width) {
						return {};
					}
					return {
						width: attributes.width,
					};
				},
			},
			height: {
				default: null,
				parseHTML: (element) => {
					const height = element.getAttribute('height');
					return height ? parseInt(height, 10) : null;
				},
				renderHTML: (attributes) => {
					if (!attributes.height) {
						return {};
					}
					return {
						height: attributes.height,
					};
				},
			},
			align: {
				default: 'center',
				parseHTML: (element) => {
					const align = element.getAttribute('data-align') || element.style.textAlign || 'center';
					return align;
				},
				renderHTML: (attributes) => {
					if (!attributes.align) {
						return {};
					}
					return {
						'data-align': attributes.align,
					};
				},
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: this.options.allowBase64
					? 'img[src]'
					: 'img[src]:not([src^="data:"])',
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
	},

	addNodeView() {
		return ({ node, getPos, editor }) => {
			const dom = document.createElement('div');
			dom.classList.add('image-resize-wrapper');

			let selected = false;
			let root: ReactDOM.Root | null = null;

			const updateAttributes = (attrs: Record<string, any>) => {
				if (typeof getPos === 'function') {
					const pos = getPos();
					if (pos !== null && pos !== undefined) {
						editor.view.dispatch(
							editor.view.state.tr.setNodeMarkup(pos, undefined, {
								...node.attrs,
								...attrs,
							})
						);
					}
				}
			};

			const render = () => {
				if (!root) {
					root = ReactDOM.createRoot(dom);
				}
				root.render(
					<ImageResizeNodeView
						node={node}
						updateAttributes={updateAttributes}
						selected={selected}
					/>
				);
			};

			// Initial render
			render();

			return {
				dom,
				contentDOM: null,
				update: (updatedNode: ProseMirrorNode) => {
					if (updatedNode.type.name !== this.name) {
						return false;
					}
					node = updatedNode;
					render();
					return true;
				},
				selectNode: () => {
					selected = true;
					render();
				},
				deselectNode: () => {
					selected = false;
					render();
				},
				destroy: () => {
					if (root) {
						root.unmount();
						root = null;
					}
				},
			};
		};
	},

	addCommands() {
		return {
			setImage: (options) => ({ commands }) => {
				return commands.insertContent({
					type: this.name,
					attrs: options,
				});
			},
		};
	},
});

