import { prisma } from 'db';
import type { TokenGateJwtResult } from 'lib/token-gates/interfaces';

type UpdateUserTokenGatesProps = { tokenGates: TokenGateJwtResult[], spaceId: string, userId: string };
type UpsertTokenGateProps = { tokenGateId: string, jwt: string, spaceId: string, userId: string };
type DeleteTokenGateProps = { tokenGateId: string, spaceId: string, userId: string } | { id: string };

export async function updateUserTokenGates ({ tokenGates, spaceId, userId }: UpdateUserTokenGatesProps): Promise<void> {
  const verified = tokenGates.filter(tg => tg.verified && tg.jwt);
  const nonVerified = tokenGates.filter(tg => !tg.verified);

  prisma.$transaction([
    ...verified.map(tg => upsertUserTokenGate({ spaceId, tokenGateId: tg.id, userId, jwt: tg.jwt || '' })),
    ...nonVerified.map(tg => deleteUserTokenGate({ spaceId, tokenGateId: tg.id, userId }))
  ]);
}

function upsertUserTokenGate ({ spaceId, tokenGateId, userId, jwt }: UpsertTokenGateProps) {
  return prisma.userTokenGate.upsert({
    where: {
      tokenGateUserSpace: {
        tokenGateId,
        userId,
        spaceId
      }
    },
    create: {
      jwt,
      tokenGateConnectedDate: new Date(),
      space: {
        connect: { id: spaceId }
      },
      user: {
        connect: { id: userId }
      },
      tokenGate: {
        connect: { id: tokenGateId }
      }
    },
    update: {
      jwt,
      tokenGateConnectedDate: new Date()
    }
  });
}

export function deleteUserTokenGates (userTokenGates: { id: string }[]) {
  const ids = userTokenGates.map(tg => tg.id);
  return prisma.userTokenGate.deleteMany({
    where: {
      id: { in: ids }
    }
  });
}

export function deleteUserTokenGate (props: DeleteTokenGateProps) {
  if ('id' in props) {
    return prisma.userTokenGate.delete({
      where: {
        id: props.id
      }
    });
  }

  const { spaceId, tokenGateId, userId } = props;

  return prisma.userTokenGate.delete({
    where: {
      tokenGateUserSpace: {
        tokenGateId,
        userId,
        spaceId
      }
    }
  });
}
