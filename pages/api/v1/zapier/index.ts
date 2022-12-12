import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSuperApiKey, requireKeys } from 'lib/middleware';
import type { CreatedSpaceResponse, CreateSpaceApiInputData } from 'lib/public-api/createWorkspaceApi';
import { createWorkspaceApi } from 'lib/public-api/createWorkspaceApi';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(testPostZapier);
handler.get(testGetZapier);

async function testGetZapier(req: NextApiRequest, res: NextApiResponse<[]>) {
  return res.status(201).json([]);
}

async function testPostZapier(req: NextApiRequest, res: NextApiResponse<{ ok: true }>) {
  const data = req.body as string;

  console.log('🔥', data);

  return res.status(201).json({ ok: true });
}

export default withSessionRoute(handler);
