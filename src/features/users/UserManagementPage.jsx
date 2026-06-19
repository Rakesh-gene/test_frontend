import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { DataGrid, GridOverlay } from '@mui/x-data-grid'
import { getUsers, updateUser } from '../../api/usersApi.js'
import FormAlert from '../../components/common/FormAlert.jsx'
import UserEditDialog from './UserEditDialog.jsx'

const pageSizeOptions = [5, 10, 25]
const defaultPaginationModel = {
  page: 0,
  pageSize: 10,
}

function formatDateTime(value) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function LoadingOverlay() {
  return (
    <GridOverlay>
      <Stack spacing={1.5} alignItems="center" sx={{ py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Loading users
        </Typography>
      </Stack>
    </GridOverlay>
  )
}

function EmptyOverlay() {
  return (
    <GridOverlay>
      <Stack spacing={1.5} alignItems="center" sx={{ py: 4, maxWidth: 420, textAlign: 'center' }}>
        <Typography variant="h6" component="p">
          No users found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The directory is empty for the current page selection.
        </Typography>
      </Stack>
    </GridOverlay>
  )
}

function UserManagementPage() {
  const [paginationModel, setPaginationModel] = useState(defaultPaginationModel)
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const requestIdRef = useRef(0)

  const loadUsers = useCallback(
    async (targetPaginationModel = paginationModel, { preserveRowsOnError = false } = {}) => {
      const requestId = requestIdRef.current + 1
      requestIdRef.current = requestId

      setIsLoading(true)
      setLoadError('')

      try {
        const response = await getUsers({
          page: targetPaginationModel.page + 1,
          pageSize: targetPaginationModel.pageSize,
        })

        if (requestIdRef.current !== requestId) {
          return
        }

        setRows(response.items)
        setRowCount(response.totalCount)
      } catch (error) {
        if (requestIdRef.current !== requestId) {
          return
        }

        if (!preserveRowsOnError) {
          setRows([])
          setRowCount(0)
        }

        const apiError = error && typeof error === 'object' ? error : null
        setLoadError(
          apiError?.detail || apiError?.title || 'The user directory could not be loaded right now.',
        )
      } finally {
        if (requestIdRef.current === requestId) {
          setIsLoading(false)
        }
      }
    },
    [paginationModel.page, paginationModel.pageSize],
  )

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const columns = useMemo(
    () => [
      {
        field: 'firstName',
        headerName: 'First name',
        flex: 1,
        minWidth: 160,
      },
      {
        field: 'lastName',
        headerName: 'Last name',
        flex: 1,
        minWidth: 160,
      },
      {
        field: 'email',
        headerName: 'Email address',
        flex: 1.5,
        minWidth: 240,
      },
      {
        field: 'createdAtUtc',
        headerName: 'Created',
        flex: 1,
        minWidth: 180,
        valueFormatter: (params) => formatDateTime(params.value),
      },
    ],
    [],
  )

  const handlePaginationModelChange = (model) => {
    setPaginationModel(model)
  }

  const handleRowClick = (params) => {
    setSelectedUser(params.row)
    setIsEditOpen(true)
  }

  const handleDialogClose = () => {
    setIsEditOpen(false)
    setSelectedUser(null)
  }

  const handleSaveUser = async (user, values) => {
    const updatedUser = await updateUser(user.id, values)
    const mergedUser = {
      ...user,
      ...values,
      ...(updatedUser ?? {}),
    }

    setRows((currentRows) =>
      currentRows.map((currentRow) => {
        if (currentRow.id !== user.id) {
          return currentRow
        }

        return mergedUser
      }),
    )
    setIsEditOpen(false)
    setSelectedUser(null)
    void loadUsers(paginationModel, { preserveRowsOnError: true })
  }

  const reloadAction = (
    <Button
      variant="outlined"
      onClick={() => {
        void loadUsers()
      }}
      disabled={isLoading}
    >
      Reload
    </Button>
  )

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        py: { xs: 3, md: 5 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(circle at top left, rgba(15, 76, 92, 0.12), transparent 34%), radial-gradient(circle at bottom right, rgba(195, 111, 39, 0.14), transparent 30%)',
        }}
      />

      <Container
        maxWidth="xl"
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 3, md: 4 },
        }}
      >
        <Stack spacing={2}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            spacing={2}
            sx={{ flexWrap: 'wrap' }}
          >
            <Stack spacing={1} sx={{ maxWidth: 860 }}>
              <Chip
                label="User management"
                color="secondary"
                variant="filled"
                sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
              />
              <Typography variant="h2" component="h1">
                Users directory
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: 760, fontSize: { xs: '1rem', md: '1.0625rem' } }}
              >
                Browse all users in a server-paginated data grid, click any row to edit profile
                details, and keep the current page selection intact after each save.
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <Button component={RouterLink} to="/" variant="outlined">
                Back to registration
              </Button>
              <Button onClick={() => void loadUsers()} variant="contained" disabled={isLoading}>
                Refresh
              </Button>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label="Server-side pagination" variant="outlined" />
            <Chip label="Row click opens edit dialog" variant="outlined" />
            <Chip label="Profile fields only" variant="outlined" />
            <Chip
              label={isLoading ? 'Syncing data' : `${rowCount} users`}
              color={isLoading ? 'primary' : 'success'}
              variant="outlined"
            />
          </Stack>
        </Stack>

        {loadError ? (
          <FormAlert
            severity="error"
            title="Unable to load users"
            action={reloadAction}
            sx={{ alignItems: 'flex-start' }}
          >
            {loadError}
          </FormAlert>
        ) : null}

        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            border: '1px solid rgba(15, 76, 92, 0.12)',
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 20px 50px rgba(15, 76, 92, 0.08)',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              px: { xs: 2, sm: 3 },
              pt: { xs: 2, sm: 3 },
              pb: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Stack spacing={0.5}>
              <Typography variant="h5" component="h2">
                All users
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click a row to review and update the selected profile.
              </Typography>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              Page {paginationModel.page + 1} of {Math.max(1, Math.ceil(rowCount / paginationModel.pageSize))}
            </Typography>
          </Box>

          <Box sx={{ height: { xs: 560, md: 680 }, width: '100%' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              loading={isLoading}
              paginationMode="server"
              rowCount={rowCount}
              paginationModel={paginationModel}
              onPaginationModelChange={handlePaginationModelChange}
              pageSizeOptions={pageSizeOptions}
              disableRowSelectionOnClick
              onRowClick={handleRowClick}
              slots={{
                loadingOverlay: LoadingOverlay,
                noRowsOverlay: EmptyOverlay,
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  borderTop: '1px solid rgba(15, 76, 92, 0.08)',
                  backgroundColor: 'rgba(15, 76, 92, 0.03)',
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 700,
                },
                '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                  outline: 'none',
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'rgba(15, 76, 92, 0.04)',
                },
                '& .MuiDataGrid-row.Mui-selected': {
                  backgroundColor: 'rgba(15, 76, 92, 0.06)',
                },
              }}
            />
          </Box>
        </Paper>

        <Alert severity="info" variant="outlined" sx={{ borderRadius: 3 }}>
          Server-side paging is preserved when edits are saved. If an update fails, the dialog
          keeps your input and surfaces the API error inline.
        </Alert>
      </Container>

      <UserEditDialog
        open={isEditOpen}
        user={selectedUser}
        onClose={handleDialogClose}
        onSave={handleSaveUser}
      />
    </Box>
  )
}

export default UserManagementPage
