import type { Block } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';

// TODO: frontend should tell us which space to use
export type ServerBlockFields = 'spaceId' | 'updatedBy' | 'createdBy';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getBlockSubtree);

async function getBlockSubtree(req: NextApiRequest, res: NextApiResponse<Block[] | { error: string }>) {
  const blockId = req.query.id as string;
  const publicPage = await prisma.page.findFirst({
    where: {
      OR: [{ boardId: blockId }, { cardId: blockId }]
    }
  });

  if (!publicPage) {
    return res.status(404).json({ error: 'page not found' });
  }

  const computed = await computeUserPagePermissions({
    resourceId: publicPage.id,
    userId: req.session.user?.id
  });

  if (computed.read !== true) {
    return res.status(404).json({ error: 'page not found' });
  }
  const blocks = await prisma.block.findMany({
    where: {
      OR: [{ id: blockId }, { rootId: blockId }, { parentId: blockId }]
    }
  });
  return res.status(200).json(blocks);
}

export default withSessionRoute(handler);
