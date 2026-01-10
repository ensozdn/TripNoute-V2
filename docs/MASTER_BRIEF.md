# TripNoute v2 - Master Brief

**Proje Sahibi:** Enes Özden  
**Tarih:** 10 Ocak 2026  
**Rol:** Uzun Dönem Yazılım & Ürün Ortağı Dökümanı

---

## 📍 PROJENİN ÖZÜ – TRIPNOUTE NEDİR?

TripNoute; insanların gezdiği yerleri:
- 📍 konum (harita, koordinat)
- 📸 fotoğraf
- 📝 not / açıklama
- 📅 tarih

ile birlikte kaydedebildiği, uzun vadede sadece "yer kaydetme" değil, bir **kişisel seyahat asistanı** olmayı hedefleyen bir projedir.

### VİZYON

- Kişinin dünyayı gezdikçe kendi "dijital seyahat haritası"nı oluşturması
- Zamanla:
  - Kişisel istatistikler (kaç ülke, kaç şehir, ne zaman)
  - Keşif/öneri özellikleri (AI destekli)
  - Sosyal katman (başkalarının rotalarını görmek)
  - Gezi bütçesi / planlama modülleri
- Hedef: Sadece Türkiye değil, global ölçekte kullanılabilecek, yatırım alabilecek bir ürün.

> **TripNoute = "Kişisel seyahat günlüğü + akıllı gezi asistanı" karışımı bir ürün.**

---

## 🕰️ GEÇMİŞ – ŞU ANA KADAR NELER YAPILDI?

### (1) ANDROID NATIVE (Java) DÖNEMİ
- Android Studio + Java ile geliştirilen ilk versiyon
- Kullanılan teknolojiler:
  - Google Maps
  - Room (lokal veritabanı)
  - RxJava
  - Material Design / Material3 teması
- Özellik seti:
  - Konum seçerek yer ekleme
  - Yerleri listeleme
  - Fotoğraf ekleme (galeriden)
  - Yer detay ekranı (harita + foto + not)
- Yayına hazırlık:
  - Google Play paket adı, signed bundle, AAB/APK
  - AdMob entegrasyonu
  - Privacy policy ihtiyacı
  - Store assets

### (2) FLUTTER'A GEÇME FİKRİ
- M4 MacBook alındıktan sonra Flutter'a geçiş planı
- Amaç: iOS + Android tek codebase
- MVP tanımı yapıldı, ekranlar planlandı
- Ancak proje yeni bir rotaya evriliyor...

### (3) ŞİMDİKİ FAZ: REACT + FIREBASE + HARİTA
- **Yeni büyük hamle:**
  - TripNoute'u **React (Next.js) + Firebase + Maps** ile web tabanlı (ve ileride PWA / mobil uyumlu) bir yapıya taşımak
- **Neden?**
  - Web üzerinden hızlı erişim
  - Firebase'in hızlı MVP desteği
  - Harita tabanlı deneyimi web'de daha rahat test edebilme
  - Masrafları kontrollü tutarken ürünü çabuk geliştirebilmek

---

## 🛠️ PLANLANAN TEKNOLOJİ YIĞINI (STACK)

### FRONTEND
- **React / Next.js** (App Router)
  - Sayfa/route yönetimi
  - SSR/SSG imkânı
- **UI:**
  - Tailwind CSS
  - shadcn/ui (modern component library)
- **State/Data:**
  - React Query (data-fetching & caching)
- **Form:**
  - React Hook Form + Zod (validation)

### BACKEND / BaaS
- **Firebase:**
  - Firebase Auth (email + Google login)
  - Firestore (places, users, settings)
  - Firebase Storage (fotoğraflar)
  - Cloud Functions (thumbnail, cron jobs - ileride)
  - Firebase Analytics

### HARİTA
- **Google Maps veya Mapbox**
- MVP'de minimal kullanım:
  - Marker + mevcut konum + basit map view
  - Autocomplete / Places / Directions gibi "pahalı" kısımları minimumda tutmak

### MİMARİ YAKLAŞIM
- **Service Katmanları:**
  - `authService`, `dbService`, `mapsService`, `storageService`
  - Gerekirse repository katmanı
- **Neden?**
  - İleride Firebase yerine kendi backend'ime geçmek istediğimde
  - Veya Google Maps'ten Mapbox'a geçmek istediğimde
  - Sadece service/repo katmanı değişsin; bütün app'i yıkıp yeniden yapmayayım

