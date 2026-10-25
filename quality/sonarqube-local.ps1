# GTA Explorer - Gestor Local de SonarQube Community Build (Sin Docker, 100% Portable)
# Descarga, instala y gestiona automáticamente:
#   - Eclipse Temurin OpenJDK 21 LTS (x64 Windows ZIP portable)
#   - SonarQube Community Build 26.10.0.133078 (Edición Oficial Gratuita Open Source)
#
# Acciones soportadas:
#   powershell -ExecutionPolicy Bypass -File quality/sonarqube-local.ps1 install
#   powershell -ExecutionPolicy Bypass -File quality/sonarqube-local.ps1 start
#   powershell -ExecutionPolicy Bypass -File quality/sonarqube-local.ps1 stop
#   powershell -ExecutionPolicy Bypass -File quality/sonarqube-local.ps1 status

param(
    [Parameter(Position = 0)]
    [ValidateSet("install", "start", "stop", "status")]
    [string]$Action = "status"
)

$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $PSScriptRoot
$ToolsDir = Join-Path $RootDir ".quality\tools"
$JdkDir = Join-Path $ToolsDir "jdk-21"
$SonarVersion = "26.10.0.133078"
$SonarDir = Join-Path $ToolsDir "sonarqube-$SonarVersion"
$SonarUrl = "https://binaries.sonarsource.com/Distribution/sonarqube/sonarqube-$SonarVersion.zip"
$JdkUrl = "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk"
$SonarHostUrl = "http://localhost:9000"
$SonarStatusApi = "$SonarHostUrl/api/system/status"

function Write-Step([string]$Message, [ConsoleColor]$Color = [ConsoleColor]::Cyan) {
    Write-Host "[SonarQube Local] $Message" -ForegroundColor $Color
}

function Fail-WithError([string]$Message) {
    Write-Host "[SonarQube Local] ERROR: $Message" -ForegroundColor Red
    exit 1
}

function Invoke-VerifiedDownload {
    param(
        [Parameter(Mandatory = $true)][string]$Url,
        [Parameter(Mandatory = $true)][string]$DestinationFile,
        [Parameter(Mandatory = $true)][long]$MinExpectedBytes,
        [Parameter(Mandatory = $true)][string]$ComponentName
    )

    Write-Step "Verificando disponibilidad de $ComponentName en origen..."
    try {
        $head = Invoke-WebRequest -Uri $Url -Method Head -UseBasicParsing -TimeoutSec 15
        if ($head.StatusCode -lt 200 -or $head.StatusCode -ge 400) {
            Fail-WithError "El servidor devolvió HTTP $($head.StatusCode) al solicitar $ComponentName ($Url)."
        }
    } catch {
        Fail-WithError "No se pudo conectar o la URL de $ComponentName no es accesible ($Url). Detalle: $($_.Exception.Message)"
    }

    if (Test-Path $DestinationFile) {
        $existingItem = Get-Item $DestinationFile
        if ($existingItem.Length -lt $MinExpectedBytes) {
            Write-Step "El archivo previo '$DestinationFile' está incompleto ($($existingItem.Length) bytes). Reemplazando..." Yellow
            Remove-Item -LiteralPath $DestinationFile -Force
        } else {
            Write-Step "Archivo descargado previamente válido detectado: $DestinationFile ($([Math]::Round($existingItem.Length / 1MB, 1)) MB)." Green
            return
        }
    }

    Write-Step "Descargando $ComponentName desde $Url ..."
    & curl.exe -f -L --retry 3 --retry-delay 2 -o $DestinationFile $Url
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $DestinationFile)) {
        Fail-WithError "Falló la descarga de $ComponentName desde $Url (código de salida curl: $LASTEXITCODE)."
    }

    $downloadedItem = Get-Item $DestinationFile
    if ($downloadedItem.Length -lt $MinExpectedBytes) {
        Fail-WithError "El archivo descargado para $ComponentName es demasiado pequeño ($($downloadedItem.Length) bytes; se esperaban al menos $MinExpectedBytes bytes)."
    }

    # Verificar firma ZIP (PK\x03\x04 -> 0x50 0x4B 0x03 0x04)
    $stream = [System.IO.File]::OpenRead($DestinationFile)
    try {
        $header = New-Object byte[] 4
        $bytesRead = $stream.Read($header, 0, 4)
        if ($bytesRead -lt 4 -or $header[0] -ne 0x50 -or $header[1] -ne 0x4B) {
            Fail-WithError "El archivo descargado para $ComponentName no es un archivo ZIP válido."
        }
    } finally {
        $stream.Close()
    }

    Write-Step "Descarga de $ComponentName completada y verificada ($([Math]::Round($downloadedItem.Length / 1MB, 1)) MB)." Green
}

