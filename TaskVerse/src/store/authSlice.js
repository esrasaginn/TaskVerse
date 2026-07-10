// Redux Toolkit kullanarak durum (state) yönetimi için bir dilim (slice) oluşturuyoruz.
import { createSlice } from "@reduxjs/toolkit";

// Kimlik doğrulama (auth) işlemlerinin yönetildiği Redux dilimi
const authSlice = createSlice({
  // Bu dilimin Redux içindeki adı "auth"
  name: "auth",
  
  // Uygulama ilk açıldığında varsayılan başlangıç durumu (initial state)
  initialState: {
    currentUser: null,       // Giriş yapan kullanıcı (başlangıçta kimse yok)
    isAuthenticated: false,  // Giriş yapıldı mı? (başlangıçta hayır)
    role: null,              // Kullanıcının rolü (yönetici, takım lideri vb.)
    groupId: null,           // Kullanıcının bulunduğu grup numarası
    error: null,             // Herhangi bir giriş hatası var mı?
  },
  
  // Durumu (state) değiştiren fonksiyonlar (reducers)
  reducers: {
    // Yeni bir kullanıcı giriş yaptığında veya çıkış yaptığında çalışır
    setCurrentUser: (state, action) => {
      // action.payload = Login ekranından gönderilen kullanıcı bilgileri
      state.currentUser = action.payload; 
      
      // Eğer kullanıcı bilgisi varsa (true), giriş yapıldı sayılır
      // Çift ünlem (!!) kullanılarak objeyi true veya false'a çeviriyoruz
      state.isAuthenticated = !!action.payload; 
      
      // Giriş yapıldıysa rolünü ve grup numarasını state'e kaydet
      state.role = action.payload ? action.payload.role : null;
      state.groupId = action.payload ? action.payload.groupId : null;
      
      // Başarılı girişte eski hataları temizle
      state.error = null;
    },
    
    // Giriş sırasında veya başka bir yerde hata oluşursa çalışır
    setError: (state, action) => {
      // action.payload içindeki hata mesajını state'e kaydet
      state.error = action.payload;
    },
    
    // Var olan hataları silmek (ekrandan kaldırmak) için çalışır
    clearError: (state) => {
      state.error = null;
    },
  },
});

// Yukarıda tanımladığımız fonksiyonları (actions) diğer dosyalarda kullanabilmek için dışa aktarıyoruz
export const { setCurrentUser, setError, clearError } = authSlice.actions;

// Redux store'una (merkezi veritabanı) kaydetmek için bu reducer'ı dışa aktarıyoruz
export default authSlice.reducer;
