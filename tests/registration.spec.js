import { expect, test } from '@playwright/test'

const validRegistration = {
  firstName: 'Ava',
  lastName: 'Johnson',
  email: 'ava.johnson@example.com',
  password: 'password123',
}

async function openRegistrationPage(page) {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
}

async function fillRegistrationForm(page, overrides = {}) {
  const values = {
    ...validRegistration,
    ...overrides,
  }

  await page.getByLabel('First name').fill(values.firstName)
  await page.getByLabel('Last name').fill(values.lastName)
  await page.getByLabel('Email address').fill(values.email)
  await page.getByRole('textbox', { name: 'Password' }).fill(values.password)
}

async function expectFieldHelperText(page, fieldName, expectedText) {
  const describedBy = await page.getByRole('textbox', { name: fieldName }).getAttribute('aria-describedby')

  expect(describedBy).toBeTruthy()

  await expect(page.locator(`#${describedBy}`)).toHaveText(expectedText)
}

function captureBrowserErrors(page) {
  const messages = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      const text = message.text()

      if (!text.includes('Failed to load resource')) {
        messages.push(`console:${text}`)
      }
    }
  })

  page.on('pageerror', (error) => {
    messages.push(`pageerror:${error.message}`)
  })

  return messages
}

function getPrimaryAlert(page) {
  return page.getByRole('alert').first()
}

