# Build environment
FROM node:18-alpine as builder
WORKDIR /app

# Add build arguments
ARG PUBLIC_URL=https://solidfm.app
ENV PUBLIC_URL=$PUBLIC_URL

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN PUBLIC_URL=$PUBLIC_URL npm run build

# Production environment
FROM nginx:alpine

# Remove default nginx configuration
RUN rm -rf /etc/nginx/conf.d/default.conf /etc/nginx/nginx.conf

# Copy built files and nginx configuration
COPY --from=builder /app/build /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/nginx.conf

# Create required nginx directories with appropriate permissions
RUN mkdir -p /tmp/client_temp /tmp/proxy_temp /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp && \
    chmod -R 777 /tmp && \
    chown -R nginx:nginx /usr/share/nginx/html /tmp /etc/nginx /var/cache/nginx && \
    chmod -R 755 /usr/share/nginx/html && \
    touch /tmp/nginx.pid && \
    chown nginx:nginx /tmp/nginx.pid

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget -q --spider http://localhost:8080/health || exit 1

# Switch to non-root user
USER nginx

# Expose port 8080
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
