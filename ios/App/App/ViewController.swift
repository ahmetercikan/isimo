import Capacitor
import UIKit

/**
 Uygulamanın web görünümü (Android karşılığı: MainActivity.java).
 - Yerel eklentiyi (el yazısı tanıma, InkPlugin) burada tanıtıyoruz: eklenti listesi
   `ios/App/App/capacitor.config.json` içinde ve her `npx cap sync` ile yeniden üretiliyor,
   bu yüzden oraya elle eklenmez.
 - Oyun tam ekran: durum çubuğunu Capacitor Info.plist'teki UIStatusBarHidden ile gizliyor
   (Android'de de sistem çubukları gizli).
 */
class ViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(InkPlugin())
    }
}
