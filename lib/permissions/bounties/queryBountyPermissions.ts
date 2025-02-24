import { prisma } from '@charmverse/core/prisma-client';

import { DataNotFoundError } from 'lib/utilities/errors';

import type { BountyPermissions } from './interfaces';
import { mapBountyPermissions } from './mapBountyPermissions';

/**
 * Returns all existing permissions for a bounty, mapped to their level
 */
export async function queryBountyPermissions({ bountyId }: { bountyId: string }): Promise<BountyPermissions> {
  const bounty = await prisma.bounty.findUnique({
    where: {
      id: bountyId
    },
    select: {
      id: true,
      createdBy: true
    }
  });

  if (!bounty) {
    throw new DataNotFoundError(`Bounty with id ${bountyId} not found.`);
  }

  const permissions = await prisma.bountyPermission.findMany({
    where: {
      bountyId
    }
  });

  const mapped = mapBountyPermissions(permissions);

  if (mapped.creator.every((p) => p.group !== 'user' || p.id !== bounty.createdBy)) {
    mapped.creator.push({
      id: bounty.createdBy,
      group: 'user'
    });
  }

  return mapped;
}
