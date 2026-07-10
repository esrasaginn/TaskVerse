// Redux'tan veri almak (useSelector) ve veri göndermek (useDispatch) için kullanıyoruz.
import { useDispatch, useSelector } from 'react-redux';
// Takım Liderinin yeni görev oluşturması için kullandığı Form bileşeni
import TaskForm from '../components/TaskForm';
// Görevleri ekranda göstermeye yarayan Kart bileşeni
import TaskCard from '../components/TaskCard';
// Bu takım liderinin grubuna bağlı (kendisiyle aynı gruptaki) geliştiricileri getiren fonksiyon
import { selectDevelopersByTeamLeaderGroup } from '../features/users/userSlice';
// Görev oluşturmak ve mevcut görevleri getirmek için kullanılan Redux fonksiyonları
import { addTaskThunk, selectTasksByCurrentUser } from '../features/tasks/taskSlice';
// Bildirim mesajları (toast) göstermek için kullanılan fonksiyon
import { addNotificationThunk } from '../features/notifications/notificationSlice';

const TeamLeaderDashboard = () => {
  const dispatch = useDispatch();
  // Sisteme giriş yapmış olan Takım Liderinin bilgilerini alıyoruz
  const currentUser = useSelector((state) => state.auth.currentUser);
  
  // Bu takım liderinin altındaki (kendi grubundaki) "Geliştiricileri" (Developers) listeliyoruz.
  // Bu liste, sağ taraftaki formda kime görev verileceğini seçmek için kullanılacak.
  const groupDevelopers = useSelector((state) => 
    selectDevelopersByTeamLeaderGroup(state, currentUser?.id)
  );
  
  // Takım lideri ile alakalı tüm aktif görevleri getir (hem aldıkları hem de verdikleri)
  const activeTasks = useSelector(selectTasksByCurrentUser);

  // 1. Yöneticiden Takım Liderine Gelen Görevler:
  // Görevi alan kişi bu Takım Lideri olacak VE görevi veren kişinin rolü 'manager' (yönetici) olacak.
  const incomingTasks = activeTasks.filter(t => 
    t.assignedTo === currentUser?.id && 
    t.assignedByRole === 'manager'
  );

  // 2. Takım Liderinin Geliştiriciye (Developer) Gönderdiği Görevler:
  // Görevi veren bu Takım Lideri olacak VE görevi alan kişinin rolü 'developer' olacak.
  const outgoingTasks = activeTasks.filter(t => 
    t.assignedBy === currentUser?.id && 
    t.assignedToRole === 'developer'
  );

  // Geliştiriciye yeni bir görev atandığında (Form gönderildiğinde) çalışacak olan fonksiyon
  const handleCreateDeveloperTask = async (taskData) => {
    // Formdan bir kişi seçilmemişse varsayılan olarak listedeki ilk geliştiriciyi al
    const targetDevId = taskData.assignedTo || (groupDevelopers[0]?.id || 'DEV0101');
    
    // Yeni görevi Redux store'una ve (varsa) veritabanına ekle
    const resultAction = await dispatch(addTaskThunk({
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      status: 'bekliyor',               // Görev henüz başlanmadığı için 'bekliyor' durumunda
      assignedBy: currentUser.id,       // Görevi atayan: Bu Takım Lideri
      assignedTo: targetDevId,          // Görevi alan: Seçilen Geliştirici
      assignedByRole: 'teamLeader',     // Atayanın rolü
      assignedToRole: 'developer',      // Alanın rolü
      feedback: '',
      dueDate: taskData.dueDate,
      category: taskData.category,
      groupId: currentUser.groupId      // Aynı grup içerisinde kalması için ekliyoruz
    }));

    // Görev başarıyla oluşturulduysa (fulfilled)
    if (addTaskThunk.fulfilled.match(resultAction)) {
      dispatch(addNotificationThunk({ 
        message: 'Görev başarıyla gönderildi.', 
        type: 'success',
        assignedTo: currentUser.id
      }));
    } else {
      // Bir hata oluştuysa (rejected)
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
      {/* Sayfa başlığı */}
      <div className="dashboard-title-section">
        <h2 className="serif-font">Takım Lideri Paneli</h2>
        <p className="dashboard-subtitle">
          Yöneticiden gelen görevleri tamamlayın ve geliştirici ekibin görevlerini koordine edin.
        </p>
      </div>

      <div className="dashboard-grid-equal">
        {/* Sol Sütun: Yöneticiden Gelen Görevler */}
        <div className="panel-card">
          <h3 className="panel-title">
            <span className="panel-title-icon">👔</span> Yöneticiden Gelen Görevler
          </h3>

          {/* Eğer yönetici henüz bir görev vermediyse */}
          {incomingTasks.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">✔️</span>
              <p>Aktif atanan görev bulunmamaktadır.</p>
              <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>
                Yöneticiden gelecek yeni işleri bekleyebilirsiniz.
              </p>
            </div>
          ) : (
            // Görevler varsa map() ile ekrana bas
            <div className="tasks-container">
              {incomingTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  userRole="teamLeader"
                  viewMode="assigned_to_me" // Bu görevlerin 'bana atandığını' karta belirtiyoruz
                />
              ))}
            </div>
          )}
        </div>

        {/* Sağ Sütun: Geliştirici Görev Yönetimi (Form + Listeler) */}
        <div className="panel-card-flow">
          {/* Üst Kısım: Geliştiriciye Görev Gönderme Formu */}
          <div className="panel-card-sub" style={{ marginBottom: '20px' }}>
            <h3 className="panel-title">
              <span className="panel-title-icon">🚀</span> Geliştiriciye Görev Gönder
            </h3>
            <TaskForm onSubmit={handleCreateDeveloperTask} buttonText="Geliştiriciye Gönder" assignees={groupDevelopers} />
          </div>

          {/* Alt Kısım: Geliştiriciye Daha Önce Gönderilmiş Olan Aktif Görevler */}
          <div className="panel-card-sub">
            <h3 className="panel-title">
              <span className="panel-title-icon">💻</span> Geliştiriciye Gönderilen Aktif Görevler
            </h3>

            {/* Eğer hiç görev gönderilmemişse */}
            {outgoingTasks.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">📋</span>
                <p>Henüz süreçte aktif bir görev bulunmamaktadır.</p>
                <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>
                  Yukarıdaki form ile geliştiriciye ilk görevini atayabilirsiniz.
                </p>
              </div>
            ) : (
              // Gönderilen görevleri map() ile listele
              <div className="tasks-container">
                {outgoingTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    userRole="teamLeader"
                    viewMode="created_by_me" // Bu görevleri 'benim oluşturduğumu' karta belirtiyoruz
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default TeamLeaderDashboard;
