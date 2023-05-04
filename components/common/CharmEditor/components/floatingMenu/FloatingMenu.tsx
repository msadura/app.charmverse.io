/* eslint-disable react/no-unused-prop-types */
import { usePluginState } from '@bangle.dev/react';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { bindTrigger } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';
import type { PluginKey } from 'prosemirror-state';
import { useState } from 'react';
import reactDOM from 'react-dom';

import Button from 'components/common/Button';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useMobileKeyboard } from 'hooks/useMobileKeyboard';
import type { IPagePermissionFlags } from 'lib/permissions/pages';

import { InlineCommentSubMenu } from '../inlineComment/inlineComment.components';
import InlineCommandPalette from '../inlinePalette/components/InlineCommandPalette';
import { TextColorMenuDropdown } from '../textColor/ColorMenuDropdown';

import type { SubMenu } from './floating-menu';
import { LinkSubMenu } from './LinkSubMenu';
import { Menu } from './Menu';
import {
  BoldButton,
  CalloutButton,
  CodeButton,
  FloatingLinkButton,
  HeadingButton,
  InlineCommentButton,
  ItalicButton,
  ParagraphButton,
  StrikeButton,
  TextColorButton,
  UnderlineButton
} from './MenuButtons';
import { MenuGroup } from './MenuGroup';
import { MobileFloatingMenuContainer } from './MobileFloatingMenuContainer';

type FloatingMenuVariant = 'defaultMenu' | 'inlineCommentSubMenu' | 'commentOnlyMenu';

type MenuProps = {
  enableComments?: boolean;
  enableVoting?: boolean;
  pluginKey: PluginKey;
  inline?: boolean;
  pagePermissions?: IPagePermissionFlags;
  nestedPagePluginKey?: PluginKey<any>;
  disableNestedPage?: boolean;
  palettePluginKey?: PluginKey;
};

export default function FloatingMenuComponent(props: MenuProps) {
  const isSmallScreen = useSmallScreen();
  const menuState = usePluginState(props.pluginKey);
  const renderElement = MenuByType({ ...props });
  const mobileKeyboardHeight = useMobileKeyboard();

  if (isSmallScreen) {
    const tooltipContainer = (menuState.tooltipContentDOM as HTMLElement).parentElement;
    if (tooltipContainer) {
      tooltipContainer.style.position = 'fixed';
      tooltipContainer.style.bottom = `${mobileKeyboardHeight}px`;
      tooltipContainer.style.transform = 'translate(0)';
    }
  }

  const renderMenu =
    isSmallScreen && renderElement ? (
      <MobileFloatingMenuContainer keyboardSpacing={mobileKeyboardHeight}>{renderElement}</MobileFloatingMenuContainer>
    ) : (
      renderElement
    );

  const menuPortalContainer = menuState.tooltipContentDOM;

  return renderElement ? reactDOM.createPortal(renderMenu, menuPortalContainer) : null;
}

function MenuByType(props: MenuProps) {
  const {
    palettePluginKey,
    pluginKey,
    inline,
    pagePermissions,
    enableComments,
    nestedPagePluginKey,
    disableNestedPage
  } = props;
  const { type } = usePluginState(props.pluginKey) as { type: SubMenu };

  const popupState = usePopupState({ variant: 'popover', popupId: 'commands-menu' });
  const displayInlineCommentButton = !inline && pagePermissions?.comment && enableComments;
  const [activeItem, setActiveItem] = useState('Text');
  const handleActiveItem = (item: string) => setActiveItem(item);

  if ((type as FloatingMenuVariant) === 'commentOnlyMenu' && pagePermissions?.comment) {
    return (
      <Menu>
        <InlineCommentButton enableComments menuKey={pluginKey} />
      </Menu>
    );
  }

  if (type === 'defaultMenu') {
    return (
      <Menu type={type} inline={inline}>
        {!inline && palettePluginKey && (
          <MenuGroup>
            <Tooltip title={<Typography component='div'>Turn into</Typography>}>
              <Button
                {...bindTrigger(popupState)}
                endIcon={<KeyboardArrowDown sx={{ marginLeft: '-4px' }} />}
                disableElevation
                variant='text'
                color='inherit'
                sx={{ padding: 0 }}
              >
                {activeItem}
              </Button>
            </Tooltip>
            <InlineCommandPalette
              palettePluginKey={palettePluginKey}
              menuKey={pluginKey}
              nestedPagePluginKey={nestedPagePluginKey}
              disableNestedPage={disableNestedPage}
              externalPopupState={popupState}
              filterItem={(item) => !!item.showInFloatingMenu}
              isFloatingMenuList={true}
              handleActiveItem={handleActiveItem}
            />
          </MenuGroup>
        )}
        <MenuGroup isLastGroup={inline}>
          <BoldButton />
          <ItalicButton />
          <UnderlineButton />
          <StrikeButton />
          <CodeButton />
          <FloatingLinkButton menuKey={pluginKey} />
          {displayInlineCommentButton && <InlineCommentButton enableComments menuKey={pluginKey} />}
        </MenuGroup>
        {!inline && (
          <MenuGroup>
            <TextColorMenuDropdown>
              <TextColorButton />
            </TextColorMenuDropdown>
          </MenuGroup>
        )}
        {!inline && (
          <MenuGroup isLastGroup>
            <ParagraphButton />
            <CalloutButton />
            <HeadingButton level={1} />
            <HeadingButton level={2} />
            <HeadingButton level={3} />
          </MenuGroup>
        )}
      </Menu>
    );
  }

  if (type === 'linkSubMenu') {
    return (
      <Menu>
        <LinkSubMenu />
      </Menu>
    );
  }

  if (type === 'inlineCommentSubMenu' && !inline) {
    return (
      <Menu type={type} noScroll>
        <InlineCommentSubMenu pluginKey={pluginKey} />
      </Menu>
    );
  }

  return null;
}
