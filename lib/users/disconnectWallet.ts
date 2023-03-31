import { prisma } from 'db';
import { InvalidInputError, MissingDataError } from 'lib/utilities/errors';

import { updateUsedIdentity } from './updateUsedIdentity';

export type DisconnectWalletRequest = {
  userId: string;
  address: string;
};

export const disconnectWallet = async ({ userId, address }: DisconnectWalletRequest) => {
  if (!address || !userId) {
    throw new InvalidInputError(`Address and userId are required to disconnect your wallet from the user account`);
  }

  const wallet = await prisma.userWallet.findUnique({
    where: {
      userId,
      address
    }
  });

  if (!wallet) {
    throw new MissingDataError(`Wallet not found for user ${userId} and adress ${address}`);
  }

  await prisma.$transaction([
    prisma.userWallet.delete({
      where: {
        userId,
        address
      }
    }),
    prisma.profileItem.deleteMany({
      where: { userId }
    })
  ]);

  return updateUsedIdentity(userId);
};