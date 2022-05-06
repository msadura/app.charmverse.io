import { Page, PageOperations, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { AllowedPagePermissions } from './available-page-permissions.class';
import { IPagePermissionFlags, IPagePermissionUserRequest, IPageWithNestedSpaceRole, PageOperationType } from './page-permission-interfaces';
import { permissionTemplates } from './page-permission-mapping';

/**
 * Nested query to get the space role a user has in the space that owns this page
 */
function pageWithSpaceRoleQuery (request: IPagePermissionUserRequest): Prisma.PageFindFirstArgs {
  return {
    where: {
      id: request.pageId
    },
    select: {
      space: {
        select: {
          spaceRoles: {
            where: {
              userId: request.userId
            }
          }
        }
      }
    }
  };
}

/**
 * Get all permissions applicable to a user for a specific page
 */
function permissionsQuery (request: IPagePermissionUserRequest): Prisma.PagePermissionFindManyArgs {
  return {
    where: {
      OR: [

        {
          userId: request.userId,
          pageId: request.pageId
        },
        {
          role: {
            spaceRolesToRole: {
              some: {
                spaceRole: {
                  userId: request.userId
                }
              }
            }
          },
          pageId: request.pageId
        },
        {
          space: {
            spaceRoles: {
              some: {
                userId: request.userId
              }
            }
          },
          pageId: request.pageId
        }
      ]
    },
    include: {
      page: true
    }
  };
}

export async function computeUserPagePermissions (request: IPagePermissionUserRequest): Promise<IPagePermissionFlags> {

  const [foundSpaceRole, permissions] = await Promise.all([
    // Check if user is a space admin for this page so they gain full rights
    // eslint-disable-next-line max-len
    (prisma.page.findFirst(pageWithSpaceRoleQuery(request)) as any as Promise<IPageWithNestedSpaceRole>).then(page => {
      return page?.space?.spaceRoles?.find(spaceRole => spaceRole.spaceId === page.spaceId && spaceRole.userId === request.userId);
    }),
    prisma.pagePermission.findMany(permissionsQuery(request))
  ]);

  // TODO DELETE LATER when we remove admin access to workspace
  if (foundSpaceRole && foundSpaceRole.isAdmin === true) {

    const fullPermissions = Object.keys(PageOperations) as PageOperationType [];

    return new AllowedPagePermissions(fullPermissions);
  }

  const computedPermissions = new AllowedPagePermissions();

  permissions.forEach(permission => {

    // Custom permissions are persisted to the database. Other permission groups are evaluated by the current mapping
    const permissionsToAdd = permission.permissionLevel === 'custom' ? permission.permissions : permissionTemplates[permission.permissionLevel];

    computedPermissions.addPermissions(permissionsToAdd);
  });

  return computedPermissions;

}
