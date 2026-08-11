# 本地静态服务器（完整 Range 支持，供视频 seek 使用）
# 用法：python serve8000.py [端口]  （默认 8000）
# 工作目录即网站根目录，请先 cd 到 hunluanzhizhu.github.io 再运行。
import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

CHUNK = 65536


class RangeHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def _serve(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            path = os.path.join(path, "index.html")
        if not os.path.isfile(path):
            self.send_error(404)
            return
        size = os.path.getsize(path)
        start, end = 0, size - 1
        range_hdr = self.headers.get("Range")
        if range_hdr and range_hdr.startswith("bytes="):
            s, _, e = range_hdr[6:].partition("-")
            try:
                start = int(s) if s else 0
                end = int(e) if e else size - 1
                end = min(end, size - 1)
            except ValueError:
                start, end = 0, size - 1
            if start > end or start >= size:
                self.send_error(416)
                return
            self.send_response(206)
            self.send_header("Content-Range", "bytes %d-%d/%d" % (start, end, size))
        else:
            self.send_response(200)
        self.send_header("Content-type", self.guess_type(path))
        self.send_header("Content-Length", str(end - start + 1))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Last-Modified", self.date_time_string(os.path.getmtime(path)))
        self.end_headers()
        if self.command == "HEAD":
            return
        with open(path, "rb") as f:
            f.seek(start)
            remaining = end - start + 1
            while remaining > 0:
                chunk = f.read(min(CHUNK, remaining))
                if not chunk:
                    break
                self.wfile.write(chunk)
                remaining -= len(chunk)

    do_GET = _serve
    do_HEAD = _serve


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
print("serving cwd on http://127.0.0.1:%d (Range enabled)" % port)
HTTPServer(("127.0.0.1", port), RangeHandler).serve_forever()
