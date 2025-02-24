import type { Page, PageType } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import type { TreeItemContentProps } from '@mui/lab/TreeItem';
import TreeItem, { treeItemClasses } from '@mui/lab/TreeItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import Tooltip from '@mui/material/Tooltip';
import type { Identifier } from 'dnd-core';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { ReactNode, SyntheticEvent } from 'react';
import React, { forwardRef, memo, useCallback, useMemo } from 'react';

import charmClient from 'charmClient';
import { getSortedBoards } from 'components/common/BoardEditor/focalboard/src/store/boards';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import EmojiPicker from 'components/common/BoardEditor/focalboard/src/widgets/emojiPicker';
import { AddToFavoritesAction } from 'components/common/PageActions/components/AddToFavoritesAction';
import { CopyPageLinkAction } from 'components/common/PageActions/components/CopyPageLinkAction';
import { DuplicatePageAction } from 'components/common/PageActions/components/DuplicatePageAction';
import TreeItemContent from 'components/common/TreeItemContent';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { usePageFromPath } from 'hooks/usePageFromPath';
import { usePagePermissions } from 'hooks/usePagePermissions';
import { usePages } from 'hooks/usePages';
import { isTouchScreen } from 'lib/utilities/browser';
import { greyColor2 } from 'theme/colors';

import AddNewCard from '../../AddNewCard';
import NewPageMenu, { StyledIconButton } from '../../NewPageMenu';
import { PageIcon } from '../../PageIcon';
import PageTitle from '../../PageTitle';

