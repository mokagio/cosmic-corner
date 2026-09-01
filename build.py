#!/usr/bin/env python3
"""Inline one page of the site into dist/ for publishing as a Claude Artifact.

    ./build.py issues/the-big-bang-was-it-real.html

Artifacts are served under a CSP that admits stylesheets only from a short
allowlist and images from nowhere but the page itself, so the stylesheet and
every image have to travel inside the file. The publish wrapper supplies the
document skeleton, hence no doctype/html/head/body tags in the output.

Cross-page links do not resolve inside an artifact; only a single article page
is worth publishing this way.
"""

import base64
import mimetypes
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).parent
DIST = ROOT / "dist"

page = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "index.html")
html = (ROOT / page).read_text()

css_href = re.search(r'<link rel="stylesheet" href="((?!https)[^"]+)"', html).group(1)
css_path = (ROOT / page).parent.joinpath(css_href).resolve()
css = css_path.read_text()


def data_uri(path):
    kind = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return f"data:{kind};base64," + base64.b64encode(path.read_bytes()).decode()


# url(...) in the stylesheet resolves against the stylesheet; src=... against the page.
css = re.sub(
    r'url\("([^"]+)"\)',
    lambda m: f'url("{data_uri((css_path.parent / m.group(1)).resolve())}")',
    css,
)
body = re.search(r"<body>(.*)</body>", html, re.S).group(1)
# The picker's script has to travel inside the file too.
body = re.sub(
    r'<script src="([^"]+)"></script>',
    lambda m: "<script>\n" + ((ROOT / page).parent / m.group(1)).resolve().read_text() + "\n</script>",
    body,
)

body = re.sub(
    r'src="((?!data:|https?:)[^"]+)"',
    lambda m: f'src="{data_uri(((ROOT / page).parent / m.group(1)).resolve())}"',
    body,
)

title = re.search(r"<title>(.*?)</title>", html, re.S).group(1)
fonts = re.search(r'<link rel="stylesheet" href="https://fonts\.googleapis[^>]*>', html).group(0)

DIST.mkdir(exist_ok=True)
out = DIST / (page.stem + ".html")
out.write_text(f"<title>{title}</title>\n{fonts}\n<style>\n{css}\n</style>\n{body}")
print(f"{out.relative_to(ROOT)} — {out.stat().st_size / 1024:.0f} KB")
