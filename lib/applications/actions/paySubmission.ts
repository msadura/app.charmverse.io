import { DataNotFoundError, WrongStateError } from 'lib/utilities/errors';
import { prisma } from 'db';
import { Application } from '@prisma/client';
import { getApplication } from '../getApplication';

export async function paySubmission (submissionId: string) {
  const submission = await getApplication(submissionId);

  if (!submission) {
    throw new DataNotFoundError(`Application with id ${submissionId} was not found`);
  }

  if (submission.status !== 'complete') {
    throw new WrongStateError('Submissions must be completed for you to make payment');
  }

  return await prisma.application.update({
    where: {
      id: submission.id
    },
    data: {
      status: 'paid'
    }
  }) as Application;
}