function Expand-ZipFast {
    param(
        [Parameter(Mandatory = $true)][string]$ZipFile,
        [Parameter(Mandatory = $true)][string]$TargetDir,
        [Parameter(Mandatory = $true)][string]$ComponentName
    )

    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
    Write-Step "Extrayendo $ComponentName en '$TargetDir'..."
    & tar.exe -xf $ZipFile -C $TargetDir
    if ($LASTEXITCODE -ne 0) {
        Fail-WithError "Error al extraer el archivo ZIP de $ComponentName ($ZipFile)."
    }
}

function Find-Java21Executable {
    if (-not (Test-Path $JdkDir)) { return $null }
    $candidates = Get-ChildItem -Path $JdkDir -Filter "java.exe" -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -match '[\\/]bin[\\/]java\.exe$' }
    return ($candidates | Select-Object -First 1)
}

function Find-StartSonarBat {
    if (-not (Test-Path $SonarDir)) { return $null }
    $candidates = Get-ChildItem -Path $SonarDir -Filter "StartSonar.bat" -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -match 'windows-x86-64[\\/]StartSonar\.bat$' }
    if (-not $candidates) {
        $candidates = Get-ChildItem -Path $SonarDir -Filter "StartSonar.bat" -Recurse -File -ErrorAction SilentlyContinue
    }
    return ($candidates | Select-Object -First 1)
}

function Test-JavaVersionCompatibility([string]$JavaExePath) {
    if (-not (Test-Path $JavaExePath)) {
        Fail-WithError "No se encontró el ejecutable de Java en '$JavaExePath'."
    }
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $verOutput = (& $JavaExePath -version 2>&1) -join "`n"
    } finally {
        $ErrorActionPreference = $prevEap
    }
    if ($verOutput -notmatch 'version "(2[1-9]|[3-9][0-9])\.') {
        Fail-WithError "La versión de Java detectada no es compatible con SonarQube Community Build (se requiere Java 21+). Salida: $verOutput"
    }
    return ($verOutput -split "`r?`n")[0].Trim()
}

function Ensure-SonarInstalled {
    New-Item -ItemType Directory -Path $ToolsDir -Force | Out-Null

    # 1. Comprobar o instalar OpenJDK 21 LTS
    $javaExe = Find-Java21Executable
    if (-not $javaExe) {
        $jdkZip = Join-Path $ToolsDir "openjdk-21-windows-x64.zip"
        Invoke-VerifiedDownload -Url $JdkUrl -DestinationFile $jdkZip -MinExpectedBytes (150 * 1024 * 1024) -ComponentName "Eclipse Temurin OpenJDK 21 LTS"
        Expand-ZipFast -ZipFile $jdkZip -TargetDir $JdkDir -ComponentName "Eclipse Temurin OpenJDK 21 LTS"
        $javaExe = Find-Java21Executable
        if (-not $javaExe) {
            Fail-WithError "No se encontró bin\java.exe dentro de '$JdkDir' tras extraer el archivo ZIP."
        }
        if (Test-Path $jdkZip) {
            Remove-Item -LiteralPath $jdkZip -Force
        }
    }

    $javaVerLine = Test-JavaVersionCompatibility -JavaExePath $javaExe.FullName

    # 2. Comprobar o instalar SonarQube Community Build 26.10.0.133078
    $startSonar = Find-StartSonarBat
    if (-not $startSonar) {
        $sonarZip = Join-Path $ToolsDir "sonarqube-$SonarVersion.zip"
        Invoke-VerifiedDownload -Url $SonarUrl -DestinationFile $sonarZip -MinExpectedBytes (500 * 1024 * 1024) -ComponentName "SonarQube Community Build $SonarVersion"
        Expand-ZipFast -ZipFile $sonarZip -TargetDir $SonarDir -ComponentName "SonarQube Community Build $SonarVersion"
        $startSonar = Find-StartSonarBat
        if (-not $startSonar) {
            Fail-WithError "No se encontró bin\windows-x86-64\StartSonar.bat dentro de '$SonarDir' tras extraer el archivo ZIP."
        }
        if (Test-Path $sonarZip) {
            Remove-Item -LiteralPath $sonarZip -Force
        }
    }

    $sonarHome = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $startSonar.FullName))

    return @{
        JavaExe      = $javaExe.FullName
        JavaHome     = Split-Path -Parent (Split-Path -Parent $javaExe.FullName)
        JavaVersion  = $javaVerLine
        StartSonar   = $startSonar.FullName
        SonarBinDir  = Split-Path -Parent $startSonar.FullName
        SonarHome    = $sonarHome
        SonarLogDir  = Join-Path $sonarHome "logs"
    }
}

