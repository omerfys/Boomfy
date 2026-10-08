import http.server
import socketserver
import urllib.request
import urllib.parse
import json
import os
import sys
import mimetypes
import gzip
import re
import socket
import webbrowser
import threading
import time

sys.stdout.reconfigure(line_buffering=True)

DEFAULT_PORT = 3001
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Ensure common MIME types are registered properly
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("image/png", ".png")
mimetypes.add_type("image/jpeg", ".jpg")
mimetypes.add_type("image/jpeg", ".jpeg")
mimetypes.add_type("font/ttf", ".ttf")
mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("font/woff", ".woff")
mimetypes.add_type("video/mp4", ".mp4")
mimetypes.add_type("audio/flac", ".flac")
mimetypes.add_type("application/json", ".json")
mimetypes.add_type("application/gzip", ".gz")
mimetypes.add_type("application/octet-stream", ".bin")

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

INJECT_TAGS = '<head><meta name="referrer" content="unsafe-url"><meta name="daw-status" content="200"><script>try{if(location.pathname.startsWith("/p/")){history.replaceState(null,"","/");}}catch(e){}</script><script src="/__daw/inpage.js"></script>'

EMPTY_PNG_1X1 = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82'
EMPTY_SVG_1X1 = b'<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>'

CURRENT_PROXIED_PROTO = "https"
CURRENT_PROXIED_HOST = ""

UNLOCKED_ACCOUNT = {
    "signedIn": True,
    "guest": False,
    "user": "Player",
    "xp": 130000,
    "token": "local-token-unlocked",
    "look": None,
    "skins": ["stickman", "skeleton", "pumpkin", "will", "vampire", "crown"],
    "packs": [
        {
            "id": "halloween",
            "name": "Halloween Skin Pack",
            "blurb": "Four characters to play as, online too.",
            "price": 499,
            "currency": "usd",
            "owned": True,
            "skins": ["skeleton", "pumpkin", "will", "vampire"],
            "ranks": [2, 3, 4, 5]
        }
    ],
    "daily": {
        "ends": 9999999999999,
        "challenges": []
    }
}

def is_client_disconnect(e):
    """Detect if an exception was caused by client closing/aborting the socket."""
    if isinstance(e, (ConnectionResetError, ConnectionAbortedError, BrokenPipeError)):
        return True
    if isinstance(e, OSError):
        # 10053: WSAECONNABORTED, 10054: WSAECONNRESET, 32: EPIPE, 104: ECONNRESET
        if getattr(e, 'winerror', None) in (10053, 10054):
            return True
        if getattr(e, 'errno', None) in (10053, 10054, 32, 104):
            return True
    return False

def to_proxy_url(url_val, base_url):
    url_val = url_val.strip()
    if not url_val or url_val.startswith('data:') or url_val.startswith('blob:') or url_val.startswith('javascript:') or url_val.startswith('#') or url_val.startswith('/__daw/'):
        return url_val
    if url_val.startswith('/p/http'):
        return url_val
    
    full_url = urllib.parse.urljoin(base_url, url_val)
    parsed = urllib.parse.urlparse(full_url)
    if parsed.scheme not in ('http', 'https'):
        return url_val
        
    return f"/p/{parsed.scheme}/{parsed.netloc}{parsed.path}" + (f"?{parsed.query}" if parsed.query else "")

