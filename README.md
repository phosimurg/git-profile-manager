## Yeni Özelliklerin Test Edilmesi

### İlk Açılışta Otomatik Profil Oluşturma

İlk kez çalıştırıldığında, uygulama bilgisayarınızdaki git config'ten kullanıcı adı ve e-posta bilgilerini okuyarak otomatik bir profil oluşturacaktır.

Testler için:
1. Uygulama verilerini temizleyin (genellikle `%APPDATA%/git-profile-manager` klasörü)
2. Git config'inizde bir kullanıcı ve e-posta ayarlı olduğundan emin olun
3. Uygulamayı başlatın
4. Otomatik olarak bir profil oluşturulduğunu göreceksiniz

### Dış Değişiklikleri Tespit Etme

Uygulama dışında git config değiştirildiğinde, uygulama bu değişikliği tespit edecek ve kullanıcıya bildirecektir.

Testler için:
1. Uygulamayı çalıştırın
2. Başka bir terminal/komut satırı açın
3. `git config --global user.name "Yeni İsim"` ve `git config --global user.email "yeni@email.com"` komutlarını çalıştırın
4. 10 saniye içinde, uygulama değişikliği tespit edecek ve bir bildirim gösterecektir
5. "Profil Olarak Kaydet" düğmesine tıklayabilir veya değişikliği yok sayabilirsiniz# Git Profil Yöneticisi

Git profilleri arasında geçiş yapmayı kolaylaştıran bir Electron uygulaması.

## Özellikler

- Profil ekleme, silme, düzenleme, aktifleştirme
- Aktif profilin görüntülenmesi
- Git config ayarlarının kolay yönetimi
- İlk açılışta otomatik profil oluşturma
- Dış değişiklikleri tespit etme ve profil olarak kaydetme seçeneği

## Kurulum

### Gerekli Paketleri Yükleme

```bash
npm install
```

### Geliştirme Modunda Çalıştırma

```bash
# Bu komut önce React sunucusunu başlatacak, sonra Electron uygulamasını çalıştıracak
npm run electron:dev
```

### Uygulamayı Build Etme

```bash
npm run electron:build
```

## Proje Yapısı

```
git-profile-manager/
├── electron/
│   ├── main.js       # Electron ana süreci
│   └── preload.js    # Preload script - API bağlantısı
├── public/           # React statik dosyaları
├── src/
│   ├── components/   # React bileşenleri
│   │   ├── ActiveProfile.js
│   │   ├── ProfileForm.js
│   │   └── ProfileList.js
│   ├── App.js        # Ana uygulama bileşeni
│   └── index.js      # React giriş noktası
└── package.json      # Proje bağımlılıkları ve komutlar
```

## Proje Kurulum Adımları

1. Gerekli npm paketlerini ekleyin:

```bash
npm install wait-on concurrently electron electron-is-dev --save-dev
```

2. "electron:dev" komutunu kullanarak uygulamayı çalıştırın:

```bash
npm run electron:dev
```

## Sorun Giderme

### React Hook Hataları
React hook hataları genellikle birden fazla React sürümünün projeye dahil edilmesinden kaynaklanır. Aşağıdaki adımları deneyin:

1. node_modules klasörünü temizleyin:
```bash
rm -rf node_modules
```

2. package-lock.json dosyasını silin:
```bash
rm package-lock.json
```

3. Bağımlılıkları yeniden yükleyin:
```bash
npm install
```

4. Uygulamayı yeniden başlatın:
```bash
npm run electron:dev
```

### Uygulama Beyaz Ekran Gösteriyor
1. Terminalde hata mesajlarını kontrol edin
2. React development sunucusunun çalıştığından emin olun (localhost:3000)
3. Electron ile React arasındaki iletişimi kontrol edin - preload.js'nin doğru yüklendiğinden emin olun
4. CSP (Content Security Policy) hatalarını çözmek için development modunda Electron'u çalıştırırken `--disable-web-security` parametresini ekleyebilirsiniz:

```bash
# package.json içindeki electron:start komutunu güncelle
"electron:start": "wait-on http://localhost:3000 && electron --disable-web-security ."
```
