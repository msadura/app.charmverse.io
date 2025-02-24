import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { Divider, MenuItem, Typography, Box } from '@mui/material';
import type { PluginKey } from 'prosemirror-state';
import { memo, useCallback, useEffect } from 'react';

import UserDisplay from 'components/common/UserDisplay';
import { useMembers } from 'hooks/useMembers';
import { usePages } from 'hooks/usePages';
import type { Member } from 'lib/members/interfaces';
import type { PageMeta } from 'lib/pages';
import { safeScrollIntoViewIfNeeded } from 'lib/utilities/browser';
import { sanitizeForRegex } from 'lib/utilities/strings';

import type { PluginState as SuggestTooltipPluginState } from '../../@bangle.dev/tooltip/suggest-tooltip';
import { hideSuggestionsTooltip } from '../../@bangle.dev/tooltip/suggest-tooltip';
import PagesList from '../../PageList';
import PopoverMenu, { GroupLabel } from '../../PopoverMenu';
import type { MentionPluginState } from '../mention.interfaces';
import { selectMention } from '../mention.utils';

export function MentionSuggest({ pluginKey }: { pluginKey: PluginKey<MentionPluginState> }) {
  const { suggestTooltipKey } = usePluginState(pluginKey) as MentionPluginState;
  const { show: isVisible } = usePluginState(suggestTooltipKey) as SuggestTooltipPluginState;
  if (isVisible) {
    return <MentionSuggestMenu pluginKey={pluginKey} />;
  }
  return null;
}

function MentionSuggestMenu({ pluginKey }: { pluginKey: PluginKey }) {
  const { members } = useMembers();
  const view = useEditorViewContext();
  const { tooltipContentDOM, suggestTooltipKey } = usePluginState(pluginKey);
  const { show: isVisible, triggerText, counter } = usePluginState(suggestTooltipKey) as SuggestTooltipPluginState;
  const { pages } = usePages();
  const onSelectMention = useCallback(
    (value: string, type: string) => {
      selectMention(pluginKey, value, type)(view.state, view.dispatch, view);
      hideSuggestionsTooltip(suggestTooltipKey)(view.state, view.dispatch, view);
    },
    [view, pluginKey]
  );

  const triggerTextRegex = sanitizeForRegex(triggerText).toLowerCase();

  const filterByUserCustomName = (member: Member) =>
    member.properties
      .find((prop) => prop.type === 'name')
      ?.value?.toString()
      .toLowerCase()
      .match(triggerTextRegex);

  const filterByDiscordName = (member: Member) =>
    (member.profile?.social as Record<string, string>)?.discordUsername
      ?.toString()
      .toLowerCase()
      .match(triggerTextRegex);

  const filterByUsername = (member: Member) => member.username.toLowerCase().match(triggerTextRegex);

  const filterByPath = (member: Member) => member.path?.toLowerCase().match(triggerTextRegex);

  const filteredMembers =
    triggerText.length !== 0
      ? members.filter(
          (member) =>
            filterByUserCustomName(member) ||
            filterByDiscordName(member) ||
            filterByUsername(member) ||
            filterByPath(member)
        )
      : members;

  const filteredPages = Object.values(pages).filter(
    (page) =>
      page &&
      !page?.deletedAt &&
      (triggerText.length !== 0 ? (page.title || 'Untitled').toLowerCase().startsWith(triggerText.toLowerCase()) : true)
  );
  const totalItems = filteredMembers.length + filteredPages.length;
  const roundedCounter = (counter < 0 ? (counter % totalItems) + totalItems : counter) % totalItems;
  const selectedGroup = roundedCounter < filteredMembers.length ? 'members' : 'pages';
  const activeItemIndex = selectedGroup === 'members' ? roundedCounter : roundedCounter - filteredMembers.length;

  useEffect(() => {
    const activeDomElement = document.querySelector('.mention-selected') as HTMLDivElement;
    if (activeDomElement) {
      safeScrollIntoViewIfNeeded(activeDomElement, true);
    }
  }, [activeItemIndex]);
  return (
    <PopoverMenu
      container={tooltipContentDOM}
      maxHeight='300px'
      isOpen={isVisible}
      onClose={() => {
        hideSuggestionsTooltip(suggestTooltipKey)(view.state, view.dispatch, view);
      }}
      width={350}
    >
      <Box
        sx={{
          py: 1
        }}
      >
        <GroupLabel>Members</GroupLabel>
        {filteredMembers.length === 0 ? (
          <Typography sx={{ ml: 2 }} variant='subtitle2' color='secondary'>
            No members found
          </Typography>
        ) : (
          <div>
            {filteredMembers.map((member, memberIndex) => {
              const isSelected = selectedGroup === 'members' ? activeItemIndex === memberIndex : false;
              return (
                <MenuItem
                  component='div'
                  onClick={() => onSelectMention(member.id, 'user')}
                  key={member.id}
                  selected={isSelected}
                  data-value={member.id}
                  data-type='user'
                  className={isSelected ? 'mention-selected' : ''}
                >
                  <UserDisplay fontSize={14} user={member} avatarSize='small' />
                </MenuItem>
              );
            })}
          </div>
        )}
        <Divider
          sx={{
            my: 1
          }}
        />
        <GroupLabel>Pages</GroupLabel>
        <PagesList
          activeItemIndex={selectedGroup === 'pages' ? activeItemIndex : -1}
          pages={filteredPages as PageMeta[]}
          onSelectPage={(pageId) => onSelectMention(pageId, 'page')}
        />
      </Box>
    </PopoverMenu>
  );
}

export default memo(MentionSuggest);