interface PageTreeItemProps {
  addSubPage: (page: Partial<Page>) => void;
  handlerId: Identifier | null; // for drag n drop
  href: string;
  isActive: boolean;
  isAdjacent: boolean;
  isEmptyContent?: boolean;
  labelIcon?: string;
  label: string;
  pageType: PageType;
  pageId: string;
  pagePath: string;
  hasSelectedChildView: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export const StyledTreeItem = styled(TreeItem, { shouldForwardProp: (prop) => prop !== 'isActive' })<{
  isActive?: boolean;
}>(({ isActive, theme }) => ({
  position: 'relative',
  backgroundColor: isActive ? theme.palette.action.focus : 'unset',
  marginLeft: 3,
  marginRight: 3,
  // unset margin on child tree items
  '.MuiTreeItem-root': {
    marginLeft: 0,
    marginRight: 0
  },

  [`& .${treeItemClasses.content}`]: {
    color: theme.palette.text.secondary,
    marginBottom: 1,
    // paddingRight: theme.spacing(1),
    // fontWeight: theme.typography.fontWeightMedium,
    '.MuiTypography-root': {
      fontWeight: 500
    },
    '&.Mui-expanded': {
      fontWeight: theme.typography.fontWeightRegular
    },
    '&.Mui-selected:hover': {
      backgroundColor: theme.palette.action.hover
    },
    '&.Mui-selected:hover::after': {
      content: '""',
      left: 0,
      top: 0,
      position: 'absolute',
      width: '100%',
      height: '100%',
      backgroundColor: theme.palette.action.hover,
      pointerEvents: 'none'
    },
    '&.Mui-focused, &.Mui-selected, &.Mui-selected.Mui-focused': {
      backgroundColor: theme.palette.action.selected,
      color: theme.palette.text.primary,
      '.MuiTypography-root': {
        fontWeight: 700
      }
    },
    [`& .${treeItemClasses.label}`]: {
      fontWeight: 'inherit',
      paddingLeft: 0,
      color: 'inherit'
    },
    [`& .${treeItemClasses.iconContainer}`]: {
      marginRight: 0,
      width: '24px'
    },
    [`& .${treeItemClasses.iconContainer} svg`]: {
      color: greyColor2
    },
    [`& .${treeItemClasses.iconContainer} svg.MuiSvgIcon-fontSizeLarge`]: {
      fontSize: 24
    }
  },
  [`& .${treeItemClasses.group}`]: {
    marginLeft: 0,
    [`& .${treeItemClasses.content}`]: {
      paddingLeft: theme.spacing(3)
    },
    // add increasing indentation to children of children
    [`& .${treeItemClasses.group} .${treeItemClasses.content}`]: {
      paddingLeft: `calc(${theme.spacing(3)} + 16px)`
    },
    [`& .${treeItemClasses.group} .${treeItemClasses.group} .${treeItemClasses.content}`]: {
      paddingLeft: `calc(${theme.spacing(3)} + 32px)`
    }
  }
}));

const AdjacentDropZone = styled.div`
  position: absolute;
  top: -2px;
  left: 0;
  right: 0;
  height: 4px;
  background-color: ${({ theme }) => theme.palette.primary.main};
`;

const PageAnchor = styled(Link)`
  color: inherit;
  text-decoration: none;
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 2px 0;
  position: relative;

  .page-actions {
    display: flex;
    gap: 4px;
    align-items: center;
    justify-content: center;
    position: absolute;
    bottom: 0px;
    top: 0px;
    right: 0px;
    .MuiIconButton-root {
      padding: 0;
      border-radius: 2px;
      height: 20px;
      width: 20px;
    }
  }

  ${({ theme }) => `
    ${theme.breakpoints.down('md')} {
      min-height: 38px;
      width: 100%;
      padding-right: 62px;

      .page-actions {
        gap: 6px;
        .MuiIconButton-root {
          height: 26px;
          width: 26px;
        }
      }
    }
  `}

  // disable hover UX on ios which converts first click to a hover event
  @media (pointer: fine) {
    .page-actions {
      opacity: 0;
    }
    &:hover .page-actions {
      opacity: 1;
    }
    &:hover .MuiTypography-root {
      width: calc(60%);
    }
  }
`;

interface PageLinkProps {
  children?: ReactNode;
  href: string;
  label?: string;
  labelIcon?: React.ReactNode;
  isEmptyContent?: boolean;
  pageType: Page['type'];
  pageId?: string;
  showPicker?: boolean;
  onClick?: () => void;
}

export function PageLink({
  showPicker = !isTouchScreen(),
  children,
  href,
  isEmptyContent,
  label,
  labelIcon,
  pageType,
  pageId,
  onClick
}: PageLinkProps) {
  const popupState = usePopupState({
    popupId: 'page-emoji',
    variant: 'popover'
  });

  const isempty = !label;

  const stopPropagation = useCallback((event: SyntheticEvent) => {
    event.stopPropagation();
  }, []);

  const preventDefault = useCallback((event: SyntheticEvent) => {
    event.stopPropagation();
    event.preventDefault();
  }, []);

  const triggerState = bindTrigger(popupState);

  return (
    <PageAnchor href={href} onClick={stopPropagation}>
      <span onClick={preventDefault}>
        <PageIcon
          pageType={pageType}
          isEditorEmpty={isEmptyContent}
          icon={labelIcon}
          {...triggerState}
          onClick={showPicker ? triggerState.onClick : undefined}
        />
      </span>
      <PageTitle hasContent={isempty} onClick={onClick}>
        {isempty ? 'Untitled' : label}
      </PageTitle>
      {children}
      {showPicker && pageId && <EmojiMenu popupState={popupState} pageId={pageId} />}
    </PageAnchor>
  );
}

function EmojiMenu({ popupState, pageId }: { popupState: any; pageId: string }) {
  const onSelectEmoji = useCallback(
    async (emoji: string) => {
      charmClient.pages.updatePage({ id: pageId, icon: emoji });
      popupState.close();
    },
    [pageId]
  );

  return (
    <Menu
      {...bindMenu(popupState)}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <EmojiPicker onSelect={onSelectEmoji} />
    </Menu>
  );
}

const TreeItemComponent = React.forwardRef<React.Ref<HTMLDivElement>, TreeItemContentProps & { isAdjacent?: boolean }>(
  ({ isAdjacent, ...props }, ref) => (
    <div id={`page-navigation-${props.nodeId}`} style={{ position: 'relative' }}>
      <TreeItemContent {...props} ref={ref as React.Ref<HTMLDivElement>} />
      {isAdjacent && <AdjacentDropZone />}
    </div>
  )
);

// eslint-disable-next-line react/function-component-definition
const PageTreeItem = forwardRef<any, PageTreeItemProps>((props, ref) => {
  const {
    addSubPage,
    children,
    handlerId,
    href,
    isActive,
    isAdjacent,
    isEmptyContent,
    labelIcon,
    label,
    pageType,
    pageId,
    pagePath,
    hasSelectedChildView,
    onClick
  } = props;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const showMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    event.preventDefault();
    event.stopPropagation();
  }, []);

