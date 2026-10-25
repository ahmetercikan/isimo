/**
 * Film Avı film listesi (deneme sürümü: 15 yerli + 15 yabancı).
 * Bilgiler (yıl, yönetmen, oyuncu, tür) herkese açık kaynaklardan; konu cümleleri bize ait, başka yerden alınmadı.
 * Afiş yok (telif). Yalnız Film Avı açılınca iner (src/engine/film.ts → loadFilms).
 *
 * a: [3. ipucunda gösterilen oyuncu, 4. ipucunda gösterilen oyuncu] — tanınmış olan sonda (daha büyük ipucu).
 * alt: kabul edilen öbür adlar (orijinal ad, kısa ad). Küçük yazım hataları ayrıca kabul edilir.
 * lv: 1 herkesin bildiği, 2 daha zor (botlar zor filmde geç bilir).
 */
export interface Film {
  id: string;
  /** Türkiye'de bilinen adı (ekranda bu gösterilir). */
  t: string;
  alt?: string[];
  y: number;
  /** Tür ("Dram", "Komedi · Suç"). */
  g: string;
  /** Ülke; yerli filmlerde "Türkiye". */
  c: string;
  /** Yönetmen. */
  d: string;
  a: [string, string];
  /** Tek cümlelik konu (filmin adı geçmez). */
  k: string;
  lv: 1 | 2;
  /** Çizgi film: oyuncu ipucu "Seslendiren" olur. */
  anim?: boolean;
}

