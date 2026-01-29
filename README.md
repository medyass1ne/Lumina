# Lumina - Automated Image Enhancement Platform

Lumina is a powerful Next.js application designed to automate image processing workflows using Google Drive and custom templates. It features a robust dashboard for managing projects, a visual template editor, and a background worker that watches Google Drive folders for new images to process automatically.

## 🚀 Features

### 1. **Visual Template Editor**
   - **Fabric.js Integration**: Create and edit templates visually.
   - **Custom Dimensions**: Support for Portrait, Landscape, Square, and Custom resolutions.
   - **Smart Resizing**: Templates automatically adapt to target image dimensions (Native Resolution processing).

### 2. **Google Drive Integration**
   - **Drive Picker**: Seamlessly select images and folders from your Drive.
   - **Automated Watcher**: A background service that monitors specific Drive folders.
   - **Smart Token Refresh**: Automatically keeps your Google Session alive 24/7 by refreshing tokens in the background and persisting them to the database.

### 3. **Image Processing Engine**
   - **High-Fidelity Output**: Uses **Sharp** for processing.
   - **Quality Control**: Processes images at their **Native Resolution** and exports as High-Quality JPEG (0.95) to balance visual perfection with file size limits (<10MB).
   - **Concurrency Locking**: prevents the background watcher from "double-processing" a user's files if a batch takes too long.

### 4. **Workflow Automation**
   - **Webhook Support**: Triggers external **N8n** workflows upon successful processing.
   - **Error Handling**: Graceful error management with user-friendly Modals (no more browser alerts).
   - **Intermediate Cleanup**: Automatically cleans up temporary files from Drive after successful webhook delivery.

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Google Cloud Console Project (for Drive API & OAuth)

### 1. Clone & Install
```bash
git clone https://github.com/medyass1ne/Lumina.git
cd image_manipulator
npm install
```

### 2. Environment Setup
Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/lumina

# Authentication (NextAuth + Google)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Processing
NEXT_PUBLIC_WEBHOOK_URL=http://localhost:5678/webhook/enhance-images
```

### 3. Run the Application

#### Web Dashboard (Frontend + API)
Runs on `http://localhost:3000`.
```bash
npm run dev
```

#### Background Watcher (Worker)
Runs the Cron job to monitor Drive folders.
**Note**: Restart this service if you change watcher logic.
```bash
npm run watch
```

## 📖 Usage Guide

1.  **Login**: Sign in with your Google Account.
2.  **Create Project**: Create a new workspace.
3.  **Design Template**: Go to "Templates" and create/upload an overlay design.
4.  **Process Manually**:
    - Click "Select Files" to pick from Drive.
    - Click "Enhance" to apply the template immediately.
5.  **Automate**:
    - Open "Listener Settings" (Ear Icon).
    - Select a Folder ID to watch.
    - Choose a Template to apply.
    - Enable the Watcher.
    - The `npm run watch` service will now pick up new files in that folder every minute!

## 🔧 Technical Stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS, Framer Motion.
- **Backend**: Next.js API Routes, MongoDB (Mongoose).
- **Image Processing**: Sharp (Node.js), Fabric.js (Canvas).
- **Auth**: NextAuth.js (Google Provider).
