import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { ActionNotPermittedError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';
import type { MultipleThreadsInput } from 'lib/threads';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(requireKeys<MultipleThreadsInput>(['threadIds', 'pageId'], 'body'), resolveThreads);

async function resolveThreads(req: NextApiRequest, res: NextApiResponse) {
  const { threadIds, pageId } = req.body as MultipleThreadsInput;

  const userId = req.session.user.id;

  const permissionSet = await computeUserPagePermissions({
    resourceId: pageId,
    userId
  });

  if (!permissionSet.comment) {
    throw new ActionNotPermittedError();
  }

  await prisma.thread.updateMany({
    where: {
      id: {
        in: threadIds
      }
    },
    data: {
      resolved: true
    }
  });

  const { spaceId } = await prisma.page.findFirstOrThrow({
    where: {
      id: pageId
    }
  });

  threadIds.forEach(() => {
    trackUserAction('page_comment_resolved', {
      pageId,
      userId,
      spaceId
    });
  });

  return res.status(201).end();
}

export default withSessionRoute(handler);
