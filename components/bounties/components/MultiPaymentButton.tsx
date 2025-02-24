import { Tooltip } from '@mui/material';
import Button from '@mui/material/Button';
import type { MetaTransactionData } from '@safe-global/safe-core-sdk-types';

import type { GnosisPaymentProps } from 'hooks/useGnosisPayment';
import { useGnosisPayment } from 'hooks/useGnosisPayment';

export interface MultiPaymentResult {
  safeAddress: string;
  transactions: (MetaTransactionData & { applicationId: string })[];
  txHash: string;
}

type Props = GnosisPaymentProps & {
  isLoading: boolean;
};

export default function MultiPaymentButton({ isLoading, chainId, safeAddress, transactions, onSuccess }: Props) {
  const { safe, makePayment } = useGnosisPayment({
    chainId,
    onSuccess,
    safeAddress,
    transactions
  });

  return (
    <Tooltip arrow placement='top' title={!safe ? `Connect your wallet to the Gnosis safe: ${safeAddress}` : ''}>
      <span>
        <Button
          disabled={isLoading || !safe || transactions.length === 0 || !chainId || !safeAddress}
          onClick={makePayment}
        >
          Send Payment ({transactions.length})
        </Button>
      </span>
    </Tooltip>
  );
}
