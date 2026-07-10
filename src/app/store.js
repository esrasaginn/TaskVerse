// Redux Toolkit'ten store oluşturmak için gerekli fonksiyonu import ediyoruz.
import { configureStore } from "@reduxjs/toolkit";

// Uygulamanın farklı kısımlarını yöneten reducer (durum yönetici) dosyalarını içe aktarıyoruz.
import authReducer from "../features/auth/authSlice"; // Giriş yapan kullanıcı durumu
import userReducer from "../features/users/userSlice"; // Sistemdeki tüm kullanıcıların listesi
import groupReducer from "../features/groups/groupSlice"; // Grupların listesi
import taskReducer from "../features/tasks/taskSlice"; // Görevlerin listesi ve işlemleri
import notificationReducer from "../features/notifications/notificationSlice"; // Bildirim (toast) mesajları
import archiveReducer from "../features/archive/archiveSlice"; // Arşivlenmiş görevlerin işlemleri
import filterReducer from "../features/filters/filterSlice"; // Görev araması ve filtreleme durumları

// Redux store'u yapılandırıyoruz. Tüm reducer'ları burada birleştirip uygulamanın merkezi veritabanını oluşturuyoruz.
export const store = configureStore({
  reducer: {
    auth: authReducer,             // 'auth' anahtarı altında kimlik doğrulama durumu tutulur.
    users: userReducer,            // 'users' anahtarı altında kullanıcı listesi tutulur.
    groups: groupReducer,          // 'groups' anahtarı altında grup bilgileri tutulur.
    tasks: taskReducer,            // 'tasks' anahtarı altında görev verileri tutulur.
    notifications: notificationReducer, // 'notifications' altında bildirimler tutulur.
    archive: archiveReducer,       // 'archive' altında arşiv işlemleri yönetilir.
    filters: filterReducer,        // 'filters' altında filtreleme kriterleri saklanır.
  },
});
