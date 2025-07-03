<div align="center">

# 🎮 Alsia Discord Bot

<img src="https://img.shields.io/badge/Discord.js-v14-blue?style=for-the-badge&logo=discord" alt="Discord.js">
<img src="https://img.shields.io/badge/Node.js-16+-green?style=for-the-badge&logo=node.js" alt="Node.js">
<img src="https://img.shields.io/badge/Database-CroxyDB%20%26%20MongoDB-purple?style=for-the-badge" alt="Database">
<img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License">

**Gelişmiş Discord Sunucu Yönetim Botu**

*Ticket sistemi, ot yönetimi, etkinlik organizasyonu ve kapsamlı moderasyon araçları ile donatılmış profesyonel Discord botu.*

</div>

---

## 🚀 Özellikler

- 🎫 **3 Kategorili Ticket Sistemi** - Genel destek, mülakat ve şikayet kategorileri
- 🌿 **Ot Yönetim Sistemi** - Talep, onay/red ve envanter takibi
- 🎮 **Etkinlik Organizasyonu** - Otomatik katılımcı yönetimi ve sonlandırma
- 👥 **Gelişmiş Moderasyon** - Ban/unban, mesaj yönetimi, rol kontrolü
- 📊 **Kapsamlı Logging** - Tüm aktivitelerin detaylı kaydı
- 🔊 **Otomatik Ses Bağlantısı** - Belirtilen ses kanalına otomatik bağlanma
- 📈 **Aktiflik Takibi** - Kullanıcı aktivite izleme ve raporlama
- 💬 **DM Sistemi** - Toplu mesaj gönderme ve bildirimler
- 🎨 **Özelleştirilebilir Embeds** - Tamamen kişiselleştirilebilir görünüm

---

## 📋 Gereksinimler

- **Node.js** v16.11.0 veya üzeri
- **Discord Bot Token**
- **MongoDB** (Opsiyonel - CroxyDB ile de çalışır)
- **Discord Sunucusu** (Yönetici yetkisi gerekli)

---

## ⚡ Kurulum

### 1. Projeyi İndirin
```bash
git clone https://github.com/kullaniciadi/alsia-discord-bot.git
cd alsia-discord-bot
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Konfigürasyon Dosyalarını Ayarlayın

**config.json:**
```json
{
  "token": "BOT_TOKEN_BURAYA",
  "mongoURL": "MONGODB_URL_BURAYA"
}
```

**ayarlar.json:**
```json
{
  "Bot": {
    "clientId": "BOT_CLIENT_ID",
    "guildId": "SUNUCU_ID",
    "botID": "BOT_ID",
    "durum": "dev by alsia",
    "durumTipi": "PLAYING"
  },
  "Yetkiler": {
    "Staff": ["YETKILI_ROL_ID_1", "YETKILI_ROL_ID_2"],
    "yetkili": "YETKILI_ROL_ID",
    "yetkiliRolId": "YETKILI_ROL_ID",
    "ekipRoleId": "EKIP_ROL_ID"
  },
  "Kanallar": {
    "sesKanalId": "SES_KANAL_ID",
    "logKanalId": "LOG_KANAL_ID",
    "bilgiKanal": "BILGI_KANAL_ID"
  },
  "Ticket": {
    "parentCategory": "TICKET_KATEGORI_ID",
    "ticketLog": "TICKET_LOG_KANAL_ID"
  },
  "Embed": {
    "authorembed": "ᴀʟꜱɪᴀ ʙᴏᴛ",
    "footerText": "Alsia Was Here",
    "iconURL": "BOT_AVATAR_URL"
  },
  "Resimler": {
    "moderasyonURL": "EMBED_RESIM_URL",
    "banner": "BANNER_RESIM_URL"
  }
}
```

### 4. Botu Başlatın
```bash
node index.js
```

---

## 🎯 Komutlar

### 📱 Slash Komutlar

#### 🎫 **Ticket Yönetimi**
```
» /ticket-kurulum
  └─ Ticket sistemini kurar ve embed mesajını gönderir

