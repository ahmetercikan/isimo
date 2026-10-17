import Capacitor
import UIKit

/**
 Uygulamanın web görünümü (Android karşılığı: MainActivity.java).
 - Yerel eklentiyi (el yazısı tanıma, InkPlugin) burada tanıtıyoruz: eklenti listesi
   `ios/App/App/capacitor.config.json` içinde ve her `npx cap sync` ile yeniden üretiliyor,
   bu yüzden oraya elle eklenmez.
 - Ekran yönü: iPhone'da yalnızca dikey (Android ile aynı), iPad'de yatay da serbest.
   Bunu burada belirtmek zorundayız: Capacitor'ın kendi kodu Info.plist'ten yalnızca genel
   `UISupportedInterfaceOrientations` anahtarını okuyor, iPad'e özel `~ipad` anahtarını görmüyor.
 */
class ViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(InkPlugin())
    }

    override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
        UIDevice.current.userInterfaceIdiom == .pad ? [.portrait, .portraitUpsideDown, .landscape] : .portrait
    }
}
