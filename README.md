# 🚀 Itown — Web Tabanlı Discord Klonu

Arkadaşlarınız ve kuzenlerinizle birlikte kullanabileceğiniz, hiçbir ek uygulama yüklemeden doğrudan tarayıcı üzerinden çalışan Discord benzeri sesli, görüntülü ve ekran paylaşımlı sohbet platformu.

---

## ✨ Özellikler

1. **Sesli Sohbet Odaları (WebRTC Mesh):**
   - Düşük gecikmeli, yüksek kaliteli ses iletişimi.
   - Konuşurken Discord tarzı **yeşil parlayan halka (Speaking Indicator)**.
   - Mikrofon susturma (Mute) ve kulaklık sağırlaştırma (Deafen).
   - Discord'un orijinal ses efektleri (Katılma, Ayrılma, Mute, Yeni Mesaj sesleri).

2. **Ekran Paylaşımı (Screen Share):**
   - Tek tıkla tüm ekranı, belirli bir pencereyi veya tarayıcı sekmesini arkadaşlarınızla canlı paylaşma.
   - Ekran paylaşımı açıldığında otomatik **Sinema / Spotlight Modu**.

3. **Kamera & Görüntülü Sohbet (Webcam):**
   - HD kamera açma/kapama desteği.
   - Video ızgarası (Grid view) ve dinamik boyutlandırma.

4. **Metin Sohbeti & Medya Paylaşımı:**
   - Çoklu metin kanalları (`#genel-sohbet`, `#oyun-sohbeti`, `#makara-medya`).
   - Ekran görüntüsü ve resim yükleme (Panodan `Ctrl + V` ile doğrudan yapıştırma desteği).
   - Hızlı emoji paneli.

5. **Kullanıcı & Profil Yönetimi:**
   - Takma ad (Nickname) ve sevimli avatar seçici.
   - Çevrim içi kullanıcı listesi ve ses odalarındaki üyelerin anlık görünümü.
   - Tek tıkla davet bağlantısını kopyalama.

---

## 🛠️ Nasıl Çalıştırılır?

### 1. Uygulamayı Başlatma
Proje dizininde terminali açıp şu komutu yazmanız yeterlidir:

```bash
npm start
```

Sunucu başladıktan sonra tarayıcınızda şu adresi açın:
👉 **`http://localhost:3001`**

---

## 🌐 Arkadaşlarınızla & Kuzenlerinizle Nasıl Paylaşırsınız?

### A. Aynı Ev / Wi-Fi Ağındaysanız (Yerel Ağ):
Bilgisayarınızın yerel IP adresini öğrenin (Windows için terminale `ipconfig` yazın, örn: `192.168.1.35`).
Kuzenleriniz telefonlarından veya bilgisayarlarından şu adrese girsin:
👉 `http://192.168.1.35:3001`

### B. Farklı Evlerdeyseniz (İnternet Üzerinden Ücretsiz Paylaşım):
Farklı şehirlerde veya evlerdeki kuzenlerinizle oynamak için ücretsiz bir tünel aracı (Cloudflare Tunnel, ngrok veya localtunnel) kullanabilirsiniz:

1. **Cloudflare Tunnel (En kolay ve ücretsiz):**
   ```bash
   npx cloudflared tunnel --url http://localhost:3001
   ```
   Size verdiği güvenli `https://...trycloudflare.com` bağlantısını arkadaşlarınıza atmanız yeterlidir!

2. **Localtunnel:**
   ```bash
   npx localtunnel --port 3001
   ```

*(Not: WebRTC'de mikrofon ve kamera izinlerinin tarayıcıda çalışabilmesi için `localhost` veya `https://` gereklidir. Cloudflare / ngrok otomatik olarak HTTPS sağlar).*

---

## 📁 Proje Yapısı

```
Itown/
├── server.js              # Node.js + Express + Socket.io (Sinyalleşme ve oda yönetimi)
├── package.json           # Proje bağımlılıkları ve çalıştırma komutları
└── client/                # React + Vite + Tailwind CSS arayüzü
    ├── src/
    │   ├── components/    # Sidebar, VoiceRoomView, ChatArea, MemberList, Settings
    │   ├── hooks/         # useWebRTC.js (Ses, kamera ve ekran paylaşım motoru)
    │   └── utils/         # soundEffects.js (Web Audio API ses efektleri)
    └── dist/              # Derlenmiş hazır frontend dosyaları
```

