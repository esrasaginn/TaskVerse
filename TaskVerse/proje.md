# TaskVerse - Kurumsal Görev ve Süreç Yönetim Sistemi

TaskVerse, modern organizasyonların karmaşık çalışma süreçlerini, hiyerarşik takım yapılarını ve günlük iş akışlarını tek bir merkezden kolayca yönetebilmeleri için tasarlanmış yeni nesil bir görev yönetim platformudur. 

Bu döküman, TaskVerse platformunun sunduğu temel işlevleri, kullanıcı rollerini, iş akışlarını ve projenin genel yapısını teknik kod detaylarına girmeden, işlevsel ve müşteri odaklı bir perspektifle açıklamaktadır.

---

## 🎯 Projenin Amacı ve Temel Hedefleri

İşletmeler büyüdükçe görevlerin kimin sorumluluğunda olduğunu takip etmek, süreçlerin hangi aşamada olduğunu izlemek ve departmanlar arası koordinasyonu sağlamak zorlaşır. TaskVerse, bu zorlukları ortadan kaldırmak amacıyla aşağıdaki hedeflerle geliştirilmiştir:

* **Hiyerarşik Uyum:** Şirketinizdeki mevcut organizasyon şemasını (Yönetici, Takım Lideri, Geliştirici/Çalışan) sisteme birebir yansıtır.
* **Süreç Şeffaflığı:** Hangi görevin kimde olduğunu, ne durumda olduğunu (Yapılacak, Yapılıyor, Test Aşamasında vb.) anlık olarak gösterir.
* **Verimlilik Artışı:** E-posta veya anlık mesajlaşma uygulamaları arasında kaybolan görevleri tek bir panoda toplayarak zaman kayıplarını önler.
* **Arşivleme ve Raporlama:** Tamamlanan işleri arşivleyerek geçmişe dönük iş geçmişinizi güvenli bir şekilde saklar.

---

## 👥 Rol Tabanlı Yetkilendirme ve Kullanıcı Seviyeleri

TaskVerse, kurumunuzdaki yetki sınırlarını korumak için 3 temel kullanıcı rolü üzerine kurulmuştur. Her kullanıcı sisteme giriş yaptığında yalnızca kendi yetki alanına giren ekranları ve verileri görür:

### 1. 💼 Departman Yöneticisi (Manager)
Yönetici paneli, en üst düzey gözetim ve analiz ekranıdır.
* **Genel Bakış:** Kendi departmanına (Grup) bağlı olan tüm alt ekiplerin genel durumunu izler.
* **Performans İzleme:** Hangi takım liderinin veya geliştiricinin üzerinde kaç aktif iş olduğunu, süreçlerin tıkanıp tıkanmadığını üst perdeden gözlemler.
* **Stratejik Yönetim:** Departmanın genel iş yükünü denetler ve süreçlerin hedeflere uygunluğunu kontrol eder.

### 2. 👥 Takım Lideri (Team Leader)
Takım lideri, operasyonel yönetimi sağlayan ve iş atamalarını yapan köprü rolündedir.
* **Görev Atama:** Ekiplere yeni görevler tanımlar, bu görevlerin detaylarını (başlık, açıklama, öncelik) belirler ve ilgili geliştiriciye atar.
* **Süreç Denetimi:** Geliştiriciler tarafından tamamlanan veya teste gönderilen işleri kontrol eder.
* **Kanban Pano Yönetimi:** İşlerin süreç içindeki hareketlerini izler ve takımı koordine eder.

### 3. 💻 Geliştirici / Çalışan (Developer)
Geliştirici rolü, doğrudan operasyonel işleri yürüten ve üreten çalışanları temsil eder.
* **Kişiselleştirilmiş Görev Panosu:** Çalışan, sisteme girdiğinde sadece ve sadece kendisine atanan işleri görür. Bu sayede dikkat dağıtıcı diğer unsurlardan uzaklaşarak kendi işine odaklanır.
* **Durum Güncelleme:** Üzerinde çalıştığı görevin durumunu (Örn: "Yapılacaklar" listesinden "Yapılıyor" veya "Test Ediliyor" aşamasına) günceller.
* **Hızlı Geri Bildirim:** İşin tamamlanmasıyla birlikte görevi tamamlandı olarak işaretler ve takım liderinin onayına sunar.

---

## 🛠️ Öne Çıkan Fonksiyonel Özellikler

TaskVerse kullanıcılarının işini kolaylaştırmak için tasarlanan temel özellikler şunlardır:

### 📋 Akıllı Görev Kartları ve Dinamik Formlar
* Her görev; başlık, detaylı açıklama, öncelik seviyesi (Düşük, Orta, Yüksek) ve atanan kişi gibi kritik bilgileri içeren kartlar halinde sunulur.
* Yeni bir iş oluşturulurken dinamik formlar aracılığıyla görev detayları eksiksiz bir şekilde tanımlanabilir.

### 🔍 Gelişmiş Arama ve Filtreleme
* Onlarca görev arasından aradığınızı saniyeler içinde bulmanızı sağlayan filtreleme mekanizması mevcuttur.
* Görevleri **durumuna**, **öncelik derecesine** veya **atanan kişiye** göre süzebilirsiniz.

### 🗂️ Güvenli Görev Arşivleme
* Tamamlanan ve artık panoda yer kaplaması istenmeyen eski görevler silinmek yerine arşivlenir.
* **Arşiv Paneli** sayesinde geçmişte tamamlanmış tüm işlere kolayca ulaşılabilir, böylece kurumsal hafıza korunmuş olur.

### 🔔 Anlık Bildirim Sistemi (Toast Notifications)
* Sistemde yapılan işlemlerin (görev ekleme, durum güncelleme, giriş yapma vb.) başarılı olup olmadığını kullanıcıya anında bildiren, ekranın kenarında beliren şık uyarı pencereleri bulunur.

---

## 📈 İşletmeniz İçin Değerleri (Neden TaskVerse?)

1. **Karmaşıklığı Önler:** Ekiplerin "Kim ne yapıyor?" sorusuna anında yanıt sunarak operasyonel karmaşayı ortadan kaldırır.
2. **Sorumluluk Bilinci (Accountability):** Her görevin net bir sorumlusu ve geçmiş hareket geçmişi olduğundan iş takibi son derece nettir.
3. **Kolay Kullanım:** Karışık eğitim süreçlerine gerek kalmadan, her seviyeden çalışanın dakikalar içinde uyum sağlayabileceği sade ve modern bir arayüze sahiptir.
4. **Veri Güvenliği ve Gizlilik:** Rol bazlı yetkilendirme sayesinde çalışanlar sadece kendi görevlerine odaklanırken, yöneticiler departman geneline hakim olur.
