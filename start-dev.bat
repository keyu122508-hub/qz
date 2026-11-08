@echo off
SET NODE=C:\Users\admin\node-v20.18.1-win-x64\node.exe
SET VITE=%~dp0node_modules\vite\bin\vite.js
cd /d %~dp0
echo Starting TavernLite dev server...
echo Open http://localhost:5173 in your browser
"%NODE%" "%VITE%" --port 5173 --host