export const FILMS: Film[] = [
  // ---------------------------------------------------------------------------- yerli
  { id: 'hababam', t: 'Hababam Sınıfı', y: 1975, g: 'Komedi', c: 'Türkiye', d: 'Ertem Eğilmez', a: ['Münir Özkul', 'Kemal Sunal'], lv: 1,
    k: 'Yaramaz öğrencileriyle ünlü bir özel lise, sert ama babacan yeni bir müdür yardımcısıyla tanışır.' },
  { id: 'selvi', t: 'Selvi Boylum Al Yazmalım', alt: ['Selvi Boylum'], y: 1977, g: 'Dram · Romantik', c: 'Türkiye', d: 'Atıf Yılmaz', a: ['Kadir İnanır', 'Türkan Şoray'], lv: 1,
    k: 'Kamyon şoförü sevgilisinin yarı yolda bıraktığı genç bir kadın, oğluna babalık eden iyi kalpli adamla ilk aşkı arasında kalır.' },
  { id: 'babamveoglum', t: 'Babam ve Oğlum', y: 2005, g: 'Dram', c: 'Türkiye', d: 'Çağan Irmak', a: ['Fikret Kuşkan', 'Çetin Tekindor'], lv: 1,
    k: 'Yıllar önce evden kopan bir gazeteci, küçük oğluyla birlikte Ege\'deki baba çiftliğine geri döner.' },
  { id: 'eskiya', t: 'Eşkıya', y: 1996, g: 'Dram · Suç', c: 'Türkiye', d: 'Yavuz Turgul', a: ['Uğur Yücel', 'Şener Şen'], lv: 1,
    k: 'Otuz beş yıl hapis yatan yaşlı bir dağ adamı, çıkınca kaybettiği sevdiğini aramak için İstanbul\'a gelir.' },
  { id: 'gora', t: 'G.O.R.A.', y: 2004, g: 'Bilimkurgu · Komedi', c: 'Türkiye', d: 'Ömer Faruk Sorak', a: ['Özge Özberk', 'Cem Yılmaz'], lv: 1,
    k: 'Sahte uzay fotoğraflarıyla halı satan bir adam, gerçekten uzaylılarca kaçırılır ve bir gezegeni kurtarmak zorunda kalır.' },
  { id: 'vizontele', t: 'Vizontele', y: 2001, g: 'Komedi · Dram', c: 'Türkiye', d: 'Yılmaz Erdoğan, Ömer Faruk Sorak', a: ['Demet Akbağ', 'Yılmaz Erdoğan'], lv: 1,
    k: '1970\'lerde Doğu\'daki küçük bir kasabaya ilk kez televizyon gelir; herkes yayını yakalamak için seferber olur.' },
  { id: 'recep', t: 'Recep İvedik', y: 2008, g: 'Komedi', c: 'Türkiye', d: 'Togan Gökbakar', a: ['Fatma Toptaş', 'Şahan Gökbakar'], lv: 1,
    k: 'Kaba saba ama iyi kalpli bir adam, çocukluk aşkına rastladığı lüks bir otelde ortalığı birbirine katar.' },
  { id: 'ayla', t: 'Ayla', y: 2017, g: 'Dram · Savaş', c: 'Türkiye', d: 'Can Ulkay', a: ['Çetin Tekindor', 'İsmail Hacıoğlu'], lv: 1,
    k: 'Kore Savaşı\'nda bir Türk askeri, ailesini kaybetmiş küçük bir kız bulur ve onu yanına alır.' },
  { id: 'kisuykusu', t: 'Kış Uykusu', y: 2014, g: 'Dram', c: 'Türkiye', d: 'Nuri Bilge Ceylan', a: ['Melisa Sözen', 'Haluk Bilginer'], lv: 2,
    k: 'Kapadokya\'da küçük bir otel işleten emekli bir tiyatro oyuncusu, kış boyunca karısı ve kız kardeşiyle hesaplaşır.' },
  { id: 'arabesk', t: 'Arabesk', y: 1988, g: 'Komedi', c: 'Türkiye', d: 'Ertem Eğilmez', a: ['Müjde Ar', 'Şener Şen'], lv: 2,
    k: 'Yeşilçam melodramlarının bütün kalıplarıyla dalga geçen bir aşk hikâyesi: çocukluk sevgilileri bir türlü kavuşamaz.' },
  { id: 'tosunpasa', t: 'Tosun Paşa', y: 1976, g: 'Komedi', c: 'Türkiye', d: 'Kartal Tibet', a: ['Şener Şen', 'Kemal Sunal'], lv: 1,
    k: 'Mısır\'da iki rakip konak, değerli bir araziyi kapmak için birbirine tuzak kurar; işin ortasında saf bir uşak kalır.' },
  { id: 'kibarfeyzo', t: 'Kibar Feyzo', y: 1978, g: 'Komedi', c: 'Türkiye', d: 'Atıf Yılmaz', a: ['Şener Şen', 'Kemal Sunal'], lv: 1,
    k: 'Başlık parası yüzünden sevdiği kızla evlenemeyen saf bir köylü, köyün ağasına karşı kendi yolunu bulmaya çalışır.' },
  { id: 'gonulyarasi', t: 'Gönül Yarası', y: 2005, g: 'Dram', c: 'Türkiye', d: 'Yavuz Turgul', a: ['Meltem Cumbul', 'Şener Şen'], lv: 2,
    k: 'Doğu\'da yıllarca öğretmenlik yapıp emekli olan bir adam, İstanbul\'da taksiciliğe başlar ve bir pavyon şarkıcısını korumaya alır.' },
  { id: 'organize', t: 'Organize İşler', y: 2005, g: 'Komedi · Suç', c: 'Türkiye', d: 'Yılmaz Erdoğan', a: ['Tolga Çevik', 'Yılmaz Erdoğan'], lv: 1,
    k: 'Araba çalan bir çetenin başı, süper kahraman kılığında dolaşan saf bir adamı ekibine katar.' },
  { id: 'yahsibati', t: 'Yahşi Batı', y: 2010, g: 'Komedi · Western', c: 'Türkiye', d: 'Ömer Faruk Sorak', a: ['Ozan Güven', 'Cem Yılmaz'], lv: 1,
    k: 'Padişahın Amerika\'ya gönderdiği iki Osmanlı elçisi, kaybettikleri hediye elmasın peşinde Vahşi Batı\'ya düşer.' },

  // ---------------------------------------------------------------------------- yabancı
  { id: 'shawshank', t: 'Esaretin Bedeli', alt: ['The Shawshank Redemption', 'Shawshank'], y: 1994, g: 'Dram', c: 'ABD', d: 'Frank Darabont', a: ['Tim Robbins', 'Morgan Freeman'], lv: 1,
    k: 'Haksız yere ömür boyu hapse mahkûm edilen bir bankacı, yıllar boyunca umudunu hiç kaybetmez.' },
  { id: 'titanik', t: 'Titanik', alt: ['Titanic'], y: 1997, g: 'Romantik · Dram', c: 'ABD', d: 'James Cameron', a: ['Kate Winslet', 'Leonardo DiCaprio'], lv: 1,
    k: 'Dev bir yolcu gemisinin ilk seferinde, zengin bir genç kızla yoksul bir ressam birbirine âşık olur.' },
  { id: 'yuzuk', t: 'Yüzüklerin Efendisi: Yüzük Kardeşliği', alt: ['Yüzüklerin Efendisi', 'Yüzük Kardeşliği', 'The Lord of the Rings', 'Lord of the Rings'], y: 2001, g: 'Fantastik · Macera', c: 'Yeni Zelanda · ABD', d: 'Peter Jackson', a: ['Viggo Mortensen', 'Elijah Wood'], lv: 1,
    k: 'Ufak tefek bir köylü, bütün dünyayı tehdit eden bir yüzüğü yok etmek için tehlikeli bir yolculuğa çıkar.' },
  { id: 'godfather', t: 'Baba', alt: ['The Godfather', 'Godfather'], y: 1972, g: 'Suç · Dram', c: 'ABD', d: 'Francis Ford Coppola', a: ['Al Pacino', 'Marlon Brando'], lv: 1,
    k: 'Mafya ailesinin reisi vurulunca, aile işlerine hiç bulaşmak istemeyen küçük oğul yavaş yavaş ailenin başına geçer.' },
  { id: 'forrest', t: 'Forrest Gump', y: 1994, g: 'Dram · Komedi', c: 'ABD', d: 'Robert Zemeckis', a: ['Robin Wright', 'Tom Hanks'], lv: 1,
    k: 'Saf ve iyi kalpli bir adam, farkında olmadan Amerika tarihinin pek çok önemli anına tanıklık eder.' },
  { id: 'matrix', t: 'Matrix', alt: ['The Matrix'], y: 1999, g: 'Bilimkurgu · Aksiyon', c: 'ABD', d: 'Lana ve Lilly Wachowski', a: ['Carrie-Anne Moss', 'Keanu Reeves'], lv: 1,
    k: 'Bir bilgisayar korsanı, yaşadığı dünyanın makinelerin kurduğu bir benzetim olduğunu öğrenir.' },
  { id: 'harrypotter', t: 'Harry Potter ve Felsefe Taşı', alt: ['Harry Potter', 'Felsefe Taşı', "Harry Potter and the Philosopher's Stone"], y: 2001, g: 'Fantastik', c: 'İngiltere · ABD', d: 'Chris Columbus', a: ['Emma Watson', 'Daniel Radcliffe'], lv: 1,
    k: 'Teyzesinin evinde merdiven altında büyüyen bir çocuk, on bir yaşında bir büyücülük okuluna çağrılır.' },
  { id: 'aslankral', t: 'Aslan Kral', alt: ['The Lion King', 'Lion King'], y: 1994, g: 'Animasyon', c: 'ABD', d: 'Roger Allers, Rob Minkoff', a: ['Jeremy Irons', 'Matthew Broderick'], lv: 1, anim: true,
    k: 'Babası öldürülen genç bir yavru, sürgünden dönüp krallığını amcasından geri almak zorundadır.' },
  { id: 'interstellar', t: 'Yıldızlararası', alt: ['Interstellar'], y: 2014, g: 'Bilimkurgu', c: 'ABD · İngiltere', d: 'Christopher Nolan', a: ['Anne Hathaway', 'Matthew McConaughey'], lv: 1,
    k: 'Kuraklıkla tükenen dünyadan insanlığa yeni bir yuva bulmak için bir pilot, ailesini bırakıp uzaya gider.' },
  { id: 'darkknight', t: 'Kara Şövalye', alt: ['The Dark Knight', 'Dark Knight', 'Batman Kara Şövalye'], y: 2008, g: 'Aksiyon · Suç', c: 'ABD · İngiltere', d: 'Christopher Nolan', a: ['Heath Ledger', 'Christian Bale'], lv: 1,
    k: 'Gece şehrini koruyan maskeli bir kahraman, kaos yaymaktan zevk alan bir suçluyla karşı karşıya gelir.' },
  { id: 'gladyator', t: 'Gladyatör', alt: ['Gladiator'], y: 2000, g: 'Tarih · Aksiyon', c: 'ABD · İngiltere', d: 'Ridley Scott', a: ['Joaquin Phoenix', 'Russell Crowe'], lv: 1,
    k: 'Ailesi öldürülüp köle yapılan bir Romalı general, arenada dövüşerek imparatordan intikam almaya çalışır.' },
  { id: 'hayatguzel', t: 'Hayat Güzeldir', alt: ['La vita è bella', 'Life Is Beautiful'], y: 1997, g: 'Dram · Komedi', c: 'İtalya', d: 'Roberto Benigni', a: ['Nicoletta Braschi', 'Roberto Benigni'], lv: 2,
    k: 'Toplama kampına düşen neşeli bir baba, küçük oğlunu korumak için her şeyin bir oyun olduğuna onu inandırır.' },
  { id: 'jurassic', t: 'Jurassic Park', y: 1993, g: 'Bilimkurgu · Macera', c: 'ABD', d: 'Steven Spielberg', a: ['Laura Dern', 'Sam Neill'], lv: 1,
    k: 'Bir adada bilimle yeniden canlandırılan dinozorların parkı, ziyaretçilere açılmadan kontrolden çıkar.' },
  { id: 'karayip', t: 'Karayip Korsanları: Siyah İnci\'nin Laneti', alt: ['Karayip Korsanları', 'Pirates of the Caribbean'], y: 2003, g: 'Macera · Fantastik', c: 'ABD', d: 'Gore Verbinski', a: ['Orlando Bloom', 'Johnny Depp'], lv: 1,
    k: 'Tuhaf tavırlı bir korsan kaptan, lanetli bir tayfadan gemisini geri almak için genç bir demirciyle güçlerini birleştirir.' },
  { id: 'avatar', t: 'Avatar', y: 2009, g: 'Bilimkurgu', c: 'ABD', d: 'James Cameron', a: ['Zoe Saldaña', 'Sam Worthington'], lv: 1,
    k: 'Felçli bir asker, uzak bir aydaki yerli halkın arasına yapay bir bedenle gönderilir ve taraf değiştirir.' },
];

