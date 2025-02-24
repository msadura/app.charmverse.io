import { Add } from '@mui/icons-material';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import React, { useCallback } from 'react';
import { useDrop } from 'react-dnd';

import useEfficientDragLayer from 'hooks/useEffecientDragLayer';
import type { IPropertyOption, IPropertyTemplate, Board, BoardGroup } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import { createBoardView } from 'lib/focalboard/boardView';
import type { CardPage, Card } from 'lib/focalboard/card';

import { Constants } from '../../constants';
import mutator from '../../mutator';
import { useAppDispatch } from '../../store/hooks';
import { updateView } from '../../store/views';
import { Utils } from '../../utils';

import CalculationRow from './calculation/calculationRow';
import TableGroup from './tableGroup';
import TableHeaders from './tableHeaders';
import TableRows from './tableRows';

type Props = {
  selectedCardIds: string[];
  board: Board;
  cardPages: CardPage[];
  activeView: BoardView;
  views: BoardView[];
  visibleGroups: BoardGroup[];
  groupByProperty?: IPropertyTemplate;
  readOnly: boolean;
  readOnlySourceData: boolean;
  cardIdToFocusOnRender: string;
  showCard: (cardId: string | null) => void;
  addCard: (groupByOptionId?: string) => Promise<void>;
  onCardClicked: (e: React.MouseEvent, card: Card) => void;
};

