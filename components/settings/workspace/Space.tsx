import type { Space } from '@charmverse/core/prisma';
import { yupResolver } from '@hookform/resolvers/yup';
import Box from '@mui/material/Box';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import ConnectSnapshot from 'components/common/PageActions/components/SnapshotAction/ConnectSnapshot';
import PrimaryButton from 'components/common/PrimaryButton';
import Legend from 'components/settings/Legend';
import ImportContent from 'components/settings/workspace/ImportContent';
import Avatar from 'components/settings/workspace/LargeAvatar';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { usePreventReload } from 'hooks/usePreventReload';
import { useSpaces } from 'hooks/useSpaces';

import { SpaceFeatureSettings } from './SpaceFeatureSettings';

const schema = yup.object({
  name: yup.string().ensure().trim().min(3, 'Name must be at least 3 characters').required('Name is required'),
  spaceImage: yup.string().nullable(true),
  domain: yup
    .string()
    .ensure()
    .trim()
    .min(3, 'Domain must be at least 3 characters')
    .matches(/^[^!?@#$%^&*+=<>(){}.'"\\[\]|~/]*$/, 'The symbols you entered are not allowed')
    .matches(/^\S*$/, 'Space is not allowed')
});

type FormValues = yup.InferType<typeof schema>;

export default function SpaceSettings({ space }: { space: Space }) {
  const router = useRouter();
  const { spaces, setSpace, setSpaces } = useSpaces();
  const [error, setError] = useState<string | null>(null);
  const isAdmin = useIsAdmin();
  const workspaceRemoveModalState = usePopupState({ variant: 'popover', popupId: 'workspace-remove' });
  const workspaceLeaveModalState = usePopupState({ variant: 'popover', popupId: 'workspace-leave' });
  const unsavedChangesModalState = usePopupState({ variant: 'popover', popupId: 'unsaved-changes' });
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty }
  } = useForm<FormValues>({
    defaultValues: space,
    resolver: yupResolver(schema)
  });

  // set default values when space is set
  useEffect(() => {
    if (space) {
      reset(space);
      charmClient.track.trackAction('page_view', { spaceId: space.id, type: 'settings' });
    }
  }, [space?.id]);

  const watchName = watch('name');
  const watchSpaceImage = watch('spaceImage');

  function onSubmit(values: FormValues) {
    if (!space || !isAdmin || !values.domain) return;
    setError(null);
    // reload with new subdomain
    const newDomain = space.domain !== values.domain;
    charmClient
      .updateSpace({ ...space, name: values.name, domain: values.domain, spaceImage: values.spaceImage })
      .then((updatedSpace) => {
        if (newDomain) {
          // add a delay so that the form resets and doesnt block user from reloading due to calling usePreventReload(isDirty)
          setTimeout(() => {
            window.location.href = router.asPath.replace(space.domain, values.domain as string);
          }, 100);
        } else {
          setSpace(updatedSpace);
        }
        reset(updatedSpace);
      })
      .catch((err) => {
        setError(err?.message || err || 'Something went wrong');
      });
  }

  function closeInviteLinkDeleteModal() {
    workspaceRemoveModalState.close();
  }

  async function deleteWorkspace() {
    workspaceRemoveModalState.open();
  }

  usePreventReload(isDirty);

  return (
    <>
      <Legend marginTop={0}>Space Details</Legend>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container direction='column' spacing={3}>
          <Grid item>
            <Avatar
              name={watchName}
              variant='rounded'
              image={watchSpaceImage}
              updateImage={(url: string) => setValue('spaceImage', url, { shouldDirty: true })}
              editable={isAdmin}
            />
            <TextField {...register('spaceImage')} sx={{ visibility: 'hidden', width: '0px' }} />
          </Grid>
          <Grid item>
            <FieldLabel>Name</FieldLabel>
            <TextField
              {...register('name')}
              disabled={!isAdmin}
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message}
              data-test='space-name-input'
            />
          </Grid>
          <Grid item>
            <FieldLabel>Domain</FieldLabel>
            <TextField
              {...register('domain')}
              disabled={!isAdmin}
              fullWidth
              error={!!errors.domain}
              helperText={errors.domain?.message}
              sx={{ mb: 1 }}
              data-test='space-domain-input'
            />
            {error && <FormHelperText error>{error}</FormHelperText>}
          </Grid>
          {isAdmin ? (
            <Grid item display='flex' justifyContent='space-between'>
              <PrimaryButton data-test='submit-space-update' disabled={!isDirty} type='submit'>
                Save
              </PrimaryButton>
              <Button variant='outlined' color='error' onClick={deleteWorkspace}>
                Delete Space
              </Button>
            </Grid>
          ) : (
            <Grid item display='flex'>
              <Button
                variant='outlined'
                color='error'
                onClick={() => {
                  workspaceLeaveModalState.open();
                }}
              >
                Leave Space
              </Button>
            </Grid>
          )}
        </Grid>
      </form>
      <Legend mt={4}>Import Content</Legend>
      <Box sx={{ ml: 1 }} display='flex' flexDirection='column' gap={1}>
        <ImportContent />
      </Box>

      <Legend mt={4}>Sidebar Module Visibility</Legend>
      <SpaceFeatureSettings />

      <Legend mt={4}>Snapshot.org Integration</Legend>
      <Box sx={{ ml: 1 }} display='flex' flexDirection='column' gap={1}>
        <ConnectSnapshot />
      </Box>
      {space && (
        <ConfirmDeleteModal
          title='Delete space'
          onClose={closeInviteLinkDeleteModal}
          open={workspaceRemoveModalState.isOpen}
          buttonText={`Delete ${space.name}`}
          question={`Are you sure you want to delete ${space.name}? This action cannot be undone`}
          onConfirm={async () => {
            if (isAdmin) {
              await charmClient.deleteSpace(space.id);
              const filteredSpaces = spaces.filter((s) => s.id !== space.id);
              setSpaces(filteredSpaces);
            }
          }}
        />
      )}
      {space && (
        <ConfirmDeleteModal
          title='Leave space'
          onClose={() => {
            workspaceLeaveModalState.close();
          }}
          open={workspaceLeaveModalState.isOpen}
          buttonText={`Leave ${space.name}`}
          question={`Are you sure you want to leave ${space.name}?`}
          onConfirm={async () => {
            await charmClient.leaveSpace(space.id);
            const filteredSpaces = spaces.filter((s) => s.id !== space.id);
            setSpaces(filteredSpaces);
          }}
        />
      )}
      <ConfirmDeleteModal
        open={unsavedChangesModalState.isOpen}
        title='You have unsaved changes'
        onClose={() => {
          // discard
          unsavedChangesModalState.close();
        }}
        buttonText='Save changes'
        question='Are you sure you want to discard unsaved changes'
        onConfirm={() => {
          // save
          unsavedChangesModalState.close();
        }}
      />
    </>
  );
}
