// Gerekli React hook'larını (useEffect, useState) içe aktarıyoruz.
import { useEffect, useState } from 'react';
// Redux durumuna erişmek (useSelector) ve eylem göndermek (useDispatch) için gerekli hook'lar.
import { useSelector, useDispatch } from 'react-redux';
// Projedeki bileşenleri (component) sayfaya dahil ediyoruz.
import Login from './components/Login';
import Layout from './components/Layout';
import ManagerDashboard from './pages/ManagerDashboard';
import TeamLeaderDashboard from './pages/TeamLeaderDashboard';
import DeveloperDashboard from './pages/DeveloperDashboard';
import ArchivePage from './pages/ArchivePage';
// Bildirimlerle ilgili Redux eylemleri (action) ve seçicileri (selector).
import { 
  selectNotifications, 
  removeNotification 
} from './features/notifications/notificationSlice';
// Farklı sekmeler arasında veri senkronizasyonu sağlayan fonksiyon.
import { setupTaskSyncListener } from './features/tasks/taskSlice';

// Uygulamanın ana bileşeni (Main Component)
function App() {
  const dispatch = useDispatch(); // Redux'a komut göndermek için kullanılır.
  // Sisteme giriş yapmış olan kullanıcının bilgilerini Redux store'dan alıyoruz.
  const currentUser = useSelector((state) => state.auth.currentUser);
  // Ekranda gösterilecek bildirim (toast) mesajlarını store'dan çekiyoruz.
  const toasts = useSelector(selectNotifications);
  // Hangi sekmenin (Görev Panosu veya Arşiv) aktif olduğunu tutan state (durum).
  const [activeTab, setActiveTab] = useState('dashboard');

  // Uygulama ilk yüklendiğinde diğer sekmelerle eşzamanlı çalışmayı başlatan dinleyiciyi kurar.
  useEffect(() => {
    dispatch(setupTaskSyncListener());
  }, [dispatch]);

  // Ekranda çıkan bildirimlerin 4.5 saniye sonra otomatik olarak kaybolmasını sağlar.
  useEffect(() => {
    if (toasts.length > 0) {
      // En son eklenen bildirimi alıyoruz.
      const latest = toasts[toasts.length - 1];
      const timer = setTimeout(() => {
        // Belirtilen süre dolduğunda bildirimi Redux'tan siliyoruz.
        dispatch(removeNotification(latest.id));
      }, 4500);
      // Bileşen temizlenirse veya yeni bildirim gelirse eski zamanlayıcıyı iptal ediyoruz.
      return () => clearTimeout(timer);
    }
  }, [toasts, dispatch]);

  // Kullanıcının rolüne göre hangi paneli (dashboard) göreceğini belirleyen yardımcı fonksiyon.
  const renderDashboard = () => {
    // Eğer kimse giriş yapmamışsa hiçbir şey gösterme.
    if (!currentUser) return null;

    // Kullanıcı rolüne göre uygun sayfayı (komponenti) döndür.
    switch (currentUser.role) {
      case 'manager':
        return <ManagerDashboard />;
      case 'teamLeader':
        return <TeamLeaderDashboard />;
      case 'developer':
        return <DeveloperDashboard />;
      default:
        // Eğer tanımsız bir rol varsa hata mesajı gösterilir.
        return (
          <div className="info-modal">
            <h3>Hata</h3>
            <p>Makamınız tanımlanamadı.</p>
          </div>
        );
    }
  };

  return (
    <>
      {/* Sağ üst veya alt köşede çıkan bildirimlerin (Toast) gösterildiği alan */}
      <div className="toast-container">
        {toasts.map((toast) => (
          // Her bir bildirim için ekrana bir kutucuk çizdiriyoruz.
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span className="toast-icon">
              {/* Bildirimin türüne göre ikon belirliyoruz. */}
              {toast.type === 'success' ? '✔️' : toast.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <div className="toast-message">{toast.message}</div>
            {/* Bildirimi manuel olarak kapatmaya yarayan çarpı butonu */}
            <button 
              className="toast-close-btn" 
              onClick={() => dispatch(removeNotification(toast.id))}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* 
        Eğer kullanıcı giriş yapmışsa (currentUser varsa) Layout (arayüz iskeleti) gösterilir.
        Aksi takdirde (giriş yapmamışsa) Login ekranı gösterilir.
      */}
      {currentUser ? (
        <Layout 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        >
          {/* Hangi sekme aktifse o sekmenin içeriğini ekrana çizdir. */}
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'archive' && <ArchivePage />}
        </Layout>
      ) : (
        <Login />
      )}
    </>
  );
}

export default App;
