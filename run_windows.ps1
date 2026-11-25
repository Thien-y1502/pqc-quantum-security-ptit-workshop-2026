$ErrorActionPreference = 'Stop'
python -m pip install -r requirements.txt
openssl version
python -m unittest discover -s tests -v
python run_all.py --trials 12 --aes-trials 30
npm install
npm run slides
