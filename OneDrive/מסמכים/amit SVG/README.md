# SVG Design Manager

A full-stack application for uploading, analyzing, and managing SVG designs.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB (running locally or connection string)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
npm run dev
```
Backend runs on `http://localhost:8888`

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173` (or assigned port)

## 📋 Features

- ✅ Upload SVG files
- ✅ Parse SVG and extract rectangles
- ✅ Store designs in MongoDB
- ✅ View designs list
- ✅ View design details with canvas preview
- ✅ Multi-select and delete designs
- ✅ Real-time updates
- ✅ Responsive design

## 🏗️ Architecture

### Backend
- **Framework**: Express.js + TypeScript
- **Database**: MongoDB with Mongoose
- **File Upload**: Multer
- **SVG Parsing**: Custom parser with xml2js

### Frontend
- **Framework**: React + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router
- **Styling**: CSS with glassmorphism design

## 📡 API Endpoints

- `POST /upload` - Upload SVG file
- `GET /api/designs` - Get all designs
- `GET /api/designs/:id` - Get design by ID
- `DELETE /api/designs/:id` - Delete design
- `GET /health` - Health check
- `GET /uploads/:filename` - Serve static files

## 🎨 UI Features

- Modern glassmorphism design
- Dark theme
- Interactive canvas preview
- Responsive layout
- Loading states and error handling

## 📝 Environment Variables

### Backend (.env)
```
PORT=8888
MONGODB_URI=mongodb://localhost:27017/svg-designs
CORS_ORIGIN=http://localhost:5173
```

## ✅ Status

All systems operational and tested.
