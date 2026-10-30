# ============================================================
#  鲸鱼娘 . 水墨丹青（清晰版）一键安装 - Windows
#
#  用法（在仓库目录里打开 PowerShell）：
#    powershell -ExecutionPolicy Bypass -File .\install.ps1
#
#  做三件事：
#    1. 皮肤 -> %USERPROFILE%\.dsh\skins\shuimo-danqing-readable
#    2. 插件 -> <profile>\node_modules\dsh-plugin-bg-motion
#    3. 插件挂进该 profile 的 bundles（自动备份 package.json）
#
#  只在「已装皮肤中心」的 profile 里挂插件，其它 profile 不动。
# ============================================================

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $MyInvocation.MyCommand.Path
$dshHome = Join-Path $env:USERPROFILE ".dsh"

Write-Host ""
Write-Host "  Whale Girl Ink Wash (Readable) - Installer" -ForegroundColor Cyan
Write-Host "  ==========================================" -ForegroundColor DarkGray
Write-Host ""

if (-not (Test-Path $dshHome)) {
    Write-Host "[!] DSH home not found: $dshHome" -ForegroundColor Red
    Write-Host "    Open DSH once first, then run this script again."
    exit 1
}
Write-Host "[OK] DSH home: $dshHome" -ForegroundColor Green

# ---------- 1. 装皮肤 ----------
$skinDst = Join-Path $dshHome "skins\shuimo-danqing-readable"
$skinsRoot = Split-Path -Parent $skinDst
if (-not (Test-Path $skinsRoot)) { New-Item -ItemType Directory -Force -Path $skinsRoot | Out-Null }
if (Test-Path $skinDst) {
    Write-Host "[..] skin exists, refreshing" -ForegroundColor Yellow
    Remove-Item $skinDst -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $skinDst | Out-Null
Copy-Item (Join-Path $repo "skin.json")   $skinDst -Force
Copy-Item (Join-Path $repo "skin.css")    $skinDst -Force
Copy-Item (Join-Path $repo "patches.css") $skinDst -Force
Copy-Item (Join-Path $repo "assets")      $skinDst -Recurse -Force
Copy-Item (Join-Path $repo "preview")     $skinDst -Recurse -Force
if (-not (Test-Path (Join-Path $skinDst "skin.json"))) {
    Write-Host "[x] failed to copy skin" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] skin -> $skinDst" -ForegroundColor Green

# ---------- 2. 找带皮肤中心的 profile ----------
$pluginSrc = Join-Path $repo "plugin"
if (-not (Test-Path $pluginSrc)) {
    Write-Host "[!] plugin/ not found in repo; background will keep playing" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Done (skin only)." -ForegroundColor Cyan
    exit 0
}

$targets = @()
foreach ($name in @("desktop", "web", "default")) {
    $profDir = Join-Path $dshHome ("profiles\" + $name)
    if (-not (Test-Path $profDir)) { continue }
    $pkg = Join-Path $profDir "package.json"
    if (-not (Test-Path $pkg)) { continue }

    $raw = Get-Content $pkg -Raw -Encoding UTF8
    # 只有声明了皮肤中心的 profile 才挂，避免污染纯 Web 端 profile
    if ($raw -match "linxin666/dsh-web-all" -or $raw -match "linxin666/dsh-client-ui-skin-center") {
        $targets += [pscustomobject]@{ Name = $name; Dir = $profDir; Pkg = $pkg }
    }
}

if ($targets.Count -eq 0) {
    Write-Host "[!] No profile with skin-center found." -ForegroundColor Yellow
    Write-Host "    Install @linxin666/dsh-web-all first (Settings -> Plugins),"
    Write-Host "    then run this script again to enable the idle-freeze animation."
    Write-Host ""
    Write-Host "  Done (skin only, no animation plugin)." -ForegroundColor Cyan
    exit 0
}

# ---------- 3. 复制插件到 profile 的 node_modules 并挂载 ----------
foreach ($t in $targets) {
    Write-Host ("[..] profile: " + $t.Name) -ForegroundColor DarkGray

    $nm = Join-Path $t.Dir "node_modules"
    if (-not (Test-Path $nm)) { New-Item -ItemType Directory -Force -Path $nm | Out-Null }
    $pluginDst = Join-Path $nm "dsh-plugin-bg-motion"

    if (Test-Path $pluginDst) { Remove-Item $pluginDst -Recurse -Force }
    Copy-Item $pluginSrc $pluginDst -Recurse -Force
    Write-Host "    plugin -> node_modules\dsh-plugin-bg-motion" -ForegroundColor Green

    # 若用户是在 git 仓库里运行，把副本换成 junction，这样以后 git pull 后不用重装
    if (Test-Path (Join-Path $repo ".git")) {
        try {
            Remove-Item $pluginDst -Recurse -Force
            New-Item -ItemType Junction -Path $pluginDst -Target $pluginSrc -ErrorAction Stop | Out-Null
            Write-Host "    (linked to repo, stays in sync after git pull)" -ForegroundColor DarkGray
        } catch {
            Copy-Item $pluginSrc $pluginDst -Recurse -Force
            Write-Host "    (copied; rerun after git pull to update)" -ForegroundColor DarkYellow
        }
    }

    $raw = Get-Content $t.Pkg -Raw -Encoding UTF8
    if ($raw -match '"dsh-plugin-bg-motion"') {
        Write-Host "    already in bundles, skipped" -ForegroundColor DarkGray
        continue
    }

    Copy-Item $t.Pkg ($t.Pkg + ".bak-bgmotion") -Force
    $json = $raw | ConvertFrom-Json

    if ($null -eq $json.dsh) {
        $json | Add-Member -NotePropertyName "dsh" -NotePropertyValue (New-Object psobject) -Force
    }
    if ($null -eq $json.dsh.profile) {
        $json.dsh | Add-Member -NotePropertyName "profile" -NotePropertyValue (New-Object psobject) -Force
    }
    if ($null -eq $json.dsh.profile.bundles) {
        $json.dsh.profile | Add-Member -NotePropertyName "bundles" -NotePropertyValue @() -Force
    }

    $bundles = @($json.dsh.profile.bundles)
    $idx = -1
    for ($i = 0; $i -lt $bundles.Count; $i++) {
        if ($bundles[$i] -like "@linxin666/*") { $idx = $i; break }
    }
    if ($idx -ge 0) {
        $before = @()
        if ($idx -gt 0) { $before = @($bundles[0..($idx-1)]) }
        $after = @($bundles[$idx..($bundles.Count-1)])
        $json.dsh.profile.bundles = @($before) + @("dsh-plugin-bg-motion") + @($after)
    } else {
        $json.dsh.profile.bundles = @($bundles) + @("dsh-plugin-bg-motion")
    }

    $out = $json | ConvertTo-Json -Depth 12
    [System.IO.File]::WriteAllText($t.Pkg, $out, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "    added to bundles (backup: package.json.bak-bgmotion)" -ForegroundColor Green
}

# ---------- 完成 ----------
Write-Host ""
Write-Host "  Installed" -ForegroundColor Cyan
Write-Host "  ---------" -ForegroundColor DarkGray
Write-Host "  1) Quit DSH completely and reopen it (plugin loads at startup)"
Write-Host "  2) Settings -> Skin Center -> pick 'shuimo-danqing-readable'"
Write-Host "  3) If nothing changes, press Ctrl+Shift+R"
Write-Host ""
Write-Host "  Result: background plays while chatting, freezes on frame 16 otherwise." -ForegroundColor Green
Write-Host ""
