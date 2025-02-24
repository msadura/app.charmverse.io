import type { IdentityType } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import CheckIcon from '@mui/icons-material/Check';
import { Box, Divider, Grid, Tooltip, Typography } from '@mui/material';
import type { ReactNode } from 'react';

import Button from 'components/common/Button';

const IntegrationName = styled(Typography)`
  background-color: ${({ theme }) => theme.palette.background.dark};
  display: inline-block;
  border-radius: 7px;
  padding: 3px 7px;
`;

type IntegrationProps = {
  isInUse: boolean;
  icon: ReactNode;
  action?: ReactNode;
  identityType: IdentityType;
  name: string;
  username: string;
  // Used for showing email for Google accounts, and wallet address for shortened wallet names or ens names
  secondaryUserName?: string;
  selectIntegration: (id: string, type: IdentityType) => void;
};

function Integration(props: IntegrationProps) {
  const { isInUse, icon, action, username, name, identityType, selectIntegration, secondaryUserName } = props;

  return (
    <Grid container>
      <Grid container item xs={10}>
        <Box py={2} px={1}>
          <Box display='flex' gap={1} alignItems='flex-end' mb={1}>
            {icon}
            {/* use smaller font size fofr wallet addresses and larger strings */}
            <Tooltip title={secondaryUserName ?? ''}>
              <Typography component='span' fontSize={username.length < 40 ? '1.4em' : '.9em'} fontWeight={700}>
                {username}
                {action}
              </Typography>
            </Tooltip>
          </Box>
          <IntegrationName variant='caption'>{name}</IntegrationName>
        </Box>

        <Grid item></Grid>
      </Grid>

      <Grid item container direction='column' xs={2}>
        <Box display='flex' alignItems='center' justifyContent='flex-end' height='100%'>
          {isInUse ? (
            <>
              <CheckIcon fontSize='small' />
              <Typography ml={1} variant='body2'>
                Selected
              </Typography>
            </>
          ) : (
            <Button size='small' onClick={() => selectIntegration(username, identityType)}>
              Select
            </Button>
          )}
        </Box>
      </Grid>
      <Grid item xs={12}>
        <Divider />
      </Grid>
    </Grid>
  );
}

export default Integration;
