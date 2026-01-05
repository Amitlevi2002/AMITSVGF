# SVG Design Backend

Backend API for SVG design management system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Make sure MongoDB is running locally or update `MONGODB_URI` in `.env`

4. Run in development mode:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
npm start
```

## API Endpoints

- `POST /api/designs` - Upload an SVG file (multipart/form-data, field name: 'svg')
- `GET /api/designs` - Get all designs
- `GET /api/designs/:id` - Get a specific design by ID

