#!/bin/sh
set -eu

ACTOR_NAME="facebook-marketplace-seller-manager"
REPO_ROOT="${ACTOR_REPO_ROOT:-/app}"
RUNS_ROOT="${ACTOR_RUNS_ROOT:-/data/actor-runs}"
TASK_ID="${CRAWLAB_TASK_ID:-manual-$(date +%Y%m%d%H%M%S)}"
RUN_DIR="$RUNS_ROOT/$ACTOR_NAME/$TASK_ID"
STORAGE_DIR="$RUN_DIR/storage"
KVS_DIR="$STORAGE_DIR/key_value_stores/default"
DATASET_DIR="$STORAGE_DIR/datasets/default"
INPUT_B64="${1:-}"

mkdir -p "$KVS_DIR" "$DATASET_DIR"

if [ -n "$INPUT_B64" ]; then
    printf '%s' "$INPUT_B64" | base64 -d > "$KVS_DIR/INPUT.json"
else
    printf '%s\n' '{}' > "$KVS_DIR/INPUT.json"
fi

export APIFY_LOCAL_STORAGE_DIR="$STORAGE_DIR"
export CRAWLEE_STORAGE_DIR="$STORAGE_DIR"
export APIFY_INPUT_KEY="INPUT"

cd "$REPO_ROOT"

if [ ! -d node_modules ]; then
    npm ci --omit=dev
fi

node src/main.js

if [ -f "$KVS_DIR/OUTPUT.json" ]; then
    cp "$KVS_DIR/OUTPUT.json" "$RUN_DIR/OUTPUT.json"
fi

if ls "$DATASET_DIR"/*.json >/dev/null 2>&1; then
    for item in "$DATASET_DIR"/*.json; do
        cat "$item"
        printf '\n'
    done > "$RUN_DIR/items.jsonl"
else
    : > "$RUN_DIR/items.jsonl"
fi

printf 'Actor run stored in %s\n' "$RUN_DIR"
