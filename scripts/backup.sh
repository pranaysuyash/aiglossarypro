#!/bin/bash

# AI/ML Glossary Pro - Database Backup Script
# This script creates automated backups of the PostgreSQL database

set -e

# Configuration
BACKUP_DIR="/backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="aiglossary_backup_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# Database connection details
DB_HOST="${POSTGRES_HOST:-postgres}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-aiglossary_prod}"
DB_USER="${POSTGRES_USER:-aiglossary}"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

log "Starting database backup..."

# Create database backup
export PGPASSWORD="${POSTGRES_PASSWORD}"

pg_dump -h ${DB_HOST} \
        -p ${DB_PORT} \
        -U ${DB_USER} \
        -d ${DB_NAME} \
        --verbose \
        --no-owner \
        --no-privileges \
        --create \
        --format=plain \
        --file=${BACKUP_DIR}/${BACKUP_FILE}

if [ $? -eq 0 ]; then
    log "Database backup created successfully: ${BACKUP_FILE}"
    
    # Compress the backup file
    gzip ${BACKUP_DIR}/${BACKUP_FILE}
    log "Backup compressed: ${COMPRESSED_FILE}"
    
    # Calculate backup size
    BACKUP_SIZE=$(du -h ${BACKUP_DIR}/${COMPRESSED_FILE} | cut -f1)
    log "Backup size: ${BACKUP_SIZE}"
    
    # Remove old backups
    find ${BACKUP_DIR} -name "aiglossary_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
    log "Old backups (older than ${RETENTION_DAYS} days) removed"
    
    # Upload to S3 if configured
    if [ ! -z "${AWS_S3_BACKUP_BUCKET}" ]; then
        log "Uploading backup to S3..."
        aws s3 cp ${BACKUP_DIR}/${COMPRESSED_FILE} s3://${AWS_S3_BACKUP_BUCKET}/database-backups/${COMPRESSED_FILE}
        if [ $? -eq 0 ]; then
            log "Backup uploaded to S3 successfully"
        else
            log "ERROR: Failed to upload backup to S3"
        fi
    fi
    
    log "Backup process completed successfully"
else
    log "ERROR: Database backup failed"
    exit 1
fi

# Health check - send status to monitoring endpoint if configured
if [ ! -z "${BACKUP_WEBHOOK_URL}" ]; then
    curl -X POST "${BACKUP_WEBHOOK_URL}" \
         -H "Content-Type: application/json" \
         -d "{\"status\":\"success\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"backup_file\":\"${COMPRESSED_FILE}\",\"backup_size\":\"${BACKUP_SIZE}\"}"
fi