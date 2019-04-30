@echo off
set PRODUCTION=false
npm run build & copy AISSearch2Test.* test\AISSearch2.* /Y & del AISSearch2Test.*