function Get-SonarHttpStatus {
    try {
        $resp = Invoke-RestMethod -Uri $SonarStatusApi -Method Get -TimeoutSec 4 -ErrorAction Stop
        $webResp = Invoke-WebRequest -Uri $SonarHostUrl -Method Get -UseBasicParsing -TimeoutSec 4 -ErrorAction Stop
        return @{
            Reachable = $true
            Status    = $resp.status
            Version   = $resp.version
            HttpCode  = [int]$webResp.StatusCode
        }
    } catch {
        return @{
            Reachable = $false
            Status    = "DOWN"
            Version   = $null
            HttpCode  = 0
        }
    }
}

function Get-SonarProcesses {
    $sonarNorm = $SonarDir.ToLowerInvariant()
    $procs = Get-CimInstance Win32_Process -Filter "Name = 'java.exe'" -ErrorAction SilentlyContinue |
        Where-Object {
            $cmd = [string]$_.CommandLine
            $exe = [string]$_.ExecutablePath
            ($cmd -match 'org\.sonar\.application\.App' -or
             $cmd -match 'org\.elasticsearch\.bootstrap' -or
             $cmd -match 'org\.sonar\.ce\.app\.CeServer' -or
             $cmd -match 'org\.sonar\.server\.app\.WebServer' -or
             ($cmd.ToLowerInvariant().Contains($sonarNorm)) -or
             ($exe.ToLowerInvariant().Contains($JdkDir.ToLowerInvariant()) -and $cmd -match 'sonar'))
        }
    return @($procs)
}

