import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { updateGuildRolesForUser } from 'lib/guild-xyz/server/updateGuildRolesForUser';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { ActionNotPermittedError, onError, onNoMatch } from 'lib/middleware';
import type { Web3LoginRequest } from 'lib/middleware/requireWalletSignature';
import { requireWalletSignature } from 'lib/middleware/requireWalletSignature';
import { sessionUserRelations } from 'lib/session/config';
import { withSessionRoute } from 'lib/session/withSession';
import { DisabledAccountError } from 'lib/utilities/errors';
import type { LoggedInUser } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireWalletSignature).post(login);

async function login(req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: any }>) {
  const { address } = req.body as Web3LoginRequest;

  const user = await prisma.user.findFirst({
    where: {
      wallets: {
        some: {
          address
        }
      }
    },
    include: sessionUserRelations
  });

  if (!user) {
    throw new ActionNotPermittedError('No user has been associated with this wallet address');
  }

  if (user.deletedAt) {
    throw new DisabledAccountError();
  }

  req.session.user = { id: user.id };
  await updateGuildRolesForUser(
    user.wallets.map((w) => w.address),
    user.spaceRoles
  );
  await req.session.save();

  trackUserAction('sign_in', { userId: user.id, identityType: 'Wallet' });

  return res.status(200).json(user);
}

export default withSessionRoute(handler);
