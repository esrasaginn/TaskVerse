import { createSlice } from "@reduxjs/toolkit";
// Tüm görevler içerisinden sadece arşivlenmiş (isArchived=true) olanları getiren fonksiyonu taskSlice'dan alıyoruz
import { selectArchivedTasks } from "../tasks/taskSlice";

// Arşiv sayfası için oluşturduğumuz Redux dilimi (Slice)
const archiveSlice = createSlice({
  name: "archive",
  // Arşivin durumu aslında Tasks (görevler) içinde tutulduğu için burada ekstra bir state (durum) tutmamıza gerek yok
  initialState: {},
  reducers: {},
});

// --- YETKİLENDİRİLMİŞ ARŞİV SEÇİCİSİ (SELECTOR) ---
// Hangi kullanıcının hangi arşivlenmiş görevleri görebileceğini hesaplayan fonksiyon.
// Bu sayede güvenlik sağlanmış olur ve kimse başkasının görevini göremez.
export const selectArchivedTasksForUser = (state) => {
  // Şu an sisteme giriş yapmış olan kullanıcıyı (currentUser) bul
  const user = state.auth.currentUser;
  
  // Eğer giriş yapmamışsa ona boş liste ([]) göster
  if (!user) return [];

  // Sistemdeki tüm arşivlenmiş görevleri getir
  const archived = selectArchivedTasks(state);

  // GÜVENLİK KURALI 1: Bir kullanıcı asla başka grubun (Örn: 2. Grubun) arşivlenmiş görevini göremez.
  // Bu nedenle sadece kullanıcının kendi grubuna (groupId) ait görevleri filtreliyoruz.
  const groupArchived = archived.filter((t) => t.groupId === user.groupId);

  // ROL BAZLI ERİŞİM KONTROLÜ
  if (user.role === "manager") {
    // 1. Yönetici: 
    // Yöneticiler kendi grupları içerisinde bizzat oluşturdukları tüm arşiv görevlerini görebilirler.
    return groupArchived.filter((t) => t.assignedByRole === "manager");
  } else if (user.role === "teamLeader") {
    // 2. Takım Lideri:
    // Takım lideri, Yöneticinin KENDİSİNE ATADIĞI veya KENDİSİNİN GELİŞTİRİCİYE ATADIĞI arşivlenmiş görevleri görebilir.
    return groupArchived.filter(
      (t) => t.assignedBy === user.id || t.assignedTo === user.id
    );
  } else if (user.role === "developer") {
    // 3. Geliştirici:
    // Geliştirici sadece doğrudan KENDİSİNE ATANAN arşivlenmiş görevleri görebilir. Başkasının arşivini göremez.
    return groupArchived.filter((t) => t.assignedTo === user.id);
  }
  
  // Eğer hiçbir kurala uymadıysa boş liste döndür (Güvenlik önlemi)
  return [];
};

export default archiveSlice.reducer;