» /ticket-isim (isim)
  └─ Mevcut ticket kanalının ismini değiştirir
```

#### 🌿 **Ot Sistemi**
```
» /ot (kullanıcı)
  └─ Belirtilen kullanıcının ot miktarını gösterir

» /ot-ekle (kullanıcı) (miktar)
  └─ Kullanıcıya ot ekler

» /ot-sil (kullanıcı) (miktar)
  └─ Kullanıcıdan ot siler

» /envanter (kullanıcı)
  └─ Kullanıcının envanterini gösterir
```

#### 🎮 **Etkinlik Sistemi**
```
» /etkinlik-kur (isim) (katılımcı-sayısı)
  └─ Yeni etkinlik oluşturur

» /aktiflik-baslat (süre)
  └─ Aktiflik etkinliği başlatır

» /sıralama
  └─ Ot sıralamasını gösterir
```

#### 👥 **Moderasyon**
```
» /ban (kullanıcı) (sebep)
  └─ Kullanıcıyı sunucudan yasaklar

» /unban (kullanıcı-id)
  └─ Kullanıcının yasağını kaldırır

» /sil (miktar)
  └─ Belirtilen miktarda mesaj siler

» /dm-gonder (kullanıcı) (mesaj)
  └─ Kullanıcıya özel mesaj gönderir

» /rol-bilgi (rol)
  └─ Rol hakkında detaylı bilgi verir

» /restart
  └─ Botu yeniden başlatır
```

### 🖱️ **Sağ Tık (Context Menu) Komutlar**
```
» Ticket'a Ekle
  └─ Seçilen kullanıcıyı ticket kanalına ekler

» Ticket'tan Çıkar  
  └─ Seçilen kullanıcıyı ticket kanalından çıkarır
```

### 🔘 **Button Etkileşimleri**

#### 📋 **Ticket Açma Butonları**
- 🔧 **Genel Destek** - Genel sorular ve destek için
- 👤 **Mülakat Destek** - Ekip mülakatları için  
- ⚠️ **Şikayet Destek** - Şikayet ve raporlar için

#### 🌿 **Ot Sistemi Butonları**
- 📝 **Ot Talep Et** - Ot talep formu açar
- ✅ **Onayla** - Ot talebini onaylar (Yetkili)
- ❌ **Reddet** - Ot talebini reddeder (Yetkili)

#### 🎮 **Etkinlik Butonları**
- 🎯 **Etkinliğe Katıl** - Etkinliğe katılım sağlar
- 🚪 **Etkinlikten Ayrıl** - Etkinlikten ayrılır
- 🔚 **Sonlandır** - Etkinliği sonlandırır (Oluşturan)

---

## 🗂️ Dosya Yapısı

```
alsia-discord-bot/
├── index.js                    # Ana bot dosyası
├── config.json                # Bot token ve MongoDB konfigürasyonu
├── ayarlar.json               # Genel ayarlar ve konfigürasyon
├── db.js                      # Veritabanı işlemleri
├── deploy-commands.js         # Slash komut deployment
├── ticketCounter.json         # Ticket sayacı
├── başlat.bat                 # Windows başlatma scripti
├── package.json               # Proje bağımlılıkları
├── commands/                  # Slash komutları
│   ├── ticket-kurulum.js     # Ticket kurulum komutu
│   ├── ticket-isim.js        # Ticket isim değiştirme
│   ├── ticket-ekle-context.js # Context menu - oyuncu ekleme
│   ├── ticket-çıkar-context.js # Context menu - oyuncu çıkarma
│   ├── ot.js                 # Ot görüntüleme
│   ├── ot-ekle.js            # Ot ekleme
│   ├── ot-sil.js             # Ot silme
│   ├── envanter.js           # Envanter görüntüleme
│   ├── etkinlik-kur.js       # Etkinlik kurma
│   ├── aktiflik-baslat.js    # Aktiflik başlatma
│   ├── sıralama.js           # Ot sıralaması
│   ├── ban.js                # Ban komutu
│   ├── unban.js              # Unban komutu
│   ├── sil.js                # Mesaj silme
│   ├── dm-gonder.js          # DM gönderme
│   ├── rol-bilgi.js          # Rol bilgileri
│   └── restart.js            # Bot restart
├── events/                    # Event handler'ları
│   ├── ticket.js             # Ticket sistemi eventi
│   ├── destek_kapat.js       # Ticket kapatma eventi
│   ├── hosgeldin.js          # Hoşgeldin sistemi
│   ├── byby.js               # Ayrılma sistemi
│   ├── mesaj.js              # Mesaj eventi
│   ├── mesajUP.js            # Mesaj güncelleme
│   ├── ses.js                # Ses eventi
│   ├── ban.js                # Ban eventi
│   ├── unban.js              # Unban eventi
│   ├── isimler.js            # İsim değişikliği
│   ├── permler.js            # Yetki değişiklikleri
│   ├── kanal-acma.js         # Kanal oluşturma
│   ├── kanal-silme.js        # Kanal silme
│   ├── kanal-guncelleme.js   # Kanal güncelleme
│   ├── rol-acma.js           # Rol oluşturma
│   ├── rol-silme.js          # Rol silme
│   └── rol-guncelleme.js     # Rol güncelleme
└── database/                  # Veritabanı dosyaları
    ├── ID.js                 # ID kayıtları
    ├── isimler2.js           # İsim kayıtları
    ├── perm-log.js           # Yetki logları
    ├── snipe-channel.js      # Snipe kanal verileri
    └── snipe-user.js         # Snipe kullanıcı verileri
