// Redux store'dan veri çekmek için useSelector kancasını içe aktarıyoruz.
import { useSelector } from 'react-redux';
// Görevleri ekranda kart şeklinde göstermemizi sağlayan bileşeni ekliyoruz.
import TaskCard from '../components/TaskCard';
// Geliştiricinin kendine atanmış aktif görevlerini seçen (filtreleyen) fonksiyon.
import { selectTasksByCurrentUser } from '../features/tasks/taskSlice';

const DeveloperDashboard = () => {
  // Sistemde giriş yapmış olan geliştiriciye ait görevleri Redux store'dan getir.
  const developerTasks = useSelector(selectTasksByCurrentUser);

  return (
    <div className="dashboard-layout">
      {/* Sayfa Üst Başlık Kısmı */}
      <div className="dashboard-title-section">
        <h2 className="serif-font">Geliştirici Paneli</h2>
        <p className="dashboard-subtitle">
          Takım lideri tarafından size atanan görevleri tamamlayın ve durum bildirin.
        </p>
      </div>

      {/* Görevlerin Listelendiği Beyaz Panel */}
      <div className="panel-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h3 className="panel-title">
          <span className="panel-title-icon">💻</span> Atanan Aktif Görevler
        </h3>

        {/* Eğer geliştiriciye atanmış hiçbir görev yoksa ekranda boş olduğunu belirten mesaj çıkacak */}
        {developerTasks.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">✔️</span>
            <p>Atanmış aktif bir göreviniz bulunmamaktadır.</p>
            <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>
              Takım liderinden gelecek olan yeni iş bildirimlerini bekleyebilirsiniz.
            </p>
          </div>
        ) : (
          /* Eğer görev(ler) varsa bunları döngü (map) ile alt alta TaskCard bileşeninde çizdiriyoruz */
          <div className="tasks-container">
            {developerTasks.map((task) => (
              <TaskCard
                key={task.id} // Her bir kartın benzersiz (unique) olması için id değeri verdik
                task={task}   // Görevin tüm detaylarını karta iletiyoruz
                userRole="developer" // Kartın içinde geliştirici yetkilerine göre butonların şekillenmesi için
                viewMode="assigned_to_me" // Bu görevin 'bana atanmış bir görev' olduğunu karta bildiriyoruz
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default DeveloperDashboard;
