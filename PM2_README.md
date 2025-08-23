# PM2 Ecosystem Configuration

This project includes PM2 ecosystem configuration files for process management and deployment.

## Files Created

- `ecosystem.config.js` - Root level configuration for managing both frontend and backend
- `backend/ecosystem.config.js` - Backend-specific configuration
- `frontend/ecosystem.config.js` - Frontend-specific configuration

## Usage

### Prerequisites

Install PM2 globally:
```bash
npm install -g pm2
```

### Running the Full Application

From the root directory:
```bash
# Start both frontend and backend
pm2 start ecosystem.config.js

# Start with production environment
pm2 start ecosystem.config.js --env production

# Monitor processes
pm2 monit

# View logs
pm2 logs

# Stop all processes
pm2 stop ecosystem.config.js

# Restart all processes
pm2 restart ecosystem.config.js

# Delete all processes
pm2 delete ecosystem.config.js
```

### Running Individual Services

#### Backend Only
```bash
cd backend
pm2 start ecosystem.config.js
```

#### Frontend Only
```bash
cd frontend

# Start development server
pm2 start ecosystem.config.js --only edusystem-frontend-dev

# Build the application
pm2 start ecosystem.config.js --only edusystem-frontend-build

# Start preview server (after build)
pm2 start ecosystem.config.js --only edusystem-frontend-preview
```

### Useful PM2 Commands

```bash
# List all processes
pm2 list

# View detailed process information
pm2 show <process-name>

# Reload processes (0-downtime reload)
pm2 reload ecosystem.config.js

# Save current process list
pm2 save

# Resurrect saved processes
pm2 resurrect

# View real-time logs
pm2 logs --lines 200

# View logs for specific process
pm2 logs <process-name>
```

## Configuration Details

### Backend Configuration
- **Name**: edusystem-backend
- **Port**: 5000 (development and production)
- **Logs**: Stored in `backend/logs/` directory
- **Memory Limit**: 1GB
- **Auto-restart**: Enabled with exponential backoff

### Frontend Configuration
- **Development**: Runs Vite dev server on port 3000
- **Preview**: Runs Vite preview server on port 4173
- **Build**: One-time build process (auto-restart disabled)

### Environment Variables
- Development: `NODE_ENV=development`
- Production: `NODE_ENV=production`

## Deployment

The root ecosystem.config.js includes a deployment configuration template. Update the deployment settings with your actual server details:

```javascript
deploy: {
  production: {
    user: 'your-username',
    host: 'your-server.com',
    ref: 'origin/main',
    repo: 'your-git-repo-url',
    path: '/path/to/deployment',
    // ... other settings
  }
}
```

Then deploy with:
```bash
pm2 deploy production setup    # First time setup
pm2 deploy production          # Deploy updates
```
