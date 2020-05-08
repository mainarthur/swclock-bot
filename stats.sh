#/bin/bash

echo "files: $(find index.js helpers/ -type f | wc -l)"
echo "lines: $(find index.js helpers/ -type f -exec cat {} + | wc -l)"
