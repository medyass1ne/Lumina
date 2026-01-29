# Dockerizing Lumina on Windows

This guide explains how to containerize the application using Docker Desktop for Windows. We will create a setup that runs:
1.  **Web App** (Next.js)
2.  **Watcher Service** (Background Worker)
3.  **MongoDB** (Database)

## 1. Create a `Dockerfile`
Create a file named `Dockerfile` (no extension) in the root of your project (`image_manipulator/Dockerfile`).

```dockerfile
# Base image
FROM node:18-alpine

# Install dependencies required for 'sharp' image processing
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy dependency definitions
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the Next.js app
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Default command (can be overridden in docker-compose)
CMD ["npm", "start"]
```

## 2. Create `docker-compose.yml`
Create a file named `docker-compose.yml` in the root. This is the magic file that runs everything together.

```yaml
version: '3.8'

services:
  # 1. The Web Dashboard
  web:
    build: .
    container_name: lumina_web
    restart: always
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/lumina
      - NEXTAUTH_URL=http://localhost:3000
      # Pass your other secrets here or use an env_file
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
    depends_on:
      - mongo
    env_file:
      - .env.local

  # 2. The Background Watcher
  watcher:
    build: .
    container_name: lumina_watcher
    restart: always
    # Override the default command to run the watcher script instead
    command: ["npm", "run", "watch"]
    environment:
      - MONGODB_URI=mongodb://mongo:27017/lumina
      # Needs same secrets as web
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
    depends_on:
      - mongo
    env_file:
      - .env.local

  # 3. MongoDB Database
  mongo:
    image: mongo:latest
    container_name: lumina_db
    restart: always
    ports:
      - "27017:27017" # Expose if you want to connect via Compass on host
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## 3. Usage on Windows

### Prerequisites
- Install **Docker Desktop for Windows**.
- Ensure standard `.env.local` exists with your keys.

### Steps
1.  **Open Terminal** (PowerShell or Command Prompt) in your project folder.
2.  **Build and Run**:
    ```powershell
    docker-compose up --build -d
    ```
    - `--build`: Recompiles the images (do this if you changed code).
    - `-d`: Detached mode (runs in background).

3.  **Check Status**:
    ```powershell
    docker ps
    ```
    You should see 3 containers running.

4.  **View Logs**:
    - Web App: `docker logs -f lumina_web`
    - Watcher: `docker logs -f lumina_watcher` (Great for checking if templates are loading!)

5.  **Stop**:
    ```powershell
    docker-compose down
    ```

## ⚠️ Important Notes for Windows
- **Localhost**: When running in Docker, `localhost` inside the container refers to the container itself.
    - The `web` and `watcher` connect to mongo using the hostname `mongo` (defined in services), NOT `localhost`. The `docker-compose.yml` above handles this by setting `MONGODB_URI=mongodb://mongo:27017/lumina`.
- **OAuth Callbacks**: Your Google Console "Authorized redirect URIs" must match `NEXTAUTH_URL`. If you access via `http://localhost:3000`, your Google config is fine.
