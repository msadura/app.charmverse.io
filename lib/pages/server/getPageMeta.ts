import type { Prisma } from '@charmverse/core/prisma';
import type { PrismaTransactionClient } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { validate } from 'uuid';

import type { PageMeta } from '../interfaces';

export function pageMetaSelect() {
  return {
    id: true,
    autoGenerated: true,
    boardId: true,
    bountyId: true,
    cardId: true,
    createdAt: true,
    createdBy: true,
    deletedAt: true,
    deletedBy: true,
    fullWidth: true,
    galleryImage: true,
    hasContent: true,
    headerImage: true,
    icon: true,
    index: true,
    isTemplate: true,
    parentId: true,
    path: true,
    proposalId: true,
    title: true,
    spaceId: true,
    updatedAt: true,
    updatedBy: true,
    type: true,
    convertedProposalId: true,
    permissions: {
      select: {
        id: true,
        pageId: true,
        permissionLevel: true,
        public: true,
        roleId: true,
        spaceId: true,
        userId: true,
        permissions: true
      }
    }
  };
}

export async function getPageMeta(
  pageIdOrPath: string,
  spaceId?: string,
  tx: PrismaTransactionClient = prisma
): Promise<PageMeta | null> {
  const isValidUUid = validate(pageIdOrPath);

  // We need a spaceId if looking up by path
  if (!isValidUUid && !spaceId) {
    return null;
  }

  const searchQuery: Prisma.PageWhereInput = isValidUUid
    ? {
        id: pageIdOrPath
      }
    : {
        path: pageIdOrPath,
        spaceId
      };

  return tx.page.findFirst({
    where: searchQuery,
    select: pageMetaSelect()
  }) as Promise<PageMeta | null>;
}
