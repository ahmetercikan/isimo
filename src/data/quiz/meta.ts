// Üretildi: node scripts/quiz-meta.mjs — elle düzenleme.
export interface QuizMeta { id: string; title: string; ask: string; scope: string; count: number }
export const QUIZZES: QuizMeta[] = [
  {
    "id": "harrypotter",
    "title": "Harry Potter",
    "ask": "Sen ne kadar Hogwartslısın?",
    "scope": "8 film (2001–2011)",
    "count": 119
  },
  {
    "id": "yuzuklerinefendisi",
    "title": "Yüzüklerin Efendisi",
    "ask": "Sen ne kadar Hobbitsin?",
    "scope": "Film üçlemesi (2001–2003), sinema sürümleri",
    "count": 60
  },
  {
    "id": "hababam",
    "title": "Hababam Sınıfı",
    "ask": "Sen ne kadar Hababam'sın?",
    "scope": "Klasik seri (1975–1981), ağırlıkla ilk dört film",
    "count": 48
  },
  {
    "id": "gora",
    "title": "G.O.R.A.",
    "ask": "Sen ne kadar Goralısın?",
    "scope": "G.O.R.A. (2004)",
    "count": 48
  },
  {
    "id": "titanik",
    "title": "Titanik",
    "ask": "Sen ne kadar Titaniksin?",
    "scope": "Titanik (1997, James Cameron)",
    "count": 49
  },
  {
    "id": "aslankral",
    "title": "Aslan Kral",
    "ask": "Sen ne kadar Aslan Kral'sın?",
    "scope": "Aslan Kral (1994); birkaç soru 2019 yapımı yeniden çevrimden",
    "count": 47
  },
  {
    "id": "tersyuz",
    "title": "Ters Yüz",
    "ask": "Sen ne kadar Ters Yüz'cüsün?",
    "scope": "Ters Yüz (2015) ve Ters Yüz 2 (2024)",
    "count": 50
  },
  {
    "id": "bluey",
    "title": "Bluey ve Bingo",
    "ask": "Sen ne kadar Heeler'sın?",
    "scope": "Bluey çizgi dizisi (2018–)",
    "count": 49
  },
  {
    "id": "karlarulkesi",
    "title": "Karlar Ülkesi",
    "ask": "Sen ne kadar Arendelle'lisin?",
    "scope": "Karlar Ülkesi (2013) ve Karlar Ülkesi 2 (2019)",
    "count": 49
  },
  {
    "id": "oyuncakhikayesi",
    "title": "Oyuncak Hikâyesi",
    "ask": "Sen ne kadar Andy'nin oyuncağısın?",
    "scope": "Oyuncak Hikâyesi 1-4 (1995, 1999, 2010, 2019)",
    "count": 49
  },
  {
    "id": "shrek",
    "title": "Şrek",
    "ask": "Sen ne kadar bataklıklısın?",
    "scope": "Şrek 1-4 (2001–2010)",
    "count": 50
  },
  {
    "id": "nemo",
    "title": "Kayıp Balık Nemo ve Dori",
    "ask": "Sen ne kadar resif balığısın?",
    "scope": "Kayıp Balık Nemo (2003) ve Kayıp Balık Dori (2016)",
    "count": 50
  },
  {
    "id": "buzdevri",
    "title": "Buz Devri",
    "ask": "Sen ne kadar buzullusun?",
    "scope": "Buz Devri 1-5 (2002–2016)",
    "count": 48
  }
];
