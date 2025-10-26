#!/bin/bash
# Script to upload static assets to Google Cloud Storage
#
# Usage:
#   ./upload-assets-to-gcs.sh BUCKET_NAME
#
# Example:
#   ./upload-assets-to-gcs.sh csgo-demo-viewer-assets
#
# Prerequisites:
#   - gcloud CLI installed and configured
#   - gsutil installed
#   - Appropriate permissions to create and manage GCS buckets

set -e

if [ $# -ne 1 ]; then
    echo "Usage: $0 BUCKET_NAME"
    echo "Example: $0 csgo-demo-viewer-assets"
    exit 1
fi

BUCKET_NAME=$1
BUCKET_URL="gs://${BUCKET_NAME}"
PUBLIC_URL="https://storage.googleapis.com/${BUCKET_NAME}"

echo "============================================"
echo "Uploading static assets to Google Cloud Storage"
echo "Bucket: ${BUCKET_NAME}"
echo "============================================"
echo ""

# Check if bucket exists
if gsutil ls "${BUCKET_URL}" > /dev/null 2>&1; then
    echo "✓ Bucket ${BUCKET_NAME} already exists"
else
    echo "Creating bucket ${BUCKET_NAME}..."
    gsutil mb "${BUCKET_URL}"
    echo "✓ Bucket created"
fi

# Make bucket publicly readable
echo "Making bucket publicly readable..."
gsutil iam ch allUsers:objectViewer "${BUCKET_URL}"
echo "✓ Bucket is now public"

# Upload homeheader_video directory
echo ""
echo "Uploading homeheader_video/ directory..."
gsutil -m cp -r web/public/homeheader_video "${BUCKET_URL}/"
echo "✓ Videos uploaded"

# Upload overviews directory
echo ""
echo "Uploading overviews/ directory..."
gsutil -m cp -r web/public/overviews "${BUCKET_URL}/"
echo "✓ Map overviews uploaded"

# Set cache control headers for better performance
echo ""
echo "Setting cache control headers (1 year)..."
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" \
    "${BUCKET_URL}/homeheader_video/*"
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" \
    "${BUCKET_URL}/overviews/*"
echo "✓ Cache headers set"

echo ""
echo "============================================"
echo "Upload complete!"
echo "============================================"
echo ""
echo "Your assets are now available at:"
echo "  ${PUBLIC_URL}/homeheader_video/"
echo "  ${PUBLIC_URL}/overviews/"
echo ""
echo "To build the Docker image with external assets:"
echo "  docker build --build-arg VITE_ASSETS_BASE_URL=${PUBLIC_URL} -t csgo-2d-demo-viewer ."
echo ""
echo "Or export the environment variable for local builds:"
echo "  export VITE_ASSETS_BASE_URL=${PUBLIC_URL}"
echo "  cd web && npm run build"
echo ""
