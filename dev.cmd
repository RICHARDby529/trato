@echo off
echo Demarrage du serveur TRATO...
npx wrangler pages dev public --ip 127.0.0.1 --port 8788 < nul
pause