import type { UpdateAttrsFunction } from '@bangle.dev/core';
import { NodeView } from '@bangle.dev/core';
import type { EditorState, Node } from '@bangle.dev/pm';
import { createElement } from '@bangle.dev/utils';
import { log } from '@charmverse/core/log';

export function listItemNodeViewPlugin(name: string, readOnly?: boolean) {
  const checkParentBulletList = (state: EditorState, pos: number) => {
    return state.doc.resolve(pos).parent.type.name === 'bulletList';
  };
  const removeCheckbox = (instance: NodeView) => {
    // already removed
    if (!instance.containerDOM!.hasAttribute('data-bangle-is-todo')) {
      return;
    }
    instance.containerDOM!.removeAttribute('data-bangle-is-todo');
    instance.containerDOM!.removeChild(instance.containerDOM!.firstChild!);
  };

  const createCheckbox = (todoChecked: boolean | null, onUpdate: (newValue: boolean) => void) => {
    const checkBox = createElement([
      'span',
      // @ts-ignore DOMOutputSpec from @types/prosemirror-model is buggy
      { contentEditable: false },
      [
        'input',
        // For some reason the presence of disabled key makes it disabled even if disabled: false
        readOnly
          ? {
              type: 'checkbox',
              disabled: true
            }
          : {
              type: 'checkbox'
            }
      ]
    ]);
    const inputElement = checkBox.querySelector('input')!;

    if (todoChecked) {
      inputElement.setAttribute('checked', '');
    }

    inputElement.addEventListener('input', (_event) => {
      log.debug('change event', inputElement.checked);
      onUpdate(
        // note:  inputElement.checked is a bool
        inputElement.checked
      );
    });

    return checkBox;
  };

  const setupCheckbox = (attrs: Node['attrs'], updateAttrs: UpdateAttrsFunction, instance: NodeView) => {
    // no need to create as it is already created
    if (instance.containerDOM!.hasAttribute('data-bangle-is-todo')) {
      return;
    }

    const checkbox = createCheckbox(attrs.todoChecked, (newValue: boolean | null) => {
      updateAttrs({
        // Fetch latest attrs as the one in outer
        // closure can be stale.
        todoChecked: newValue
      });
    });

    instance.containerDOM!.setAttribute('data-bangle-is-todo', '');
    instance.containerDOM!.prepend(checkbox);
  };

  return NodeView.createPlugin({
    name,
    containerDOM: [
      'li',
      {
        // To style our todo friend different than a regular li
        'data-bangle-name': name
      }
    ],
    contentDOM: ['span', {}],
    renderHandlers: {
      create: (instance, { attrs, updateAttrs, getPos, view }) => {
        const todoChecked = attrs.todoChecked;
        // branch if todo needs to be created
        if (todoChecked != null) {
          // todo only makes sense if parent is bullet list
          if (checkParentBulletList(view.state, getPos())) {
            setupCheckbox(attrs, updateAttrs, instance as NodeView);
          }
        }

        // Connect the two contentDOM and containerDOM for pm to write to
        instance.containerDOM?.appendChild(instance.contentDOM!);
      },

      // We need to achieve a two way binding of the todoChecked state.
      // First binding: dom -> editor : done by  inputElement's `input` event listener
      // Second binding: editor -> dom: Done by the `update` handler below
      update: (instance, { attrs, view, getPos, updateAttrs }) => {
        const { todoChecked } = attrs;
        if (todoChecked == null) {
          removeCheckbox(instance as NodeView);
          return;
        }

        // if parent is not bulletList i.e. it is orderedList
        if (!checkParentBulletList(view.state, getPos())) {
          return;
        }

        // assume nothing about the dom elements state.
        // for example it is possible that the checkbox is not created
        // when a regular list is converted to todo list only update handler
        // will be called. The create handler was called in the past
        // but without the checkbox element, hence the checkbox wont be there
        setupCheckbox(attrs, updateAttrs, instance as NodeView);
        const checkbox = instance!.containerDOM!.firstChild!.firstChild! as HTMLInputElement;
        log.debug(`updating inputElement, checked = ${todoChecked}`);
        checkbox.checked = todoChecked;
      },

      destroy: () => {}
    }
  });
}
