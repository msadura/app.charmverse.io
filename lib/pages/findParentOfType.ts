import type { PageType } from '@charmverse/core/prisma';

import type { PageNode, PagesMap, TargetPageTree } from './interfaces';

export interface FindParentOfTypeOptions<P extends PageNode> {
  pageType: PageType | PageType[];
  pageId?: string;
  pageMap?: PagesMap<P>;
  targetPageTree?: TargetPageTree<P>;
}

function matcher({
  evaluatedPageType,
  searchPageType
}: {
  evaluatedPageType?: PageType;
  searchPageType: PageType | PageType[];
}) {
  if (!evaluatedPageType) {
    return false;
  }

  if (typeof searchPageType === 'object') {
    return searchPageType.includes(evaluatedPageType);
  }

  return searchPageType === evaluatedPageType;
}

/**
 * Accepts a pagemap (used in the UI) or a target page tree (used in the server)
 * Traverses parents until a matching item is found
 * @returns
 */
export function findParentOfType<P extends PageNode = PageNode>({
  pageType,
  targetPageTree
}: Required<Pick<FindParentOfTypeOptions<P>, 'targetPageTree' | 'pageType'>>): string | null;
export function findParentOfType<P extends PageNode = PageNode>({
  pageType,
  pageId,
  pageMap
}: Required<Pick<FindParentOfTypeOptions<P>, 'pageType' | 'pageId' | 'pageMap'>>): string | null;
export function findParentOfType<P extends PageNode = PageNode>({
  pageType,
  pageId,
  pageMap,
  targetPageTree
}: FindParentOfTypeOptions<P>): string | null {
  if (pageMap) {
    let currentNode = pageMap[pageId as string];

    while (currentNode !== undefined) {
      const parentId = currentNode?.parentId;

      if (!parentId) {
        return null;
      }

      currentNode = pageMap[parentId];

      if (matcher({ evaluatedPageType: currentNode?.type, searchPageType: pageType })) {
        return currentNode?.id as string;
      }
    }
  } else if (targetPageTree) {
    const length = targetPageTree.parents.length;

    for (let i = 0; i < length; i++) {
      const parent = targetPageTree.parents[i];

      if (matcher({ evaluatedPageType: parent?.type, searchPageType: pageType })) {
        return parent.id;
      }
    }
  }

  return null;
}
