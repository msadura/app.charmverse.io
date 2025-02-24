import { log } from '@charmverse/core/log';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import UndoIcon from '@mui/icons-material/Undo';
import VerticalAlignBottomOutlinedIcon from '@mui/icons-material/VerticalAlignBottomOutlined';
import { List, Divider } from '@mui/material';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import { bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import Papa from 'papaparse';
import type { ChangeEvent } from 'react';

import charmClient from 'charmClient';
import { CsvExporter } from 'components/common/BoardEditor/focalboard/csvExporter/csvExporter';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import { getSortedBoards } from 'components/common/BoardEditor/focalboard/src/store/boards';
import {
  getViewCardsSortedFilteredAndGrouped,
  sortCards
} from 'components/common/BoardEditor/focalboard/src/store/cards';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { getCurrentBoardViews, getView } from 'components/common/BoardEditor/focalboard/src/store/views';
import type { ImportAction } from 'components/common/Modal/ConfirmImportModal';
import ConfirmImportModal from 'components/common/Modal/ConfirmImportModal';
import { AddToFavoritesAction } from 'components/common/PageActions/components/AddToFavoritesAction';
import { CopyPageLinkAction } from 'components/common/PageActions/components/CopyPageLinkAction';
import { DuplicatePageAction } from 'components/common/PageActions/components/DuplicatePageAction';
import { useApiPageKeys } from 'hooks/useApiPageKeys';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useDateFormatter } from 'hooks/useDateFormatter';
import { useMembers } from 'hooks/useMembers';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { Board } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { CardPage } from 'lib/focalboard/card';
import type { IPagePermissionFlags } from 'lib/permissions/pages';

import { isValidCsvResult, addNewCards } from '../utils/databasePageOptions';

import { DocumentHistory } from './DocumentHistory';
import type { PageActionMeta } from './DocumentPageActionList';

type Props = {
  onComplete: VoidFunction;
  page: PageActionMeta;
  pagePermissions?: IPagePermissionFlags;
};