/**
 * Yalnız öneri listesinde çıkan filmler (ipucu yok, hiçbir turda sorulmaz). Öneri listesinde
 * yalnız sorulan filmler olsaydı liste cevabı ele verirdi; bunları seçmek yanlış tahmin sayılır.
 */
export const DECOYS: string[] = [
  'Neşeli Günler', 'Süt Kardeşler', 'Çöpçüler Kralı', 'Hokkabaz', 'Av Mevsimi', 'Dedemin İnsanları', 'Eyyvah Eyvah',
  'Düğün Dernek', 'Kelebeğin Rüyası', 'Mucize', 'Bizim Aile', 'Muhsin Bey', 'Ağır Roman', 'Kurtlar Vadisi Irak',
  "Bir Zamanlar Anadolu'da", 'Çiçek Abbas', 'Şaban Oğlu Şaban', 'Propaganda', 'Hayat Var', 'Ali Baba ve 7 Cüceler',
  'Başlangıç', 'Yeşil Yol', 'Dövüş Kulübü', 'Kuzuların Sessizliği', 'Ucuz Roman', 'Geleceğe Dönüş', 'Terminatör',
  "Er Ryan'ı Kurtarmak", "Schindler'in Listesi", 'Oyuncak Hikayesi', 'Shrek', 'Buz Devri', 'Karlar Ülkesi', 'Joker',
  'Yenilmezler', 'Rocky', 'Örümcek Adam', 'Yıldız Savaşları', 'Hızlı ve Öfkeli', 'Kayıp Balık Nemo',
];
