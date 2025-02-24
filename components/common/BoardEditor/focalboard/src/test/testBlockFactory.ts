import { v4 } from 'uuid';

import type { Block } from 'lib/focalboard/block';
import type { Board, IPropertyOption, IPropertyTemplate } from 'lib/focalboard/board';
import { createBoard } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import { createBoardView } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';
import { createCard } from 'lib/focalboard/card';
import { createFilterClause } from 'lib/focalboard/filterClause';
import { createFilterGroup } from 'lib/focalboard/filterGroup';

import type { CheckboxBlock } from '../blocks/checkboxBlock';
import { createCheckboxBlock } from '../blocks/checkboxBlock';
import type { CommentBlock } from '../blocks/commentBlock';
import { createCommentBlock } from '../blocks/commentBlock';
import type { DividerBlock } from '../blocks/dividerBlock';
import { createDividerBlock } from '../blocks/dividerBlock';
import type { ImageBlock } from '../blocks/imageBlock';
import { createImageBlock } from '../blocks/imageBlock';
import type { TextBlock } from '../blocks/textBlock';
import { createTextBlock } from '../blocks/textBlock';

class TestBlockFactory {
  static createBoard(): Board {
    const board = createBoard();
    board.rootId = board.id;
    board.title = 'board title';
    board.fields.description = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: []
        }
      ]
    };
    board.fields.showDescription = true;
    board.fields.icon = 'i';

    for (let i = 0; i < 3; i++) {
      const propertyOption: IPropertyOption = {
        id: 'value1',
        value: 'value 1',
        color: 'propColorTurquoise'
      };
      const propertyTemplate: IPropertyTemplate = {
        id: `property${i + 1}`,
        name: `Property ${i + 1}`,
        type: 'select',
        options: [propertyOption]
      };
      board.fields.cardProperties.push(propertyTemplate);
    }

    return board;
  }

  static createBoardView(board?: Board): BoardView {
    const view = createBoardView();
    view.parentId = board ? board.id : 'parent';
    view.rootId = board ? board.rootId : 'root';
    view.title = 'view title';
    view.fields.viewType = 'board';
    view.fields.groupById = 'property1';
    view.fields.hiddenOptionIds = ['value1'];
    view.fields.cardOrder = ['card1', 'card2', 'card3'];
    view.fields.sortOptions = [
      {
        propertyId: 'property1',
        reversed: true
      },
      {
        propertyId: 'property2',
        reversed: false
      }
    ];
    view.fields.columnWidths = {
      column1: 100,
      column2: 200
    };

    // Filter
    const filterGroup = createFilterGroup();
    const filter = createFilterClause();
    filter.propertyId = 'property1';
    filter.condition = 'contains';
    filter.values = ['value1'];
    filter.filterId = v4();
    filterGroup.filters.push(filter);
    view.fields.filter = filterGroup;

    return view;
  }

  static createTableView(board?: Board): BoardView {
    const view = createBoardView();
    view.parentId = board ? board.id : 'parent';
    view.rootId = board ? board.rootId : 'root';
    view.title = 'view title';
    view.fields.viewType = 'table';
    view.fields.groupById = 'property1';
    view.fields.hiddenOptionIds = ['value1'];
    view.fields.cardOrder = ['card1', 'card2', 'card3'];
    view.fields.sortOptions = [
      {
        propertyId: 'property1',
        reversed: true
      },
      {
        propertyId: 'property2',
        reversed: false
      }
    ];
    view.fields.columnWidths = {
      column1: 100,
      column2: 200
    };

    // Filter
    const filterGroup = createFilterGroup();
    const filter = createFilterClause();
    filter.propertyId = 'property1';
    filter.condition = 'contains';
    filter.values = ['value1'];
    filter.filterId = v4();
    filterGroup.filters.push(filter);
    view.fields.filter = filterGroup;

    return view;
  }

  static createCard(board?: Board): Card {
    const card = createCard();
    card.parentId = board ? board.id : 'parent';
    card.rootId = board ? board.rootId : 'root';
    card.title = 'title';
    card.fields.icon = 'i';
    card.fields.properties.property1 = 'value1';

    return card;
  }

  private static addToCard<BlockType extends Block>(block: BlockType, card: Card, isContent = true): BlockType {
    block.parentId = card.id;
    block.rootId = card.rootId;
    if (isContent) {
      card.fields.contentOrder.push(block.id);
    }
    return block;
  }

  static createComment(card: Card): CommentBlock {
    const block = this.addToCard(createCommentBlock(), card, false);
    block.title = 'title';

    return block;
  }

  static createText(card: Card): TextBlock {
    const block = this.addToCard(createTextBlock(), card);
    block.title = 'title';
    return block;
  }

  static createImage(card: Card): ImageBlock {
    const block = this.addToCard(createImageBlock(), card);
    block.fields.fileId = 'fileId';
    return block;
  }

  static createDivider(card: Card): DividerBlock {
    const block = this.addToCard(createDividerBlock(), card);
    block.title = 'title';
    return block;
  }

  static createCheckbox(card: Card): CheckboxBlock {
    const block = this.addToCard(createCheckboxBlock(), card);
    block.title = 'title';
    return block;
  }
}

export { TestBlockFactory };
