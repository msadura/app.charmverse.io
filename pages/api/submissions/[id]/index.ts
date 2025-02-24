import type { Application } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { SubmissionContent } from 'lib/applications/actions';
import { updateSubmission } from 'lib/applications/actions';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { requireKeys } from 'lib/middleware/requireKeys';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utilities/errors';
import { isTruthy } from 'lib/utilities/types';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys<SubmissionContent>(['submission', 'submissionNodes'], 'body'))
  .put(updateSubmissionController);

async function updateSubmissionController(req: NextApiRequest, res: NextApiResponse<Application>) {
  const { id: submissionId } = req.query;

  const existingSubmission = await prisma.application.findUnique({
    where: {
      id: submissionId as string
    },
    select: {
      createdBy: true,
      bounty: {
        select: {
          customReward: true
        }
      }
    }
  });

  if (!existingSubmission) {
    throw new DataNotFoundError(`Submission with id ${submissionId} was not found.`);
  }

  const userId = req.session.user.id;

  if (existingSubmission.createdBy !== userId) {
    throw new UnauthorisedActionError('Only the creator of this submission can update it.');
  }

  const updated = await updateSubmission({
    submissionId: submissionId as string,
    submissionContent: req.body,
    customReward: isTruthy(existingSubmission.bounty.customReward)
  });

  return res.status(200).json(updated);
}

export default withSessionRoute(handler);
