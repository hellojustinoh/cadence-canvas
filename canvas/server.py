#!/usr/bin/env python3
"""
Cadence Design Canvas server.

Serves the whole project root on one port so the canvas and all six
aesthetic versions share an origin:
  /                      -> canvas UI
  /cadence/...           -> v1, /cadence-lab/... -> v2, etc.

Feedback API (backed by canvas/feedback.json, which the agent reads
and replies to):
  GET  /api/feedback            -> all feedback items
  POST /api/feedback            -> {frame, text} create
  POST /api/feedback/update     -> {id, status?, reply?, text?}
  POST /api/feedback/delete     -> {id}
"""
import json
import os
import sys
import time
import uuid
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FEEDBACK = os.path.join(ROOT, "canvas", "feedback.json")


def load():
    try:
        with open(FEEDBACK) as f:
            return json.load(f)
    except Exception:
        return []


def save(items):
    with open(FEEDBACK, "w") as f:
        json.dump(items, f, indent=2)
        f.write("\n")


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _json(self, obj, code=200):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.split("?")[0] == "/":
            self.send_response(302)
            self.send_header("Location", "/canvas/")
            self.end_headers()
            return
        if self.path.startswith("/api/feedback"):
            return self._json(load())
        return super().do_GET()

    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0))
        try:
            data = json.loads(self.rfile.read(n) or b"{}")
        except Exception:
            return self._json({"error": "bad json"}, 400)
        items = load()

        if self.path == "/api/feedback":
            item = {
                "id": uuid.uuid4().hex[:8],
                "frame": str(data.get("frame", "")),
                "text": str(data.get("text", "")).strip(),
                "status": "open",
                "reply": "",
                "at": int(time.time() * 1000),
            }
            if not item["text"]:
                return self._json({"error": "empty"}, 400)
            items.append(item)
            save(items)
            return self._json(item)

        if self.path == "/api/feedback/update":
            for it in items:
                if it["id"] == data.get("id"):
                    for k in ("status", "reply", "text"):
                        if k in data:
                            it[k] = data[k]
            save(items)
            return self._json({"ok": True})

        if self.path == "/api/feedback/delete":
            items = [it for it in items if it["id"] != data.get("id")]
            save(items)
            return self._json({"ok": True})

        return self._json({"error": "not found"}, 404)

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4190
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