test.describe('registration page', () => {
  test('shows the initial page state and default messaging', async ({ page }) => {
    const browserErrors = captureBrowserErrors(page)

    await openRegistrationPage(page)

    await expect(page.getByText('Build a polished account creation experience with controlled inputs, accessible validation, and clear server feedback when the backend rejects the submission.')).toBeVisible()
    await expect(getPrimaryAlert(page)).toContainText('Form requirements')
    await expect(getPrimaryAlert(page)).toContainText('All fields are required. Use a valid email address and a password with at least 8 characters.')
    await expect(page.getByRole('button', { name: 'Create account' })).toBeEnabled()
    expect(browserErrors).toEqual([])
  })

  test('validates required, email, and password rules on blur and submit', async ({ page }) => {
    const browserErrors = captureBrowserErrors(page)

    await test.step('required fields surface on blur and submit', async () => {
      await openRegistrationPage(page)

      const firstNameField = page.getByLabel('First name')
      await firstNameField.click()
      await page.keyboard.press('Tab')

      await expectFieldHelperText(page, 'First name', 'First name is required.')

      await page.getByRole('button', { name: 'Create account' }).click()

      await expectFieldHelperText(page, 'Last name', 'Last name is required.')
      await expectFieldHelperText(page, 'Email address', 'Email address is required.')
      await expectFieldHelperText(page, 'Password', 'Password is required.')
    })

    await test.step('email format validation appears on blur', async () => {
      await page.reload()
      await fillRegistrationForm(page, {
        email: 'invalid-email',
        password: 'password123',
      })

      const emailField = page.getByLabel('Email address')
      await emailField.focus()
      await page.keyboard.press('Tab')

      await expectFieldHelperText(page, 'Email address', 'Enter a valid email address.')
    })

    await test.step('password minimum length validation appears on blur', async () => {
      await page.reload()
      await fillRegistrationForm(page, {
        password: 'short',
      })

      const passwordField = page.getByRole('textbox', { name: 'Password' })
      await passwordField.focus()
      await page.keyboard.press('Tab')

      await expectFieldHelperText(page, 'Password', 'Use at least 8 characters.')
    })

    expect(browserErrors).toEqual([])
  })

  test('toggles password visibility with an accessible action label', async ({ page }) => {
    const browserErrors = captureBrowserErrors(page)

    await openRegistrationPage(page)

    const passwordField = page.getByRole('textbox', { name: 'Password' })
    const toggleButton = page.getByRole('button', { name: 'Show password' })

    await expect(passwordField).toHaveAttribute('type', 'password')
    await expect(toggleButton).toBeVisible()

    await toggleButton.click()

    await expect(passwordField).toHaveAttribute('type', 'text')
    await expect(page.getByRole('button', { name: 'Hide password' })).toBeVisible()

    await page.getByRole('button', { name: 'Hide password' }).click()

    await expect(passwordField).toHaveAttribute('type', 'password')
    expect(browserErrors).toEqual([])
  })

  test('submits valid data with a loading state and success summary', async ({ page }) => {
    const browserErrors = captureBrowserErrors(page)
    let releaseRequest

    await page.route('**/api/user/register', async (route) => {
      await new Promise((resolve) => {
        releaseRequest = resolve
      })

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 42,
          email: validRegistration.email,
          createdAtUtc: '2026-06-14T10:00:00.000Z',
        }),
      })
    })

    await openRegistrationPage(page)
    await fillRegistrationForm(page)

    const submitButton = page.getByRole('button', { name: 'Create account' })

    await submitButton.click()

    await expect(submitButton).toBeDisabled()
    await expect(submitButton).toHaveAttribute('aria-busy', 'true')
    await expect(page.getByText('Submitting the registration request to the backend.')).toBeVisible()

    releaseRequest()

    await expect(getPrimaryAlert(page)).toContainText('Registration complete')
    await expect(getPrimaryAlert(page)).toContainText('User #42 was created for ava.johnson@example.com.')
    await expect(getPrimaryAlert(page)).toContainText('Created at')
    expect(browserErrors).toEqual([])
  })

  test('maps 400 validation errors to inline field messages', async ({ page }) => {
    const browserErrors = captureBrowserErrors(page)

    await page.route('**/api/user/register', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          title: 'Please check the highlighted fields',
          detail: 'One or more values are invalid.',
          errors: {
            'request.firstName': ['First name must be at least 2 characters.'],
            email: ['Enter a valid email address.'],
            password: ['Use at least 8 characters.'],
          },
        }),
      })
    })

    await openRegistrationPage(page)
    await fillRegistrationForm(page)

    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(getPrimaryAlert(page)).toContainText('Please check the highlighted fields')
    await expect(getPrimaryAlert(page)).toContainText('One or more values are invalid.')
    await expectFieldHelperText(page, 'First name', 'First name must be at least 2 characters.')
    await expectFieldHelperText(page, 'Email address', 'Enter a valid email address.')
    await expectFieldHelperText(page, 'Password', 'Use at least 8 characters.')
    expect(browserErrors).toEqual([])
  })

  test('maps 409 conflicts and clears the field message after editing', async ({ page }) => {
    const browserErrors = captureBrowserErrors(page)

    await page.route('**/api/user/register', async (route) => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          title: 'Email already in use',
          detail: 'Choose a different email address.',
          errors: {
            email: ['Choose a different email address.'],
          },
        }),
      })
    })

    await openRegistrationPage(page)
    await fillRegistrationForm(page)

    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(getPrimaryAlert(page)).toContainText('Email already in use')
    await expectFieldHelperText(page, 'Email address', 'Choose a different email address.')

    await page.getByLabel('Email address').fill('ava.johnson+1@example.com')

    await expect(page.locator('p', { hasText: 'Choose a different email address.' })).toHaveCount(0)
    await expect(getPrimaryAlert(page)).toContainText('Form requirements')
    expect(browserErrors).toEqual([])
  })

  test('shows a safe fallback for generic server failures', async ({ page }) => {
    const browserErrors = captureBrowserErrors(page)

    await page.route('**/api/user/register', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({}),
      })
    })

    await openRegistrationPage(page)
    await fillRegistrationForm(page)

    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(getPrimaryAlert(page)).toContainText('Registration failed')
    await expect(getPrimaryAlert(page)).toContainText('Unable to create the account right now.')
    expect(browserErrors).toEqual([])
  })

  test('shows the same safe fallback when the network request fails', async ({ page }) => {
    const browserErrors = captureBrowserErrors(page)

    await page.route('**/api/user/register', async (route) => {
      await route.abort('failed')
    })

    await openRegistrationPage(page)
    await fillRegistrationForm(page)

    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(getPrimaryAlert(page)).toContainText('Registration failed')
    await expect(getPrimaryAlert(page)).toContainText('Unable to create the account right now.')
    expect(browserErrors).toEqual([])
  })
})

test.describe('responsive smoke', () => {
  test('renders on a narrow viewport', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()
    const browserErrors = captureBrowserErrors(page)

    await openRegistrationPage(page)

    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible()
    await expect(getPrimaryAlert(page)).toContainText('Form requirements')
    expect(browserErrors).toEqual([])

    await context.close()
  })

  test('renders on a wide viewport', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    const browserErrors = captureBrowserErrors(page)

    await openRegistrationPage(page)

    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible()
    await expect(getPrimaryAlert(page)).toContainText('Form requirements')
    expect(browserErrors).toEqual([])

    await context.close()
  })
})
