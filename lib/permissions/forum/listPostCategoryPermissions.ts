import type { PostCategoryPermission } from '@prisma/client';

import { prisma } from 'db';
import { PostCategoryNotFoundError } from 'lib/forums/categories/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { InvalidInputError } from 'lib/utilities/errors';
import { isUUID } from 'lib/utilities/strings';

import type { PermissionCompute, PermissionComputeRequest } from '../interfaces';

import type { AssignablePostCategoryPermissionGroups, AssignedPostCategoryPermission } from './interfaces';
import { mapPostCategoryPermissionToAssignee } from './mapPostCategoryPermissionToAssignee';

export async function listPostCategoryPermissions({
  resourceId,
  userId
}: PermissionCompute): Promise<AssignedPostCategoryPermission[]> {
  if (!userId) {
    return [];
  }

  if (!isUUID(resourceId)) {
    throw new InvalidInputError('Invalid post category ID');
  }

  const postCategory = await prisma.postCategory.findUnique({
    where: {
      id: resourceId
    },
    select: {
      spaceId: true
    }
  });

  if (!postCategory) {
    throw new PostCategoryNotFoundError(resourceId);
  }

  const { error } = await hasAccessToSpace({
    spaceId: postCategory.spaceId,
    userId
  });

  if (error) {
    return [];
  }

  const permissions = await prisma.postCategoryPermission.findMany({
    where: {
      postCategoryId: resourceId
    }
  });

  const mappedPermissions: AssignedPostCategoryPermission[] = permissions
    .map((permission) => {
      try {
        const mapped = mapPostCategoryPermissionToAssignee(permission);
        return mapped;
      } catch (err) {
        return null;
      }
    })
    .filter((permission) => permission !== null) as AssignedPostCategoryPermission[];

  return mappedPermissions;
}