export function DatabasePageActionList({ pagePermissions, onComplete, page }: Props) {
  const pageId = page.id;
  const router = useRouter();
  const { pages, deletePage, mutatePagesRemove } = usePages();
  const view = useAppSelector(getView(router.query.viewId as string));
  const boards = useAppSelector(getSortedBoards);
  const boardViews = useAppSelector(getCurrentBoardViews);
  const { showMessage } = useSnackbar();
  const { members } = useMembers();
  const { user } = useUser();
  const currentSpace = useCurrentSpace();
  const { formatDateTime, formatDate } = useDateFormatter();
  const importConfirmationPopup = usePopupState({ variant: 'popover', popupId: 'import-confirmation-popup' });
  const { keys } = useApiPageKeys(pageId);

  const activeBoardId = view?.fields.sourceData?.boardId ?? view?.fields.linkedSourceId ?? view?.rootId;
  const board = boards.find((b) => b.id === activeBoardId);
  const boardPage = pages[pageId];

  function undoChanges() {
    if (mutator.canUndo) {
      const description = mutator.undoDescription;
      mutator.undo().then(() => {
        showMessage(description ? `Undo ${description}` : 'Undo', 'success');
      });
    } else {
      showMessage('Nothing to Undo', 'info');
    }
  }

  const cards = useAppSelector(
    getViewCardsSortedFilteredAndGrouped({
      boardId: board?.id ?? '',
      viewId: view?.id ?? '',
      pages
    })
  );

  async function onDeletePage() {
    await deletePage({
      pageId
    });
    onComplete();
  }

  async function deleteCards() {
    const cardIds = cards.map((card) => card.id).filter((cardId) => pages[cardId] && !pages[cardId]?.deletedAt);
    await mutator.deleteBlocks(cardIds);
    mutatePagesRemove(cardIds);
  }

  const exportCsv = (_board: Board, _view: BoardView) => {
    const cardPages: CardPage[] = cards
      .map((card) => ({ card, page: pages[card.id] }))
      .filter((item): item is CardPage => !!item.page);

    const sortedCardPages = sortCards(cardPages, _board, _view, members);
    const _cards = sortedCardPages.map(({ card, page: { title } }) => {
      return {
        ...card,
        // update the title from correct model
        title
      };
    });
    try {
      CsvExporter.exportTableCsv(_board, _view, _cards, {
        date: formatDate,
        dateTime: formatDateTime
      });
      showMessage('Export complete!');
    } catch (error) {
      log.error('CSV export failed', error);
      showMessage('Export failed', 'error');
    }
    onComplete();
    const spaceId = pages[pageId]?.spaceId;
    if (spaceId) {
      charmClient.track.trackAction('export_page_csv', { pageId, spaceId });
    }
  };

  const importCsv = (event: ChangeEvent<HTMLInputElement>, importAction?: ImportAction): void => {
    if (board && event.target.files && event.target.files[0]) {
      Papa.parse(event.target.files[0], {
        header: true,
        skipEmptyLines: true,
        worker: event.target.files[0].size > 100000, // 100kb
        delimiter: '\n', // fallback for a csv with 1 column
        complete: async (results) => {
          onComplete();
          if (results.errors && results.errors[0]) {
            log.warn('CSV import failed', { spaceId: currentSpace?.id, pageId, error: results.errors[0] });
            showMessage(results.errors[0].message ?? 'There was an error importing your csv file.', 'warning');
            return;
          }

          if (isValidCsvResult(results)) {
            if (!user || !currentSpace) {
              throw new Error(
                'An error occured while importing. Please verify you have a valid user, space and board.'
              );
            }

            showMessage('Importing your csv file...', 'info');

            if (importAction === 'delete') {
              try {
                await deleteCards();
              } catch (error) {
                log.error('CSV Import - Deleting all the cards before importing failed', {
                  spaceId: currentSpace?.id,
                  pageId,
                  error
                });
                showMessage((error as Error).message || 'Failed to delete the old cards', 'error');
              }
            }

            try {
              await addNewCards({
                board,
                members,
                results,
                spaceId: currentSpace.id,
                userId: user.id,
                views: boardViews,
                apiPageKeys: keys
              });

              const spaceId = currentSpace?.id;
              if (spaceId) {
                charmClient.track.trackAction('import_page_csv', { pageId, spaceId });
              }
              showMessage('Your csv file was imported successfully', 'success');
            } catch (error) {
              log.error('CSV import failed', { spaceId: currentSpace?.id, pageId, error });
              showMessage((error as Error).message || 'Import failed', 'error');
            }
          }
        }
      });
    }
  };

  if (!board || !view) {
    return null;
  }

  return (
    <List dense>
      <AddToFavoritesAction pageId={pageId} onComplete={onComplete} />
      <DuplicatePageAction
        onComplete={onComplete}
        pageId={pageId}
        pageType={boardPage?.type}
        pagePermissions={pagePermissions}
      />
      <CopyPageLinkAction path={`/${boardPage?.path}`} onComplete={onComplete} />
      <Divider />
      <Tooltip title={!pagePermissions?.delete ? "You don't have permission to delete this page" : ''}>
        <div>
          <ListItemButton disabled={!pagePermissions?.delete} onClick={onDeletePage}>
            <DeleteOutlinedIcon
              fontSize='small'
              sx={{
                mr: 1
              }}
            />
            <ListItemText primary='Delete' />
          </ListItemButton>
        </div>
      </Tooltip>
      <Tooltip
        title={
          !pagePermissions?.edit_content
            ? "You don't have permission to undo changes"
            : !mutator.canUndo
            ? 'Nothing to undo'
            : ''
        }
      >
        <div>
          <ListItemButton disabled={!mutator.canUndo || !pagePermissions?.edit_content} onClick={undoChanges}>
            <UndoIcon
              fontSize='small'
              sx={{
                mr: 1
              }}
            />
            <ListItemText primary='Undo' />
          </ListItemButton>
        </div>
      </Tooltip>
      <ListItemButton onClick={() => exportCsv(board, view)}>
        <FormatListBulletedIcon
          fontSize='small'
          sx={{
            mr: 1
          }}
        />
        <ListItemText primary='Export to CSV' />
      </ListItemButton>
      <ListItemButton
        component='label'
        {...(cards.length > 0 && bindTrigger(importConfirmationPopup))}
        htmlFor='csvfile'
      >
        <VerticalAlignBottomOutlinedIcon
          fontSize='small'
          sx={{
            mr: 1
          }}
        />
        <ListItemText primary='Import CSV' />
        {cards.length === 0 && (
          <input hidden type='file' id='csvfile' name='csvfile' accept='.csv' onChange={importCsv} />
        )}
      </ListItemButton>
      <Divider />
      <DocumentHistory
        page={{
          createdAt: new Date(board.createdAt),
          createdBy: board.createdBy,
          updatedAt: new Date(board.updatedAt),
          updatedBy: board.updatedBy
        }}
      />
      <ConfirmImportModal
        open={importConfirmationPopup.isOpen}
        onClose={importConfirmationPopup.close}
        onConfirm={importCsv}
        buttonText='Import'
        question='Choose how to manage your current data. Merge duplicate records or delete them entirely.'
      />
    </List>
  );
}
