# App Review'a cevap — İsim Şehir (Guideline 4.3 / 4.2.6)

**Durum:** iOS 1.0.1, 20 Ekim 2026'da "4.3.0 Design: Spam" gerekçesiyle reddedildi. Aynı mesaj aynı
saatte Çizio 1.5.0 ve Sayio 1.0 için de geldi — yani hesabın tamamına bakılmış.

**Yapılacak:** Tekrar **göndermeyin**. App Store Connect → uygulama → **App Review** → reddedilen
gönderi → en altta **Reply to App Review** → aşağıdaki İngilizce metni yapıştırıp gönderin.

**Göndermeden önce kontrol edin:** 4. ve 9. soruların cevapları sizin gerçek durumunuzu anlatmalı.
Metinde yazanlar bildiklerimizden ibaret; test eden başka kişiler olduysa oraya ekleyin.

---

## Gönderilecek metin (İngilizce)

Dear App Review Team,

We believe this app meets the requirements of guidelines 4.3(a), 4.3(b) and 4.2.6, and we are answering
all nine questions in full below. The app has not been resubmitted.

**1. What the app does and the primary problem it solves**

İsim Şehir is a digital version of a pen-and-paper game that is part of Turkish school culture: a letter
of the Turkish alphabet is drawn, and each player must write one word starting with that letter for every
category (person, city, animal, plant, object, country and so on). The first player to fill every box calls
"STOP" and everyone else has ten seconds left.

Playing it on paper has four practical problems, and the app solves each one:
- Everyone must be in the same room with paper and pens. The app runs real-time rooms: one player creates a
  room, the others join with a six-character code, and up to ten people can play from their own phones.
- Players argue about whether an answer is real. The app shows every answer to every player after the round,
  with the original handwriting, and lets players vote an answer out; the majority decides. Fifteen built-in
  Turkish dictionaries (about 12,800 curated entries) mark which answers exist in a dictionary, but the
  players, not the app, have the final word.
- Scoring is tedious and error-prone. The app scores automatically: 10 points for a valid answer nobody else
  gave, 5 if someone else gave the same answer, 20 if you are the only player with a valid answer in that
  category, 0 for empty, misspelled single-letter or wrong-letter answers.
- Someone has to run the game. The app draws letters without repeating them inside a game, runs the timer,
  enforces the STOP rule and moves everyone through the rounds together.

Answers are written with a finger, not typed. On iOS the handwriting is recognised on the device with
Apple's Vision framework, offline. Writing by hand is deliberate: typing turns the game into a spelling
exercise and makes it easy to look answers up, while handwriting keeps the feel of the paper game.

The app also contains a second, different game mode called "Sıra Sende": a Turkish word-ladder game in
which players take turns changing exactly one letter of the word on the table to make another real Turkish
word (KAR → KAZ → KÖZ). Each player has lives; a player who cannot find a word loses one, and the last
player standing wins. It uses a separate 3,894-word Turkish pool that we built and measured for chain
connectivity, so that games do not dead-end.

**2. Intended users**

Turkish-speaking families and groups of friends, roughly ages 10 and up, who already know this specific
game from school. It is not a general international word game: the alphabet handling (Turkish İ/I, Ç, Ş,
Ğ, Ö, Ü), the category dictionaries (Turkish cities and districts, Turkish given names, Turkish dishes,
Turkish TV series), the voice narration and the entire interface are Turkish. A player who does not read
Turkish cannot use the app.

**3. The gap in the market**