def rewrite_html(html_str, base_url):
    html_str = re.sub(r'<meta[^>]+http-equiv=["\']?(Content-Security-Policy|X-Frame-Options)["\']?[^>]*>', '', html_str, flags=re.IGNORECASE)
    if '<head>' in html_str:
        html_str = html_str.replace('<head>', INJECT_TAGS, 1)
    elif '<HEAD>' in html_str:
        html_str = html_str.replace('<HEAD>', INJECT_TAGS, 1)
    elif '<html' in html_str:
        pos = html_str.find('>')
        if pos != -1:
            html_str = html_str[:pos+1] + INJECT_TAGS + html_str[pos+1:]
    else:
        html_str = INJECT_TAGS + html_str

    def replace_src(match):
        attr = match.group(1)
        quote = match.group(2)
        val = match.group(3)
        return f'{attr}={quote}{to_proxy_url(val, base_url)}{quote}'

    html_str = re.sub(r'\b(src|href|action)\s*=\s*(["\'])([^"\']+?)\2', replace_src, html_str, flags=re.IGNORECASE)

    def replace_css_url(match):
        val = match.group(1).strip('\'"')
        return f'url("{to_proxy_url(val, base_url)}")'

    html_str = re.sub(r'url\(\s*([^)]+?)\s*\)', replace_css_url, html_str, flags=re.IGNORECASE)

    return html_str

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        # Clean logging without clutter
        pass

    def handle_one_request(self):
        try:
            super().handle_one_request()
        except Exception as e:
            if is_client_disconnect(e):
                self.close_connection = True
                return
            raise

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Access-Control-Expose-Headers', '*')
        self.send_header('Cross-Origin-Resource-Policy', 'cross-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'unsafe-none')
        self.send_header('Cross-Origin-Opener-Policy', 'unsafe-none')
        super().end_headers()

    def do_OPTIONS(self):
        try:
            self.send_response(200)
            self.end_headers()
        except Exception as e:
            if is_client_disconnect(e):
                return
            raise

    def do_POST(self):
        try:
            self._handle_post()
        except Exception as e:
            if is_client_disconnect(e):
                return
            raise

    def _handle_post(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # Handle account look & destroy APIs
        if path.startswith('/api/destroy/'):
            content_len = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_len) if content_len > 0 else b'{}'
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            try:
                data = json.loads(body.decode('utf-8'))
                if 'look' in data:
                    UNLOCKED_ACCOUNT['look'] = data['look']
            except:
                pass
            self.wfile.write(json.dumps(UNLOCKED_ACCOUNT).encode('utf-8'))
            return

        if path in ['/api/id', '/api/event', '/api/mp', '/mp/new', '/mp/quick']:
            content_len = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_len) if content_len > 0 else b'{}'
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            try:
                data = json.loads(body.decode('utf-8'))
                ret_id = data.get('id', '1234567890abcdef')
            except:
                ret_id = '1234567890abcdef'
            self.wfile.write(json.dumps({'id': ret_id, 'ok': True}).encode('utf-8'))
            return

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(b'{"ok": true}')

    def do_GET(self):
        try:
            self._handle_get()
        except Exception as e:
            if is_client_disconnect(e):
                return
            raise

    def _handle_get(self):
        global CURRENT_PROXIED_HOST, CURRENT_PROXIED_PROTO
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # Handle /api/destroy/me, etc.
        if path.startswith('/api/destroy/'):
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(UNLOCKED_ACCOUNT).encode('utf-8'))
            return

        # Handle /p/<protocol>/<host>/<path...>
        if path.startswith('/p/'):
            parts = path[3:].split('/', 2)
            if len(parts) >= 2:
                proto = parts[0]
                host = parts[1]
                rest = parts[2] if len(parts) > 2 else ''
                query = ('?' + parsed.query) if parsed.query else ''
                target_url = f"{proto}://{host}/{rest}{query}"
                CURRENT_PROXIED_PROTO = proto
                CURRENT_PROXIED_HOST = host
            else:
                self.send_response(400)
                self.end_headers()
                return

            try:
                req = urllib.request.Request(
                    target_url,
                    headers={
                        'User-Agent': USER_AGENT,
                        'Accept': '*/*',
                        'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8',
                        'Accept-Encoding': 'identity',
                    }
                )
                with urllib.request.urlopen(req, timeout=12) as resp:
                    raw_data = resp.read()
                    if resp.headers.get('Content-Encoding') == 'gzip':
                        try:
                            raw_data = gzip.decompress(raw_data)
                        except Exception:
                            pass

                    content_type = resp.headers.get('Content-Type', 'application/octet-stream')
                    final_url = resp.geturl()

                    if 'text/html' in content_type:
                        try:
                            html_text = raw_data.decode('utf-8', errors='ignore')
                            html_text = rewrite_html(html_text, final_url)
                            raw_data = html_text.encode('utf-8')
                        except Exception:
                            pass

                    self.send_response(200)
                    self.send_header('Content-Type', content_type)
                    self.send_header('Content-Length', str(len(raw_data)))
                    self.send_header('x-final-url', final_url)
                    self.end_headers()
                    self.wfile.write(raw_data)
                    return
            except Exception as e:
                if is_client_disconnect(e):
                    return
                self._serve_fallback_asset(path)
                return

        # Handle /api/page?url=...
        if path == '/api/page':
            qs = urllib.parse.parse_qs(parsed.query)
            target_url = qs.get('url', [''])[0]
            if not target_url:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Missing url parameter'}).encode('utf-8'))
                return

            if not target_url.startswith('http://') and not target_url.startswith('https://'):
                target_url = 'https://' + target_url

            parsed_target = urllib.parse.urlparse(target_url)
            CURRENT_PROXIED_PROTO = parsed_target.scheme or "https"
            CURRENT_PROXIED_HOST = parsed_target.netloc

            try:
                req = urllib.request.Request(
                    target_url,
                    headers={
                        'User-Agent': USER_AGENT,
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8',
                        'Accept-Encoding': 'identity',
                    }
                )
                with urllib.request.urlopen(req, timeout=12) as resp:
                    raw_data = resp.read()
                    if resp.headers.get('Content-Encoding') == 'gzip':
                        try:
                            raw_data = gzip.decompress(raw_data)
                        except Exception:
                            pass
                    
                    final_url = resp.geturl()
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/html; charset=utf-8')
                    self.send_header('Content-Length', str(len(raw_data)))
                    self.send_header('x-final-url', final_url)
                    self.end_headers()
                    self.wfile.write(raw_data)
                    return
            except Exception as e:
                if is_client_disconnect(e):
                    return
                try:
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': f'Failed to fetch site: {str(e)}'}).encode('utf-8'))
                except Exception:
                    pass
                return

        # 1. Handle Root Path (index.html)
        if path == '/' or path == '':
            index_path = os.path.join(DIRECTORY, 'index.html')
            if os.path.exists(index_path):
                with open(index_path, 'rb') as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(content)))
                self.end_headers()
                self.wfile.write(content)
                return

        # 2. Handle Local Files on Disk directly with HTTP Range Support (for video/audio/large assets)
        local_rel_path = path.lstrip('/')
        local_full_path = os.path.join(DIRECTORY, local_rel_path)

        if os.path.exists(local_full_path) and os.path.isfile(local_full_path):
            ctype = mimetypes.guess_type(local_full_path)[0] or 'application/octet-stream'
            if local_full_path.endswith('.gz'):
                if 'json.gz' in local_full_path:
                    ctype = 'application/json'
                elif 'bin.gz' in local_full_path:
                    ctype = 'application/octet-stream'

            file_size = os.path.getsize(local_full_path)
            range_header = self.headers.get('Range')

            try:
                if range_header and range_header.startswith('bytes='):
                    # HTTP 206 Partial Content for streaming media
                    ranges = range_header[6:].split('-')
                    start = int(ranges[0]) if ranges[0] else 0
                    end = int(ranges[1]) if len(ranges) > 1 and ranges[1] else file_size - 1
                    start = max(0, min(start, file_size - 1))
                    end = max(start, min(end, file_size - 1))
                    length = end - start + 1

                    self.send_response(206)
                    self.send_header('Content-Type', ctype)
                    self.send_header('Content-Range', f'bytes {start}-{end}/{file_size}')
                    self.send_header('Content-Length', str(length))
                    self.send_header('Accept-Ranges', 'bytes')
                    self.end_headers()

                    with open(local_full_path, 'rb') as f:
                        f.seek(start)
                        remaining = length
                        while remaining > 0:
                            chunk = f.read(min(remaining, 65536))
                            if not chunk:
                                break
                            self.wfile.write(chunk)
                            remaining -= len(chunk)
                    return
                else:
                    self.send_response(200)
                    self.send_header('Content-Type', ctype)
                    self.send_header('Content-Length', str(file_size))
                    self.send_header('Accept-Ranges', 'bytes')
                    self.end_headers()

                    with open(local_full_path, 'rb') as f:
                        while True:
                            chunk = f.read(65536)
                            if not chunk:
                                break
                            self.wfile.write(chunk)
                    return
            except Exception as e:
                if is_client_disconnect(e):
                    return
                pass

        # 3. If file is not found locally, try to proxy from Referer or last proxied host
        ref = self.headers.get('Referer', '')
        proto = CURRENT_PROXIED_PROTO or "https"
        host = CURRENT_PROXIED_HOST

        if '/p/' in ref:
            try:
                ref_parts = ref.split('/p/', 1)[1].split('/', 2)
                if len(ref_parts) >= 2:
                    proto = ref_parts[0]
                    host = ref_parts[1]
            except Exception:
                pass

        if host:
            target_asset_url = f"{proto}://{host}{path}" + (f"?{parsed.query}" if parsed.query else "")
            try:
                req = urllib.request.Request(
                    target_asset_url,
                    headers={
                        'User-Agent': USER_AGENT,
                        'Accept': '*/*',
                        'Accept-Encoding': 'identity',
                    }
                )
                with urllib.request.urlopen(req, timeout=8) as resp:
                    data = resp.read()
                    content_type = resp.headers.get('Content-Type', 'application/octet-stream')
                    self.send_response(200)
                    self.send_header('Content-Type', content_type)
                    self.send_header('Content-Length', str(len(data)))
                    self.end_headers()
                    self.wfile.write(data)
                    return
            except Exception as e:
                if is_client_disconnect(e):
                    return
                pass

        # 4. If not found locally or remotely, serve fallback asset
        self._serve_fallback_asset(path)

    def _serve_fallback_asset(self, path):
        try:
            path_lower = path.lower()
            if path_lower.endswith('.svg'):
                self.send_response(200)
                self.send_header('Content-Type', 'image/svg+xml')
                self.send_header('Content-Length', str(len(EMPTY_SVG_1X1)))
                self.end_headers()
                self.wfile.write(EMPTY_SVG_1X1)
            elif any(path_lower.endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.avif']):
                self.send_response(200)
                self.send_header('Content-Type', 'image/png')
                self.send_header('Content-Length', str(len(EMPTY_PNG_1X1)))
                self.end_headers()
                self.wfile.write(EMPTY_PNG_1X1)
            elif path_lower.endswith('.js'):
                self.send_response(200)
                self.send_header('Content-Type', 'application/javascript')
                self.send_header('Content-Length', '11')
                self.end_headers()
                self.wfile.write(b'/* empty */')
            elif path_lower.endswith('.css'):
                self.send_response(200)
                self.send_header('Content-Type', 'text/css')
                self.send_header('Content-Length', '11')
                self.end_headers()
                self.wfile.write(b'/* empty */')
            elif any(path_lower.endswith(ext) for ext in ['.woff', '.woff2', '.ttf', '.otf']):
                self.send_response(200)
                self.send_header('Content-Type', 'font/woff2')
                self.send_header('Content-Length', '0')
                self.end_headers()
                self.wfile.write(b'')
            elif path_lower.startswith('/api/'):
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', '11')
                self.end_headers()
                self.wfile.write(b'{"ok":true}')
            else:
                self.send_response(200)
                self.send_header('Content-Type', 'text/plain')
                self.send_header('Content-Length', '0')
                self.end_headers()
                self.wfile.write(b'')
        except Exception as e:
            if is_client_disconnect(e):
                return
            pass

class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

    def handle_error(self, request, client_address):
        """Silently ignore normal client disconnection/abort errors."""
        exc_type, exc_val, exc_tb = sys.exc_info()
        if is_client_disconnect(exc_val) or (exc_type and issubclass(exc_type, (ConnectionResetError, ConnectionAbortedError, BrokenPipeError))):
            return
        super().handle_error(request, client_address)

def open_browser_delayed(port):
    time.sleep(0.6)
    webbrowser.open(f"http://localhost:{port}")

def run():
    port = DEFAULT_PORT
    print(f"Starting Boomfy Local Server on http://localhost:{port}")
    server_address = ('', port)
    
    # Auto-open browser after server starts listening
    threading.Thread(target=open_browser_delayed, args=(port,), daemon=True).start()

    try:
        with ThreadingHTTPServer(server_address, CustomHandler) as httpd:
            print(f"========================================================")
            print(f"  Boomfy is RUNNING at http://localhost:{port}")
            print(f"  Press Ctrl+C to stop the server.")
            print(f"========================================================")
            httpd.serve_forever()
    except OSError as e:
        print(f"\n[INFO] Port {port} is already active or in use.")
        print(f"Access Boomfy at: http://localhost:{port}")
        webbrowser.open(f"http://localhost:{port}")

if __name__ == '__main__':
    run()
