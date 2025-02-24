import { ArrowDropDown } from '@mui/icons-material';
import type { Theme } from '@mui/material';
import { IconButton, useMediaQuery, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material';
import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state';
import { memo } from 'react';

import Button from 'components/common/Button';
import { useCharmEditor, EDIT_MODE_CONFIG } from 'hooks/useCharmEditor';
import type { EditMode } from 'hooks/useCharmEditor';

const editModeConfig = {
  editing: {
    color: 'primary',
    label: 'Editing'
  },
  suggesting: {
    color: 'success',
    label: 'Suggesting'
  },
  viewing: {
    color: 'secondary',
    label: 'Viewing'
  }
} as const;

function EditModeToggle() {
  const { availableEditModes, editMode, setPageProps } = useCharmEditor();
  const isLargeScreen = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));

  function setMode(mode: EditMode) {
    setPageProps({ editMode: mode });
  }

  if (!editMode) {
    return null;
  }

  const availableModes = availableEditModes.map((mode) => [mode, editModeConfig[mode]] as const);

  return (
    <PopupState variant='popover' popupId='edit-mode-select'>
      {(popupState) => (
        <>
          {isLargeScreen ? (
            <Tooltip title='Toggle suggestion mode'>
              <Button
                {...bindTrigger(popupState)}
                startIcon={EDIT_MODE_CONFIG[editMode].icon}
                endIcon={<ArrowDropDown />}
                size='small'
                disableElevation
                variant='outlined'
                color={editModeConfig[editMode].color}
              >
                {editModeConfig[editMode].label}
              </Button>
            </Tooltip>
          ) : (
            <IconButton {...bindTrigger(popupState)}>{EDIT_MODE_CONFIG[editMode].icon}</IconButton>
          )}

          <Menu
            {...bindMenu(popupState)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          >
            {availableModes.map(([mode, { label }]) => (
              <MenuItem
                key={mode}
                dense
                onClick={() => {
                  setMode(mode as EditMode);
                  popupState.close();
                }}
              >
                <ListItemIcon sx={{ color: editMode === mode ? `${editModeConfig[mode].color}.main` : '' }}>
                  {EDIT_MODE_CONFIG[mode].icon}
                </ListItemIcon>
                <ListItemText>{label}</ListItemText>
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </PopupState>
  );
}

export default memo(EditModeToggle);
