Get-Content .env.development | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#")) {
        if ($line -match '^([^=]+)=(.*)$') {
            $key = $Matches[1].Trim()
            $val = $Matches[2].Trim()
            # Remove surrounding quotes if present
            if ($val.StartsWith('"') -and $val.EndsWith('"')) {
                $val = $val.Substring(1, $val.Length - 2)
            }
            Write-Output "Adding $key..."
            # Add to production environment only
            npx vercel env add $key production --value $val --yes
        }
    }
}
