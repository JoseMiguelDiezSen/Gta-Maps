# Script de despliegue automatico para GTA MAPS
# Uso: .\deploy.ps1

$VpsIp = "161.22.42.84"
$VpsPath = "/var/www/gtamaps"

Write-Host "Iniciando proceso de despliegue de GTA MAPS..." -ForegroundColor Cyan

# 1. Compilar Release
Write-Host "1/4 Compilando frontend y backend..." -ForegroundColor Yellow
dotnet publish GTAAPP.Server/GTAAPP.Server.csproj -c Release -o ./publish

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en la compilacion. Abortando despliegue." -ForegroundColor Red
    exit 1
}

# 2. Comprimir paquete
Write-Host "2/4 Comprimiendo archivos de publicacion..." -ForegroundColor Yellow
tar -czf publish.tar.gz -C ./publish .

# 3. Asegurar directorio en VPS y subir por SCP
Write-Host "3/4 Subiendo paquete a la VPS ($VpsIp)..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no root@$VpsIp "mkdir -p $VpsPath"
scp -o StrictHostKeyChecking=no publish.tar.gz root@${VpsIp}:${VpsPath}/publish.tar.gz

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al subir el archivo por SCP." -ForegroundColor Red
    exit 1
}

# 4. Extraer y reiniciar servicio en VPS
Write-Host "4/4 Descomprimiendo y reiniciando el servicio en la VPS..." -ForegroundColor Yellow
$remoteCmd = "tar -xzf $VpsPath/publish.tar.gz -C $VpsPath/ ; cp -r $VpsPath/wwwroot/browser/* $VpsPath/wwwroot/ 2>/dev/null ; systemctl restart gtamaps"
ssh -o StrictHostKeyChecking=no root@$VpsIp $remoteCmd

# 5. Limpieza local
Remove-Item -Path publish.tar.gz -Force -ErrorAction SilentlyContinue

Write-Host "Despliegue completado con exito!" -ForegroundColor Green
Write-Host "Puedes comprobar tu app en: http://$VpsIp" -ForegroundColor Cyan
