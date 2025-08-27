# WASM build stage
FROM golang:1.24 AS builder_go

USER root
WORKDIR /csgo-2d-demo-player

COPY go.mod .
COPY go.sum .
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=js GOARCH=wasm GO111MODULE=on go build \
  -a -o _output/csdemoparser.wasm \
  -gcflags all=-trimpath=/ \
  -asmflags all=-trimpath=/ \
  cmd/wasm/wasm.go

# Frontend build stage
FROM node:lts-alpine AS builder_npm

USER root

WORKDIR /csgo-2d-demo-player/web

COPY web/package.json .
COPY web/package-lock.json .
RUN npm install

COPY web/index.html .
COPY web/vite.config.js .
COPY web/public public
COPY --from=builder_go /usr/local/go/lib/wasm/wasm_exec.js public/wasm/wasm_exec.js
COPY web/src src
RUN npm run build

# Nginx stage
FROM nginx:alpine

# Copy built frontend assets
COPY --from=builder_npm /csgo-2d-demo-player/web/dist/ /usr/share/nginx/html/

# Copy WASM files to correct locations
COPY --from=builder_go /csgo-2d-demo-player/_output/csdemoparser.wasm /usr/share/nginx/html/wasm/
COPY --from=builder_go /usr/local/go/lib/wasm/wasm_exec.js /usr/share/nginx/html/wasm/

# Create custom nginx configuration
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 8080;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript application/wasm;

    # Set correct MIME type for WASM files
    location ~* \.wasm$ {
        add_header Content-Type application/wasm;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Handle SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Expose port 8080
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
