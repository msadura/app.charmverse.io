import { prisma } from '@charmverse/core/prisma-client';

import type { IPagePermissionWithAssignee } from '../page-permission-interfaces';

export async function listPagePermissions(pageId: string): Promise<IPagePermissionWithAssignee[]> {
  const permissions = await prisma.pagePermission.findMany({
    where: {
      pageId
    },
    include: {
      role: true,
      space: true,
      sourcePermission: true
    }
  });

  return permissions;
}
