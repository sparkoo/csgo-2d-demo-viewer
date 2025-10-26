# Static Assets Configuration

This document describes how to configure the application to load static assets from external storage (CDN) instead of bundling them in the Docker image.

## Overview

The application includes approximately 9MB of static assets:
- **Videos** (~7MB): 12 MP4 files in `homeheader_video/` used for the homepage background
- **Map Overviews** (~1.8MB): 14 PNG files in `overviews/` used for 2D map visualization

By default, these assets are bundled into the Docker image and served by the application. For production deployments (especially on Cloud Run), serving these assets from a CDN can:
- Reduce Docker image size
- Reduce Cloud Run egress costs
- Improve load times through CDN edge caching
- Reduce memory and CPU usage on the application server

## Configuration

### Environment Variables

Set the `VITE_ASSETS_BASE_URL` environment variable to the base URL of your CDN or storage bucket.

**Example:**
```bash
export VITE_ASSETS_BASE_URL="https://storage.googleapis.com/my-bucket"
```

### Building with External Assets

When building the Docker image, pass the CDN URL as a build argument:

```bash
docker build \
  --build-arg VITE_ASSETS_BASE_URL="https://storage.googleapis.com/my-bucket" \
  -t csgo-2d-demo-viewer .
```

This will:
1. Configure the frontend to load assets from the CDN
2. Remove the large asset directories from the final Docker image

### Uploading Assets to Cloud Storage

#### Quick Start with Helper Script (GCP only)

For Google Cloud Storage, use the provided helper script:

```bash
./hack/upload-assets-to-gcs.sh YOUR-BUCKET-NAME
```

This script will:
1. Create the bucket if it doesn't exist
2. Make it publicly readable
3. Upload all assets
4. Set appropriate cache headers
5. Display the CDN URL to use for building

#### Manual Upload to Google Cloud Storage (GCP)

1. Create a storage bucket:
```bash
gsutil mb gs://csgo-demo-viewer-assets
```

2. Make the bucket publicly readable:
```bash
gsutil iam ch allUsers:objectViewer gs://csgo-demo-viewer-assets
```

3. Upload the assets:
```bash
# From the repository root
gsutil -m cp -r web/public/homeheader_video gs://csgo-demo-viewer-assets/
gsutil -m cp -r web/public/overviews gs://csgo-demo-viewer-assets/
```

4. Set cache control headers for better performance:
```bash
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" \
  gs://csgo-demo-viewer-assets/homeheader_video/*
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" \
  gs://csgo-demo-viewer-assets/overviews/*
```

5. Use the bucket URL when building:
```bash
export VITE_ASSETS_BASE_URL="https://storage.googleapis.com/csgo-demo-viewer-assets"
```

#### AWS S3

1. Create an S3 bucket and configure it for public access
2. Upload the assets from `web/public/homeheader_video/` and `web/public/overviews/`
3. Use the bucket URL: `https://your-bucket.s3.amazonaws.com`

#### Azure Blob Storage

1. Create a storage account and container
2. Upload the assets
3. Use the blob storage URL: `https://youraccounst.blob.core.windows.net/container-name`

## Development

For local development, assets are served from the local `web/public/` directory by default. You don't need to set any environment variables unless you want to test CDN integration.

## Backward Compatibility

If `VITE_ASSETS_BASE_URL` is not set:
- The application will load assets from the local server (default behavior)
- All assets remain bundled in the Docker image
- No changes to existing deployments

## Asset Structure

When uploading to external storage, maintain the same directory structure:

```
your-cdn-url/
├── homeheader_video/
│   ├── highlights_01.mp4
│   ├── highlights_02.mp4
│   └── ... (12 videos total)
└── overviews/
    ├── de_ancient.png
    ├── de_dust2.png
    └── ... (14 map overviews total)
```

## Testing

After deploying with external assets:

1. Open the homepage and verify videos load correctly
2. Load a demo and verify map overviews display properly
3. Check browser console for any 404 errors
4. Verify the Docker image size is reduced (~9MB smaller)

## Cost Optimization

For Google Cloud Platform:
- Use a regional bucket for lower costs if users are in a specific region
- Use Cloud CDN in front of Cloud Storage for better performance
- Consider lifecycle policies to manage old or unused assets
- Monitor egress costs to ensure savings vs bundled approach
