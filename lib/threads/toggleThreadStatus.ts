import { prisma } from '@charmverse/core/prisma-client';

import { InvalidInputError } from 'lib/utilities/errors';

import type { ThreadStatusUpdate, ThreadWithComments } from './interfaces';
import { ThreadStatus } from './interfaces';

export async function toggleThreadStatus({ id, status }: ThreadStatusUpdate): Promise<ThreadWithComments> {
  if (Object.keys(ThreadStatus).indexOf(status) === -1) {
    throw new InvalidInputError('Provide a valid status for the thread');
  }

  const resolvedStatus = status === 'closed';

  // check that thread exists
  await prisma.thread.findUniqueOrThrow({
    where: {
      id
    },
    select: {
      id: true
    }
  });

  const updatedThread = await prisma.thread.update({
    where: {
      id
    },
    data: {
      resolved: resolvedStatus
    },
    include: {
      comments: true
    }
  });

  return updatedThread;
}
