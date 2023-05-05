import type { ProposalCategory, Space, User } from '@charmverse/core/prisma';

import type { ProposalWithUsers } from 'lib/proposal/interface';
import { generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposal, generateProposalCategory } from 'testing/utils/proposals';

import { AvailableProposalPermissions } from '../../availableProposalPermissions.class';
import type { AvailableProposalPermissionFlags } from '../../interfaces';
import { policyStatusDiscussionEditableCommentable } from '../policyStatusDiscussionEditableCommentable';

let proposal: ProposalWithUsers;
let proposalCategory: ProposalCategory;
let space: Space;
let adminUser: User;
let proposalAuthor: User;
let proposalReviewer: User;
let spaceMember: User;

beforeAll(async () => {
  const generated = await generateUserAndSpace({
    isAdmin: true
  });

  adminUser = generated.user;
  space = generated.space;
  proposalAuthor = await generateSpaceUser({ isAdmin: false, spaceId: space.id });
  spaceMember = await generateSpaceUser({ isAdmin: false, spaceId: space.id });
  proposalReviewer = await generateSpaceUser({ isAdmin: false, spaceId: space.id });

  proposalCategory = await generateProposalCategory({
    spaceId: space.id
  });

  proposal = await generateProposal({
    categoryId: proposalCategory.id,
    authors: [proposalAuthor.id],
    proposalStatus: 'discussion',
    spaceId: space.id,
    userId: proposalAuthor.id,
    reviewers: [
      {
        group: 'user',
        id: proposalReviewer.id
      }
    ]
  });
});

const fullPermissions = new AvailableProposalPermissions().full;

describe('policyStatusDiscussionEditableCommentable', () => {
  it('should perform a no-op if the status is not discussion', async () => {
    const permissions = await policyStatusDiscussionEditableCommentable({
      flags: fullPermissions,
      isAdmin: false,
      resource: { ...proposal, status: 'draft' },
      userId: proposalAuthor.id
    });

    expect(permissions).toMatchObject<AvailableProposalPermissionFlags>({
      view: true,
      edit: true,
      delete: true,
      comment: true,
      create_vote: true,
      review: true,
      vote: true,
      make_public: true
    });
  });

  it('should allow the author to view, edit, comment, delete and make public', async () => {
    const permissions = await policyStatusDiscussionEditableCommentable({
      flags: fullPermissions,
      isAdmin: false,
      resource: proposal,
      userId: proposalAuthor.id
    });

    expect(permissions).toMatchObject<AvailableProposalPermissionFlags>({
      view: true,
      edit: true,
      delete: true,
      comment: true,
      make_public: true,
      create_vote: false,
      review: false,
      vote: false
    });
  });

  it('should return same level of permissions as the author for an admin', async () => {
    const permissions = await policyStatusDiscussionEditableCommentable({
      flags: fullPermissions,
      isAdmin: true,
      resource: proposal,
      userId: adminUser.id
    });

    expect(permissions).toMatchObject<AvailableProposalPermissionFlags>({
      view: true,
      edit: true,
      delete: true,
      comment: true,
      make_public: true,
      create_vote: false,
      review: false,
      vote: false
    });
  });

  it('should only provide view and comment permissions for the reviewer', async () => {
    const permissions = await policyStatusDiscussionEditableCommentable({
      flags: fullPermissions,
      isAdmin: false,
      resource: proposal,
      userId: proposalReviewer.id
    });

    expect(permissions).toMatchObject<AvailableProposalPermissionFlags>({
      view: true,
      comment: true,
      make_public: false,
      edit: false,
      delete: false,
      create_vote: false,
      review: false,
      vote: false
    });
  });

  it('should return only view and comment permissions for the space members', async () => {
    const permissions = await policyStatusDiscussionEditableCommentable({
      flags: fullPermissions,
      isAdmin: false,
      resource: proposal,
      userId: spaceMember.id
    });

    expect(permissions).toMatchObject<AvailableProposalPermissionFlags>({
      view: true,
      comment: true,
      make_public: false,
      edit: false,
      delete: false,
      create_vote: false,
      review: false,
      vote: false
    });
  });
});
