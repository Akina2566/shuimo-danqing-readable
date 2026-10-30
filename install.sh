#!/usr/bin/env bash
# ============================================================
#  Whale Girl . Ink Wash (Readable) - Installer (macOS / Linux)
#
#  Usage:
#    bash install.sh
#
#  Does three things:
#    1. skin   -> ~/.dsh/skins/shuimo-danqing-readable
#    2. plugin -> <profile>/node_modules/dsh-plugin-bg-motion
#    3. mount plugin in that profile's bundles (package.json auto-backed-up)
#
#  Only touches profiles that already declare the skin-center plugin.
# ============================================================

set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DSH_HOME="${DSH_HOME:-$HOME/.dsh}"

echo ""
echo "  Whale Girl Ink Wash (Readable) - Installer"
echo "  =========================================="
echo ""

if [ ! -d "$DSH_HOME" ]; then
  echo "[!] DSH home not found: $DSH_HOME"
  echo "    Open DSH once first, then run this script again."
  exit 1
fi
echo "[OK] DSH home: $DSH_HOME"

# ---------- 1. skin ----------
SKIN_DST="$DSH_HOME/skins/shuimo-danqing-readable"
mkdir -p "$(dirname "$SKIN_DST")"
if [ -d "$SKIN_DST" ]; then echo "[..] skin exists, refreshing"; rm -rf "$SKIN_DST"; fi
mkdir -p "$SKIN_DST"
cp "$REPO/skin.json" "$REPO/skin.css" "$REPO/patches.css" "$SKIN_DST/"
cp -R "$REPO/assets" "$REPO/preview" "$SKIN_DST/"
[ -f "$SKIN_DST/skin.json" ] || { echo "[x] failed to copy skin"; exit 1; }
echo "[OK] skin -> $SKIN_DST"

# ---------- 2. find profile with skin-center ----------
PLUGIN_SRC="$REPO/plugin"
if [ ! -d "$PLUGIN_SRC" ]; then
  echo "[!] plugin/ not found; background will keep playing"
  echo ""; echo "  Done (skin only)."; exit 0
fi

TARGETS=""
for name in desktop web default; do
  DIR="$DSH_HOME/profiles/$name"
  PKG="$DIR/package.json"
  [ -f "$PKG" ] || continue
  if grep -q "linxin666/dsh-web-all\|linxin666/dsh-client-ui-skin-center" "$PKG"; then
    TARGETS="$TARGETS $DIR"
  fi
done

if [ -z "$TARGETS" ]; then
  echo "[!] No profile with skin-center found."
  echo "    Install @linxin666/dsh-web-all first (Settings -> Plugins),"
  echo "    then run this script again to enable the idle-freeze animation."
  echo ""; echo "  Done (skin only, no animation plugin)."; exit 0
fi

# ---------- 3. plugin + mount ----------
for DIR in $TARGETS; do
  echo "[..] profile: $(basename "$DIR")"
  NM="$DIR/node_modules"
  mkdir -p "$NM"
  DST="$NM/dsh-plugin-bg-motion"
  rm -rf "$DST"

  # 在 git 仓库里运行时用符号链接，git pull 后自动同步；否则复制
  if [ -d "$REPO/.git" ] && ln -s "$PLUGIN_SRC" "$DST" 2>/dev/null; then
    echo "    plugin -> node_modules/dsh-plugin-bg-motion (symlink)"
  else
    cp -R "$PLUGIN_SRC" "$DST"
    echo "    plugin -> node_modules/dsh-plugin-bg-motion (copied)"
  fi

  PKG="$DIR/package.json"
  if grep -q '"dsh-plugin-bg-motion"' "$PKG"; then
    echo "    already in bundles, skipped"
    continue
  fi

  cp "$PKG" "$PKG.bak-bgmotion"
  node - "$PKG" <<'NODEEOF'
const fs = require('fs');
const p = process.argv[2];
const j = JSON.parse(fs.readFileSync(p, 'utf8'));
j.dsh = j.dsh || {};
j.dsh.profile = j.dsh.profile || {};
const bundles = Array.isArray(j.dsh.profile.bundles) ? j.dsh.profile.bundles.slice() : [];
if (!bundles.includes('dsh-plugin-bg-motion')) {
  const idx = bundles.findIndex(b => String(b).startsWith('@linxin666/'));
  if (idx >= 0) bundles.splice(idx, 0, 'dsh-plugin-bg-motion');
  else bundles.push('dsh-plugin-bg-motion');
  j.dsh.profile.bundles = bundles;
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n', 'utf8');
  console.log('    added to bundles (backup: package.json.bak-bgmotion)');
}
NODEEOF
done

echo ""
echo "  Installed"
echo "  ---------"
echo "  1) Quit DSH completely and reopen it (plugin loads at startup)"
echo "  2) Settings -> Skin Center -> pick 'shuimo-danqing-readable'"
echo "  3) If nothing changes, press Ctrl+Shift+R"
echo ""
echo "  Result: background plays while chatting, freezes on frame 16 otherwise."
echo ""
