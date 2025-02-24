import { useEffect, useCallback } from 'react';

import type { ImageBlock } from '../../blocks/imageBlock';
import { createImageBlock } from '../../blocks/imageBlock';
import mutator from '../../mutator';
import octoClient from '../../octoClient';

export default function useImagePaste(cardId: string, contentOrder: (string | string[])[], rootId: string): void {
  const uploadItems = useCallback(
    async (items: FileList) => {
      let newImage: File | null = null;
      const uploads: Promise<string | undefined>[] = [];

      if (!items.length) {
        return;
      }

      for (const item of items) {
        newImage = item;
        if (newImage?.type.indexOf('image/') === 0) {
          uploads.push(octoClient.uploadFile(rootId, newImage));
        }
      }

      const uploaded = await Promise.all(uploads);
      const blocksToInsert: ImageBlock[] = [];
      for (const fileId of uploaded) {
        if (!fileId) {
          // eslint-disable-next-line no-continue
          continue;
        }
        const block = createImageBlock();
        block.parentId = cardId;
        block.rootId = rootId;
        block.fields.fileId = fileId || '';
        blocksToInsert.push(block);
      }

      mutator.performAsUndoGroup(async () => {
        const newContentBlocks = await mutator.insertBlocks(blocksToInsert, 'pasted images');
        const newContentOrder = JSON.parse(JSON.stringify(contentOrder));
        newContentOrder.push(...newContentBlocks.map((b: ImageBlock) => b.id));

        await mutator.changeCardContentOrder(cardId, contentOrder, newContentOrder, 'paste image');
      });
    },
    [cardId, contentOrder, rootId]
  );

  const onDrop = useCallback(
    (event: DragEvent): void => {
      if (event.dataTransfer) {
        const items = event.dataTransfer.files;
        uploadItems(items);
      }
    },
    [uploadItems]
  );

  const onPaste = useCallback(
    (event: ClipboardEvent): void => {
      if (event.clipboardData) {
        const items = event.clipboardData.files;
        uploadItems(items);
      }
    },
    [uploadItems]
  );

  useEffect(() => {
    document.addEventListener('paste', onPaste);
    document.addEventListener('drop', onDrop);
    return () => {
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('drop', onDrop);
    };
  }, [uploadItems]);
}
