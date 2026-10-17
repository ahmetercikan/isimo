import CoreGraphics
import Foundation
import Vision

/**
 El yazısı tanıma motoru (Apple Vision) — cihazda çalışır, internet gerekmez.
 Çizgiler beyaz zemine siyah kalemle çizilir, sonra Vision'ın Türkçe metin tanıyıcısı okur.
 Capacitor köprüsü: InkPlugin.swift · web tarafı: src/lib/ink.ts
 (Bu dosya yalnızca CoreGraphics + Vision kullanır; böylece Mac'te de denenebilir:
  scripts/ink-ios-test/README.md)
 */
enum InkVision {
    /// Yazının çizildiği resmin hedef yüksekliği: Vision küçük yazıyı iyi okumuyor.
    static let targetHeight: CGFloat = 220
    /// Uzun kelimelerde resmi sınırsız büyütmemek için.
    static let maxWidth: CGFloat = 2400
    /// Kenar boşluğu: yazı resmin kenarına değmemeli.
    static let padding: CGFloat = 28

    /// Çizgileri (canvas koordinatları) beyaz zeminli siyah yazı resmine çevirir.
    static func render(strokes: [[CGPoint]]) -> CGImage? {
        let pts = strokes.flatMap { $0 }
        guard pts.count > 0 else { return nil }
        let minX = pts.map(\.x).min()!, maxX = pts.map(\.x).max()!
        let minY = pts.map(\.y).min()!, maxY = pts.map(\.y).max()!
        // Tek bir yatay çizgi ("-") ya da nokta çizilmiş olabilir: en/boyu sıfıra bölmeyelim.
        let inkW = max(maxX - minX, 1), inkH = max(maxY - minY, 1)
        var scale = targetHeight / inkH
        if inkW * scale + 2 * padding > maxWidth { scale = (maxWidth - 2 * padding) / inkW }
        let w = Int((inkW * scale + 2 * padding).rounded())
        let h = Int((inkH * scale + 2 * padding).rounded())
        guard let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0,
                                  space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGImageAlphaInfo.none.rawValue)
        else { return nil }
        ctx.setFillColor(gray: 1, alpha: 1)
        ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
        ctx.setStrokeColor(gray: 0, alpha: 1)
        ctx.setLineWidth(max(5, targetHeight * 0.05))
        ctx.setLineCap(.round)
        ctx.setLineJoin(.round)
        // Vision resmi yukarıdan aşağı okur, CoreGraphics aşağıdan yukarı çizer: y ters çevrilir.
        let map = { (p: CGPoint) in
            CGPoint(x: (p.x - minX) * scale + padding, y: CGFloat(h) - ((p.y - minY) * scale + padding))
        }
        for stroke in strokes {
            let p = stroke.map(map)
            guard let first = p.first else { continue }
            if p.count == 1 {
                // Tek dokunuş (örneğin "i"nin noktası): küçük bir yuvarlak.
                ctx.fillEllipse(in: CGRect(x: first.x - 4, y: first.y - 4, width: 8, height: 8))
                continue
            }
            ctx.beginPath()
            ctx.move(to: first)
            // Köşeli görünmesin: ara noktalardan geçen yumuşak eğri (noktalar kontrol noktası, orta noktalar bağlanır).
            for i in 1..<(p.count - 1) {
                let mid = CGPoint(x: (p[i].x + p[i + 1].x) / 2, y: (p[i].y + p[i + 1].y) / 2)
                ctx.addQuadCurve(to: mid, control: p[i])
            }
            ctx.addLine(to: p[p.count - 1])
            ctx.strokePath()
        }
        return ctx.makeImage()
    }

    /// Resmi okur; döner: adaylar (en olası önce). Tanınan hiçbir şey yoksa boş dizi.
    static func read(image: CGImage, lang: String = "tr-TR") -> [String] {
        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.usesLanguageCorrection = true
        request.recognitionLanguages = [lang]
        // Resimde yalnızca yazı var: küçük parçaları da denesin.
        request.minimumTextHeight = 0.05
        if #available(iOS 16.0, macOS 13.0, *) {
            request.revision = VNRecognizeTextRequestRevision3  // el yazısını daha iyi okur
            request.automaticallyDetectsLanguage = false
        }
        do {
            try VNImageRequestHandler(cgImage: image, orientation: .up, options: [:]).perform([request])
        } catch {
            return []
        }
        let lines = (request.results ?? []).sorted { a, b in
            // Soldan sağa, üstten aşağı: tek kelime beklenir ama parçalanmış olabilir.
            abs(a.boundingBox.midY - b.boundingBox.midY) > 0.25
                ? a.boundingBox.midY > b.boundingBox.midY
                : a.boundingBox.minX < b.boundingBox.minX
        }
        guard !lines.isEmpty else { return [] }
        if lines.count == 1 {
            return clean(lines[0].topCandidates(6).map(\.string))
        }
        // Parçalanmışsa: parçaları boşlukla ve boşluksuz birleştir (oyun sözlüğe bakıp seçer), sonra parçaların kendisi.
        let tops = lines.map { $0.topCandidates(1).first?.string ?? "" }
        return clean([tops.joined(separator: " "), tops.joined()] + lines.flatMap { $0.topCandidates(2).map(\.string) })
    }

    /// Çizgileri tanır (çiz + oku).
    static func recognize(strokes: [[CGPoint]], lang: String = "tr-TR") -> [String] {
        guard let image = render(strokes: strokes) else { return [] }
        return read(image: image, lang: lang)
    }

    /// Boşlukları toparlar, boşları ve tekrarları atar.
    private static func clean(_ list: [String]) -> [String] {
        var seen = Set<String>()
        return list.compactMap { raw -> String? in
            let t = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !t.isEmpty, seen.insert(t.lowercased()).inserted else { return nil }
            return t
        }
    }
}
