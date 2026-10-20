# App Review'a cevap — İsim Şehir (Guideline 4.3 / 4.2.6)

**Durum:** iOS 1.0.1, 20 Ekim 2026'da "4.3.0 Design: Spam" gerekçesiyle reddedildi. Aynı mesaj aynı
saatte Çizio 1.5.0 ve Sayio 1.0 için de geldi — yani hesabın tamamına bakılmış.

**Yapılacak:** Tekrar **göndermeyin**. App Store Connect → uygulama → **App Review** → reddedilen
gönderi → en altta **Reply to App Review** → aşağıdaki İngilizce metni yapıştırıp gönderin.
Metin, cevap kutusunun 4000 karakter sınırına sığacak şekilde yazıldı.

**Göndermeden önce kontrol edin:** 4. sorudaki test bilgisi ve 9. sorudaki hesap açıklaması gerçek
durumunuzu anlatmalı. Test eden başka kişiler olduysa 4. maddeye ekleyin.

---

## Gönderilecek metin (İngilizce)

We believe this app meets guidelines 4.3(a), 4.3(b) and 4.2.6. Answers to all nine questions:

1. İsim Şehir digitises a Turkish pen-and-paper game. A Turkish letter is drawn and each player writes one word starting with it for every category (person, city, animal, plant, object, country). Whoever fills every box calls STOP; the others get ten seconds. The app does what paper cannot: real-time rooms for up to ten players on their own phones via a six-character code; after each round every answer is shown to everyone and players vote invented ones out by majority; scoring is automatic (10 unique, 5 shared, 20 if you are the only valid answer, 0 otherwise). Answers are handwritten with a finger and recognised on the device with Apple's Vision framework, offline; typing would turn the game into a lookup exercise. A second mode is a Turkish word ladder: change one letter to make another real word, with lives and elimination, from a 3,894-word pool measured so chains do not dead-end.

2. Turkish-speaking families and friends, ages 10 and up, who know this game from school. Everything is Turkish: letter handling (İ/I, Ç, Ş, Ğ, Ö, Ü) and fifteen dictionaries of Turkish cities, given names, dishes and series. Someone who cannot read Turkish cannot use it.

3. Comparable apps are typed, mostly English Scattergories variants; Turkish ones are single-player and offline. None combines: finger handwriting with on-device Turkish recognition; collective voting on disputed answers, which is how the game is really played; about 12,800 curated dictionary entries that flag answers and drive the computer opponents; ten-player rooms; and an original word-ladder mode.

4. Testing has two sides: the developer tests each build on his own device through TestFlight, and his eight-year-old daughter plays the public web build (ahmetercikan.github.io/isimo) with the family, which is how the game is really used. Feedback changed the shipped build: a straight line was read as "1" or "l", letting a player call STOP with empty boxes, so STOP now requires a valid answer in every category; the landscape layout cut off the writing pad, so it was rebuilt; the dictionaries grew to about 12,800 entries; and a misspelling ("Oranguta" against "Orangutan") scored as unique, so matching now resolves answers through the dictionary.

5. Standalone. The same developer has two other apps here: Çizio teaches drawing to ages 5-9 and is on Google Play through several releases; Sayio teaches arithmetic strategy to ages 4-14. Different audiences and engines.

6. Çizio and Sayio are single-child learning apps with no multiplayer and no advertising. This is a competitive, timed, networked party game with advertising; merging them would mix audiences, age ratings and privacy profiles.

7. Yes: the three apps share this developer's own code — a stylesheet and interface shell that give the hand-drawn look, small helpers for sound and local profiles, and the Capacitor configuration. Written only for this app: the round state machine, the room protocol, the handwriting pipeline and Vision plugin, the dictionaries, the scoring and voting engine, the computer opponents and the word-ladder engine.

8. No. Only standard frameworks: React, Vite, Capacitor, Firebase Realtime Database, Google AdMob and Apple's Vision framework. No white-label SDK, template, generation service or licensed content library. Dictionaries, artwork and copy were made for this app.

9. No. Concept, content, code and artwork are by Ahmet Mesut Erçıkan, a member of this team, named in the copyright line. Nobody commissioned it; it is not from a template or generation service. The membership is registered to Abdurrahman Kaan Dikeç and Mr. Erçıkan submits as a member of that team; that is the only reason the seller and copyright names differ. If Apple prefers these apps under an account in the author's own name, tell us and we will begin the transfer.

We can provide a walkthrough video or further detail.
