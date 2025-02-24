import type { TokenGate } from '@charmverse/core/prisma';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import type { ResourceId, SigningConditions } from 'lit-js-sdk';
import LitShareModal from 'lit-share-modal-v3';
import { debounce } from 'lodash';
import type { PopupState } from 'material-ui-popup-state/hooks';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { v4 as uuid } from 'uuid';

import useLitProtocol from 'adapters/litProtocol/hooks/useLitProtocol';
import charmClient from 'charmClient';
import Modal, { ErrorModal } from 'components/common/Modal';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import type { AuthSig } from 'lib/blockchain/interfaces';
import getLitChainFromChainId from 'lib/token-gates/getLitChainFromChainId';

import TokenGatesTable from './components/TokenGatesTable';

const ShareModalContainer = styled.div`
  width: 100%;
  min-height: 600px;

  .lsm-single-select-condition-display {
    overflow-y: scroll;
  }

  .lsm-single-condition-select-container,
  .lsm-condition-display,
  .lsm-condition-container,
  .lsm-review-conditions-group-container {
    overflow-y: auto !important;
  }
  /* Remove position: absolute so we have a dynamic height */
  .lsm-condition-display,
  .lsm-review-conditions-container,
  .lsm-single-condition-multiple-button,
  .lsm-lit-footer,
  // container when selecting multiple conditions
  .lsm-multiple-conditions-container {
    position: relative;
    top: 0;
  }
`;

// Example: https://github.com/LIT-Protocol/lit-js-sdk/blob/9b956c0f399493ae2d98b20503c5a0825e0b923c/build/manual_tests.html
// Docs: https://www.npmjs.com/package/lit-share-modal-v3

type ConditionsModalResult = Pick<SigningConditions, 'unifiedAccessControlConditions' | 'permanant'> & {
  authSigTypes: string[];
  chains: string[];
};

interface TokenGatesProps {
  isAdmin: boolean;
  spaceId: string;
  popupState: PopupState;
}

export default function TokenGates({ isAdmin, spaceId, popupState }: TokenGatesProps) {
  const deletePopupState = usePopupState({ variant: 'popover', popupId: 'token-gate-delete' });
  const [removedTokenGate, setRemovedTokenGate] = useState<TokenGate | null>(null);

  const theme = useTheme();
  const litClient = useLitProtocol();
  const { chainId } = useWeb3AuthSig();
  const { walletAuthSignature, sign } = useWeb3AuthSig();
  const errorPopupState = usePopupState({ variant: 'popover', popupId: 'token-gate-error' });
  const [apiError, setApiError] = useState<string>('');
  const { data = [], mutate } = useSWR(`tokenGates/${spaceId}`, () =>
    charmClient.tokenGates.getTokenGates({ spaceId })
  );

  const { isOpen: isOpenTokenGateModal, close: closeTokenGateModal } = popupState;

  function onSubmit(conditions: ConditionsModalResult) {
    setApiError('');
    return saveTokenGate(conditions)
      .then(() => {
        closeTokenGateModal();
      })
      .catch((error) => {
        setApiError(error.message || error);
        errorPopupState.open();
      });
  }

  const throttledOnSubmit = useMemo(() => debounce(onSubmit, 200), [litClient]);

  function closeTokenGateDeleteModal() {
    setRemovedTokenGate(null);
    deletePopupState.close();
  }

  async function saveTokenGate(conditions: ConditionsModalResult) {
    const tokenGateId = uuid();
    const resourceId: ResourceId = {
      baseUrl: 'https://app.charmverse.io',
      path: `${Math.random()}`,
      orgId: spaceId,
      role: 'member',
      extraData: JSON.stringify({
        tokenGateId
      })
    };

    const chain = getLitChainFromChainId(chainId);

    const authSig: AuthSig = walletAuthSignature ?? (await sign());

    await litClient!.saveSigningCondition({
      ...conditions,
      chain,
      authSig,
      resourceId
    });
    await charmClient.tokenGates.saveTokenGate({
      conditions: conditions as any,
      resourceId,
      spaceId,
      id: tokenGateId
    });
    await mutate();
  }

  async function deleteTokenGate(tokenGate: TokenGate) {
    setRemovedTokenGate(tokenGate);
    deletePopupState.open();
  }

  return (
    <>
      <TokenGatesTable isAdmin={isAdmin} tokenGates={data} onDelete={deleteTokenGate} />
      <Modal open={isOpenTokenGateModal} onClose={closeTokenGateModal} noPadding size='large'>
        <ShareModalContainer>
          <LitShareModal
            darkMode={theme.palette.mode === 'dark'}
            injectCSS={false}
            permanentDefault={true}
            isModal={false}
            onUnifiedAccessControlConditionsSelected={throttledOnSubmit}
          />
        </ShareModalContainer>
      </Modal>
      <ErrorModal message={apiError} open={errorPopupState.isOpen} onClose={errorPopupState.close} />
      {removedTokenGate && (
        <ConfirmDeleteModal
          title='Delete token gate'
          onClose={closeTokenGateDeleteModal}
          open={deletePopupState.isOpen}
          buttonText='Delete token gate'
          question='Are you sure you want to delete this invite link?'
          onConfirm={async () => {
            await charmClient.tokenGates.deleteTokenGate(removedTokenGate.id);
            // update the list of links
            await mutate();
            setRemovedTokenGate(null);
          }}
        />
      )}
    </>
  );
}
