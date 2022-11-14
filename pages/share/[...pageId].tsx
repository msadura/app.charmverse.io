
import type { GetServerSideProps } from 'next';
import { validate } from 'uuid';

import PublicPageComponent from 'components/share/PublicPage';
import { getPublicPageByIdOrPath } from 'lib/pages/getPublicPageById';

export default function PublicPage () {

  return <PublicPageComponent />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const pageId = context.query.id as string[];

  if (validate(pageId?.[0] || '')) {
    const foundPage = await getPublicPageByIdOrPath(pageId);
    return {
      redirect: {
        destination: `/share/${foundPage.space?.domain}/${foundPage.page.path}`,
        permanent: false
      }
    };
  }

  return {
    props: {}
  };
};
