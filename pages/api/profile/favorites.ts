import type { FavoritePage } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { sessionUserRelations } from 'lib/session/config';
import { withSessionRoute } from 'lib/session/withSession';
import type { LoggedInUser } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .put(updateFavoritePages)
  .use((req, res, next) => {
    if (!req.body.pageId) {
      return res.status(400).json({ error: 'pageId is required' });
    }
    next();
  })
  .post(addFavoritePage)
  .delete(unFavoritePage);

async function addFavoritePage(req: NextApiRequest, res: NextApiResponse<Partial<LoggedInUser> | { error: any }>) {
  const pageId = req.body.pageId as string;
  const user = await prisma.user.update({
    where: {
      id: req.session.user.id
    },
    data: {
      favorites: {
        connectOrCreate: {
          where: {
            pageId_userId: {
              pageId,
              userId: req.session.user.id
            }
          },
          create: {
            pageId
          }
        }
      }
    },
    include: sessionUserRelations
  });
  return res.status(200).json(user);
}

async function unFavoritePage(req: NextApiRequest, res: NextApiResponse<Partial<LoggedInUser> | { error: any }>) {
  const pageId = req.body.pageId as string;
  const user = await prisma.user.update({
    where: {
      id: req.session.user.id
    },
    data: {
      favorites: {
        delete: {
          pageId_userId: {
            pageId,
            userId: req.session.user.id
          }
        }
      }
    },
    include: sessionUserRelations
  });
  return res.status(200).json(user);
}

async function updateFavoritePages(req: NextApiRequest, res: NextApiResponse<FavoritePage[]>) {
  const favorites = req.body.favorites as FavoritePage[];
  const userId = req.session.user.id;
  const updatedFavorites = await prisma.$transaction(
    favorites.map((favorite) =>
      prisma.favoritePage.update({
        where: {
          pageId_userId: {
            userId,
            pageId: favorite.pageId
          }
        },
        data: {
          ...favorite
        }
      })
    )
  );

  return res.status(200).json(updatedFavorites);
}

export default withSessionRoute(handler);
