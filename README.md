# Fingerprint POC

A proof-of-concept application for integrating with Fingerprint Pro for visitor identification and tracking.

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your Fingerprint API keys and authentication settings:
   ```
   NEXT_PUBLIC_FINGERPRINT_PUBLIC_API_KEY=your_public_api_key
   FINGERPRINT_SECRET_API_KEY=your_secret_api_key
   BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
   
   # Authentication
   NEXTAUTH_SECRET=your_secret_key
   ADMIN_PASSWORD=your_admin_password
   ```

### Login Credentials
## This is for the dashboard page only

- **Username**: admin
- **Password**: The password is set in the `.env.local` file as `ADMIN_PASSWORD`

### Authentication Setup

The authentication system uses a simple cookie-based approach with the following components:

- **Login API**: `/api/auth/login` - Validates credentials and sets an auth cookie
- **Logout API**: `/api/auth/logout` - Clears the auth cookie
- **Session API**: `/api/auth/session` - Returns the current user's session

To modify the authentication settings:

1. Update the admin password in your `.env.local` file:
   ```
   ADMIN_PASSWORD=your_secure_password
   ```

2. For production deployment, make sure to set a strong, unique `NEXTAUTH_SECRET` value:
   ```bash
   # Generate a secure random string
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. When deploying to production, set these environment variables in your hosting platform.


## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

### Visitor Dashboard

The application includes a dedicated dashboard that provides a comprehensive view of visitor data. Access it by navigating to `/dashboard` or clicking the dashboard link from the home page.

The dashboard displays:
- Current visitor information
- Webhook events for the current visitor
- Event details and an event search function

### Visitor Identification

The application uses Fingerprint Pro to identify visitors across sessions and devices. Each visitor is assigned a unique identifier that persists even when cookies are cleared or different browsers are used.

### Account Takeover Protection Demo

The application includes a  demo that showcases how Fingerprint can be used to detect and prevent account takeover attempts:

- **Registration**: Users can register a new account, capturing their device fingerprint
- **Login**: When users attempt to login, the system compares their current fingerprint to the one captured during registration
- **Security**: If the fingerprints don't match (indicating a potentially unauthorized login attempt), additional verification is required

Access this demo by navigating to `/account-takeover-demo` or clicking the Account Takeover Demo link from the home page.

### Webhook Events

The application includes a webhook endpoint that receives events from Fingerprint Pro. These events are stored in the database and can be viewed in the UI:

- **Main Page**: Shows webhook events for the current visitor
- **Dashboard**: Displays webhook events with additional context
- **Webhooks Page**: Shows all webhook events from all visitors

To access the webhooks page, click the "View All Events" button on the main page or dashboard, or navigate to `/webhooks`.


## Database

This application uses SQLite for local development and Vercel Blob for production data storage. The database automatically switches between local and cloud storage based on the environment. It uses a simple in memory key value store for the account takeover demo portion.

## Blob Storage Testing

I have included some scripts to test and verify Vercel Blob storage functionality:

### Test Blob Upload

This script tests the ability to upload files to Vercel Blob storage:

```bash
node scripts/test-blob-upload.js
```

The script will:
1. Create a small test file with a timestamp
2. Upload it to Vercel Blob storage
3. List all blobs in your project to verify the upload
4. Display detailed information about each blob

### List Blobs

This script lists all blobs in your Vercel Blob storage:

```bash
node scripts/blob-list.js
```

The script will:
1. Connect to Vercel Blob storage using your token
2. List all available blobs in your project
3. Display detailed information including pathname and size
4. Show the complete API response for debugging

These scripts are useful for:
- Verifying your Vercel Blob storage configuration
- Debugging blob storage issues in production
- Confirming that your `BLOB_READ_WRITE_TOKEN` is valid and working

## CLI Tool

A command-line interface tool is provided for managing visitor data. The CLI tool uses a local SQLite database stored in the `./data` directory.

### Available Commands

```bash
# List all visitors
node scripts/fingerprint-cli.js listVisitors

# Get details for a specific visitor
node scripts/fingerprint-cli.js getVisitorEvents <visitorId>

# Delete a visitor and all their events
node scripts/fingerprint-cli.js deleteVisitor <visitorId>
```

## Webhook Testing with ngrok

To test Fingerprint webhooks locally, you need to expose your local server to the internet using ngrok.

### Setting up ngrok

1. Install ngrok if you haven't already:
   ```bash
   npm install -g ngrok
   ```

2. Start your Next.js development server:
   ```bash
   npm run dev
   ```

3. In a separate terminal, start ngrok to create a tunnel to your local server:
   ```bash
   ngrok http 3000
   ```

4. ngrok will provide a public URL (e.g., `https://ea5d-69-145-58-111.ngrok-free.app`). Copy this URL.

### Configuring Fingerprint Webhooks

1. Go to your Fingerprint dashboard
2. Navigate to the Webhooks section
3. Add a new webhook with the ngrok URL + `/api/fingerprint-webhook` path:
   ```
   https://ea5d-69-145-58-111.ngrok-free.app/api/fingerprint-webhook
   ```
4. Select the events you want to receive (e.g., identification)
5. Save the webhook configuration

### Testing the Webhook

You can test the webhook by sending a POST request to your ngrok URL:

```bash
curl -X POST https://ea5d-69-145-58-111.ngrok-free.app/api/fingerprint-webhook \
  -H "Content-Type: application/json" \
  -d '{"requestId":"test123","visitorId":"test-visitor-123"}'
```

After sending the webhook, you can verify it was received by:

1. Checking the CLI:
   ```bash
   node scripts/fingerprint-cli.js getVisitorEvents test-visitor-123
   ```

2. Viewing the webhook events in the UI:
   - Navigate to the main page to see events for the current visitor
   - Visit the dashboard to see a more detailed view
   - Go to the `/webhooks` page to see all webhook events

## Deployment

This application is designed to be deployed on Vercel:

```bash
npm run build
npm run deploy
```