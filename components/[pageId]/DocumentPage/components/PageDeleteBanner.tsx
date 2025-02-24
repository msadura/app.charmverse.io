import styled from '@emotion/styled';
import { Box, Button } from '@mui/material';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { mutate } from 'swr';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';

const StyledPageDeleteBanner = styled(Box, {
  shouldForwardProp: (prop: string) => prop !== 'card'
})<{ card?: boolean }>`
  width: 100%;
  z-index: var(--z-index-appBar);
  display: flex;
  justify-content: center;
  background-color: ${({ theme }) => theme.palette.error.main};
  padding: ${({ theme }) => theme.spacing(1)};
`;

export default function PageDeleteBanner({ pageId }: { pageId: string }) {
  const [isMutating, setIsMutating] = useState(false);
  const space = useCurrentSpace();
  const router = useRouter();
  const { pages } = usePages();

  async function restorePage() {
    if (space) {
      await charmClient.restorePage(pageId);
      await mutate(`pages/${space.id}`);
    }
  }

  async function deletePage() {
    if (space) {
      await router.push(
        `/${router.query.domain}/${
          Object.values(pages).find((page) => page?.type !== 'card' && !page?.deletedAt)?.path
        }`
      );
      await charmClient.deletePage(pageId);
    }
  }

  const isShowingCard = new URLSearchParams(window.location.search).get('cardId');

  return (
    <StyledPageDeleteBanner card={isShowingCard ? isShowingCard !== 'undefined' && isShowingCard.length !== 0 : false}>
      <Box display='flex' gap={1} alignItems='center' data-test='archived-page-banner'>
        <div
          style={{
            color: 'white',
            fontWeight: 600
          }}
        >
          This page is in Trash
        </div>
        <Button
          data-test='banner--restore-archived-page'
          color={'white' as any}
          disabled={isMutating}
          onClick={async () => {
            setIsMutating(true);
            await restorePage();
            setIsMutating(false);
          }}
          variant='outlined'
        >
          Restore Page
        </Button>
        <Button
          data-test='banner--permanently-delete'
          color={'white' as any}
          disabled={isMutating}
          onClick={async () => {
            setIsMutating(true);
            await deletePage();
            setIsMutating(false);
          }}
          variant='outlined'
        >
          Delete permanently
        </Button>
      </Box>
    </StyledPageDeleteBanner>
  );
}