function Table(props: Props): JSX.Element {
  const { board, cardPages, activeView, visibleGroups, groupByProperty, views } = props;
  const isManualSort = activeView.fields.sortOptions?.length === 0;
  const dispatch = useAppDispatch();

  const { offset, resizingColumn } = useEfficientDragLayer((monitor) => {
    if (monitor.getItemType() === 'horizontalGrip') {
      return {
        offset: monitor.getDifferenceFromInitialOffset()?.x || 0,
        resizingColumn: monitor.getItem()?.id
      };
    }
    return {
      offset: 0,
      resizingColumn: ''
    };
  });

  const visiblePropertyTemplates = React.useMemo(
    () =>
      activeView.fields.visiblePropertyIds
        .map((id) => board.fields.cardProperties.find((t) => t.id === id))
        .filter((i) => i) as IPropertyTemplate[],
    [board.fields.cardProperties, activeView.fields.visiblePropertyIds]
  );

  const columnRefs = React.useMemo(() => {
    const refs: Map<string, React.RefObject<HTMLDivElement>> = new Map();
    visiblePropertyTemplates.forEach((template) => {
      refs.set(template.id, React.createRef());
    });
    refs.set(Constants.titleColumnId, React.createRef());
    return refs;
  }, [visiblePropertyTemplates]);

  const [, drop] = useDrop<{ id: string }, any, null>(
    () => ({
      accept: 'horizontalGrip',
      drop: async (item, monitor) => {
        const columnWidths = { ...activeView.fields.columnWidths };
        const finalOffset = monitor.getDifferenceFromInitialOffset()?.x || 0;
        const newWidth = Math.max(Constants.minColumnWidth, (columnWidths[item.id] || 0) + (finalOffset || 0));
        if (newWidth !== columnWidths[item.id]) {
          columnWidths[item.id] = newWidth;

          const newView = createBoardView(activeView);
          newView.fields.columnWidths = columnWidths;
          try {
            dispatch(updateView(newView));
            await mutator.updateBlock(newView, activeView, 'resize column');
          } catch {
            dispatch(updateView(activeView));
          }
        }
      }
    }),
    [activeView]
  );

  const hideGroup = useCallback(
    (groupById: string): void => {
      const index: number = activeView.fields.collapsedOptionIds.indexOf(groupById);
      const newValue: string[] = [...activeView.fields.collapsedOptionIds];
      if (index > -1) {
        newValue.splice(index, 1);
      } else if (groupById !== '') {
        newValue.push(groupById);
      }

      const newView = createBoardView(activeView);
      newView.fields.collapsedOptionIds = newValue;
      mutator.performAsUndoGroup(async () => {
        await mutator.updateBlock(newView, activeView, 'hide group');
      });
    },
    [activeView]
  );

  const onDropToGroupHeader = useCallback(
    async (option: IPropertyOption, dstOption?: IPropertyOption) => {
      if (dstOption) {
        Utils.log(`ondrop. Header target: ${dstOption.value}, source: ${option?.value}`);

        // Move option to new index
        const visibleOptionIds = visibleGroups.map((o) => o.option.id);
        const srcIndex = visibleOptionIds.indexOf(dstOption.id);
        const destIndex = visibleOptionIds.indexOf(option.id);

        visibleOptionIds.splice(srcIndex, 0, visibleOptionIds.splice(destIndex, 1)[0]);
        Utils.log(`ondrop. updated visibleoptionids: ${visibleOptionIds}`);

        await mutator.changeViewVisibleOptionIds(activeView.id, activeView.fields.visibleOptionIds, visibleOptionIds);
      }
    },
    [activeView, visibleGroups]
  );

  const onDropToGroup = useCallback(
    (srcCard: Card, groupID: string, dstCardID: string) => {
      Utils.log(`onDropToGroup: ${srcCard.title}`);
      const { selectedCardIds } = props;

      const draggedCardIds = Array.from(new Set(selectedCardIds).add(srcCard.id));
      const description = draggedCardIds.length > 1 ? `drag ${draggedCardIds.length} cards` : 'drag card';

      if (activeView.fields.groupById !== undefined) {
        const cardsById = cardPages.reduce<{ [key: string]: Card }>((acc, card) => {
          acc[card.card.id] = card.card;
          return acc;
        }, {});
        const draggedCards: Card[] = draggedCardIds.map((o: string) => cardsById[o]);

        mutator.performAsUndoGroup(async () => {
          // Update properties of dragged cards
          const awaits = [];
          for (const draggedCard of draggedCards) {
            Utils.log(`draggedCard: ${draggedCard.title}, column: ${draggedCard.fields.properties}`);
            Utils.log(`droppedColumn:  ${groupID}`);
            const oldOptionId = draggedCard.fields.properties[groupByProperty!.id];
            Utils.log(`ondrop. oldValue: ${oldOptionId}`);

            if (groupID !== oldOptionId) {
              awaits.push(mutator.changePropertyValue(draggedCard, groupByProperty!.id, groupID, description));
            }
          }
          await Promise.all(awaits);
        });
      }

      // Update dstCard order
      if (isManualSort) {
        let cardOrder = Array.from(new Set([...activeView.fields.cardOrder, ...cardPages.map((o) => o.card.id)]));
        if (dstCardID) {
          const isDraggingDown = cardOrder.indexOf(srcCard.id) <= cardOrder.indexOf(dstCardID);
          cardOrder = cardOrder.filter((id) => !draggedCardIds.includes(id));
          let destIndex = cardOrder.indexOf(dstCardID);
          if (isDraggingDown) {
            destIndex += 1;
          }
          cardOrder.splice(destIndex, 0, ...draggedCardIds);
        } else {
          // Find index of first group item
          const firstCard = cardPages.find(
            ({ card }) => card.fields.properties[activeView.fields.groupById!] === groupID
          );
          if (firstCard) {
            const destIndex = cardOrder.indexOf(firstCard.card.id);
            cardOrder.splice(destIndex, 0, ...draggedCardIds);
          } else {
            // if not found, this is the only item in group.
            return;
          }
        }

        mutator.performAsUndoGroup(async () => {
          await mutator.changeViewCardOrder(activeView, cardOrder, description);
        });
      }
    },
    [activeView, cardPages, props.selectedCardIds, groupByProperty]
  );

  const onDropToCard = useCallback(
    (srcCard: Card, dstCard: Card) => {
      Utils.log(`onDropToCard: ${dstCard.title}`);
      onDropToGroup(srcCard, dstCard.fields.properties[activeView.fields.groupById!] as string, dstCard.id);
    },
    [activeView]
  );

  const propertyNameChanged = useCallback(
    async (option: IPropertyOption, text: string): Promise<void> => {
      await mutator.changePropertyOptionValue(board, groupByProperty!, option, text);
    },
    [board, groupByProperty]
  );

  return (
    <div className='Table' ref={drop}>
      <div className='octo-table-body'>
        <TableHeaders
          board={board}
          cards={cardPages.map((c) => c.card)}
          activeView={activeView}
          views={views}
          offset={offset}
          resizingColumn={resizingColumn}
          columnRefs={columnRefs}
          readOnly={props.readOnly}
          readOnlySourceData={props.readOnlySourceData}
        />

        {/* Table rows */}
        <div className='table-row-container'>
          {activeView.fields.groupById &&
            visibleGroups.map((group) => {
              return (
                <TableGroup
                  key={group.option.id}
                  board={board}
                  activeView={activeView}
                  groupByProperty={groupByProperty}
                  group={group}
                  readOnly={props.readOnly || props.readOnlySourceData}
                  columnRefs={columnRefs}
                  selectedCardIds={props.selectedCardIds}
                  cardIdToFocusOnRender={props.cardIdToFocusOnRender}
                  hideGroup={hideGroup}
                  addCard={props.addCard}
                  showCard={props.showCard}
                  propertyNameChanged={propertyNameChanged}
                  onCardClicked={props.onCardClicked}
                  onDropToGroupHeader={onDropToGroupHeader}
                  onDropToCard={onDropToCard}
                  onDropToGroup={onDropToGroup}
                />
              );
            })}

          {/* No Grouping, Rows, one per card */}
          {!activeView.fields.groupById && (
            <TableRows
              board={board}
              activeView={activeView}
              columnRefs={columnRefs}
              cardPages={cardPages}
              selectedCardIds={props.selectedCardIds}
              readOnly={props.readOnly || props.readOnlySourceData}
              cardIdToFocusOnRender={props.cardIdToFocusOnRender}
              offset={offset}
              resizingColumn={resizingColumn}
              showCard={props.showCard}
              addCard={props.addCard}
              onCardClicked={props.onCardClicked}
              onDrop={onDropToCard}
            />
          )}
        </div>

        {/* Add New row */}
        <div className='octo-table-footer'>
          {!props.readOnly && !props.readOnlySourceData && !activeView.fields.groupById && (
            <div
              className='octo-table-cell'
              onClick={() => {
                props.addCard('');
              }}
            >
              <Box display='flex' gap={1} alignItems='center'>
                <Add fontSize='small' />
                <Typography fontSize='small' id='TableComponent.plus-new'>
                  New
                </Typography>
              </Box>
            </div>
          )}
        </div>

        <CalculationRow
          board={board}
          cards={cardPages.map((c) => c.card)}
          activeView={activeView}
          resizingColumn={resizingColumn}
          offset={offset}
          readOnly={props.readOnly || props.readOnlySourceData}
        />
      </div>
    </div>
  );
}

export default Table;
