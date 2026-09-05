#!/usr/bin/env python3
"""
Print the CHANGELOG.md section for one version, for use as release notes.

    python3 tools/release_notes.py 30

Exits non-zero if that version has no section, so a release workflow fails
loudly rather than publishing an empty body.
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def section_for(changelog, version):
    """Return the body of the '## v<version>' section, without its heading."""
    lines = changelog.split("\n")
    start = None
    for i, line in enumerate(lines):
        if re.match(r"^## v%s\s*$" % re.escape(str(version)), line):
            start = i + 1
            break
    if start is None:
        return None
    end = len(lines)
    for j in range(start, len(lines)):
        if re.match(r"^## v\d+\s*$", lines[j]):
            end = j
            break
    return "\n".join(lines[start:end]).strip()


def main(argv):
    if len(argv) != 2:
        sys.stderr.write("usage: release_notes.py <version>\n")
        return 2
    version = argv[1]
    with io.open(os.path.join(ROOT, "CHANGELOG.md"), encoding="utf-8") as fh:
        body = section_for(fh.read(), version)
    if not body:
        sys.stderr.write("no CHANGELOG.md section found for v%s\n" % version)
        return 1
    sys.stdout.write(body + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
