
$files = @(
  "c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/gta5/online/gta5-online.component.ts",
  "c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/gta5/historia/gta5-historia.component.ts",
  "c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/gta6/online/gta6-online.component.ts",
  "c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/gta6/historia/gta6-historia.component.ts"
)
foreach ($file in $files) {
  $content = Get-Content -Raw $file
  $newContent = $content -replace "'icon-theme-classic'", "'icon-theme-classic',`n            'icon-theme-standard'"
  Set-Content -Path $file -Value $newContent -NoNewline
}

