export const fieldRootSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 3,
    backgroundColor: 'background.paper',
    transition: (theme) =>
      theme.transitions.create(['box-shadow', 'border-color', 'background-color'], {
        duration: theme.transitions.duration.shorter,
      }),
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(47, 92, 255, 0.45)',
    },
    '&.Mui-focused': {
      boxShadow: '0 0 0 4px rgba(47, 92, 255, 0.08)',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: 'primary.main',
      borderWidth: 2,
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: 'primary.main',
  },
  '& .MuiFormHelperText-root': {
    marginLeft: 0,
  },
}

