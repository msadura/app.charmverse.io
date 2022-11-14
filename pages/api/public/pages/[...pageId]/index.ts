import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import type { PublicPageResponse } from 'lib/pages';
import { getPublicPageByIdOrPath } from 'lib/pages/getPublicPageById';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getPublicPage);

async function getPublicPage (req: NextApiRequest, res: NextApiResponse<PublicPageResponse>) {

  const { pageId: pageIdOrPath } = req.query as { pageId: string[] };

  const pageData = await getPublicPageByIdOrPath(pageIdOrPath);

  return res.status(200).json(pageData);
}

export default withSessionRoute(handler);
