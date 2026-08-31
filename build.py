#!/usr/bin/env python3
"""Inline the site into dist/artifact.html for publishing as a Claude Artifact.

Artifacts are served under a CSP that admits scripts and stylesheets only from a
short allowlist, and images from nowhere but the page itself — so the plate has
to travel as a data URI. The publish wrapper supplies the document skeleton, so
the output carries no doctype/html/head/body tags.
"""

import base64
import pathlib
import re

ROOT = pathlib.Path(__file__).parent
DIST = ROOT / "dist"

html = (ROOT / "index.html").read_text()
css = (ROOT / "styles.css").read_text()
plate = base64.b64encode((ROOT / "assets/globular-cluster.jpg").read_bytes()).decode()

css = css.replace(
    'url("assets/globular-cluster.jpg")',
    f'url("data:image/jpeg;base64,{plate}")',
)

body = re.search(r"<body>(.*)</body>", html, re.S).group(1)
title = re.search(r"<title>(.*?)</title>", html, re.S).group(1)
fonts = re.search(r'<link rel="stylesheet" href="https://fonts\.googleapis[^>]*>', html).group(0)

DIST.mkdir(exist_ok=True)
(DIST / "artifact.html").write_text(
    f"<title>{title}</title>\n{fonts}\n<style>\n{css}\n</style>\n{body}"
)

size = (DIST / "artifact.html").stat().st_size
print(f"dist/artifact.html — {size / 1024:.0f} KB")
