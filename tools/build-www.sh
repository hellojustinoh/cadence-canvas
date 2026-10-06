#!/usr/bin/env sh
# Builds www/ (Capacitor's webDir) from the public collage app plus the native speech bridge.
set -e
cd "$(dirname "$0")/.."
rm -rf www && mkdir www
cp cadence-collage/index.html cadence-collage/app.js cadence-collage/styles.css www/
cp ios-shell/native-speech.js www/
# the bridge must define webkitSpeechRecognition before app.js reads it
sed -i.bak 's#<script src="app.js"></script>#<script src="native-speech.js"></script>\n<script src="app.js"></script>#' www/index.html && rm -f www/index.html.bak
grep -q 'native-speech.js' www/index.html || { echo "inject failed"; exit 1; }
echo "www/ built from cadence-collage ($(wc -c < www/app.js) bytes app.js)"
