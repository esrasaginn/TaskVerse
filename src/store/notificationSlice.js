import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Yeni bir bildirim (toast) eklemek için asenkron (gecikmeli/işlemli) fonksiyon
// Bu sayede bildirime rastgele bir ID atayabiliyoruz ve kimin göreceğini belirliyoruz.
export const addNotificationThunk = createAsyncThunk(
  "notifications/addNotification",
  async (payload, { dispatch }) => {
    // message: Ekranda yazacak metin (örn: "Görev Onaylandı")
    // type: Bildirimin rengi (success = yeşil, error = kırmızı, info = mavi)
    // assignedTo: Bu bildirimi kimin göreceği (kullanıcı ID'si). Boş bırakılırsa herkes görebilir.
    const { message, type, assignedTo } = payload;
    
    // Bildirime benzersiz bir kimlik numarası (ID) oluştur (Örn: 1629837213abc)
    // Bu sayede her bildirimi ayrı ayrı takip edip kapatabileceğiz.
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    
    const newNotif = {
      id,
      message,
      type: type || "info", // Eğer renk belirtilmemişse varsayılan olarak mavi (info) yap
      isRead: false, // Henüz okunmadı
      assignedTo: assignedTo || null, // Eğer kişi belirtilmemişse null yap
      createdAt: new Date().toISOString(), // Bildirimin oluşturulma saati
    };
    
    // Oluşturduğumuz bu bildirimi Redux durumuna (state) gönder.
    dispatch(addNotification(newNotif));
    return newNotif;
  }
);

// Ekranda açık olan bir bildirimi kapatmak (silmek) için kullanılan asenkron fonksiyon
export const removeNotificationThunk = createAsyncThunk(
  "notifications/removeNotification",
  async (id, { dispatch }) => {
    // ID'ye göre bildirimi listeden çıkar
    dispatch(removeNotification(id));
    return id;
  }
);

// Bildirimlerin durumunu yöneten Redux dilimi (Slice)
const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    notifications: [], // Başlangıçta ekranda hiç bildirim yok
  },
  reducers: {
    // Bildirim listesini tamamen yenilemek (üstüne yazmak) için
    setNotifications: (state, action) => {
      state.notifications = action.payload;
    },
    // Listeye (ekrana) yeni bildirim ekler
    addNotification: (state, action) => {
      state.notifications.push(action.payload);
    },
    // İstenilen ID'ye sahip bildirimi listeden (ekrandan) siler
    removeNotification: (state, action) => {
      // filter: Sadece silmek istemediğimiz (id'si eşleşmeyen) bildirimleri tutar
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload
      );
    },
    // Tüm bildirimleri tek seferde silmek (temizlemek) için
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

// Reducer fonksiyonlarını diğer dosyalarda kullanabilmek için dışa aktarıyoruz
export const {
  setNotifications,
  addNotification,
  removeNotification,
  clearNotifications,
} = notificationSlice.actions;

// --- SEÇİCİLER (SELECTORS) ---

// Ekranda gösterilecek bildirimleri çeken fonksiyon
export const selectNotifications = (state) => {
  const currentUser = state.auth.currentUser;
  
  // Eğer sisteme birisi giriş yaptıysa (currentUser varsa)
  if (currentUser) {
    // Sadece HERKESE AÇIK olanları (!assignedTo) VEYA KENDİSİNE ATANANLARI (assignedTo === currentUser.id) göster
    return state.notifications.notifications.filter(
      (n) => !n.assignedTo || n.assignedTo === currentUser.id
    );
  }
  // Kimse giriş yapmamışsa hepsini döndür (Genelde giriş ekranındaki hatalar için)
  return state.notifications.notifications;
};

// store.js içinde kullanmak için reducer'ı dışa aktar
export default notificationSlice.reducer;
