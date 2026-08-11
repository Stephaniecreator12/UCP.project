# Lance la suite de tests Django sur un PostgreSQL Docker jetable
# (comportement Testcontainers) : le conteneur est cree automatiquement
# au debut des tests et supprime a la fin, donnees effacees.
# Usage : .\run-tests.ps1 [options django, ex: apps.users.tests]

# Attention : ne PAS mettre $ErrorActionPreference = "Stop" ici.
# PowerShell 5.1 enverrait alors sur le flux d'erreur la sortie stderr de
# Django ("Creating test database...") et interromprait le script en cours
# de route.
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = (Resolve-Path (Join-Path $ScriptDir "..\..")).Path

$Py = Join-Path $Root ".venv\Scripts\python.exe"
if (-not (Test-Path $Py)) {
    $Py = "python"
}

Set-Location (Join-Path $Root "backend_PPM")
& $Py manage.py test --settings=config.test_settings @args
exit $LASTEXITCODE