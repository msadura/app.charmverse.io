import { Chip, MenuItem, TextField } from '@mui/material';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import { forwardRef, useRef, useState } from 'react';
import { v4 } from 'uuid';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { SelectOptionItem } from 'components/common/form/fields/Select/SelectOptionItem';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';
import { getRandomThemeColor } from 'theme/utils/getRandomThemeColor';

const filter = createFilterOptions<SelectOptionType>();

type SelectProps = {
  multiselect?: boolean;
  options?: SelectOptionType[];
  disabled?: boolean;
  onChange: (option: string | string[]) => void;
  onCreateOption?: (option: SelectOptionType) => void;
  onUpdateOption?: (option: SelectOptionType) => void;
  onDeleteOption?: (option: SelectOptionType) => void;
}

type Props = ControlFieldProps & FieldProps & SelectProps;

export const SelectField = forwardRef<HTMLDivElement, Props>((
  {
    label,
    iconLabel,
    inline,
    disabled,
    multiselect = false,
    options = [],
    onDeleteOption,
    onUpdateOption,
    onCreateOption,
    ...inputProps
  },
  ref
) => {
  const selectedValues: string[] = Array.isArray(inputProps.value) ? inputProps.value : [inputProps.value];
  const selectedOptions = options.filter(option => option.id && selectedValues.includes(option.id));
  const [isOptionEditOpened, setIsOptionEditOpened] = useState(false);
  const [isOpened, setIsOpened] = useState(false);

  const inputRef = useRef<HTMLInputElement>();

  function toggleOptionEdit (opened: boolean) {
    setIsOptionEditOpened(opened);
    setIsOpened(true);
  }

  function onValueChange (updatedSelectedOptions: SelectOptionType[]) {
    const values = updatedSelectedOptions.map(option => option.id).filter(Boolean) as string[];
    const tempValueOption = updatedSelectedOptions.find(option => option.temp);
    const newValue = multiselect ? values : values.pop();

    if (tempValueOption && onCreateOption) {
      delete tempValueOption.temp;
      onCreateOption(tempValueOption);
    }

    inputProps.onChange(newValue || '');
  }

  return (
    <FieldWrapper label={label} inline={inline} iconLabel={iconLabel}>
      <Autocomplete
        onClose={(e) => {
          if (e.type === 'blur' && isOptionEditOpened) {
            return;
          }

          setIsOpened(false);
        }}
        onOpen={() => setIsOpened(true)}
        open={isOpened || isOptionEditOpened}
        ref={ref}
        disabled={disabled}
        disableCloseOnSelect={multiselect}
        value={selectedOptions}
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        multiple
        filterSelectedOptions
        sx={{ minWidth: 150, width: '100%' }}
        options={options}
        autoHighlight
        clearIcon={null}
        renderOption={(selectProps, option) => {
          if (option.temp) {
            return <MenuItem {...selectProps}>Add {option.name}</MenuItem>;
          }

          return (
            <SelectOptionItem
              key={option.id || option.name}
              option={option}
              menuItemProps={selectProps}
              onDelete={onDeleteOption || undefined}
              onChange={onUpdateOption || undefined}
              onToggleOptionEdit={toggleOptionEdit}
            />
          );
        }}
        renderTags={(value, getTagProps) => value.map((option, index) => (
          // eslint-disable-next-line react/jsx-key
          <Chip
            {...getTagProps({ index })}
            size='small'
            label={option.name}
            color={option.color}
          />
        ))}
        noOptionsText='No options available'
        renderInput={(params) => (
          <TextField
            inputRef={inputRef}
            {...params}
            size='small'
          />
        )}
        getOptionLabel={(option: SelectOptionType) => {
          return option.name;
        }}
        filterOptions={(allOptions: SelectOptionType[], params) => {
          const filtered = filter(allOptions, params);

          const { inputValue } = params;

          // Suggest the creation of a new value
          const isExisting = options.some((option) => inputValue.toLowerCase() === option.name?.toLocaleLowerCase());
          if (inputValue !== '' && !isExisting && onCreateOption) {
            filtered.push({
              temp: true,
              id: v4(),
              name: inputValue,
              color: getRandomThemeColor()
            });
          }

          return filtered;
        }}
        isOptionEqualToValue={(option, checkValue) => {
          if ('id' in option) {
            return 'id' in checkValue && option.id === checkValue.id;
          }

          return false;
        }}
        onChange={(_, values) => {
          onValueChange(values);
        }}
      />
    </FieldWrapper>
  );
});