import { useState, useEffect } from 'react';

// Görev Oluşturma Formu (TaskForm)
// onSubmit: Form gönderildiğinde ne yapılacağını dışarıdan alır (Dashboard sayfalarından)
// buttonText: Butonun üzerinde ne yazacağını belirler (Varsayılan: "Görev Oluştur")
// assignees: Görevin kimlere atanabileceğini gösteren kullanıcı listesi
const TaskForm = ({ onSubmit, buttonText = "Görev Oluştur", assignees = [] }) => {
  // Form içindeki giriş alanlarının anlık değerlerini (state) tutuyoruz
  const [title, setTitle] = useState(''); // Başlık
  const [description, setDescription] = useState(''); // Açıklama
  const [dueDate, setDueDate] = useState(''); // Teslim tarihi
  const [priority, setPriority] = useState('dusuk'); // Öncelik seviyesi (düşük, orta, yüksek)
  const [category, setCategory] = useState('mülki'); // Görevin kategorisi
  const [assignedToId, setAssignedToId] = useState(''); // Görevin atandığı kişinin kimliği (ID)

  // assignees (atanabilecek kişiler) listesi değiştiğinde çalışır.
  // Varsayılan olarak listedeki ilk kişiyi seçili hale getirir.
  useEffect(() => {
    if (assignees.length > 0) {
      setAssignedToId(assignees[0].id);
    } else {
      setAssignedToId('');
    }
  }, [assignees]);

  // Form gönder (Submit) butonuna tıklandığında çalışacak fonksiyon
  const handleSubmit = (e) => {
    e.preventDefault(); // Sayfanın gereksiz yere yenilenmesini engeller

    // Zorunlu alanların (başlık, açıklama, tarih) boş bırakılmadığından emin ol
    // .trim() metodu yazının başındaki ve sonundaki boşlukları siler
    if (!title.trim() || !description.trim() || !dueDate) {
      return; // Eğer boşsa formun gönderilmesini durdur
    }

    // Üst bileşenden (Yönetici veya Lider sayfasından) gelen onSubmit fonksiyonuna verileri gönder
    onSubmit({
      title,
      description,
      dueDate,
      priority,
      category,
      // Eğer kullanıcı listeden kimseyi manuel seçmediyse ilk kişiyi otomatik ata
      assignedTo: assignedToId || (assignees[0]?.id || '')
    });

    // Form başarıyla gönderildikten sonra giriş alanlarını temizle (ilk haline döndür)
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('dusuk');
    setCategory('mülki');
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">
      {/* Eğer atanacak personel listesi boş değilse 'Kişi Seçimi' kutusunu göster */}
      {assignees.length > 0 && (
        <div className="form-group">
          <label htmlFor="task-assignee">Atanacak Personel</label>
          <select
            id="task-assignee"
            className="form-control"
            value={assignedToId}
            // Kullanıcı farklı birini seçtiğinde assignedToId state'ini güncelle
            onChange={(e) => setAssignedToId(e.target.value)}
            required
          >
            {/* Gelen listeyi dön (map) ve her biri için açılır listede (select) bir seçenek (option) yarat */}
            {assignees.map(user => (
              <option key={user.id} value={user.id}>
                {user.icon} {user.fullName} ({user.title})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Görev Başlığı Alanı */}
      <div className="form-group">
        <label htmlFor="task-title">Görev Başlığı</label>
        <input
          id="task-title"
          type="text"
          className="form-control"
          placeholder="Örn: E-ticaret Entegrasyonu Geliştirilmesi..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required // Bu alanın doldurulması zorunludur
        />
      </div>

      {/* Görev Açıklaması Alanı (Metin Kutusu) */}
      <div className="form-group">
        <label htmlFor="task-desc">Görev Açıklaması</label>
        <textarea
          id="task-desc"
          className="form-control"
          placeholder="Görevin detaylarını, adımlarını ve beklentilerini giriniz..."
          rows="4" // Kutu yüksekliğini 4 satırlık yap
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      {/* Tarih Seçimi Alanı */}
      <div className="form-group">
        <label htmlFor="task-date">Son Teslim Tarihi (Deadline)</label>
        <input
          id="task-date"
          type="date"
          className="form-control"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
        />
      </div>

      {/* Görev Kategorisi Seçimi */}
      <div className="form-group">
        <label htmlFor="task-category">Görev Kategorisi</label>
        <select
          id="task-category"
          className="form-control"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          <option value="mülki">Yönetim / İdari 📁</option>
          <option value="askeri">Yazılım / Geliştirme 💻</option>
          <option value="imari">Altyapı / DevOps ⚙️</option>
          <option value="mali">Finans / Bütçe 💰</option>
        </select>
      </div>

      {/* Öncelik Derecesi Seçimi (Düşük, Orta, Yüksek) */}
      <div className="form-group">
        <label>Öncelik Derecesi</label>
        <div className="priority-selector">
          {/* Her buton kendi öncelik seviyesini state'e atar. Seçili olana 'active' class'ı eklenir. */}
          <button
            type="button"
            className={`priority-option ${priority === 'dusuk' ? 'active' : ''}`}
            data-priority="dusuk"
            onClick={() => setPriority('dusuk')}
          >
            Düşük
          </button>
          <button
            type="button"
            className={`priority-option ${priority === 'orta' ? 'active' : ''}`}
            data-priority="orta"
            onClick={() => setPriority('orta')}
          >
            Orta
          </button>
          <button
            type="button"
            className={`priority-option ${priority === 'yuksek' ? 'active' : ''}`}
            data-priority="yuksek"
            onClick={() => setPriority('yuksek')}
          >
            Yüksek
          </button>
        </div>
      </div>

      {/* Formu Onaylama (Gönderme) Butonu */}
      <button type="submit" className="btn-primary form-btn-submit">
        🚀 {buttonText}
      </button>
    </form>
  );
};

export default TaskForm;
