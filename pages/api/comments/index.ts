import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { CommentCreate } from 'lib/comments';
import { addComment } from 'lib/comments';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { ActionNotPermittedError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { computeUserPagePermissions } from 'lib/permissions/pages/page-permission-compute';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(requireKeys(['content', 'threadId'], 'body'), addCommentController);

async function addCommentController(req: NextApiRequest, res: NextApiResponse) {
  const { threadId, content } = req.body as CommentCreate;
  const userId = req.session.user.id;

  const thread = await prisma.thread.findUnique({
    where: {
      id: threadId
    },
    select: {
      pageId: true,
      spaceId: true
    }
  });

  if (!thread) {
    throw new DataNotFoundError(`Thread with id ${threadId} not found`);
  }

  const permissionSet = await computeUserPagePermissions({
    resourceId: thread.pageId,
    userId
  });

  if (!permissionSet.comment) {
    throw new ActionNotPermittedError();
  }

  const createdComment = await addComment({
    threadId,
    userId,
    content
  });

  trackUserAction('page_comment_created', {
    pageId: thread.pageId,
    userId,
    spaceId: thread.spaceId
  });

  return res.status(201).json(createdComment);
}

export default withSessionRoute(handler);
