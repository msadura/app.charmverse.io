import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

import { count } from 'lib/metrics';

export async function task() {
  log.debug('Running Proposal status cron job');

  try {
    const proposalsToUpdate = await prisma.proposal.findMany({
      where: {
        status: 'vote_active',
        snapshotProposalExpiry: {
          not: null,
          lte: new Date()
        }
      }
    });

    await prisma.proposal.updateMany({
      where: {
        id: {
          in: proposalsToUpdate.map((proposal) => proposal.id)
        }
      },
      data: {
        status: 'vote_closed'
      }
    });

    count('cron.proposal-status.expired-snapshot-votes', proposalsToUpdate.length);
  } catch (error: any) {
    log.error(`Error expiring proposals: ${error.stack || error.message || error}`, { error });
  }
}
