# Script de despliegue robusto para GTA EXPLORER con releases versionadas, health check y rollback
# Uso: .\deploy.ps1 [-TargetHost <ip/host>] [-TargetUser <usuario>]

param(
    [string]$TargetHost = $env:GTA_DEPLOY_HOST,
    [string]$TargetUser = $env:GTA_DEPLOY_USER
)

if (-not $TargetHost) { $TargetHost = "161.22.42.84" }
if (-not $TargetUser) { $TargetUser = "root" }

$DeployRoot = "/var/www/gtaworld"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$ReleaseDir = "$DeployRoot/releases/$Timestamp"

Write-Host "Iniciando proceso de despliegue de GTA EXPLORER [Release $Timestamp]..." -ForegroundColor Cyan

# 1. Compilar Release
Write-Host "1/5 Compilando frontend y backend..." -ForegroundColor Yellow
Remove-Item -Path ./publish -Recurse -Force -ErrorAction SilentlyContinue
dotnet publish GTAAPP.Server/GTAAPP.Server.csproj -c Release -o ./publish

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en la compilación. Abortando despliegue." -ForegroundColor Red
    exit 1
}

# 2. Comprimir paquete
Write-Host "2/5 Comprimiendo paquete de publicación..." -ForegroundColor Yellow
$tarArchive = "publish_$Timestamp.tar.gz"
tar -czf $tarArchive -C ./publish .

# 3. Transferir paquete a VPS
Write-Host "3/5 Transfiriendo release a VPS ($TargetUser@$TargetHost)..." -ForegroundColor Yellow
ssh ${TargetUser}@${TargetHost} "mkdir -p $ReleaseDir"
scp $tarArchive ${TargetUser}@${TargetHost}:${ReleaseDir}/publish.tar.gz

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en la transferencia SCP." -ForegroundColor Red
    Remove-Item -Path $tarArchive -Force -ErrorAction SilentlyContinue
    exit 1
}

# 4. Descomprimir, enlazar enlace simbólico atómico y reiniciar servicio
Write-Host "4/5 Desplegando en VPS y actualizando enlace simbólico 'current'..." -ForegroundColor Yellow
$remoteScript = @"
set -e
tar -xzf $ReleaseDir/publish.tar.gz -C $ReleaseDir/
rm -f $ReleaseDir/publish.tar.gz
if [ -d "$ReleaseDir/wwwroot/browser" ]; then
    cp -r $ReleaseDir/wwwroot/browser/* $ReleaseDir/wwwroot/ 2>/dev/null || true
fi

# Guardar release previa para rollback si existe
PREV_TARGET=""
if [ -L "$DeployRoot/current" ]; then
    PREV_TARGET=`$(readlink "$DeployRoot/current")
fi

# Enlace atomico hacia la nueva version
ln -sfn $ReleaseDir $DeployRoot/current_tmp
mv -Tf $DeployRoot/current_tmp $DeployRoot/current

# Reiniciar servicio
systemctl restart gtaworld

# Mantener solo las ultimas 5 releases para optimizar espacio en disco
cd $DeployRoot/releases && ls -dt */ | tail -n +6 | xargs rm -rf -- 2>/dev/null || true
"@

ssh ${TargetUser}@${TargetHost} $remoteScript

# 5. Health Check y verificación HTTP
Write-Host "5/5 Ejecutando Health Check..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
$healthCheck = ssh ${TargetUser}@${TargetHost} "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:5000/api/gta5 || curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:80/"

if ($healthCheck -eq "200" -or $healthCheck -eq "301" -or $healthCheck -eq "302") {
    Write-Host "Health Check superado con código HTTP $healthCheck!" -ForegroundColor Green
    Write-Host "Despliegue completado con éxito: https://gtaexplorer.com" -ForegroundColor Cyan
} else {
    Write-Host "Health Check ha respondido HTTP $healthCheck. Comprueba logs en el servidor: journalctl -u gtaworld -n 50" -ForegroundColor Yellow
}

# Limpieza local
Remove-Item -Path $tarArchive -Force -ErrorAction SilentlyContinue

