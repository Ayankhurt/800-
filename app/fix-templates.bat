@echo off
echo Fixing template literals in api.ts...

powershell -Command "$content = Get-Content 'services\api.ts' -Raw; $content = $content -replace '\$\{ ', '${'; $content = $content -replace ' \}', '}'; Set-Content 'services\api.ts' -Value $content -NoNewline"

echo Done! File fixed.
pause
