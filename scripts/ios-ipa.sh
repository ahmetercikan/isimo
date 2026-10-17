#!/bin/sh
# App Store'a yüklenecek imzalı paketi (IPA) üretir.
#   sh scripts/ios-ipa.sh
# Gerekli: Xcode, Xcode → Settings → Accounts'ta ABDURRAHMAN KAAN DIKEC hesabı (ekip AQ2Y664A4Z).
# Çıktı: store/release/ios/App.ipa (depoya girmez)
set -e
cd "$(dirname "$0")/.."
archive="${TMPDIR:-/tmp}/IsimSehir.xcarchive"
out="store/release/ios"
rm -rf "$archive" "$out"
mkdir -p "$out"

npm run ios:sync
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath "$archive" \
  -allowProvisioningUpdates archive
xcodebuild -exportArchive -archivePath "$archive" \
  -exportOptionsPlist ios/ExportOptions.plist -exportPath "$out" \
  -allowProvisioningUpdates
echo
echo "Paket hazır: $out/App.ipa"
