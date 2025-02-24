import type { Block } from 'lib/focalboard/block';

import { TestBlockFactory } from '../test/testBlockFactory';

import { ArchiveUtils } from './archive';

test('archive: archive and unarchive', async () => {
  const blocks: Block[] = [];

  const board = TestBlockFactory.createBoard();
  blocks.push(board);
  blocks.push(TestBlockFactory.createBoardView(board));
  const card = TestBlockFactory.createCard(board);
  blocks.push(card);
  blocks.push(TestBlockFactory.createText(card));
  blocks.push(TestBlockFactory.createDivider(card));
  blocks.push(TestBlockFactory.createImage(card));

  const archive = ArchiveUtils.buildBlockArchive(blocks);
  const unarchivedBlocks = ArchiveUtils.parseBlockArchive(archive);

  expect(unarchivedBlocks).toEqual(blocks);
});
