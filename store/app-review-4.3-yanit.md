# App Review'a gönderilen cevap — İsim Şehir (Guideline 4.3 / 4.2.6)

**Durum:** iOS 1.0.1, 20 Ekim 2026'da "4.3.0 Design: Spam" gerekçesiyle reddedildi. Aynı mesaj aynı saatte
üç uygulamaya birden geldi (İsim Şehir, Çizio, Sayio), yani hesabın tamamına bakılmış.

**Gönderildi:** 20 Ekim 2026. App Store Connect → İsim Şehir → App Review → reddedilen gönderi → Reply to App
Review. Aşağıdaki metnin birebir aynısı gönderildi (3.9 bin karakter; kutunun sınırı 4000).
Telif satırı da aynı gün hesap sahibinin adına çevrildi, böylece satıcı ile telif aynı isim.

**Bundan sonra:** Apple cevap verene kadar uygulamayı tekrar göndermeyin.

---

## Gönderilen metin

Hello,

We have not resubmitted the app. Here are our answers to all nine questions.

1. Isim Sehir is the digital version of a pen and paper game almost every Turkish child plays at school. The app draws a Turkish letter and each player writes one word starting with it for every category: person, city, animal, plant, object, country. Whoever fills all the boxes first presses STOP and the others have ten seconds left. On paper the game needs everyone at one table, someone to settle arguments about invented words, and someone to add up the score. The app does all three. Up to ten players join a room from their own phones with a six character code, every answer is shown to everyone at the end of a round so players can vote out the ones they think are made up, and points are counted automatically. Answers are written with a finger and read on the device by the Vision framework, because typing would turn the game into a lookup exercise. The app also holds a second game, a Turkish word ladder where one letter changes at a time.

2. Turkish speaking families and groups of friends, from about age ten upward, who already know the game. Everything in it is Turkish, from the handling of letters such as I and İ to fifteen dictionaries of Turkish cities, first names, dishes and television series. It is of no use to anyone who does not read Turkish.

3. The comparable apps we looked at are typed, and most are English Scattergories variants. The Turkish ones are single player and offline. None brings together handwriting read on the device in Turkish, a voting step so players decide which answers count, about 12,800 curated dictionary entries, rooms for ten players, and a word ladder of our own.

4. Two people test the app. One of us installs every build on his own iPhone through TestFlight, and his eight year old daughter plays the public web build at ahmetercikan.github.io/isimo with the family. Things they found went into the build you have. A straight line in a box was read as the letter l, which let a player press STOP with empty boxes, so STOP now opens only when every category holds a real answer. The writing pad was cut off when the phone was held sideways, so we rebuilt that screen. A misspelling scored higher than the correct spelling because the app counted it as a unique answer, so matching now goes through the dictionary.

5. It stands on its own. Two other apps of ours are on this account. Cizio teaches drawing to children aged five to nine and has been on Google Play through several releases, and Sayio teaches arithmetic strategy to ages four to fourteen. Different ages, subjects and code.

6. The other two are quiet single player apps for one child, with no opponents and no advertising. This one is a competitive game with a timer, network rooms and ads. Putting them together would mix audiences, age ratings and privacy profiles in one app.

7. There is shared code and we would rather describe it plainly. The three apps use the same stylesheet and interface shell, which gives them a similar hand drawn look, plus small helpers for sound and for storing a profile, and the same Capacitor setup. All of it is our own code. Everything that makes this app what it is was written for it: the rounds, the room protocol, the handwriting plugin, the dictionaries, the scoring and voting, and the word ladder.

8. No. Apart from React, Vite, Capacitor, Firebase Realtime Database, Google AdMob and Apple's Vision framework there is nothing shared. No white label kit, no bought template, no generation service, no licensed content. We wrote the dictionaries, drew the artwork and wrote the text.

9. Nobody asked us to build it and nobody supplied the idea, the content or the branding. It was written by Ahmet Mesut Ercikan, a developer on this team, and it is published under this account, which also holds the copyright. No part of it came from a template or a generation service.

If a video of a game would help, we will send one.
