import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import { useBounties } from 'hooks/useBounties';
import { usePages } from 'hooks/usePages';
import type { BountyWithDetails } from 'lib/bounties';
import type { PageMeta } from 'lib/pages';

import { BountyGalleryCard } from './BountyGalleryCard';

interface Props {
  bounties: BountyWithDetails[];
  publicMode?: boolean;
}

export function BountiesGalleryView({ bounties, publicMode }: Props) {
  const { deletePage, pages } = usePages();
  const { showPage } = usePageDialog();
  const { setBounties } = useBounties();
  const router = useRouter();

  const filteredBounties = bounties
    .filter((bounty) => bounty.status === 'open')
    .sort((b1, b2) => (b1.updatedAt > b2.updatedAt ? -1 : 1));
  function onClickDelete(pageId: string) {
    setBounties((_bounties) => _bounties.filter((_bounty) => _bounty.page.id !== pageId));
    deletePage({ pageId });
  }

  function onClose() {
    router.push({ pathname: router.pathname, query: { ...router.query, bountyId: undefined } });
  }

  function openPage(bountyId: string) {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, bountyId }
    });
  }

  useEffect(() => {
    if (typeof router.query.bountyId === 'string') {
      showPage({
        bountyId: router.query.bountyId,
        readOnly: publicMode,
        onClose
      });
    }
  }, [router.query.bountyId]);

  return (
    <div className='Gallery' style={{ overflow: 'visible' }}>
      {filteredBounties.map((bounty) => {
        return (
          <BountyGalleryCard
            key={bounty.id}
            bounty={bounty}
            onClick={() => {
              openPage(bounty.page.id);
            }}
            readOnly={!!publicMode}
            page={pages[bounty.page.id] as PageMeta}
            onDelete={onClickDelete}
          />
        );
      })}
    </div>
  );
}
