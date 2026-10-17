import Capacitor
import CoreGraphics
import Foundation

/**
 El yazısı tanıma — iOS (Apple Vision; cihazda çalışır, indirilecek model yok).
 Web tarafı: src/lib/ink.ts · Android karşılığı: android/.../InkPlugin.java (ML Kit Digital Ink).
   prepare({ lang })                           → { ready: true }
   recognize({ strokes, width, height, lang }) → { candidates: string[] }  (en olası önce)
 strokes: [{ x: number[], y: number[], t: number[] }] — t (zaman) iOS'ta kullanılmaz.
 Tanıma motoru: InkVision.swift
 */
@objc(InkPlugin)
public class InkPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "InkPlugin"
    public let jsName = "Ink"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "prepare", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "recognize", returnType: CAPPluginReturnPromise),
    ]

    @objc func prepare(_ call: CAPPluginCall) {
        call.resolve(["ready": true])
    }

    @objc func recognize(_ call: CAPPluginCall) {
        let strokes = Self.points(call.getArray("strokes") ?? [])
        guard !strokes.isEmpty else {
            call.resolve(["candidates": []])
            return
        }
        // Oyun "tr" gönderir; Vision ülke kodunu da ister.
        let short = call.getString("lang", "tr")
        let lang = short.contains("-") ? short : (short == "tr" ? "tr-TR" : short)
        // Tanıma yüz milisaniyeler sürebilir: arayüz donmasın.
        DispatchQueue.global(qos: .userInitiated).async {
            let candidates = InkVision.recognize(strokes: strokes, lang: lang)
            call.resolve(["candidates": candidates])
        }
    }

    /// JS'ten gelen { x: [...], y: [...] } listesini noktalara çevirir; bozuk çizgileri atar.
    private static func points(_ raw: [Any]) -> [[CGPoint]] {
        raw.compactMap { item in
            guard let stroke = item as? [String: Any],
                  let xs = numbers(stroke["x"]), let ys = numbers(stroke["y"]),
                  !xs.isEmpty
            else { return nil }
            return (0..<min(xs.count, ys.count)).map { CGPoint(x: xs[$0], y: ys[$0]) }
        }
    }

    private static func numbers(_ value: Any?) -> [CGFloat]? {
        guard let list = value as? [Any] else { return nil }
        let out = list.compactMap { ($0 as? NSNumber).map { CGFloat($0.doubleValue) } }
        return out.count == list.count ? out : nil
    }
}
