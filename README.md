# Fingerprint Visitor Demo

A Next.js application that demonstrates visitor identification and tracking using Fingerprint Pro.

## Overview

This application showcases how to implement visitor identification across browser sessions using Fingerprint Pro. It displays visitor information and demonstrates how to integrate Fingerprint's client-side SDK in a React/Next.js environment.

## Features

* Visitor identification and tracking
* Display of visitor information
* Responsive UI with dark mode support

## Technology Stack

* [Next.js](https://nextjs.org/)
* [React](https://reactjs.org/)
* [Fingerprint Pro](https://fingerprint.com/)
* [Tailwind CSS](https://tailwindcss.com/)

## Prerequisites

* Node.js 14.x or higher
* A Fingerprint Pro API key

## Setup

1. Clone the repository:
```
git clone https://github.com/yourusername/fingerprint-visitor-demo.git
cd fingerprint-visitor-demo
```

2. Install dependencies:
```
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory with your Fingerprint API key:
```
NEXT_PUBLIC_FINGERPRINT_API_KEY=your_fingerprint_api_key
```

## Running the Application

Run the development server:
```
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How It Works

The application uses the Fingerprint Pro React SDK to identify visitors. The main components are:

* `FpjsProvider`: Provides the Fingerprint context to the application
* `VisitorInfo`: Displays information about the current visitor

## License

MIT

## Resources

* [Fingerprint Documentation](https://dev.fingerprint.com/)
* [Next.js Documentation](https://nextjs.org/docs)