switch ($Action) {
    "install" {
        $info = Ensure-SonarInstalled
        Write-Step "Instalación verificada con éxito:" Green
        Write-Host "  * Java Runtime : $($info.JavaVersion)"
        Write-Host "  * Ruta Java    : $($info.JavaExe)"
        Write-Host "  * SonarQube    : Community Build $SonarVersion"
        Write-Host "  * StartSonar   : $($info.StartSonar)"
        Write-Host "  * Directorio   : $($info.SonarHome)"
        exit 0
    }

    "status" {
        $http = Get-SonarHttpStatus
        $procs = Get-SonarProcesses
        $javaExe = Find-Java21Executable
        $startSonar = Find-StartSonarBat

        Write-Host "---------------------------------------------------------------------"
        Write-Host "  ESTADO DE SONARQUBE COMMUNITY BUILD LOCAL"
        Write-Host "---------------------------------------------------------------------"
        Write-Host "  * Instalado     : $(if ($javaExe -and $startSonar) { 'SÍ (' + $SonarVersion + ')' } else { 'NO' })"
        if ($javaExe) {
            Write-Host "  * Java Path     : $($javaExe.FullName)"
        }
        if ($startSonar) {
            Write-Host "  * StartSonar    : $($startSonar.FullName)"
        }
        Write-Host "  * Procesos JVM  : $($procs.Count) activo(s)"
        Write-Host "  * Estado API    : $($http.Status) $(if ($http.Version) { '(v' + $http.Version + ')' } else { '' })"
        Write-Host "  * Interfaz Web  : $(if ($http.Reachable -and $http.HttpCode -eq 200) { 'OPERATIVA en ' + $SonarHostUrl + ' (HTTP 200)' } else { 'INACTIVA' })"
        Write-Host "---------------------------------------------------------------------"

        if ($http.Reachable -and $http.Status -eq "UP") {
            exit 0
        } else {
            exit 1
        }
    }

    "start" {
        $info = Ensure-SonarInstalled

        $current = Get-SonarHttpStatus
        if ($current.Reachable -and $current.Status -eq "UP") {
            Write-Step "SonarQube Community Build ya está en ejecución y operativo (UP) en $SonarHostUrl (v$($current.Version))." Green
            exit 0
        }

        $env:SONAR_JAVA_PATH = $info.JavaExe
        $env:JAVA_HOME = $info.JavaHome

        Write-Step "Iniciando SonarQube Community Build $SonarVersion con Java 21..."
        Write-Host "  * SONAR_JAVA_PATH = $($info.JavaExe)"
        Write-Host "  * StartSonar.bat  = $($info.StartSonar)"

        # Lanzar proceso mediante WMI/CIM (Win32_Process.Create) para que quede desacoplado de cualquier JobObject de consola
        $cmdLine = "cmd.exe /c `"set `"SONAR_JAVA_PATH=$($info.JavaExe)`" && set `"JAVA_HOME=$($info.JavaHome)`" && `"$($info.StartSonar)`"`""
        $startup = New-CimInstance -ClassName Win32_ProcessStartup -ClientOnly -Property @{ ShowWindow = [uint16]0 }
        $wmiResult = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
            CommandLine = $cmdLine
            CurrentDirectory = $info.SonarBinDir
            ProcessStartupInformation = $startup
        }
        if ($wmiResult.ReturnValue -ne 0) {
            Fail-WithError "No se pudo lanzar el proceso de SonarQube mediante Win32_Process (Código: $($wmiResult.ReturnValue))."
        }

        Write-Step "Proceso lanzado en segundo plano (PID inicial: $($wmiResult.ProcessId)). Esperando a que todos los servicios (ElasticSearch, Web, Compute Engine) pasen a estado UP en $SonarHostUrl ..." Yellow

        $maxWaitSeconds = 180
        $elapsed = 0
        $pollInterval = 4
        $lastReportedStatus = ""

        while ($elapsed -lt $maxWaitSeconds) {
            Start-Sleep -Seconds $pollInterval
            $elapsed += $pollInterval

            $st = Get-SonarHttpStatus
            if ($st.Status -ne $lastReportedStatus) {
                Write-Step "  [$($elapsed)s] Estado reportado por API: $($st.Status)" Gray
                $lastReportedStatus = $st.Status
            }

            if ($st.Reachable -and $st.Status -eq "UP" -and $st.HttpCode -eq 200) {
                Write-Step "SonarQube Community Build está 100% OPERATIVO (UP) en $SonarHostUrl (Versión: $($st.Version), HTTP $($st.HttpCode))." Green
                exit 0
            }

            # Si no quedan procesos Java de Sonar y han pasado más de 15s, revisar logs y abortar con error claro
            $activeProcs = Get-SonarProcesses
            if ($elapsed -ge 16 -and $activeProcs.Count -eq 0) {
                $sonarLog = Join-Path $info.SonarLogDir "sonar.log"
                $logTail = if (Test-Path $sonarLog) { (Get-Content $sonarLog -Tail 25) -join "`n" } else { "No se encontró sonar.log" }
                Fail-WithError "El proceso de SonarQube terminó prematuramente durante el arranque. Últimas líneas de sonar.log:`n$logTail"
            }
        }

        Fail-WithError "Tiempo de espera agotado ($maxWaitSeconds s) esperando a que SonarQube alcance el estado UP. Estado actual: $lastReportedStatus."
    }

    "stop" {
        Write-Step "Deteniendo SonarQube Community Build..." Yellow
        $procs = Get-SonarProcesses
        if ($procs.Count -eq 0) {
            Write-Step "No hay procesos activos de SonarQube en ejecución." Green
            exit 0
        }

        # 1. Detener primero el proceso coordinador (org.sonar.application.App)
        $appProcs = $procs | Where-Object { $_.CommandLine -match 'org\.sonar\.application\.App' }
        foreach ($p in $appProcs) {
            Write-Step "Deteniendo proceso coordinador App (PID $($p.ProcessId))..."
            Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
        }

        Start-Sleep -Seconds 3

        # 2. Detener cualquier subproceso remanente (CeServer, WebServer, Elasticsearch)
        $remaining = Get-SonarProcesses
        if ($remaining.Count -gt 0) {
            Write-Step "Cerrando $($remaining.Count) subproceso(s) de SonarQube (Compute Engine, Web, Elasticsearch)..." Yellow
            foreach ($rp in $remaining) {
                Stop-Process -Id $rp.ProcessId -Force -ErrorAction SilentlyContinue
            }
        }

        $waitStop = 0
        while ($waitStop -lt 15) {
            Start-Sleep -Seconds 1
            $waitStop += 1
            if ((Get-SonarProcesses).Count -eq 0) {
                break
            }
        }

        $finalCheck = Get-SonarProcesses
        $httpAfter = Get-SonarHttpStatus
        if ($finalCheck.Count -eq 0 -and -not $httpAfter.Reachable) {
            Write-Step "SonarQube Community Build se ha detenido por completo (0 procesos activos)." Green
            exit 0
        } else {
            Fail-WithError "No se pudieron detener todos los procesos de SonarQube ($($finalCheck.Count) restantes)."
        }
    }
}
