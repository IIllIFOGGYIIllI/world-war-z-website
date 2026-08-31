$ErrorActionPreference = "Stop"

$KeyFile = Join-Path $PSScriptRoot "..\wwz-companion-release.jks"
$Alias = "wwzcompanion"

Write-Host "World War Z Companion - Android signing key" -ForegroundColor Red
Write-Host "Keep this .jks file and its passwords safe. Future app updates must use the same key." -ForegroundColor Yellow

if (Test-Path $KeyFile) {
    throw "Signing key already exists: $KeyFile"
}

$StoreSecure = Read-Host "Create a keystore password" -AsSecureString
$KeySecure = Read-Host "Create a key password" -AsSecureString
$StorePtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($StoreSecure)
$KeyPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($KeySecure)
try {
    $StorePass = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($StorePtr)
    $KeyPass = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($KeyPtr)
    if ($StorePass.Length -lt 6 -or $KeyPass.Length -lt 6) {
        throw "Passwords must be at least 6 characters."
    }

    & keytool -genkeypair `
      -keystore $KeyFile `
      -storepass $StorePass `
      -keypass $KeyPass `
      -alias $Alias `
      -keyalg RSA `
      -keysize 4096 `
      -validity 10000 `
      -dname "CN=World War Z Companion, OU=World War Z, O=World War Z, L=Sydney, ST=NSW, C=AU"

    if ($LASTEXITCODE -ne 0) { throw "keytool failed." }

    $cert = & keytool -list -v -keystore $KeyFile -storepass $StorePass -alias $Alias
    $fingerprintLine = $cert | Select-String "SHA256:" | Select-Object -First 1
    $fingerprint = ($fingerprintLine -replace '^.*SHA256:\s*', '').Trim()

    $bytes = [IO.File]::ReadAllBytes($KeyFile)
    $base64 = [Convert]::ToBase64String($bytes)
    $base64Path = "$KeyFile.base64.txt"
    [IO.File]::WriteAllText($base64Path, $base64)

    Write-Host ""
    Write-Host "Signing key created." -ForegroundColor Green
    Write-Host "Key file: $KeyFile"
    Write-Host "Base64 copy for GitHub secret: $base64Path"
    Write-Host "Alias: $Alias"
    Write-Host "SHA-256 fingerprint: $fingerprint"
    Write-Host ""
    Write-Host "GitHub secrets to create:" -ForegroundColor Cyan
    Write-Host "WWZ_ANDROID_KEYSTORE_BASE64 = contents of the .base64.txt file"
    Write-Host "WWZ_ANDROID_KEYSTORE_PASSWORD = the keystore password you entered"
    Write-Host "WWZ_ANDROID_KEY_PASSWORD = the key password you entered"
    Write-Host "WWZ_ANDROID_KEY_ALIAS = $Alias"
    Write-Host ""
    Write-Host "Then generate .well-known/assetlinks.json with:" -ForegroundColor Cyan
    Write-Host "python android-app\scripts\generate_assetlinks.py `"$fingerprint`""
}
finally {
    if ($StorePtr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($StorePtr) }
    if ($KeyPtr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($KeyPtr) }
    Remove-Variable StorePass, KeyPass -ErrorAction SilentlyContinue
}
