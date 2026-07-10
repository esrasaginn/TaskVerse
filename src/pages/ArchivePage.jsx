import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// Arşivlenen (tamamlanmış veya iptal edilmiş) görevleri çeken fonksiyon
import { selectArchivedTasksForUser } from '../features/archive/archiveSlice';
// Arama ve filtreleme durumlarını kontrol eden fonksiyonlar
import { selectFilters, setFilter, resetFilters } from '../features/filters/filterSlice';
// Kullanıcı isimlerini (Yönetici 1, Geliştirici 3 vb.) id'den bulmak için tüm kullanıcıları çeken fonksiyon
import { selectAllUsers } from '../features/users/userSlice';
// Arşivi tamamen temizlemeye (silmeye) yarayan fonksiyon
import { clearArchiveThunk } from '../features/tasks/taskSlice';
// Bildirim çıkarmaya yarayan fonksiyon
import { addNotificationThunk } from '../features/notifications/notificationSlice';

const ArchivePage = () => {
  const dispatch = useDispatch();
  
  // Redux store'dan bu kullanıcının görebileceği geçmiş görevleri (arşivi) çekiyoruz.
  const historyTasks = useSelector(selectArchivedTasksForUser);
  // Redux'ta tutulan anlık filtreleme değerlerini alıyoruz (arama kelimesi, durum, öncelik vb.)
  const filters = useSelector(selectFilters);
  // Id ile isim eşleştirmesi yapabilmek için tüm kullanıcıları çekiyoruz.
  const users = useSelector(selectAllUsers);

  // İstatistik hesaplamaları (sayfanın üstündeki kutucuklar için)
  const totalCount = historyTasks.length; // Toplam görev sayısı
  // Durumu 'onaylandi' olanları filtrele ve sayısını bul
  const approvedCount = historyTasks.filter(t => t.status === 'onaylandi').length; 
  // Durumu 'iptal_edildi' olanları filtrele ve sayısını bul
  const deletedCount = historyTasks.filter(t => t.status === 'iptal_edildi').length;

  // Görevin önceliğini veritabanı formatından (dusuk) Türkçe etikete (Düşük) çevirir
  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'yuksek': return 'Yüksek';
      case 'orta': return 'Orta';
      case 'dusuk': return 'Düşük';
      default: return priority;
    }
  };

  // Görevin durum kodunu ekranda okunabilir Türkçe metne çevirir
  const getStatusLabel = (task) => {
    if (task.status === 'iptal_edildi') return 'İptal Edildi (Silindi)';
    switch (task.status) {
      case 'bekliyor': return 'Bekliyor';
      case 'devam_ediyor': return 'Devam Ediyor';
      case 'tamamlandi': return 'Tamamlandı (Onay Bekliyor)';
      case 'tamamlanmadi': return 'Tamamlanmadı (Onay Bekliyor)';
      case 'onaylandi': return 'Onaylandı';
      case 'reddedildi': return 'Reddedildi';
      default: return task.status;
    }
  };

  // CSS class'ını belirlemek için durumu döndürür (örneğin iptal edilenleri kırmızı yapmak için)
  const getStatusClass = (task) => {
    if (task.status === 'iptal_edildi') return 'deleted';
    return task.status;
  };

  // Görevi veren veya alan kişinin ID'sini alır, kullanıcılar listesinde bulur ve adını döndürür
  const getActorName = (userId) => {
    const u = users.find(x => x.id === userId);
    return u ? `${u.icon} ${u.fullName}` : userId;
  };

  // Filtreleme (Arama) İşlemi
  // Mevcut arşivlenmiş görevleri (historyTasks) filtreliyoruz.
  const filteredTasks = historyTasks.filter(task => {
    // 1. Arama kutusuna yazılan metin, başlığın veya açıklamanın içinde geçiyor mu? (Küçük harfe çevirerek arıyoruz)
    const matchesSearch = 
      task.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(filters.searchTerm.toLowerCase());

    // 2. Açılır menüden seçilen durum, görevin durumuyla eşleşiyor mu? (all ise hepsini göster)
    const matchesStatus = filters.status === 'all' || task.status === filters.status;
    
    // 3. Açılır menüden seçilen öncelik eşleşiyor mu?
    const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;

    // Her üç koşul da sağlanıyorsa bu görevi gösterilenler listesine al
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Sıralama (Sort) İşlemi: En yeni görevler en üstte görünsün istiyoruz.
  // Görev ID'leri 'task-17124912912' gibi bir zaman damgasına (timestamp) sahip.
  // Harfleri temizleyip (replace) sayılara çeviriyor (parseInt) ve büyükten küçüğe sıralıyoruz.
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const timeA = parseInt(a.id.replace(/^[a-zA-Z-]+/, '')) || 0;
    const timeB = parseInt(b.id.replace(/^[a-zA-Z-]+/, '')) || 0;
    return timeB - timeA;
  });

  // "Filtreleri Temizle" butonuna basınca çalışır. Arama kutusunu ve select'leri ilk haline getirir.
  const handleClearFilters = () => {
    dispatch(resetFilters());
  };

  // "Arşivi Temizle" butonuna basınca çalışır.
  const handleClearArchive = () => {
    // Kullanıcıya bir onay penceresi (Emin misiniz?) gösteririz.
    const isConfirmed = window.confirm("Tüm arşivi temizlemek istediğinize emin misiniz? Bu işlem geri alınamaz.");
    if (isConfirmed) {
      // Eğer 'Tamam'a bastıysa arşivi silen fonksiyonu tetikliyoruz.
      dispatch(clearArchiveThunk());
      dispatch(addNotificationThunk({ message: "Arşiv başarıyla temizlendi.", type: "success" }));
    }
  };

  // Sayfada göstereceğimiz verileri ikiye bölüyoruz.
  // İlk 6 görev kart (kutu) şeklinde gösterilecek. Kalanlar ise tablo (liste) şeklinde gösterilecek.
  const cardTasks = sortedTasks.slice(0, 6); // İlk 6 elemanı al
  const tableTasks = sortedTasks.slice(6); // 6'dan sonrasını al

  // Sayfalama (Pagination) işlemleri - Tablo kısmı için
  const [currentPage, setCurrentPage] = useState(1); // Şu anki sayfa (Başlangıçta 1)
  const itemsPerPage = 5; // Her sayfada en fazla 5 görev gösterilsin
  // Toplam sayfa sayısını hesapla (Örn: 12 görev varsa, 12/5 = 2.4, yukarı yuvarla = 3 sayfa)
  const totalPages = Math.ceil(tableTasks.length / itemsPerPage);
  
  // Şu an bulunduğumuz sayfaya göre sadece o sayfada gösterilecek olan görevleri kesip (slice) alıyoruz.
  const displayedTableTasks = tableTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Kullanıcı herhangi bir filtre veya arama yaparsa, sayfalama otomatik olarak 1. sayfaya sıfırlansın.
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.searchTerm, filters.status, filters.priority]);

  return (
    <div className="archive-page" style={{ animation: 'fadeIn 0.3s ease' }}>
      
      {/* Üst Başlık ve Temizle Butonu Alanı */}
      <div className="dashboard-title-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="serif-font">📂 Görev Arşivi</h2>
          <p className="dashboard-subtitle">
            Tamamlanan (onaylanan) ve iptal edilen geçmiş görevlerinizin tüm detaylarını buradan inceleyebilirsiniz.
          </p>
        </div>
        
        {/* Arşivde görev varsa temizleme butonunu göster */}
        {historyTasks.length > 0 && (
          <button 
            type="button" 
            className="btn-danger"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={handleClearArchive}
          >
            🗑️ Arşivi Temizle
          </button>
        )}
      </div>

      {/* İstatistik Kartları Alanı (Toplam Kayıt, Onaylananlar, İptal Edilenler) */}
      <div className="archive-stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="archive-stat-card">
          <div className="archive-stat-icon-box" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
            📂
          </div>
          <div className="archive-stat-content">
            <span className="archive-stat-value">{totalCount}</span>
            <span className="archive-stat-label">Toplam Kayıt</span>
          </div>
        </div>

        <div className="archive-stat-card">
          <div className="archive-stat-icon-box" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
            ✔️
          </div>
          <div className="archive-stat-content">
            <span className="archive-stat-value">{approvedCount}</span>
            <span className="archive-stat-label">Onaylananlar</span>
          </div>
        </div>

        <div className="archive-stat-card">
          <div className="archive-stat-icon-box" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>
            ❌
          </div>
          <div className="archive-stat-content">
            <span className="archive-stat-value">{deletedCount}</span>
            <span className="archive-stat-label">Silinen / İptaller</span>
          </div>
        </div>
      </div>

      {/* Arama ve Filtreleme Formu */}
      <div className="panel-card" style={{ marginBottom: '24px' }}>
        <div className="archive-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
          
          {/* Metin Arama Kutusu */}
          <div className="filter-group" style={{ flex: '2 1 300px' }}>
            <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>Arama</label>
            <input
              type="text"
              className="form-control"
              placeholder="Görev başlığı veya açıklama..."
              value={filters.searchTerm}
              // Klavye her tuşa basıldığında arama terimini Redux'a gönder (setFilter)
              onChange={(e) => dispatch(setFilter({ field: 'searchTerm', value: e.target.value }))}
            />
          </div>

          {/* Durum Filtreleme Açılır Menüsü */}
          <div className="filter-group" style={{ flex: '1 1 150px' }}>
            <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>Durum</label>
            <select
              className="form-control"
              value={filters.status}
              onChange={(e) => dispatch(setFilter({ field: 'status', value: e.target.value }))}
            >
              <option value="all">Tümü (Tarihçe)</option>
              <option value="onaylandi">Onaylandı</option>
              <option value="iptal_edildi">İptal Edilenler</option>
            </select>
          </div>

          {/* Öncelik Filtreleme Açılır Menüsü */}
          <div className="filter-group" style={{ flex: '1 1 150px' }}>
            <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>Öncelik</label>
            <select
              className="form-control"
              value={filters.priority}
              onChange={(e) => dispatch(setFilter({ field: 'priority', value: e.target.value }))}
            >
              <option value="all">Tüm Öncelikler</option>
              <option value="dusuk">Düşük</option>
              <option value="orta">Orta</option>
              <option value="yuksek">Yüksek</option>
            </select>
          </div>

          {/* Temizle Butonu */}
          <button 
            type="button" 
            className="btn-secondary" 
            style={{ height: '40px', padding: '0 16px', whiteSpace: 'nowrap' }}
            onClick={handleClearFilters}
          >
            🧹 Filtreleri Temizle
          </button>
        </div>
      </div>

      {/* GÖREVLERİN LİSTELENDİĞİ ALAN */}
      {sortedTasks.length === 0 ? (
        // Eğer aranan kriterlere uygun hiç görev yoksa bu uyarı mesajını göster.
        <div className="empty-state panel-card" style={{ padding: '40px', textAlign: 'center' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>📂</span>
          <p style={{ fontWeight: '600', color: 'var(--navy-dark)' }}>Arşivde kriterlere uygun görev bulunmamaktadır.</p>
        </div>
      ) : (
        <>
          {/* Kart Görünümü (Sadece ilk 6 eleman için) */}
          {cardTasks.length > 0 && (
            <div className="tasks-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              {cardTasks.map(task => (
                // Her bir arşivlenmiş görev için kart oluştur.
                <div key={task.id} className="task-card archived-task-card" style={{ opacity: 0.9 }}>
                  <div className="task-card-header">
                    <h4 className="task-card-title">{task.title}</h4>
                    <div className="task-badges">
                      <span className={`badge badge-priority-${task.priority}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                      <span className={`badge badge-status-${getStatusClass(task)}`}>
                        {getStatusLabel(task)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="task-card-body">
                    <p className="task-desc">{task.description}</p>
                    {/* Eğer göreve bir geri bildirim yazılmışsa göster */}
                    {task.feedback && (
                      <div className="task-feedback-section">
                        <span className="feedback-title">Geri Bildirim:</span>
                        <p className="feedback-text">“{task.feedback}”</p>
                      </div>
                    )}
                    {/* Eğer görev reddedilmişse ve sebebi yazılmışsa göster */}
                    {task.rejectionReason && (
                      <div className="task-feedback-section" style={{ borderLeftColor: 'var(--priority-yuksek)', backgroundColor: '#fff5f5' }}>
                        <span className="feedback-title" style={{ color: 'var(--priority-yuksek)' }}>Reddedilme Nedeni:</span>
                        <p className="feedback-text" style={{ color: '#b91c1c' }}>“{task.rejectionReason}”</p>
                      </div>
                    )}
                  </div>

                  <div className="task-card-footer">
                    <div className="task-actors">
                      {/* getActorName ile ID'yi verip adı-soyadı yazdırıyoruz */}
                      <span>Veren: <strong>{getActorName(task.assignedBy)}</strong></span>
                      <span>Alan: <strong>{getActorName(task.assignedTo)}</strong></span>
                    </div>
                    <div className="task-date">
                      Süreç Sonu: <strong>{task.dueDate}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tablo Görünümü (İlk 6'dan sonra kalan görevler için sayfa sayfa gösterilir) */}
          {tableTasks.length > 0 && (
            <div className="archive-table-container">
              <h4 style={{ margin: '4px 0 12px', color: 'var(--navy-dark)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📊 Diğer Arşivlenmiş Görevler (Tablo Görünümü)
              </h4>
              <table className="archive-table">
                <thead>
                  <tr>
                    <th>Görev Başlığı</th>
                    <th>Öncelik</th>
                    <th>Durum</th>
                    <th>Veren / Alan</th>
                    <th>Süreç Sonu</th>
                    <th>Detay / Geri Bildirim</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Şu anki sayfaya denk gelen görevleri listele */}
                  {displayedTableTasks.map(task => (
                    <tr key={task.id}>
                      <td style={{ fontWeight: '600' }}>{task.title}</td>
                      <td>
                        <span className={`badge badge-priority-${task.priority}`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-status-${getStatusClass(task)}`}>
                          {getStatusLabel(task)}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column' }}>
                          <span>Veren: {getActorName(task.assignedBy)}</span>
                          <span>Alan: {getActorName(task.assignedTo)}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: '500' }}>{task.dueDate}</td>
                      <td>
                        <div style={{ fontSize: '0.8rem', maxWidth: '320px' }}>
                          <p style={{ margin: 0 }}><strong>Açıklama:</strong> {task.description}</p>
                          {task.feedback && <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}><strong>Geri Bildirim:</strong> “{task.feedback}”</p>}
                          {task.rejectionReason && <p style={{ margin: '4px 0 0', color: '#b91c1c' }}><strong>Ret Nedeni:</strong> “{task.rejectionReason}”</p>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Eğer 1 sayfadan daha uzun bir liste varsa alt kısımda Sayfalama (İleri-Geri) butonlarını göster */}
              {totalPages > 1 && (
                <div className="archive-pagination">
                  <button 
                    className="archive-pagination-btn"
                    disabled={currentPage === 1} // İlk sayfadaysan Geri butonunu deaktif yap (basılamaz)
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} // Önceki sayfaya git
                  >
                    ◀ Önceki
                  </button>
                  <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                    Sayfa {currentPage} / {totalPages}
                  </span>
                  <button 
                    className="archive-pagination-btn"
                    disabled={currentPage === totalPages} // Son sayfadaysan İleri butonunu deaktif yap
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} // Sonraki sayfaya git
                  >
                    Sonraki ▶
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ArchivePage;