```

---

## ⚙️ Konfigürasyon Rehberi

### 🔧 **Temel Ayarlar**

| Ayar | Açıklama | Nasıl Alınır |
|------|----------|--------------|
| `Bot.clientId` | Bot client ID'si | Discord Developer Portal → Bot → Application ID |
| `Bot.guildId` | Discord sunucu ID'si | Sunucuya sağ tık → ID'yi Kopyala |
| `Yetkiler.Staff` | Yetkili rol ID'leri | Role sağ tık → ID'yi Kopyala |
| `Ticket.parentCategory` | Ticket kategorisi ID'si | Kategoriye sağ tık → ID'yi Kopyala |
| `Kanallar.logKanalId` | Log kanalı ID'si | Kanala sağ tık → ID'yi Kopyala |

### 🎨 **Görsel Ayarlar**
- **Embed Renkleri**: Hex kod formatında (#000000)
- **Emoji ID'leri**: Custom emoji'ler için <:emoji_name:id> formatı
- **Resim URL'leri**: Discord CDN veya harici hosting

---

## 🎮 Sistemler Nasıl Çalışır?

### 🎫 **Ticket Sistemi**
```
1. /ticket-kurulum komutu ile embed mesajı gönderilir
2. Kullanıcı kategori butonuna tıklar
3. Otomatik kanal oluşturulur ve yetkiler ayarlanır
4. Mülakat kategorisinde otomatik form gönderilir
5. Yetkili destek sağlar ve kapat butonu ile kapatır
```

### 🌿 **Ot Sistemi**
```
1. Kullanıcı ot talep butonuna tıklar
2. Modal form açılır ve miktar girilir
3. Yetkili log kanalında talep görür
4. Onayla/Reddet butonları ile işlem yapılır
5. Kullanıcıya DM ile bildirim gönderilir
```

### 🎮 **Etkinlik Sistemi**
```
1. /etkinlik-kur komutu ile etkinlik oluşturulur
2. Katıl/Ayrıl butonları ile katılım sağlanır
3. Hedef sayıya ulaşınca otomatik sonlanır
4. Katılım listesi indirilebilir dosya olarak sunulur
```

---

## 📊 Özellikler Detayı

### 🔐 **Yetki Sistemi**
- Çoklu yetkili rol desteği
- Rol tabanlı erişim kontrolü
- Otomatik yetki kontrolü

### 📈 **Logging Sistemi**
- Kapsamlı aktivite kayıtları
- Ayrı log kanalları
- Detaylı bilgi embeds

### 🔔 **Bildirim Sistemi**
- DM bildirimleri
- Yetkili etiketleme
- Log kanalı entegrasyonu

### 🎨 **Embed Sistemi**
- Özelleştirilebilir renkler
- Custom emoji desteği
- Dinamik içerik

---

## 🛠️ Kullanılan Teknolojiler

- **[Discord.js v14](https://discord.js.org/)** - Discord API wrapper
- **[CroxyDB](https://www.npmjs.com/package/croxydb)** - Basit JSON veritabanı
- **[MongoDB](https://www.mongodb.com/)** - NoSQL veritabanı (opsiyonel)
- **[Mongoose](https://mongoosejs.com/)** - MongoDB object modeling
- **[Moment.js](https://momentjs.com/)** - Tarih/saat işlemleri
- **[Express.js](https://expressjs.com/)** - Web framework
- **[Canvafy](https://www.npmjs.com/package/canvafy)** - Canvas işlemleri
- **[Discord HTML Transcripts](https://www.npmjs.com/package/discord-html-transcripts)** - Transcript oluşturma
- **[Node.js](https://nodejs.org/)** - JavaScript runtime

---

## 🚨 Önemli Notlar

### ⚠️ **Dikkat Edilmesi Gerekenler**
- Bot'un sunucuda **Yönetici** yetkisi olmalı
- Ticket kategorisi önceden oluşturulmalı
- Log kanalları bot tarafından erişilebilir olmalı
- Yetkili rolleri doğru ayarlanmalı
- MongoDB bağlantısı opsiyonel (CroxyDB ile de çalışır)

### 🔒 **Güvenlik**
- `config.json` dosyasını **asla** paylaşmayın
- Bot token'ını güvenli tutun
- Yetkili rollerini dikkatli ayarlayın
- MongoDB URL'sini güvenli saklayın

---

## 🤝 Katkıda Bulunma

1. Bu repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/YeniOzellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'Yeni özellik eklendi'`)
4. Branch'inizi push edin (`git push origin feature/YeniOzellik`)
5. Pull Request oluşturun

