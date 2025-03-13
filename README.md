# Fingerprint POC

A proof-of-concept application for integrating with Fingerprint Pro for visitor identification and tracking.

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your Fingerprint API keys:
   ```
   NEXT_PUBLIC_FINGERPRINT_PUBLIC_API_KEY=your_public_api_key
   FINGERPRINT_SECRET_API_KEY=your_secret_api_key
   BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
   ```

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database

This application uses SQLite for local development and Vercel Blob for production data storage. The database automatically switches between local and cloud storage based on the environment.

## Blob Storage Testing

The application includes scripts to test and verify Vercel Blob storage functionality:

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

After sending the webhook, you can verify it was received by checking the CLI:

```bash
node scripts/fingerprint-cli.js getVisitorEvents test-visitor-123
```

## Deployment

This application is designed to be deployed on Vercel:

```bash
npm run build
npm run deploy
```

In production, the application will use Vercel Blob for database storage.

## Troubleshooting

### Blob Storage Issues

If you encounter issues with blob storage in production:

1. **Verify Environment Variables**: Ensure `BLOB_READ_WRITE_TOKEN` is correctly set in your Vercel project settings.

2. **Test Blob Access**: Run the blob test scripts to verify your token and access:
   ```bash
   # Test uploading to blob storage
   node scripts/test-blob-upload.js
   
   # List all blobs to verify they exist
   node scripts/blob-list.js
   ```

3. **Check Logs**: Look for error messages containing "Error uploading database to Blob storage" or "BLOB_READ_WRITE_TOKEN not found".

4. **Token Permissions**: Verify your token has read/write permissions by checking in the Vercel dashboard.

5. **Database Persistence**: If data is being stored but not persisted between requests, it may indicate the database is being written to the temporary file system but not uploaded to blob storage.

6. **Serverless Function Timeout**: Ensure your function isn't timing out before the blob upload completes. Consider optimizing database operations for faster execution.

7. **Blob Storage Limits**: Check if you've reached any storage limits in your Vercel plan.

### Common Solutions

- Regenerate your `BLOB_READ_WRITE_TOKEN` in the Vercel dashboard
- Ensure proper error handling in your application code
- Add additional logging to pinpoint where failures occur
- Test with smaller database files to rule out size limitations