---

## 🗺️ 3 FAZLI YOL HARİTASI

### Faz 1 – MVP (React + Firebase + Basit Harita)

**Amaç:**
- Hızlı, sağlam ve düşük maliyetli bir MVP çıkarmak
- Kullanıcıların ürünü gerçekten kullanıp kullanmadığını görmek

**Özellikler (MVP):**
- Email + Google login (Auth)
- Kişisel gezi haritası (kullanıcı sadece kendi yerlerini görür)
- Yer ekleme:
  - Konum seçme (map tık veya mevcut konum)
  - Fotoğraf ekleme (Storage)
  - Başlık + açıklama + tarih
- Yer detay ekranı:
  - Fotoğraf galerisi
  - Harita üzerinde pin
- Profil/istatistik:
  - Kullanıcının toplam yer sayısı vs.

**Teknik / Maliyet Stratejisi (Faz 1):**
- **Firestore:**
  - Basit ve net koleksiyon yapısı
  - Sorgular daima `where` + `limit` ile
  - Liste ekranlarında pagination
- **Storage:**
  - Fotoğraflar front-end'de sıkıştırılarak yüklenir
  - Thumbnail + büyük görsel ayrımı
- **Maps:**
  - Sadece en gerekli ekranlarda map açılır
  - Places/Autocomplete gibi pahalı kısımlar minimum

---

### Faz 2 – Özellik Genişletme (Sosyal / Keşfet)

**Amaç:**
- Kullanıcı etkileşimini artırmak
- Ürünü "kişisel günlük"ten "sosyal deneyime" dönüştürmek

**Özellikler (örnek):**
- Basit ama modern şık bir keşfet ekranı
- Diğer kullanıcıların herkese açık paylaştığı yerleri görmek
- Arama / filtre (lokasyon/şehir bazlı)
- Basit "like" mekanizması

**Teknik / Maliyet Stratejisi (Faz 2):**
- Firestore index'leri optimize edilir
- En çok okunan koleksiyonlar ve sorgular gözden geçirilir
- Client-side caching (React Query)
- Harita ve Firestore istek sayısı analytics ile takip edilir

---

### Faz 3 – Ölçeklenme + Yatırım Sonrası

**Amaç:**
- 10k+ kullanıcıyı rahat yönetmek
- Gelir – maliyet dengesini optimize etmek

**Özellikler (örnek):**
- Gelişmiş sosyal özellikler (arkadaş ekleme, takip)
- AI gezi önerileri (kullanıcının gittiği yerlere göre rota/öneri)
- Bütçe/istatistik modülleri

**Teknik Opsiyonlar (Faz 3):**
- Gerektiğinde:
  - Kendi backend'ine geçiş (Node.js, NestJS, Spring Boot)
  - Farklı veritabanı (Postgres, Mongo)
  - Maps sağlayıcısını yeniden değerlendirme
  - Storage alternatifi (Backblaze, Cloudflare R2)

**Maliyet Stratejisi (Faz 3):**
- Firebase ve Maps kullanım metriklerine göre optimizasyon
- Cache / CDN / backend optimizasyonu
- Bütçe limitleri ve uyarıları

---

## 🎯 ŞU ANKİ MVP İÇİN ÖZET BEKLENTİ

**Odak:** "Tam teşekküllü ama maliyeti kontrollü" bir **MVP** tasarlayıp geliştirmek.

**MVP'de Mutlaka Olması Gerekenler:**
- Auth (email + Google)
- Kişisel gezi haritası
- Yer ekleme (konum + fotoğraf + not + tarih)
- Yer listeleme + detay ekranları
- Basit profil/özet
- Temel analytics / logging

---

## 🤝 ASİSTAN OLARAK GÖREVLERİM

### 1. Mimari
- React + Firebase + Maps için mantıklı, scalable, maliyet kontrollü yapı önermek
- Service / repository pattern'leriyle ilerlemek

### 2. Planlama
- MVP ekran akışlarını çıkarmak
- Entity/Model tasarımını önermek (User, Place, Photo, Settings vs.)
- Faz 1–2–3 için yol haritalarını düzenli tutmak