  function closeMenu() {
    setAnchorEl(null);
  }

  const ContentProps = useMemo(
    () => ({ isAdjacent, className: hasSelectedChildView ? 'Mui-selected' : undefined }),
    [isAdjacent, hasSelectedChildView]
  );

  const TransitionProps = useMemo(() => ({ timeout: 50 }), []);
  const anchorOrigin = useMemo(() => ({ vertical: 'bottom', horizontal: 'left' } as const), []);
  const transformOrigin = useMemo(() => ({ vertical: 'top', horizontal: 'left' } as const), []);

  const [userSpacePermissions] = useCurrentSpacePermissions();

  const labelComponent = useMemo(
    () => (
      <PageLink
        isEmptyContent={isEmptyContent}
        href={href}
        label={label}
        labelIcon={labelIcon}
        pageId={pageId}
        pageType={pageType}
        onClick={onClick}
      >
        <div className='page-actions'>
          <StyledIconButton size='small' onClick={showMenu}>
            <MoreHorizIcon color='secondary' fontSize='small' />
          </StyledIconButton>

          {userSpacePermissions?.createPage && pageType === 'board' && <AddNewCard pageId={pageId} />}
          {userSpacePermissions?.createPage && pageType === 'page' && (
            <NewPageMenu tooltip='Add a page inside' addPage={addSubPage} />
          )}
        </div>
      </PageLink>
    ),
    [href, label, pageId, labelIcon, addSubPage, pageType, userSpacePermissions?.createPage]
  );

  return (
    <>
      <StyledTreeItem
        data-handler-id={handlerId}
        isActive={isActive}
        label={labelComponent}
        nodeId={pageId}
        // @ts-ignore
        ContentComponent={TreeItemComponent}
        ContentProps={ContentProps}
        TransitionProps={TransitionProps}
        ref={ref}
      >
        {children}
      </StyledTreeItem>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        onClick={closeMenu}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
      >
        {Boolean(anchorEl) && <PageActionsMenu closeMenu={closeMenu} pageId={pageId} pagePath={pagePath} />}
      </Menu>
    </>
  );
});

function PageActionsMenu({ closeMenu, pageId, pagePath }: { closeMenu: () => void; pageId: string; pagePath: string }) {
  const boards = useAppSelector(getSortedBoards);
  const currentPage = usePageFromPath();
  const { deletePage, pages } = usePages();
  const { permissions: pagePermissions } = usePagePermissions({ pageIdOrPath: pageId });
  const router = useRouter();
  const deletePageDisabled = !pagePermissions?.delete;
  const page = pages[pageId];

  async function deletePageWithBoard() {
    if (deletePageDisabled) {
      return;
    }
    const board = boards.find((b) => b.id === page?.id);
    const newPage = await deletePage({
      board,
      pageId
    });

    if (!currentPage && newPage) {
      // If we are in a page that doesn't exist, redirect user to the created page
      router.push(`/${router.query.domain}/${newPage.id}`);
    }
  }

  return (
    <>
      <Tooltip arrow placement='top' title={deletePageDisabled ? 'You do not have permission to delete this page' : ''}>
        <div>
          <ListItemButton dense disabled={deletePageDisabled} onClick={deletePageWithBoard}>
            <ListItemIcon>
              <DeleteOutlinedIcon />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </ListItemButton>
        </div>
      </Tooltip>
      <AddToFavoritesAction pageId={pageId} onComplete={closeMenu} />
      <DuplicatePageAction
        pageId={pageId}
        pageType={page?.type}
        pagePermissions={pagePermissions}
        onComplete={closeMenu}
      />
      <CopyPageLinkAction path={`/${pagePath}`} onComplete={closeMenu} />
    </>
  );
}

export default memo(PageTreeItem);