Existing apps in this space are typed word games, mostly English-language Scattergories-style titles. The
Turkish ones we are aware of are single-player, offline and typing-based. This app addresses gaps that
none of them cover together:
- Finger handwriting input with on-device Turkish handwriting recognition, including recovery from common
  recognition errors (a missing dot or cedilla on the first letter is corrected to the round's letter).
- Collective judging: answers are reviewed together and voted on, which is how the game is actually played
  among friends. We found no competitor that reproduces this social step.
- Fifteen curated Turkish dictionaries with about 12,800 entries, used both to flag answers and to drive
  the computer opponents.
- Real-time rooms for up to ten players on their own phones, plus three difficulty levels of computer
  opponents for playing alone.
- A second, original Turkish word-ladder mode with a vocabulary pool measured for playability.

**4. Beta testing before submission**

The app was tested through TestFlight on the developer's own devices and in play sessions on the public
web build (https://ahmetercikan.github.io/isimo/) before submission. Feedback from those sessions changed
the production build. Concrete examples:
- A tester found that drawing a single straight line in every box let a player call "STOP" without really
  answering: the recognizer read a vertical line as "1" or "l". We now require every category to hold a
  valid answer (at least two letters, starting with the round's letter) before the STOP button unlocks, the
  recognizer discards single-character candidates, and single-letter answers score zero.
- Testers reported that the writing pad was cut off and the buttons covered the screen when the phone was
  held sideways. We added a dedicated landscape layout in which the writing pad and the controls sit side
  by side.
- Testers said the "play against computer opponents" entry point was easy to miss on the home screen, so it
  became a full button instead of a translucent strip.
- Testers said the word packages were too small, so we expanded them to about 12,800 dictionary entries.
- A tester noticed a scoring error: when three players wrote "Orangutan" and one wrote "Oranguta", the
  misspelling counted as a unique answer and scored more than the correct ones. Matching now resolves
  answers through the dictionary, so a misspelling scores as the same answer.

**5. Standalone product or part of a suite**

İsim Şehir is a standalone product. Two other apps by the same developer exist on this account, and they
are different products for different people:
- Çizio teaches children aged 5 to 9 to draw, step by step, with narrated lessons, a dress-up studio and a
  3D island to explore.
- Sayio teaches mental-arithmetic strategies and problem solving to children aged 4 to 14, with a
  multiplication-table curriculum based on derivation strategies and spaced repetition.
- İsim Şehir is a competitive multiplayer party word game for families and friends.

Different audiences, different content, different engines and different session shapes. What they share is
the same developer's hand-drawn visual style and the shared interface code described in question 7.

**6. Why this is not a feature inside another app**

The three apps have incompatible shapes. Çizio and Sayio are single-child learning apps used alone, with no
multiplayer, no timers against other people and no advertising. İsim Şehir is a competitive, timed,
real-time multiplayer game that uses network rooms and shows advertising between games. Putting a
competitive ad-supported party game inside a children's learning app would mix audiences, change its age
rating and its privacy profile, and would be worse for the children those apps are built for.

**7. Code, frameworks or assets shared with other apps on this account**

Yes, and we want to be precise about it. The three apps written by this developer share a layer of his own
code: a common stylesheet and interface shell that produce the hand-drawn look, small helper modules for
sound playback and local profile storage, and the Capacitor project configuration. This is the developer's
own code reused across his own apps, not third-party code.

Everything that defines each app is unique to it and was written for it: in İsim Şehir, the game director
and round state machine, the real-time room protocol, the handwriting pipeline and its Vision-based native
plugin, the fifteen category dictionaries, the scoring and voting engine, the computer opponents and the
word-ladder engine. None of this exists in the other apps, and none of the other apps' core code (Çizio's
3D island and drawing-grading engine, Sayio's question generators and multiplication curriculum) exists
here.

**8. Code, SDK or content library shared with third-party apps**

No. Beyond standard, publicly available frameworks, the app contains no shared component: React, Vite and
Capacitor for the application shell, Firebase Realtime Database for the online rooms, Google AdMob for
advertising, and Apple's Vision framework for on-device handwriting recognition. There is no white-label
SDK, no commercial template, no app generation service and no licensed content library. The dictionaries,
artwork, icons, sound design and copy were produced by the developer for this app.

**9. Was the app created for a client, partner or other third party?**

No. The concept, content, code, artwork and branding were created by Ahmet Mesut Erçıkan, who is a member
of this developer team and is named in the app's copyright line. The app was not commissioned by anyone,
was not built on behalf of a third party, and was not produced from a commercial template or an app
generation service. The Apple Developer Program membership is registered to Abdurrahman Kaan Dikeç, and
Mr. Erçıkan develops and submits his apps as a member of that team; that is the only reason the seller
name and the copyright line differ. If Apple would prefer these apps to be distributed under a developer
account in the author's own name, we will do that — please tell us and we will begin the transfer.

Thank you for reviewing this in detail. We are happy to provide a build walkthrough, a video of a full
game, or any further information you need.

Kind regards,
Ahmet Mesut Erçıkan
