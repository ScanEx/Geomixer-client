@echo off
set PRODUCTION=true
set BETA=true
npm run build & copy src\LoaderWorker.js LoaderWorker.js /Y