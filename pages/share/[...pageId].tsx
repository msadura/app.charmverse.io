
import type { GetServerSideProps } from 'next';
import { validate } from 'uuid';

import charmClient from 'charmClient';
import PublicPageComponent from 'components/share/PublicPage';

export default function PublicPage () {

  return <PublicPageComponent />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const pageId = context.query.id;
  const pageIdOrPath = pageId instanceof Array ? pageId.join('/') : pageId as string;

  if (validate(pageId?.[0] || '')) {
    const foundPage = await charmClient.getPublicPage(pageIdOrPath);
    return {
      redirect: {
        destination: `/share/${foundPage.space?.domain}/${foundPage.page.path}`,
        permanent: true
      }
    };
  }

  return {
    props: {}
  };
};
