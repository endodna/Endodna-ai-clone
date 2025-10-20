# BiosAI Frontend

A React application built with TypeScript, Vite, and Tailwind CSS for the BiosAI platform.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Supabase** for authentication
- **i18next** for internationalization

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file with:

```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Features

- Simple welcome page
- Supabase authentication (configured but not used in UI)
- Internationalization support
- Responsive design with Tailwind CSS
