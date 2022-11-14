
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { validate } from 'uuid';

import PublicPageComponent from 'components/share/PublicPage';
import { getPublicPageByIdOrPath } from 'lib/pages/getPublicPageById';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const pageId = context.query.pageId as string[];

  if (validate(pageId?.[0] || '')) {
    try {
      const foundPage = await getPublicPageByIdOrPath(pageId);
      return {
        redirect: {
          destination: `/share/${foundPage.space?.domain}/${foundPage.page.path}`,
          permanent: false
        }
      };
    }
    catch (error) {
      return {
        props: { notFound: true }
      };
    }
  }
  return {
    props: {}
  };
};

export default function PublicPage ({ notFound }: InferGetServerSidePropsType<typeof getServerSideProps>) {

  return <PublicPageComponent notFound={notFound} />;
}

