// Redux hook'ları içe aktarılıyor.
import { useDispatch, useSelector } from 'react-redux';
// Çıkış yapma işlemi için gerekli auth action'ı.
import { setCurrentUser } from '../features/auth/authSlice';

// Layout bileşeni, uygulamanın genel iskeletini (Header, Navbar, Footer) oluşturur.
// "children", bu iskeletin ortasında (main etiketinde) gösterilecek olan asıl sayfayı temsil eder.
const Layout = ({ 
  activeTab,    // Hangi sekmenin aktif olduğunu tutar (dashboard veya archive)
  setActiveTab, // Sekmeyi değiştirmek için kullanılır
  children      // Sayfanın asıl içeriği (örn: Görev Panosu bileşeni)
}) => {
  const dispatch = useDispatch();
  // Şu an sisteme giriş yapmış kullanıcı bilgisini alıyoruz.
  const currentUser = useSelector((state) => state.auth.currentUser);

  // Çıkış yap butonuna tıklandığında çalışır.
  const handleSignOut = () => {
    // Mevcut kullanıcıyı 'null' yaparak sistemi kapatıyoruz (çıkış).
    dispatch(setCurrentUser(null));
  };

  return (
    <div className="app-container">
      {/* Üst Kısım: Başlık ve Kullanıcı Bilgileri */}
      <header className="navbar">
        <div className="navbar-brand">
          <span style={{ fontSize: '2rem' }}>🚀</span>
          <div>
            <h1 className="serif-font">TaskVerse</h1>
            <p className="navbar-tagline">Görevleri yönet, ekibini ilerlet.</p>
          </div>
        </div>
        
        {/* Sadece bir kullanıcı giriş yaptıysa sağ üstteki paneli göster */}
        {currentUser && (
          <div className="navbar-user-section">
            <div className="navbar-stats-bar">
              {/* Kullanıcının adını ve ikonunu gösteren kısım */}
              <span className="navbar-stat-pill status-rank" style={{ cursor: 'default' }}>
                <span className="pill-icon">{currentUser.icon}</span>
                <span className="serif-font">{currentUser.fullName}</span>
              </span>
            </div>
            
            <div className="navbar-user">
              {/* Çıkış Yapma Butonu */}
              <button className="btn-signout" onClick={handleSignOut}>
                🚪 Çıkış Yap
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Alt Menü (Sekmeler): Görev Panosu ve Görev Arşivi */}
      {currentUser && (
        <div className="sub-navbar">
          <div className="sub-navbar-content">
            {/* Görev Panosu Sekmesi */}
            <button 
              className={`sub-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Görev Panosu
            </button>
            {/* Görev Arşivi Sekmesi */}
            <button 
              className={`sub-nav-btn ${activeTab === 'archive' ? 'active' : ''}`}
              onClick={() => setActiveTab('archive')}
            >
              📂 Görev Arşivi
            </button>
          </div>
        </div>
      )}
      
      {/* Ana İçerik: children değişkeni sayesinde App.jsx içinden gönderilen sayfayı burada çizdiriyoruz. */}
      <main className="main-content">
        {children}
      </main>

      {/* Sayfanın en altındaki bilgi şeridi (Footer) */}
      <footer className="footer-bar">
        <p className="serif-font">TaskVerse © 2026 | Görevleri yönet, ekibini ilerlet.</p>
      </footer>
    </div>
  );
};

export default Layout;
