import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { HtmlBlockView } from './HtmlBlockView';

export const HtmlBlock = Node.create({
  name: 'htmlBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      html: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-html-block]',
        getAttrs: (el) => ({
          html: decodeURIComponent(
            (el as HTMLElement).getAttribute('data-html-block') || ''
          ),
        }),
      },
    ];
  },

  renderHTML({ node }) {
    return [
      'div',
      { 'data-html-block': encodeURIComponent(node.attrs.html as string) },
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(HtmlBlockView as any);
  },
});
