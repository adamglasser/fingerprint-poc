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
   
   # Neon PostgreSQL Database
   DATABASE_URL=your_neon_connection_string
   DATABASE_URL_UNPOOLED=your_neon_unpooled_connection_string
   
   # Authentication
   NEXTAUTH_SECRET=your_secret_key
   ADMIN_PASSWORD=your_admin_password

   # Sealed Client Results (Optional)
   FP_ENCRYPTION_KEY=your_encryption_key
   ```

### Sealed Client Results

This application supports Fingerprint's sealed client results feature, which provides enhanced security by encrypting the client-side identification results. The sealed results are automatically unsealed on the server side.

To enable sealed client results:

1. Make sure your Fingerprint Pro account has sealed client results enabled
2. Set the following environment variable in your `.env.local`:
   ```
   FP_ENCRYPTION_KEY=your_encryption_key
   ```

The application will automatically:
- Receive sealed results from the client
- Unseal the results on the server using your encryption key
- Display the unsealed visitor information in the UI
- Maintain the same functionality as with unsealed results

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

This application uses Neon PostgreSQL, a serverless Postgres database, for both development and production environments. The database connection automatically adapts to the environment (development or production).

### Neon PostgreSQL Configuration

1. Create a Neon project at https://console.neon.tech/
2. Get your connection strings from the Neon dashboard
3. Add them to your `.env.local` file:
   ```
   # Recommended for most uses
   DATABASE_URL=postgres://user:password@host/dbname?sslmode=require

   # For uses requiring a connection without pgbouncer
   DATABASE_URL_UNPOOLED=postgresql://user:password@host/dbname?sslmode=require
   ```

### Database Implementation

The application uses the `@neondatabase/serverless` driver which supports two connection methods:

1. **HTTP-based connections** (via `neon()`) - Used for simple, one-off queries
2. **WebSocket-based connections** (via `Pool`) - Used for transaction support and maintaining compatibility with node-postgres interfaces

The implementation includes compatibility layers for both methods, making it easy to work with the database regardless of your preferred approach.


## Webhook Testing with ngrok

To test Fingerprint webhooks locally, you need to expose your local server to the internet using ngrok.

### Setting up ngrok

1. Make sure ngrok is installed:
   ```bash
   npm install -g ngrok
   ```

2. Start your Next.js development server:
   ```bash
   npm run dev
   ```

3. In a separate terminal, start ngrok:
   ```bash
   npx ngrok http 3000
   ```

4. Copy the HTTPS URL provided by ngrok (e.g., https://your-temporary-subdomain.ngrok.io)

5. In your Fingerprint Pro dashboard:
   - Go to Webhooks settings
   - Add a new webhook with the ngrok URL + `/api/webhook-receiver`
   - Example: `https://your-temporary-subdomain.ngrok.io/api/webhook-receiver`
   - Select the events you want to receive
   - Save the webhook

6. After configuring the webhook, visit your local application at http://localhost:3000 
   - Generate some traffic
   - Check the webhook events in your application UI

## Production Deployment

When deploying to production (e.g., Vercel), make sure to set all required environment variables:

### Required Environment Variables

1. **Fingerprint API Keys**:
   ```
   NEXT_PUBLIC_FINGERPRINT_PUBLIC_API_KEY=your_public_api_key
   FINGERPRINT_SECRET_API_KEY=your_secret_api_key
   ```

2. **Database Connection**:
   ```
   DATABASE_URL=your_neon_connection_string
   DATABASE_URL_UNPOOLED=your_neon_unpooled_connection_string
   ```

3. **Authentication**:
   ```
   NEXTAUTH_SECRET=your_secret_key
   ADMIN_PASSWORD=your_admin_password
   ```

4. **Sealed Results (if enabled)**:
   ```
   FP_ENCRYPTION_KEY=your_encryption_key
   ```

### Vercel Region Selection

For best performance with Neon PostgreSQL, choose a Vercel region close to your Neon database region. For example, if your Neon database is in AWS us-east-2, use the US East (N. Virginia) region on Vercel.

## License

This project is for demonstration purposes only. For production use, make sure to comply with Fingerprint's terms of service and implement proper security measures.