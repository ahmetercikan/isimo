/**
 iOS el yazısı tanımayı (InkVision.swift) Mac'te dener: çizgi dosyasını okur, Vision'ın ne okuduğunu yazar.
 Çalıştırma: scripts/ink-ios/dene.sh
 */
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
guard args.count > 1, let data = FileManager.default.contents(atPath: args[1]),
      let words = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]]
else {
    print("Kullanım: dene <strokes.json> [resim-klasörü]")
    exit(1)
}
let imageDir = args.count > 2 ? args[2] : nil

var hit = 0
for entry in words {
    let word = entry["word"] as? String ?? "?"
    let raw = entry["strokes"] as? [[String: Any]] ?? []
    let strokes: [[CGPoint]] = raw.compactMap { s in
        guard let xs = (s["x"] as? [Any])?.compactMap({ ($0 as? NSNumber).map { CGFloat($0.doubleValue) } }),
              let ys = (s["y"] as? [Any])?.compactMap({ ($0 as? NSNumber).map { CGFloat($0.doubleValue) } }),
              !xs.isEmpty
        else { return nil }
        return (0..<min(xs.count, ys.count)).map { CGPoint(x: xs[$0], y: ys[$0]) }
    }
    guard let image = InkVision.render(strokes: strokes) else {
        print("\(word): çizilemedi")
        continue
    }
    if let dir = imageDir {
        let url = URL(fileURLWithPath: dir).appendingPathComponent("\(word).png")
        if let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil) {
            CGImageDestinationAddImage(dest, image, nil)
            CGImageDestinationFinalize(dest)
        }
    }
    let candidates = InkVision.read(image: image)
    let ok = candidates.contains { $0.lowercased() == word.lowercased() }
    if ok { hit += 1 }
    print("\(ok ? "✓" : "·") yazılan: \(word)  →  okunan: \(candidates.isEmpty ? "(hiçbir şey)" : candidates.joined(separator: " | "))")
}
print("\nAdaylar arasında doğru olan: \(hit)/\(words.count)")
