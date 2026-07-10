// React hook'larını içe aktarıyoruz.
// useState: Bileşen içindeki değişkenlerin durumunu (state) yönetmek için.
// useEffect: Sayfa yüklendiğinde veya bir değer değiştiğinde çalışacak fonksiyonlar için.
import { useState, useEffect } from 'react';
// Redux kancaları (hooks)
import { useDispatch, useSelector } from 'react-redux';
// Giriş işlemleri ve hatalarını yöneten Redux fonksiyonları (action'lar).
import { clearError, setCurrentUser } from '../features/auth/authSlice';
// Veritabanındaki tüm kullanıcıları getiren seçici (selector) fonksiyon.
import { selectAllUsers } from '../features/users/userSlice';
// Ekranda bildirim göstermeye yarayan fonksiyon.
import { addNotification } from '../features/notifications/notificationSlice';

const Login = () => {
  const dispatch = useDispatch();
  // Tüm kullanıcıları store'dan alıyoruz.
  const users = useSelector(selectAllUsers);
  // Redux store'daki giriş hatasını alıyoruz (varsa).
  const authError = useSelector((state) => state.auth.error);

  // Form içindeki alanlar için durumları (state) tanımlıyoruz.
  const [selectedRole, setSelectedRole] = useState('manager'); // Seçili rol: manager, teamLeader, developer
  const [username, setUsername] = useState('manager'); // Kullanıcı adı girişi
  const [password, setPassword] = useState('1234'); // Şifre girişi
  const [rememberMe, setRememberMe] = useState(false); // Beni hatırla seçeneği
  const [error, setError] = useState(''); // Ekrandaki hata mesajı
  const [showPassword, setShowPassword] = useState(false); // Şifreyi göster/gizle geçişi
  const [loading, setLoading] = useState(false); // Yükleniyor durumu (bekleme ekranı için)

  // Seçilen role göre formdaki kullanıcı adı ve şifreyi otomatik dolduruyoruz (test için kolaylık).
  useEffect(() => {
    if (selectedRole === 'manager') {
      setUsername('manager');
      setPassword('1234');
    } else if (selectedRole === 'teamLeader') {
      setUsername('teamlead');
      setPassword('1234');
    } else if (selectedRole === 'developer') {
      setUsername('developer');
      setPassword('1234');
    }
  }, [selectedRole]);

  // Eğer Redux üzerinde (authError) bir giriş hatası meydana gelirse,
  // bu hatayı ekranda bildirim (toast) olarak gösteriyoruz.
  useEffect(() => {
    if (authError) {
      setError(authError);
      dispatch(addNotification({ 
        id: Date.now().toString(),
        message: authError, 
        type: 'error' 
      }));
      // Gösterdikten sonra hatayı siliyoruz ki sürekli ekranda kalmasın.
      dispatch(clearError());
    }
  }, [authError, dispatch]);

  // Rol kartlarına (Yönetici, Takım Lideri, Geliştirici) tıklanıldığında çalışır.
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError(''); // Rol değiştiğinde varsa ekrandaki hatayı temizle.
  };

  // 'Şifremi unuttum' linkine tıklandığında çalışır.
  const handleForgotPassword = (e) => {
    e.preventDefault(); // Sayfanın yenilenmesini engeller.
    dispatch(addNotification({
      id: Date.now().toString(),
      message: "Varsayılan giriş şifreniz '1234' olarak tanımlanmıştır.",
      type: "info"
    }));
  };

  // Giriş (Login) formunun gönderilme (Submit) olayı.
  const handleSubmit = (e) => {
    e.preventDefault(); // Form gönderilince sayfanın yenilenmesini durduruyoruz.
    setError('');
    setLoading(true); // Giriş yapılıyor ikonunu aktif ediyoruz.

    // Kullanıcı adını küçük harflere çevirip boşlukları siliyoruz (standartlaştırma).
    const normUsername = username.toLowerCase().trim();

    // Veritabanı içindeki kullanıcılar listesinde eşleşen kişiyi arıyoruz.
    // Seçilen rol, kullanıcı adı ve şifre veritabanındaki kişiyle tamamen aynı olmalı.
    const matchedUser = users.find(
      (u) => 
        u.role === selectedRole && 
        u.username.toLowerCase() === normUsername && 
        u.password === password
    );

    // Eğer böyle bir kullanıcı bulunamazsa hata mesajı göster ve işlemi iptal et.
    if (!matchedUser) {
      setError("Giriş bilgileri hatalı. Lütfen seçilen rol, kullanıcı adı ve şifreyi kontrol ediniz.");
      dispatch(addNotification({ 
        id: Date.now().toString(),
        message: "Rol veya kimlik doğrulaması başarısız.", 
        type: "error" 
      }));
      setLoading(false); // Yüklenme bitiyor.
      return;
    }

    // Kullanıcı bilgileri doğruysa, kişiyi 'şu an giriş yapmış olan kullanıcı' (currentUser) olarak ayarlıyoruz.
    dispatch(setCurrentUser(matchedUser));
    // Ekranda hoş geldin bildirimi çıkartıyoruz.
    dispatch(addNotification({ 
      id: Date.now().toString(),
      message: `Hoş geldiniz, ${matchedUser.fullName}!`, 
      type: 'success' 
    }));
    setLoading(false);
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        {/* Üst başlık alanı */}
        <div className="login-header">
          <span style={{ fontSize: '3rem' }}>🚀</span>
          <h1 className="serif-font">TaskVerse</h1>
          <p>“Görevleri yönet, ekibini ilerlet.”</p>
        </div>

        {/* Hata varsa bu kırmızı kutucuğu çizdiriyoruz. */}
        {error && (
          <div className="login-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="role-selection-label">
            Rolünüzü Seçiniz
          </label>
          
          {/* Rol Seçim Kartları */}
          <div className="role-cards">
            {/* Yönetici Rolü Kartı */}
            <div
              className={`role-card ${selectedRole === 'manager' ? 'active' : ''}`}
              onClick={() => handleRoleSelect('manager')}
            >
              <span className="role-card-icon">👔</span>
              <span className="role-card-title serif-font">Yönetici</span>
            </div>
            {/* Takım Lideri Rolü Kartı */}
            <div
              className={`role-card ${selectedRole === 'teamLeader' ? 'active' : ''}`}
              onClick={() => handleRoleSelect('teamLeader')}
            >
              <span className="role-card-icon">🧭</span>
              <span className="role-card-title serif-font">Takım Lideri</span>
            </div>
            {/* Geliştirici Rolü Kartı */}
            <div
              className={`role-card ${selectedRole === 'developer' ? 'active' : ''}`}
              onClick={() => handleRoleSelect('developer')}
            >
              <span className="role-card-icon">💻</span>
              <span className="role-card-title serif-font">Geliştirici</span>
            </div>
          </div>

          {/* Kullanıcı Adı Girişi */}
          <div className="form-group">
            <label htmlFor="username">Kullanıcı Adı</label>
            <input
              type="text"
              id="username"
              className="form-control"
              placeholder="Kullanıcı adınızı giriniz"
              value={username}
              onChange={(e) => setUsername(e.target.value)} // Klavyeden girilen her harfi state'e atar.
              required // Zorunlu alan
              disabled={loading} // Yüklenirken klavye kullanımını engeller.
            />
          </div>

          {/* Şifre Girişi */}
          <div className="form-group" style={{ position: 'relative' }}>
            <label htmlFor="password">Şifre</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                // Eğer showPassword true ise metin görünür, değilse nokta nokta (password) görünür.
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="form-control"
                placeholder="Şifrenizi giriniz"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: '40px' }} // Göz ikonu için sağdan boşluk bıraktık.
                disabled={loading}
              />
              {/* Şifreyi Gizle/Göster Butonu */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--text-muted)',
                  userSelect: 'none'
                }}
                title={showPassword ? "Şifreyi Gizle" : "Şifreyi Göster"}
                disabled={loading}
              >
                {/* Duruma göre göz veya kilit emojisi gösteriyoruz. */}
                {showPassword ? '👁️' : '🔒'}
              </button>
            </div>
          </div>

          {/* Beni Hatırla ve Şifremi Unuttum kısmı */}
          <div className="form-options">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <span>Beni Hatırla</span>
            </label>
            <a href="#" className="forgot-password" onClick={handleForgotPassword}>
              Şifremi Unuttum?
            </a>
          </div>

          {/* Giriş Butonu */}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '⏳ Giriş Yapılıyor...' : '🚀 Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
