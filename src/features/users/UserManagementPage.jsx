import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { getUsers, updateUser } from '../../api/usersApi.js'
import { FormCard, FormAlert } from '../../components/common/index.js'
import UserEditDialog from './UserEditDialog.jsx'

const initialPaginationModel = {
  page: 0,
  pageSize: 10,
}

const pageSizeOptions = [5, 10, 25, 50]

const columns = [
  {
    field: 'firstName',
    headerName: 'First name',
    flex: 1,
    minWidth: 140,
  },
  {
    field: 'lastName',
    headerName: 'Last name',
    flex: 1,
    minWidth: 140,
  },
  {
    field: 'email',
    headerName: 'Email address',
    flex: 1.4,
    minWidth: 220,
  },
  {
    field: 'createdAtUtc',
    headerName: 'Created',
    minWidth: 180,
    renderCell: (params) => {
      const value = params.value

      if (!value) {
        return ''
      }

      const parsed = new Date(value)
      return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString()
    },
  },
]

function UserManagementPage() {
  const [paginationModel, setPaginationModel] = useState(initialPaginationModel)
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const [refreshToken, setRefreshToken] = useState(0)
  const [banner, setBanner] = useState(null)

  const currentPageLabel = useMemo(() => {
    const start = rowCount === 0 ? 0 : paginationModel.page * paginationModel.pageSize + 1
    const end = Math.min((paginationModel.page + 1) * paginationModel.pageSize, rowCount)

    if (rowCount === 0) {
      return searchTerm ? `No matches found for "${searchTerm}"` : 'No users loaded yet'
    }

    return `Showing ${start}-${end} of ${rowCount}`
  }, [paginationModel.page, paginationModel.pageSize, rowCount, searchTerm])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchTerm(searchInput.trim())
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [searchInput])

  useEffect(() => {
    let active = true

    async function loadPage() {
      setIsLoading(true)
      setLoadError('')

      try {
        const result = await getUsers({
          page: paginationModel.page + 1,
          pageSize: paginationModel.pageSize,
          search: searchTerm,
        })

        if (!active) {
          return
        }

        setRows(result.items)
        setRowCount(result.totalCount)
        setBanner((current) =>
          current?.severity === 'success' && current.scope === 'save'
            ? current
            : null,
        )
      } catch (error) {
        if (!active) {
          return
        }

        const apiError = error && typeof error === 'object' ? error : null

        setLoadError(apiError?.detail || apiError?.title || 'Unable to load users right now.')
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadPage()

    return () => {
      active = false
    }
  }, [paginationModel.page, paginationModel.pageSize, refreshToken, searchTerm])

  const handleRetry = () => {
    setRefreshToken((current) => current + 1)
  }

  const handleSearchChange = (event) => {
    const { value } = event.target

    setSearchInput(value)
    setPaginationModel((current) =>
      current.page === 0 ? current : { ...current, page: 0 },
    )
  }

  const handleRowClick = (params) => {
    setSelectedUser(params.row)
    setEditOpen(true)
  }

  const handleCloseDialog = () => {
    setEditOpen(false)
    setSelectedUser(null)
  }

  const handleSaveUser = async (payload) => {
    if (!selectedUser) {
      return
    }

    await updateUser(selectedUser.id ?? selectedUser.userId, payload)

    setBanner({
      severity: 'success',
      title: 'User updated',
      message: `${payload.firstName} ${payload.lastName} was saved successfully.`,
      scope: 'save',
    })
    setEditOpen(false)
    setSelectedUser(null)
    setRefreshToken((current) => current + 1)
  }

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
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
              <Chip
                label="User management"
                color="secondary"
                variant="filled"
                sx={{ fontWeight: 700 }}
              />
              <Chip label="Newest first" variant="outlined" sx={{ fontWeight: 700 }} />
            </Stack>

            <Typography variant="h2" component="h1">
              Manage users
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720 }}>
              Review every registered user, move through the list with server-backed pagination,
              and edit profile details directly from the grid.
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            <Button component={RouterLink} to="/" variant="outlined">
              Back to registration
            </Button>
            <Button onClick={handleRetry} variant="contained" disabled={isLoading}>
              Refresh list
            </Button>
          </Stack>
        </Stack>

        {banner ? (
          <FormAlert
            severity={banner.severity}
            title={banner.title}
            onClose={() => setBanner(null)}
          >
            {banner.message}
          </FormAlert>
        ) : null}

        {loadError ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={handleRetry} disabled={isLoading}>
                Retry
              </Button>
            }
          >
            {loadError}
          </Alert>
        ) : null}

        <FormCard
          eyebrow="User directory"
          title="All registered users"
          description={currentPageLabel}
          sx={{ overflow: 'hidden' }}
        >
          <TextField
            label="Search users"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="First name, last name, or email"
            helperText="Server-side search matches first name, last name, and email."
            fullWidth
            sx={{ mb: 2 }}
            inputProps={{ 'aria-label': 'Search users' }}
          />

          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid rgba(15, 76, 92, 0.12)',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ height: { xs: 560, md: 680 }, width: '100%' }}>
              <DataGrid
                rows={rows}
                columns={columns}
                loading={isLoading}
                paginationMode="server"
                rowCount={rowCount}
                paginationModel={paginationModel}
                onPaginationModelChange={(nextModel) =>
                  setPaginationModel((current) => {
                    if (nextModel.pageSize !== current.pageSize) {
                      return {
                        page: 0,
                        pageSize: nextModel.pageSize,
                      }
                    }

                    return nextModel
                  })
                }
                pageSizeOptions={pageSizeOptions}
                disableRowSelectionOnClick
                onRowClick={handleRowClick}
                getRowId={(row) => row.id ?? row.userId}
                localeText={{
                  noRowsLabel: searchTerm
                    ? `No users match "${searchTerm}"`
                    : 'No users available yet',
                }}
                sx={{
                  border: 0,
                  '& .MuiDataGrid-columnHeaders': {
                    bgcolor: 'rgba(15, 76, 92, 0.04)',
                    borderBottomColor: 'rgba(15, 76, 92, 0.12)',
                  },
                  '& .MuiDataGrid-cell': {
                    borderBottomColor: 'rgba(15, 76, 92, 0.08)',
                  },
                  '& .MuiDataGrid-row': {
                    cursor: 'pointer',
                  },
                }}
              />
            </Box>
          </Paper>
        </FormCard>

        <UserEditDialog
          user={selectedUser}
          open={editOpen}
          onClose={handleCloseDialog}
          onSave={handleSaveUser}
        />
      </Container>
    </Box>
  )
}

export default UserManagementPage
