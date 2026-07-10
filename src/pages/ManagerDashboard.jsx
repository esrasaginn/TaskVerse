// Redux store ile haberleşmek (veri çekmek veya emir göndermek) için gerekli hook'lar.
import { useDispatch, useSelector } from 'react-redux';
// Yeni görev oluşturmak için kullandığımız Form bileşeni
import TaskForm from '../components/TaskForm';
// Görevleri liste halinde ekranda göstermeye yarayan Kart bileşeni
import TaskCard from '../components/TaskCard';
// Yalnızca bu yöneticinin grubuna bağlı "Takım Liderlerini" getiren yardımcı fonksiyon
import { selectTeamLeadersByManagerGroup } from '../features/users/userSlice';
// Görev atamak ve bu yöneticiye ait aktif görevleri getirmek için kullanılan Redux fonksiyonları
import { addTaskThunk, selectTasksByCurrentUser } from '../features/tasks/taskSlice';
// Ekranda sağ üstte çıkan küçük bildirimleri (toast) yöneten fonksiyon
import { addNotificationThunk } from '../features/notifications/notificationSlice';

const ManagerDashboard = () => {
  const dispatch = useDispatch();
  // Sisteme giriş yapmış olan yöneticinin bilgilerini alıyoruz.
  const currentUser = useSelector((state) => state.auth.currentUser);
  
  // Yöneticinin kendi grubuna (örn: Grup 1) bağlı olan takım liderlerini veritabanından çekiyoruz.
  // Formda atama yapılırken sadece bu kişiler listelenecek.
  const groupLeaders = useSelector((state) => 
    selectTeamLeadersByManagerGroup(state, currentUser?.groupId)
  );
  
  // Bu yöneticinin oluşturduğu ve henüz arşivlenmemiş aktif görevleri çekiyoruz.
  const activeManagerTasks = useSelector(selectTasksByCurrentUser);

  // Form (TaskForm) doldurulup 'Görev Oluştur' butonuna basıldığında çalışan fonksiyon.
  const handleFormSubmit = async (taskData) => {
    // Eğer formdan bir lider seçilmemişse, gruptaki ilk lideri (varsayılan) hedef seç.
    const targetTLId = taskData.assignedTo || (groupLeaders[0]?.id || 'TL0101');
    
    // Görevi oluşturmak için Redux 'addTaskThunk' fonksiyonunu çağırıyoruz.
    const resultAction = await dispatch(addTaskThunk({
      title: taskData.title,             // Görevin başlığı
      description: taskData.description, // Görevin detayı
      priority: taskData.priority,       // Öncelik seviyesi (Düşük, Orta, Yüksek)
      status: 'bekliyor',                // İlk oluşturulduğunda durumu "bekliyor" olur.
      assignedBy: currentUser.id,        // Görevi veren kişi (Mevcut Yönetici)
      assignedTo: targetTLId,            // Görevin atandığı kişi (Takım Lideri)
      assignedByRole: 'manager',         // Veren kişinin rolü
      assignedToRole: 'teamLeader',      // Alan kişinin rolü
      feedback: '',                      // Henüz geri bildirim yok
      dueDate: taskData.dueDate,         // Teslim tarihi
      category: taskData.category,       // Kategori (Yönetim, Yazılım vb.)
      groupId: currentUser.groupId       // Hangi gruba ait olduğu
    }));

    // Eğer görev başarıyla veritabanına/state'e eklenirse (fulfilled)
    if (addTaskThunk.fulfilled.match(resultAction)) {
      dispatch(addNotificationThunk({ 
        message: 'Görev başarıyla gönderildi.', 
        type: 'success',
        assignedTo: currentUser.id // Bildirim bu yöneticiye gösterilecek
      }));
    } else {
      // Eğer bir hata oluşursa (rejected), hatayı ekrana bas
      const errorMsg = resultAction.payload || 'Görev gönderilemedi.';
      dispatch(addNotificationThunk({ 
        message: `Hata: ${errorMsg}`, 
        type: 'error',
        assignedTo: currentUser.id
      }));
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sayfa üst başlık ve açıklaması */}
      <div className="dashboard-title-section">
        <h2 className="serif-font">Yönetici Paneli</h2>
        <p className="dashboard-subtitle">Görevleri oluşturun, takım liderinin raporlarını onaylayın veya reddedin.</p>
      </div>

      <div className="dashboard-grid">
        {/* Sol Sütun: Görev Oluşturma Formu */}
        <div className="panel-card">
          <h3 className="panel-title">
            <span className="panel-title-icon">🚀</span> Görev Oluştur
          </h3>
          {/* Görev formu bileşenini çağırıyoruz ve liderler listesini gönderiyoruz */}
          <TaskForm onSubmit={handleFormSubmit} buttonText="Görev Oluştur" assignees={groupLeaders} />
        </div>

        {/* Sağ Sütun: Aktif Görevler Listesi */}
        <div className="panel-card">
          <h3 className="panel-title">
            <span className="panel-title-icon">🧭</span> Takım Liderine Verilen Aktif Görevler
          </h3>
          
          {/* Eğer henüz atanan bir görev yoksa boş durum uyarısı göster */}
          {activeManagerTasks.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">📋</span>
              <p>Henüz süreçte aktif bir görev bulunmamaktadır.</p>
              <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>Sol taraftaki formdan takım liderine ilk görevi atayabilirsiniz.</p>
            </div>
          ) : (
            /* Görevler varsa bunları alt alta sırala (map ile döndür) */
            <div className="tasks-container">
              {activeManagerTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  userRole="manager"         // Kartın yönetici yetkileriyle çizilmesini sağlar
                  viewMode="created_by_me"   // Yöneticinin kartta silme/düzenleme butonlarını görmesini sağlar
                />
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ManagerDashboard;