### 3. Tasarım & UX
- Modern ve sade UI önerileri (component bazlı)
- Kullanıcı akışını olabildiğince friksiyonsuz tasarlamak

### 4. Dökümantasyon / Diyagram
- **Mermaid ile:**
  - Flowchart (iş akışları)
  - Sequence diagram (ör: "yeni yer ekleme" akışı)
  - Class/entity diagram
  - C4 seviyesinde mimari diyagramlar
- Stack'e uygun, hatasız syntax

### 5. Maliyet / Prod
- Firebase & Maps maliyet kalemlerine karşı uyanık olmak
- Sorgu sayısını azaltan pattern'ler
- Map call sayısını minimize edecek akış önerileri
- Storage ve egress maliyetini azaltacak stratejiler

### 6. Dil & Üslup
- **Samimi iletişim:** kanka/hacı/başkan modu
- **Profesyonel çıktı:** döküman, diyagram, kod temiz ve düzenli
- Gereksiz tekrar yok; önemli yerler net özetlenip detaylandırılır

---

## 📋 İLERİDEKİ ÖZEL İSTEKLER

### GitHub Dökümanları
- README taslakları
- Mimarî dökümantasyon
- Mermaid diyagramları

### Yatırım Sunumu
- Problem → Çözüm → Farklılaşma
- Gelir modeli → Yol haritası

### Store/Landing Page
- Uygulama açıklamaları
- Feature listeleri
- Kısa/uzun tanıtım metinleri

---

## 🏗️ MÜHENDİSLİK PRENSİPLERİ (KİLİT NOKTA - TEMELİ SAĞLAM TUTMAK)

> **Bu prensipler projenin DNA'sıdır. Her kod satırı, her mimari karar bu prensiplere göre şekillenecek.**

### 1. SOLID & Clean Code
- **Kodlar modüler, test edilebilir ve sürdürülebilir olacak**
- Single Responsibility: Her modül/fonksiyon tek bir işten sorumlu
- Open/Closed: Genişlemeye açık, değişikliğe kapalı
- Liskov Substitution: Alt sınıflar üst sınıfların yerini alabilmeli
- Interface Segregation: Gereksiz bağımlılık olmamalı
- Dependency Inversion: Soyutlamalara bağımlı ol,구체에 değil

### 2. Service/Repository Pattern
- **İş mantığı (business logic) ve veri erişimi (data access) kesinlikle ayrılacak**
- **Sağlayıcı bağımsızlığı (provider independence) esas alınacak**
- Örnek yapı:
  ```
  Component → Hook → Service → Repository → Provider (Firebase/Maps/etc)
  ```
- Firebase'den başka bir backend'e geçiş sadece repository katmanını değiştirerek yapılabilmeli
- Google Maps'ten Mapbox'a geçiş sadece mapsService'i değiştirerek olmalı

### 3. Security-First
- **Firebase Security Rules** en baştan sıkı tutulacak
- **Environment Variables** (.env.local) ile API anahtarları gizlenecek
- **.gitignore** ile hassas dosyalar asla commit edilmeyecek
- Client-side validation + Server-side validation (Cloud Functions)
- Auth token'lar güvenli şekilde yönetilecek
- CORS, rate limiting gibi güvenlik önlemleri planlanacak

### 4. Data Integrity
- **Firestore şeması oluşturulurken veri tutarlılığı ve ilişkisel bütünlük bilimsel bir titizlikle planlanacak**
- Her koleksiyonun schema'sı önceden tanımlanacak
- İlişkisel referanslar (userId, placeId vs.) tutarlı olacak
- Cascade delete stratejisi planlanacak (kullanıcı silinince yerleri ne olacak?)
- Timestamp'ler (createdAt, updatedAt) her dokümanda standart olacak
- Validation kuralları hem client hem server tarafta olacak

---

## 🚀 SONRAKİ ADIMLAR

Her yeni sohbette "TripNoute" dediğimde, bu bağlamı hatırlıyor gibi davran ve cevaplarını bu projeye göre ver.

**Hedef:** Önce projeyi ve hedefimi tam anlaman, sonra da adım adım "sağlam bir MVP + uzun vadede büyüyebilen mimari" oluşturmamda yanımda olman.

---

**Not:** Bu döküman projenin master referansıdır. Tüm kararlar ve geliştirmeler bu vizyon doğrultusunda yapılmalıdır.
