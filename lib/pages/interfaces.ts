import type { Page, PagePermission, Space } from '@charmverse/core/prisma';

import type { BountyWithDetails } from 'lib/bounties';
import type { Board, IPropertyTemplate } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';
import type { PagePermissionMeta } from 'lib/permissions/interfaces';
import type { IPagePermissionFlags } from 'lib/permissions/pages';
import type { ProposalWithUsers } from 'lib/proposal/interface';

export interface IPageWithPermissions extends Page {
  permissions: (PagePermission & { sourcePermission: PagePermission | null })[];
}

export type PageWithPermissionsMeta = Page & {
  permissions: PagePermissionMeta[];
};

export interface PageWithChildren extends IPageWithPermissions {
  children: PageWithChildren[];
}

export interface ModifyChildPagesResponse {
  pageIds: string[];
}

export interface PageLink {
  title: string;
  url: string;
}

// These 2 types are used for reducing a list of pages to a tree
// Generic type A is optional, we can mount additional properties on basic node definitions

// eslint-disable-next-line @typescript-eslint/ban-types
export type PageNode<A = {}> = Pick<
  Page,
  'id' | 'spaceId' | 'type' | 'parentId' | 'index' | 'createdAt' | 'deletedAt'
> &
  Partial<Pick<Page, 'boardId' | 'cardId'>> &
  A;

// eslint-disable-next-line @typescript-eslint/ban-types
export type PageNodeWithChildren<A = {}> = PageNode<{ children: PageNodeWithChildren<A>[] }> & A;

export type PageNodeWithPermissions = PageNode<{
  permissions: (PagePermission & { sourcePermission: PagePermission | null })[];
}>;

/**
 * @rootPageIds The list of roots we want to track
 * @targetPageId Overrides root pageIds. Ensures only the root containing the target page ID will be returned
 * @includeDeletedPages By default, we want to drop deleted pages from the tree.
 */
export interface PageTreeMappingInput<T extends PageNode> {
  items: T[];
  rootPageIds?: string[];
  targetPageId?: string;
  includeDeletedPages?: boolean;
}

/**
 * @pageNodes An existing list of pages from the database which we can use to build the tree. Used in a context where we want to perform multiple resolvePageTree operations without calling the database multiple times
 */
export interface PageTreeResolveInput {
  pageId: string;
  flattenChildren?: boolean;
  includeDeletedPages?: boolean;
  fullPage?: boolean;
  pageNodes?: PageNodeWithPermissions[];
}

export type TargetPageTree<T extends PageNode = PageNode> = {
  parents: PageNodeWithChildren<T>[];
  targetPage: PageNodeWithChildren<T>;
};

/**
 * A target page tree that also contains a pre-computed flat list of children
 */
export type TargetPageTreeWithFlatChildren<T extends PageNode = PageNode> = {
  parents: PageNodeWithChildren<T>[];
  targetPage: PageNodeWithChildren<T>;
  flatChildren: PageNodeWithChildren<T>[];
};

// Page without content and contentText props - used for list of pages (on the client)
export type PageMeta = Pick<
  Page,
  | 'id'
  | 'deletedAt'
  | 'deletedBy'
  | 'createdAt'
  | 'createdBy'
  | 'updatedAt'
  | 'updatedBy'
  | 'title'
  | 'headerImage'
  | 'icon'
  | 'path'
  | 'parentId'
  | 'spaceId'
  | 'type'
  | 'boardId'
  | 'index'
  | 'cardId'
  | 'proposalId'
  | 'bountyId'
  | 'hasContent'
  | 'galleryImage'
>;
// extend PageMeta so that we can populate usePages hook while /pages is loading
export type PageWithContent = PageMeta &
  Pick<
    Page,
    | 'id'
    | 'bountyId'
    | 'cardId'
    | 'content'
    | 'contentText'
    | 'convertedProposalId'
    | 'createdAt'
    | 'createdBy'
    | 'deletedAt'
    | 'fontFamily'
    | 'fontSizeSmall'
    | 'fullWidth'
    | 'headerImage'
    | 'icon'
    | 'parentId'
    | 'proposalId'
    | 'snapshotProposalId'
    | 'spaceId'
    | 'title'
    | 'type'
    | 'updatedAt'
    | 'updatedBy'
  > & { permissionFlags: IPagePermissionFlags };

export type PageDetails = {
  id: string;
  content: string | number | boolean | Record<string, any> | any[] | null;
  contentText: string;
  spaceId: string;
};

export type PageWithProposal = Page & { proposal: ProposalWithUsers | null };

export type PagesMap<P extends PageMeta | PageNode = PageMeta> = Record<string, P | undefined>;

export type PageUpdates = Partial<Page> & { id: string };
export type PageDetailsUpdates = Partial<PageDetails> & { id: string };

export interface IPageMetaWithPermissions extends PageMeta {
  permissions: (PagePermission & { sourcePermission: PagePermission | null })[];
}

export interface PublicPageResponse {
  page: PageWithContent;
  boardPages: Page[];
  space: Space;
  cards: Card[];
  boards: Board[];
  views: BoardView[];
  bounty: BountyWithDetails | null;
}