---

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## 📞 Destek ve İletişim

- 🐛 **Bug Report:** [GitHub Issues](https://github.com/kullaniciadi/alsia-discord-bot/issues)
- 💬 **Discord Destek:** [Destek Sunucusu](https://discord.gg/SUNUCU_LINKI)
- 📧 **E-mail:** destek@alsia.com

---

## 📸 Ekran Görüntüleri

<div align="center">

### 🎫 Ticket Kurulum Paneli
*3 kategorili destek sistemi ana paneli*

### 🌿 Ot Talep Sistemi
*Modal form ile ot talep etme sistemi*

### 🎮 Etkinlik Organizasyonu
*Otomatik katılımcı yönetimi ile etkinlik sistemi*

### 📊 Moderasyon Paneli
*Kapsamlı moderasyon araçları ve log sistemi*

</div>

---

## 🔄 Güncellemeler

### v1.0.0
- Discord.js v14 desteği
- Ticket sistemi (3 kategori)
- Ot yönetim sistemi
- Etkinlik organizasyonu
- Kapsamlı moderasyon araçları
- MongoDB & CroxyDB desteği
- Otomatik ses bağlantısı
- Gelişmiş logging sistemi

---

<div align="center">

### 💝 Teşekkürler

**Alsia Discord Bot** kullandığınız için teşekkür ederiz!

*Made with ❤️ by Alsia Development Team*

---

⭐ **Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!**

[![Discord](https://img.shields.io/badge/Discord-Join%20Server-7289da?style=for-the-badge&logo=discord)](https://discord.gg/SUNUCU_LINKI)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=for-the-badge&logo=github)](https://github.com/kullaniciadi)

</div>
