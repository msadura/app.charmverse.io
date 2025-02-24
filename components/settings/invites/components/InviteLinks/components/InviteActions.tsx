import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Box, ListItemText, Tooltip } from '@mui/material';
import type { MenuProps } from '@mui/material/Menu';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import { bindTrigger } from 'material-ui-popup-state/hooks';
import type { PopupState } from 'material-ui-popup-state/hooks';
import type { MouseEvent, SyntheticEvent } from 'react';
import { memo, useState } from 'react';

import Button from 'components/common/Button';

const StyledMenu = styled((props: MenuProps) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right'
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right'
    }}
    {...props}
  />
))(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: 6,
    maxWidth: 260,
    color: theme.palette.mode === 'light' ? 'rgb(55, 65, 81)' : theme.palette.grey[300],
    boxShadow:
      'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
    '& .MuiMenu-list': {
      padding: '4px 0'
    },
    '& .MuiMenuItem-root': {
      alignItems: 'flex-start',
      whiteSpace: 'normal',
      '& .MuiBox-root': {
        display: 'flex',
        flexDirection: 'column'
      },
      '& .MuiSvgIcon-root': {
        color: theme.palette.text.secondary,
        marginTop: theme.spacing(0.2),
        marginRight: theme.spacing(1)
      }
    }
  }
}));

export type popupStateTrigger = Omit<ReturnType<typeof bindTrigger>, 'onClick'>;

interface InviteActionsProps {
  isAdmin: boolean;
  invitePopupState: PopupState;
  tokenGatePopupState: PopupState;
  onOpenInvitesClick: (e: SyntheticEvent<any, Event>) => void;
  onOpenTokenGateClick: (e: SyntheticEvent<any, Event>) => void;
}

function InviteActions({
  isAdmin,
  invitePopupState,
  tokenGatePopupState,
  onOpenInvitesClick,
  onOpenTokenGateClick
}: InviteActionsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleAddClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleInvites = (e: SyntheticEvent<any, Event>) => {
    onOpenInvitesClick(e);
    handleClose();
  };

  const handleTokenGate = (e: SyntheticEvent<any, Event>) => {
    onOpenTokenGateClick(e);
    handleClose();
  };

  return (
    <>
      <Tooltip title={!isAdmin ? 'Only space admins can create invite links' : ''} arrow>
        {/* Tooltip on disabled button requires one block element below wrapper */}
        <span>
          <Button
            id='add-invites-menu'
            aria-controls={open ? 'demo-customized-menu' : undefined}
            aria-haspopup='true'
            aria-expanded={open ? 'true' : undefined}
            disableElevation
            onClick={handleAddClick}
            endIcon={<KeyboardArrowDownIcon />}
            disabled={!isAdmin}
          >
            Add
          </Button>
        </span>
      </Tooltip>
      <StyledMenu
        id='demo-customized-menu'
        MenuListProps={{
          'aria-labelledby': 'add-invites-menu'
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem {...bindTrigger(invitePopupState)} onClick={handleInvites} disableRipple dense>
          <AddIcon fontSize='small' />
          <Box>
            <ListItemText
              primary='Add a Private Link'
              secondary='Anyone with this link can join your space'
              primaryTypographyProps={{ fontWeight: 600 }}
              secondaryTypographyProps={{ variant: 'caption', color: 'secondary' }}
            />
          </Box>
        </MenuItem>
        <MenuItem {...bindTrigger(tokenGatePopupState)} onClick={handleTokenGate} disableRipple dense>
          <AddIcon fontSize='small' />
          <Box>
            <ListItemText
              primary='Add a Token Gate'
              secondary='Control access to your space with tokens & NFTS (Wallet Required)'
              primaryTypographyProps={{ fontWeight: 600 }}
              secondaryTypographyProps={{ variant: 'caption', color: 'secondary' }}
            />
          </Box>
        </MenuItem>
      </StyledMenu>
    </>
  );
}

export default memo(InviteActions);
