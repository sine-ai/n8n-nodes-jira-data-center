# n8n Docker Compose Management

## Quick Commands

### Start n8n
```bash
cd /path/to/your/n8n-nodes-jira-data-center
docker-compose up -d
```

### Stop n8n
```bash
docker-compose down
```

### Restart n8n
```bash
docker-compose restart
```

### View logs
```bash
docker-compose logs -f n8n
```

### Update n8n to latest version
```bash
docker-compose pull
docker-compose up -d
```

## Installed Community Packages
- ✅ n8n-nodes-jira-data-center v1.0.0 (with project dropdowns)
- ✅ n8n-nodes-bitbucket-data-center v1.4.0

## Access
- **Web Interface:** http://localhost
- **Container Name:** n8n  
- **Port:** 80 → 5678

## Data Persistence
All n8n data is stored in the `n8n_data` Docker volume and will persist across container restarts.

## Configuration Notes
- **Telemetry disabled** (`N8N_DIAGNOSTICS_ENABLED=false`) to prevent connection errors
- **UI login disabled** for easier development access
- **TLS verification disabled** for local HTTPS testing
- **Both community packages loaded**: Jira Data Center + Bitbucket Data Center

## Setup Instructions

1. **Copy this template:**
   ```bash
   cp n8n-management.template.md n8n-management.md
   ```

2. **Update paths in your local copy** to match your system

3. **The local copy is gitignored** to keep personal paths private
