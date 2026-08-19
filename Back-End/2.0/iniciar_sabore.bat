@echo off
echo ==============================================
echo        INICIANDO OS SERVICOS DO SABORE
echo ==============================================
echo.

:: Verifica se o MySQL do XAMPP ja esta rodando
tasklist | findstr /i "mysqld.exe" > nul
if errorlevel 1 (
    echo [INFO] Iniciando o banco de dados MySQL do XAMPP...
    start "" /min "C:\xampp\mysql\bin\mysqld.exe"
    echo [SUCESSO] MySQL iniciado em segundo plano!
) else (
    echo [INFO] Banco de dados MySQL ja esta em execucao.
)

echo.
echo [INFO] Iniciando o servidor Back-End do Sabore...
echo.
npm run dev

pause
