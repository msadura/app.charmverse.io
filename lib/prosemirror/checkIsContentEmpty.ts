import type { PageContent } from 'lib/prosemirror/interfaces';

export function checkIsContentEmpty(content: PageContent | null | undefined) {
  return (
    !content?.content ||
    content.content.length === 0 ||
    (content.content.length === 1 &&
      // These nodes dont contain any content so there is no content field
      !content.content[0]?.type.match(/(cryptoPrice|columnLayout|image|iframe|mention|page|poll|tableOfContents)/) &&
      !content.content[0].content?.length)
  );
}
