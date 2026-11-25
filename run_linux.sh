#!/usr/bin/env sh
set -eu
python3 -m pip install -r requirements.txt
openssl version
python3 -m unittest discover -s tests -v
python3 run_all.py --trials 12 --aes-trials 30
npm install
npm run slides
