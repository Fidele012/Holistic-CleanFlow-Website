# Holistic CleanFlow

A comprehensive water services management platform that provides water payment services, issue reporting, institution dashboard, and geolocation tracking.

## Features

- User Authentication (Login/Signup)
- Water Bill Payment
- Issue Reporting System
- Institution Dashboard
- Geolocation Tracking
- Photo and Text Posting
- Password Reset Functionality

## Tech Stack

- Frontend: HTML5, CSS3, JavaScript
- Backend: Node.js with Express
- Database: MongoDB
- Authentication: JWT
- Maps Integration: Google Maps API
- Payment Gateway: Stripe

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add the following variables:
     ```
     MONGODB_URI=your_mongodb_uri
     JWT_SECRET=your_jwt_secret
     STRIPE_SECRET_KEY=your_stripe_secret_key
     GOOGLE_MAPS_API_KEY=your_google_maps_api_key
     ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
holistic-cleanflow/
├── client/                 # Frontend files
│   ├── css/               # Stylesheets
│   ├── js/                # Client-side JavaScript
│   └── images/            # Image assets
├── server/                # Backend files
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   └── middleware/      # Custom middleware
├── public/               # Static files
└── package.json         # Project dependencies
``` 