import type { Post } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { createProposal } from 'lib/proposal/createProposal';

export async function convertPageToProposal({
  userId,
  page,
  categoryId
}: {
  categoryId: string;
  page: Pick<Post, 'content' | 'contentText' | 'spaceId' | 'title' | 'id'>;
  userId: string;
}) {
  const { page: proposalPage } = await createProposal({
    userId,
    spaceId: page.spaceId,
    categoryId,
    pageProps: {
      content: page.content,
      contentText: page.contentText,
      title: page.title
    }
  });

  await prisma.page.update({
    where: {
      id: page.id
    },
    data: {
      convertedProposalId: proposalPage.id
    }
  });

  return proposalPage;
}
