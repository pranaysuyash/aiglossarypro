# Performance Optimizations

## HTTP/2 & Compression Setup

This document outlines the performance optimizations implemented in the AI Glossary Pro backend.

### HTTP/2 Support

HTTP/2 is automatically enabled in production when SSL certificates are available:

**Environment Variables Required:**
```bash
SSL_KEY_PATH=/path/to/private.key
SSL_CERT_PATH=/path/to/certificate.crt
```

**Benefits:**
- Multiplexing: Multiple requests over a single connection
- Header compression: Reduced overhead
- Server push capabilities (future enhancement)
- Binary protocol: More efficient than HTTP/1.1 text protocol

**Fallback Behavior:**
- Development: Uses HTTP/1.1 for better debugging
- Production without SSL: Falls back to HTTP/1.1 with warning

### Compression

**Brotli Compression (Preferred):**
- 20-30% better compression than gzip
- Supported by all modern browsers
- Quality level 6 (balanced speed/compression)
- Automatic size hints for optimal compression

**Gzip Compression (Fallback):**
- Universal browser support
- Used when Brotli is not supported
- Standard compression level

**Compression Thresholds:**
- Minimum size: 1KB (1024 bytes)
- JSON responses and text content
- Automatic compression ratio monitoring

### Cache Optimization

**Headers Set:**
- `Vary: Accept-Encoding` - Proper cache differentiation
- `X-Compression-Enabled: gzip, br` - Client capability awareness
- `Cache-Control: public, max-age=300` - 5-minute API cache default
- `X-Compression-Method` - Debugging information
- `X-Compression-Ratio` - Performance monitoring

### Monitoring

Response size and compression metrics are automatically tracked:
- Original response size
- Compressed size
- Compression ratio percentage
- Large response warnings (>50KB)

### SSL Certificate Setup for HTTP/2

**Development (Local):**
```bash
# Generate self-signed certificate for testing
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes

# Set environment variables
export SSL_KEY_PATH=./key.pem
export SSL_CERT_PATH=./cert.pem
```

**Production:**
Use certificates from your certificate authority (Let's Encrypt, etc.):
```bash
export SSL_KEY_PATH=/etc/ssl/private/domain.key
export SSL_CERT_PATH=/etc/ssl/certs/domain.crt
```

### Performance Impact

Expected improvements:
- **Brotli**: 20-30% smaller payloads vs gzip
- **HTTP/2**: 10-30% faster page loads (multiple resources)
- **Combined**: 40-60% reduction in bandwidth usage

### Browser Support

- **HTTP/2**: 97%+ global browser support
- **Brotli**: 95%+ global browser support
- **Gzip**: 100% browser support (fallback)

### Future Enhancements

- Server Push for critical resources
- QUIC/HTTP3 support when stable
- Dynamic compression quality based on client connection
- Streaming compression for large responses