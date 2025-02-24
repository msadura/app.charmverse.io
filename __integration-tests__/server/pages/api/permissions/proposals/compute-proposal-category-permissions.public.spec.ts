import type { ProposalCategoryPermission } from '@charmverse/core/prisma';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';

import { publicPermissionsClient } from 'lib/permissions/api/client';
import { baseUrl, loginUser } from 'testing/mockApiCall';

describe('POST /api/permissions/proposals/compute-proposal-category-permissions - Compute permissions for a proposal category', () => {
  it('should return computed permissions for a user and non user, and respond 200', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: false, spacePaidTier: 'free' });
    const proposalCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id
    });
    const userCookie = await loginUser(user.id);

    const computed = await publicPermissionsClient.proposals.computeProposalCategoryPermissions({
      resourceId: proposalCategory.id,
      userId: user.id
    });

    const result = (
      await request(baseUrl)
        .post('/api/permissions/proposals/compute-proposal-category-permissions')
        .set('Cookie', userCookie)
        .send({ resourceId: proposalCategory.id })
        .expect(200)
    ).body as ProposalCategoryPermission;

    expect(result).toMatchObject(expect.objectContaining(computed));

    // Non logged in user test case
    const publicComputed = await publicPermissionsClient.proposals.computeProposalCategoryPermissions({
      resourceId: proposalCategory.id,
      userId: undefined
    });
    const publicResult = (
      await request(baseUrl)
        .post('/api/permissions/proposals/compute-proposal-category-permissions')
        .send({ resourceId: proposalCategory.id })
        .expect(200)
    ).body as ProposalCategoryPermission;

    expect(publicResult).toMatchObject(expect.objectContaining(publicComputed));
  });
});
