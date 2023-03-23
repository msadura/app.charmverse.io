import { useTheme } from '@emotion/react';
import { Box, ClickAwayListener } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { MobileDialog } from 'components/common/MobileDialog/MobileDialog';
import { useSmScreen } from 'hooks/useMediaScreens';
import { useSnackbar } from 'hooks/useSnackbar';
import type { Board, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';

import mutator from '../../mutator';
import { IDType, Utils } from '../../utils';
import Button from '../../widgets/buttons/button';
import Menu from '../../widgets/menu';
import MenuWrapper from '../../widgets/menuWrapper';
import PropertyMenu, { PropertyTypes, typeDisplayName } from '../../widgets/propertyMenu';
import Calculations from '../calculations/calculations';
import type { ConfirmationDialogBoxProps } from '../confirmationDialogBox';
import ConfirmationDialogBox from '../confirmationDialogBox';
import PropertyValueElement from '../propertyValueElement';

type Props = {
  board: Board;
  card: Card;
  cards: Card[];
  activeView?: BoardView;
  views: BoardView[];
  readOnly: boolean;
  pageUpdatedBy: string;
  pageUpdatedAt: string;
};

function CardDetailProperties(props: Props) {
  const { board, card, cards, views, activeView, pageUpdatedAt, pageUpdatedBy } = props;
  const [newTemplateId, setNewTemplateId] = useState('');
  const [openMobileDrawer, setOpenMobileDrawer] = useState(false);
  const intl = useIntl();
  const { showMessage } = useSnackbar();
  const theme = useTheme();
  const isSmScreen = useSmScreen();

  useEffect(() => {
    const newProperty = board.fields.cardProperties.find((property) => property.id === newTemplateId);
    if (newProperty) {
      setNewTemplateId('');
    }
  }, [newTemplateId, board.fields.cardProperties]);

  const [confirmationDialogBox, setConfirmationDialogBox] = useState<ConfirmationDialogBoxProps>({
    heading: '',
    onConfirm: () => {},
    onClose: () => {}
  });
  const [showConfirmationDialog, setShowConfirmationDialog] = useState<boolean>(false);

  function onPropertyChangeSetAndOpenConfirmationDialog(
    newType: PropertyType,
    newName: string,
    propertyTemplate: IPropertyTemplate
  ) {
    const oldType = propertyTemplate.type;

    // do nothing if no change
    if (oldType === newType && propertyTemplate.name === newName) {
      return;
    }

    const affectsNumOfCards: string = Calculations.countNotEmpty(cards, propertyTemplate, intl);

    // if no card has this value set delete the property directly without warning
    if (affectsNumOfCards === '0') {
      mutator.changePropertyTypeAndName(board, cards, propertyTemplate, newType, newName);
      return;
    }

    let subTextString = intl.formatMessage(
      {
        id: 'CardDetailProperty.property-name-change-subtext',
        defaultMessage: 'type from "{oldPropType}" to "{newPropType}"'
      },
      { oldPropType: oldType, newPropType: newType }
    );

    if (propertyTemplate.name !== newName) {
      subTextString = intl.formatMessage(
        {
          id: 'CardDetailProperty.property-type-change-subtext',
          defaultMessage: 'name to "{newPropName}"'
        },
        { newPropName: newName }
      );
    }

    setConfirmationDialogBox({
      heading: intl.formatMessage({
        id: 'CardDetailProperty.confirm-property-type-change',
        defaultMessage: 'Confirm Property Type Change!'
      }),
      subText: intl.formatMessage(
        {
          id: 'CardDetailProperty.confirm-property-name-change-subtext',
          defaultMessage:
            'Are you sure you want to change property "{propertyName}" {customText}? This will affect value(s) across {numOfCards} card(s) in this board, and can result in data loss.'
        },
        {
          propertyName: propertyTemplate.name,
          customText: subTextString,
          numOfCards: affectsNumOfCards
        }
      ),

      confirmButtonText: intl.formatMessage({
        id: 'CardDetailProperty.property-change-action-button',
        defaultMessage: 'Change Property'
      }),
      onConfirm: async () => {
        setShowConfirmationDialog(false);
        try {
          await mutator.changePropertyTypeAndName(board, cards, propertyTemplate, newType, newName);
        } catch (err: any) {
          Utils.logError(`Error Changing Property And Name:${propertyTemplate.name}: ${err?.toString()}`);
        }
        showMessage(
          intl.formatMessage({
            id: 'CardDetailProperty.property-changed',
            defaultMessage: 'Changed property successfully!'
          }),
          'success'
        );
      },
      onClose: () => setShowConfirmationDialog(false)
    });

    // open confirmation dialog for property type or name change
    setShowConfirmationDialog(true);
  }

  function onPropertyDeleteSetAndOpenConfirmationDialog(propertyTemplate: IPropertyTemplate) {
    // set ConfirmationDialogBox Props
    setConfirmationDialogBox({
      heading: intl.formatMessage({
        id: 'CardDetailProperty.confirm-delete-heading',
        defaultMessage: 'Confirm Delete Property'
      }),
      subText: intl.formatMessage(
        {
          id: 'CardDetailProperty.confirm-delete-subtext',
          defaultMessage:
            'Are you sure you want to delete the property "{propertyName}"? Deleting it will delete the property from all cards in this board.'
        },
        { propertyName: propertyTemplate.name }
      ),
      confirmButtonText: intl.formatMessage({
        id: 'CardDetailProperty.delete-action-button',
        defaultMessage: 'Delete'
      }),
      onConfirm: async () => {
        const deletingPropName = propertyTemplate.name;
        setShowConfirmationDialog(false);
        try {
          await mutator.deleteProperty(board, views, cards, propertyTemplate.id);
          showMessage(
            intl.formatMessage(
              { id: 'CardDetailProperty.property-deleted', defaultMessage: 'Deleted {propertyName} Successfully!' },
              { propertyName: deletingPropName }
            ),
            'success'
          );
        } catch (err: any) {
          Utils.logError(
            `Error Deleting Property!: Could Not delete Property -" + ${deletingPropName} ${err?.toString()}`
          );
        }
      },

      onClose: () => setShowConfirmationDialog(false)
    });

    // open confirmation dialog property delete
    setShowConfirmationDialog(true);
  }

  function getDeleteDisabled(template: IPropertyTemplate) {
    if (
      views.some((view) => view.fields.viewType === 'calendar' && view.fields.dateDisplayPropertyId === template.id)
    ) {
      return 'Date property is used in calendar view';
    }
  }

  return (
    <div className='octo-propertylist'>
      {board.fields.cardProperties.map((propertyTemplate: IPropertyTemplate) => {
        const propertyValue = card.fields.properties[propertyTemplate.id];
        return (
          <div key={`${propertyTemplate.id}-${propertyTemplate.type}-${propertyValue}`} className='octo-propertyrow'>
            {props.readOnly && (
              <div className='octo-propertyname octo-propertyname--readonly'>
                <Button>{propertyTemplate.name}</Button>
              </div>
            )}
            {!props.readOnly && (
              <MenuWrapper isOpen={propertyTemplate.id === newTemplateId}>
                <div className='octo-propertyname'>
                  <Button>{propertyTemplate.name}</Button>
                </div>
                <PropertyMenu
                  deleteDisabled={getDeleteDisabled(propertyTemplate)}
                  propertyId={propertyTemplate.id}
                  propertyName={propertyTemplate.name}
                  propertyType={propertyTemplate.type}
                  onTypeAndNameChanged={(newType: PropertyType, newName: string) => {
                    onPropertyChangeSetAndOpenConfirmationDialog(newType, newName, propertyTemplate);
                  }}
                  onDelete={() => onPropertyDeleteSetAndOpenConfirmationDialog(propertyTemplate)}
                />
              </MenuWrapper>
            )}
            <PropertyValueElement
              readOnly={props.readOnly}
              card={card}
              board={board}
              updatedAt={pageUpdatedAt}
              updatedBy={pageUpdatedBy}
              propertyTemplate={propertyTemplate}
              showEmptyPlaceholder={true}
              displayType='details'
            />
          </div>
        );
      })}

      {showConfirmationDialog && <ConfirmationDialogBox dialogBox={confirmationDialogBox} />}
      {!props.readOnly && activeView && (
        <Box>
          <ClickAwayListener onClickAway={() => setOpenMobileDrawer(false)}>
            <div className='octo-propertyname add-property'>
              <MenuWrapper onClose={() => setOpenMobileDrawer(false)}>
                <Button
                  onClick={() => {
                    setOpenMobileDrawer(!openMobileDrawer);
                  }}
                >
                  <FormattedMessage id='CardDetail.add-property' defaultMessage='+ Add a property' />
                </Button>
                <Box display={{ base: 'none', md: 'initial' }}>
                  <Menu position='bottom-start' disablePortal={false}>
                    <PropertyTypes
                      isMobile={!isSmScreen}
                      label={intl.formatMessage({
                        id: 'PropertyMenu.selectType',
                        defaultMessage: 'Select property type'
                      })}
                      onTypeSelected={async (type) => {
                        const template: IPropertyTemplate = {
                          id: Utils.createGuid(IDType.BlockID),
                          name: typeDisplayName(intl, type),
                          type,
                          options: []
                        };
                        const templateId = await mutator.insertPropertyTemplate(board, activeView, -1, template);
                        setNewTemplateId(templateId);
                      }}
                    />
                  </Menu>
                </Box>
              </MenuWrapper>
            </div>
          </ClickAwayListener>
          {!isSmScreen && (
            <MobileDialog
              title={intl.formatMessage({ id: 'PropertyMenu.selectType', defaultMessage: 'Select property type' })}
              open={openMobileDrawer && !isSmScreen}
              onClose={() => setOpenMobileDrawer(false)}
              PaperProps={{ sx: { background: theme.palette.background.light } }}
              contentSx={{ pr: 0, pb: 0, pl: 1 }}
            >
              <Box display='flex' gap={1} flexDirection='column' flex={1} height='100%'>
                <PropertyTypes
                  isMobile={!isSmScreen}
                  label={intl.formatMessage({
                    id: 'PropertyMenu.selectType',
                    defaultMessage: 'Select property type'
                  })}
                  onTypeSelected={async (type) => {
                    const template: IPropertyTemplate = {
                      id: Utils.createGuid(IDType.BlockID),
                      name: typeDisplayName(intl, type),
                      type,
                      options: []
                    };
                    const templateId = await mutator.insertPropertyTemplate(board, activeView, -1, template);
                    setNewTemplateId(templateId);
                  }}
                />
              </Box>
            </MobileDialog>
          )}
        </Box>
      )}
    </div>
  );
}

export default React.memo(CardDetailProperties);
