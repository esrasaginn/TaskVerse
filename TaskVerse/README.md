# TaskVerse - Gelişmiş Görev ve Süreç Yönetim Sistemi

TaskVerse, hiyerarşik takım yapılarına uygun, çoklu rol sistemini destekleyen ve modern frontend teknolojileri ile geliştirilmiş bir görev yönetim platformudur. React 19 ve Redux Toolkit gücüyle inşa edilmiş, Vite ile optimize edilmiştir.

## 📋 İçindekiler

- [Proje Mimarisi](#-proje-mimarisi)
- [Teknoloji Yığını (Tech Stack)](#-teknoloji-y%C4%B1%C4%9F%C4%B1n%C4%B1)
- [Klasör ve Modül Yapısı](#-klas%C3%B6r-ve-mod%C3%BCl-yap%C4%B1s%C4%B1)
- [Rol Tabanlı Erişim ve Yetkilendirme (RBAC)](#-rol-tabanl%C4%B1-eri%C5%9Fim-ve-yetkilendirme)
- [State Management (Redux Store)](#-state-management)
- [Bileşen (Component) Mimarisi](#-bile%C5%9Fen-mimarisi)
- [Veri Yönetimi (Mock Database)](#-veri-y%C3%B6netimi-ve-mock-database)
- [Geliştirici Kurulumu](#-geli%C5%9Ftirici-kurulumu)

---

## 🏗 Proje Mimarisi

Proje, tek sayfa uygulaması (Single Page Application - SPA) mantığıyla çalışır. İş mantığı (Business Logic) büyük ölçüde Redux Slices içerisinde izole edilmiştir. Katmanlar birbirinden tamamen bağımsız çalışabilecek yapıda dizayn edilmiş ve `Feature-Based` bir klasör yapısı kurgulanmıştır.

Bileşenler sunum (Presentational) ve taşıyıcı (Container) olarak görev bazlı çalışır, asıl veri manipulasyonları Redux Thunk'ları ve Reducers üzerinden geçirilir. Uygulamanın ana rendering yapısı state üzerindeki rollere göre dinamik olarak şekillenmektedir.

## 🚀 Teknoloji Yığını

- **Frontend Kütüphanesi:** React (v19)
- **State Management:** Redux Toolkit (@reduxjs/toolkit) + React-Redux
- **Build ve Dev Server:** Vite
- **Modül Formatı:** ESM (ECMAScript Modules)
- **Linting:** ESLint (Flat Config - eslint.config.js)
- **CSS:** Saf (Vanilla) CSS tabanlı component scoping yaklaşımlı global stiller.

## 📂 Klasör ve Modül Yapısı

```text
src/
├── app/          # Redux store yapılandırması (store.js vb.)
├── assets/       # İkonlar, resimler ve statik dosyalar
├── components/   # Ortak bileşenler (TaskCard, TaskForm, Layout, Login, ArchivePanel)
├── data/         # Statik JSON veritabanı (taskverse-db-turkce-isimli.json)
├── features/     # Uygulamanın iş yükünü çeken Redux Slice'ları (auth, tasks, filters vb.)
├── pages/        # Rol bazlı ana gösterim alanları (Manager, Team Leader ve Developer Dashboard)
├── styles/       # Modül ve sayfa bazlı CSS stil dosyaları
├── App.jsx       # Ana yönlendirme (routing/auth) ve Toast bildirim bileşeni
├── App.css       # Uygulamanın temel şablon stili
└── main.jsx      # React Root Renderer ve Redux Provider
```

## 🔐 Rol Tabanlı Erişim ve Yetkilendirme (RBAC)

Sistem statik olarak belirlenmiş 3 yetki katmanı sunar:

1. **Manager (Yönetici):** Kendi departmanı (Grup) altındaki tüm Takım Liderleri ve Geliştiricileri görebilir, istatistiklerine erişebilir, süreçleri master seviyede yönetebilir. `ManagerDashboard` sayfasını görüntüler.
2. **Team Leader (Takım Lideri):** Manager'a bağlı olup, altındaki spesifik geliştirici (Developer) takımına görev atayabilir. Sprint veya Kanban board benzeri bir akışta görev onay ve denetim işlemlerini yürütür. `TeamLeaderDashboard` sayfasını görüntüler.
3. **Developer (Geliştirici):** Sistemdeki en alt hiyerarşidir. Yalnızca kendisine atanan işleri görür. Görevlerin durumlarını (Örn: Yapılıyor, Test Ediliyor, Tamamlandı) günceller. `DeveloperDashboard` sayfasını görüntüler.

_Uygulamada giriş yapmamış (unauthenticated) kullanıcılar doğrudan `Login` bileşenine yönlendirilir._

## 🧠 State Management (Redux Store)

Global state, birbirinden bağımsız logic parçalarına (slice) ayrılmıştır. Bu yapı `src/features` altında konumlandırılmıştır:

- **`authSlice`**: Sisteme giriş yapan kullanıcının session objesini tutar. Yetki doğrulama işlemleri burada gerçekleşir.
- **`taskSlice`**: Görevlerin CRUD işlemlerini üstlenir. `setupTaskSyncListener` fonksiyonuyla dış veya asenkron veri güncellemelerini dinlemek için dizayn edilmiştir.
- **`notificationSlice`**: Uygulama içindeki global hata, başarılı işlem veya uyarıları bir "Toast" yığını (stack) olarak yönetir. Toastlar, `App.jsx` seviyesinde dinlenir ve otomatik olarak 4.5 saniyede ekrandan kaybolur.
- **`archiveSlice`**: Tamamlanmış ve ana panodan (board) kaldırılması istenen görevlerin tutulduğu arşiv koleksiyonudur.
- **`filtersSlice`**: Ön yüzdeki arama veya filtreleme (Durum, Atanan Kişi vs.) tercihlerini depolar.
- **`groupsSlice` & `usersSlice`**: Hiyerarşi ağacındaki kişilerin listelerini ve ilişkisel verilerini barındırır.

## 🧩 Bileşen Mimarisi

- **Toast Notification Stack:** `App.jsx` içerisine gömülü, Redux store'a (`selectNotifications`) bağlı çalışır. Yeni bir bildirim geldiğinde dinamik olarak render edilir.
- **Layout:** Uygulamanın üst (Navbar) veya yan (Sidebar) gibi iskelet yapılarını taşıyıp Dashboard sayfalarını ve Arşiv Panosunu alt eleman (children/props) olarak render eder. Sekme değişimini (`activeTab`) kontrol eder.
- **TaskCard & TaskForm:** Görevlerin görüntülendiği interaktif kartlar ve yeni görev yaratma/güncelleme formlarıdır. Bütün Dashboard'larda reusability (tekrar kullanılabilirlik) ilkesiyle ortak kullanılır.

## 🗄️ Veri Yönetimi ve Mock Database

Geliştirme süreci için bir backend API sunucusuna ihtiyaç duyulmaması adına `generate_db.cjs` dosyası kodlanmıştır. Bu Node.js betiği, rastgele Türkçe isimlerden ve soyisimlerden oluşan büyük bir şirket ağacı (network) kurar.

**Script'in Sağladığı Otomasyon:**

1. 10 Farklı ana "Grup" oluşturur.
2. Her gruba 1 adet Yönetici atar.
3. Her gruba 3 adet Takım Lideri atar.
4. Her gruba 10 adet Geliştirici atar.
5. Sonuç olarak ortaya çıkan hiyerarşik JSON dosyasını `src/data/taskverse-db-turkce-isimli.json` dizinine kaydeder.

_Sisteme giriş için bu JSON dosyasındaki hesaplar kullanılır (Tüm varsayılan şifreler: `1234` olarak belirlenmiştir)._

## 🛠 Geliştirici Kurulumu

Projeyi lokal bilgisayarınızda çalıştırmak için aşağıdaki adımları sırasıyla uygulayabilirsiniz:

### Gereksinimler

- Node.js (v16 veya daha güncel bir sürüm)
- npm, yarn, veya pnpm

### Kurulum Adımları

```bash
# 1. Projeyi indirin ve proje klasörüne gidin
cd TaskVerse

# 2. Gerekli NPM bağımlılıklarını kurun
npm install

# 3. Opsiyonel: Test Veritabanını Yeniden Üretin (Rastgele İsimlerle veri yenilemek için)
node generate_db.cjs

# 4. Geliştirme (Development) Sunucusunu Başlatın
npm run dev
```

Uygulama başarıyla derlendikten sonra varsayılan olarak `http://localhost:5173` adresinde çalışacaktır. Test edebilmeniz için örnek hesaplar:

- **Yönetici Girişi:** Kullanıcı Adı: `manager1` - Şifre: `1234`
- **Takım Lideri Girişi:** Kullanıcı Adı: `teamlead1_1` - Şifre: `1234`
- **Geliştirici Girişi:** Kullanıcı Adı: `developer1_1` - Şifre: `1234`
