import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

export function generateSuperApiToken({ name, token }: { name?: string; token?: string }) {
  return prisma.superApiToken.create({
    data: {
      name: name || '',
      token: token || v4()
    }
  });
}
