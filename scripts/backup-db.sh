#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="$(dirname "$0")/../backups"
BACKUP_FILE="$BACKUP_DIR/restaurante_pos_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

echo "Creando backup en $BACKUP_FILE ..."
docker exec restaurante-postgres pg_dump -U restaurante restaurante_pos > "$BACKUP_FILE"

echo "Backup completado: $BACKUP_FILE"
