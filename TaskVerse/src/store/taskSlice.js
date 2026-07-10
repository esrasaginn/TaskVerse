import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// Bildirim mesajları çıkarmak için kullandığımız slice
import { addNotification } from "../notifications/notificationSlice";

// Farklı tarayıcı sekmeleri arasında (örn: iki farklı hesap yan yana açıkken)
// gerçek zamanlı iletişim kurmamızı sağlayan "BroadcastChannel" API'sini oluşturuyoruz.
// İsim "taskverse-tasks" olmak zorunda ki tüm sekmeler aynı kanalı dinlesin.
const channel = new BroadcastChannel("taskverse-tasks");

// Sekmeler arası iletişimi dinleyen ana fonksiyon. App.jsx içinden bir kez çağırılır.
export const setupTaskSyncListener = () => (dispatch, getState) => {
  // Diğer sekmeden bir mesaj geldiğinde bu fonksiyon tetiklenir
  channel.onmessage = (event) => {
    const state = getState();
    const currentUser = state.auth.currentUser;

    // Gelen mesajın türüne göre Redux state'ini (durumunu) güncelliyoruz.
    if (event.data.type === "TASK_CREATED") {
      const task = event.data.payload;
      // Yeni gelen görevi kendi state'imize de ekle
      dispatch(addTaskFromSync(task));
      
      // Eğer görev şu an bu sekmeye giriş yapmış kullanıcıya atandıysa bildirim göster
      if (currentUser && task.assignedTo === currentUser.id) {
        dispatch(addNotification({
          id: Date.now().toString(),
          message: "Yeni bir görev aldınız.",
          type: "info",
          assignedTo: currentUser.id
        }));
      }
    } else if (event.data.type === "TASK_UPDATED") {
      // Görev güncellendiyse (düzenleme, devretme vb.) state'te güncelle
      dispatch(updateTaskFromSync(event.data.payload));
    } else if (event.data.type === "TASK_DELETED") {
      // Görev silindiyse state'te silindi/iptal olarak işaretle
      dispatch(deleteTaskFromSync(event.data.payload));
    } else if (event.data.type === "TASK_COMPLETED") {
      // Görev onaylandıysa state'te onaylandı olarak işaretle
      dispatch(completeTaskFromSync(event.data.payload));
    } else if (event.data.type === "TASK_ARCHIVED") {
      // Arşive kaldırılan görevler için
      dispatch(archiveTaskFromSync(event.data.payload));
    } else if (event.data.type === "TASK_STATUS_CHANGED") {
      // Görevin durumu veya geri bildirimi değiştiyse
      const payload = event.data.payload;
      dispatch(changeTaskStatusFromSync(payload));
    } else if (event.data.type === "CLEAR_ARCHIVE") {
      // Arşiv tamamen silindiyse diğer sekmelerden de sil
      dispatch(clearArchiveFromSync(event.data.payload));
    }
  };
};

// Yaptığımız bir değişikliği diğer sekmelere "BroadcastChannel" üzerinden yollayan yardımcı fonksiyon.
const notifyOtherTabs = (type, payload) => {
  channel.postMessage({ type, payload });
};

// Uygulama ilk açıldığında tarayıcının kendi hafızasından (localStorage) eski görevleri okur
const getInitialTasks = () => {
  try {
    const saved = localStorage.getItem("taskverse_tasks");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Başlangıçta test için konan "task-init-" ID'li sahte görevleri temizler
      const cleaned = parsed.filter((t) => !t.id.startsWith("task-init-"));
      localStorage.setItem("taskverse_tasks", JSON.stringify(cleaned));
      return cleaned;
    }
  } catch (e) {
    // Eğer okuma sırasında hata olursa boş geç (uygulamanın çökmesini engeller)
  }
  return []; // Hata varsa veya veri yoksa boş liste döndür
};

// --- ASYNC THUNKS ---
// Bunlar, bir işlem yapıldığında (görev ekleme, silme) hem Redux state'ini güncelleyen 
// hem de `notifyOtherTabs` ile diğer sekmelere haber veren asenkron (gecikmeli/işlemli) fonksiyonlardır.

// Yeni Görev Ekleme İşlemi
export const addTaskThunk = createAsyncThunk(
  "tasks/addTask",
  async (taskData, { dispatch, getState, rejectWithValue }) => {
    const state = getState();
    const currentUser = state.auth.currentUser;
    // Güvenlik: Kullanıcı giriş yapmamışsa reddet
    if (!currentUser) return rejectWithValue("Kullanıcı girişi yapılmamış.");

    const { title, description, assignedTo, dueDate, priority, category } = taskData;
    
    // Veri Doğrulama (Validation) Kuralları
    if (!title || !title.trim()) return rejectWithValue("Görev başlığı boş olamaz.");
    if (!description || !description.trim()) return rejectWithValue("Görev açıklaması boş olamaz.");
    if (!assignedTo) return rejectWithValue("Atanacak kullanıcı seçilmeden görev gönderilemez.");
    if (currentUser.role === "developer") return rejectWithValue("Geliştirici görev oluşturamaz.");
    
    // Atanacak kişinin bizimle aynı grupta olup olmadığını kontrol et
    const allUsers = state.users.users;
    const assignee = allUsers.find(u => u.id === assignedTo);
    if (!assignee) return rejectWithValue("Atanacak personel sistemde bulunamadı.");
    if (assignee.groupId !== currentUser.groupId) return rejectWithValue("Farklı gruptaki bir kullanıcıya görev gönderilemez.");
    
    // Hiyerarşi Kontrolü:
    // Yöneticiler sadece takım liderlerine, Takım liderleri sadece geliştiricilere görev verebilir.
    if (currentUser.role === "manager" && assignee.role !== "teamLeader") {
      return rejectWithValue("Yönetici sadece takım liderine görev gönderebilir.");
    }
    if (currentUser.role === "teamLeader" && assignee.role !== "developer") {
      return rejectWithValue("Takım lideri sadece geliştiriciye görev gönderebilir.");
    }

    // Görev için yeni bir ID oluştur (zaman damgası ile)
    const id = "task-" + Date.now();
    // Görevin tüm verilerini hazırlıyoruz
    const newTask = {
      id,
      title,
      description,
      dueDate,
      priority: priority || "dusuk",
      category: category || "mülki",
      assignedBy: currentUser.id,
      assignedByRole: currentUser.role,
      assignedTo: assignee.id,
      assignedToRole: assignee.role,
      groupId: currentUser.groupId,
      status: "bekliyor", // Yeni görevler her zaman "bekliyor" durumundadır
      isArchived: false,
      feedback: "",
      rejectionReason: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Oluşturduğumuz bu görevi kendi sistemimize kaydet (Redux'a ekle)
    dispatch(addTask(newTask));
    // Diğer sekmelere (mesela takım liderinin bilgisayarına) haber ver
    notifyOtherTabs("TASK_CREATED", newTask);
    return newTask;
  }
);

// Görevi Düzenleme İşlemi (Başlık vb. değiştiğinde)
export const updateTaskThunk = createAsyncThunk(
  "tasks/updateTask",
  async (payload, { dispatch }) => {
    dispatch(updateTask(payload));
    notifyOtherTabs("TASK_UPDATED", payload);
    return payload;
  }
);

// Görevi İptal Etme (Silme) İşlemi
export const deleteTaskThunk = createAsyncThunk(
  "tasks/deleteTask",
  async (taskId, { dispatch }) => {
    dispatch(deleteTask(taskId));
    notifyOtherTabs("TASK_DELETED", taskId);
    return taskId;
  }
);

// Görevi Onaylama İşlemi
export const completeTaskThunk = createAsyncThunk(
  "tasks/completeTask",
  async (taskId, { dispatch }) => {
    dispatch(completeTask(taskId));
    notifyOtherTabs("TASK_COMPLETED", taskId);
    return taskId;
  }
);

// Görevi Arşive Taşıma İşlemi
export const archiveTaskThunk = createAsyncThunk(
  "tasks/archiveTask",
  async (taskId, { dispatch }) => {
    dispatch(archiveTask(taskId));
    notifyOtherTabs("TASK_ARCHIVED", taskId);
    return taskId;
  }
);

// Görevin Durumunu (Devam Ediyor, Tamamlandı, Geri Bildirim vb.) Değiştirme İşlemi
export const changeTaskStatusThunk = createAsyncThunk(
  "tasks/changeTaskStatus",
  async (payload, { dispatch }) => {
    dispatch(changeTaskStatus(payload));
    notifyOtherTabs("TASK_STATUS_CHANGED", payload);
    return payload;
  }
);

// Arşivi Tamamen Temizleme İşlemi
export const clearArchiveThunk = createAsyncThunk(
  "tasks/clearArchive",
  async (_, { dispatch, getState }) => {
    const user = getState().auth.currentUser;
    if (user) {
      dispatch(clearArchive(user));
      notifyOtherTabs("CLEAR_ARCHIVE", user);
    }
  }
);

// --- REDUX DİLİMİ (SLICE) ---
// State'in asıl olarak güncellendiği yer burasıdır. (Senkron işlemler)
const taskSlice = createSlice({
  name: "tasks",
  initialState: {
    tasks: getInitialTasks(), // Sayfa açılırken verileri localStorage'dan alır
  },
  reducers: {
    // Tüm görev listesini üstüne yazmak için
    setTasks: (state, action) => {
      state.tasks = action.payload;
      localStorage.setItem("taskverse_tasks", JSON.stringify(action.payload)); // Tarayıcı hafızasına kaydet
    },
    // Yeni görev eklendiğinde state'in en başına (unshift) koyar
    addTask: (state, action) => {
      const task = action.payload;
      state.tasks.unshift(task);
      localStorage.setItem("taskverse_tasks", JSON.stringify(state.tasks));
    },
    // Diğer sekmeden yeni bir görev geldiğinde (Sync), eğer bizde zaten yoksa en başa koyar
    addTaskFromSync: (state, action) => {
      const task = action.payload;
      if (!state.tasks.find(t => t.id === task.id)) {
        state.tasks.unshift(task);
        localStorage.setItem("taskverse_tasks", JSON.stringify(state.tasks));
      }
    },
    // Görevi günceller (Düzenle formundan gelirse)
    updateTask: (state, action) => {
      const { id, ...fields } = action.payload;
      const existing = state.tasks.find((t) => t.id === id);
      if (existing) {
        Object.assign(existing, fields); // Eski değerlerin üstüne yeni gelenleri (fields) yaz
        existing.updatedAt = new Date().toISOString(); // Güncellenme tarihini şu anki zaman yap
        localStorage.setItem("taskverse_tasks", JSON.stringify(state.tasks));
      }
    },
    // Diğer sekmeden görev güncellemesi geldiğinde
    updateTaskFromSync: (state, action) => {
      const { id, ...fields } = action.payload;
      const existing = state.tasks.find((t) => t.id === id);
      if (existing) {
        Object.assign(existing, fields);
        existing.updatedAt = new Date().toISOString();
        localStorage.setItem("taskverse_tasks", JSON.stringify(state.tasks));
      }
    },
    // Görev silindiğinde (iptal edildiğinde), tamamen silmek yerine durumunu iptal yapıp arşive yollar
    deleteTask: (state, action) => {
      const taskId = action.payload;
      const existing = state.tasks.find((t) => t.id === taskId);
      if (existing) {
        existing.status = "iptal_edildi";
        existing.isArchived = true;
        existing.updatedAt = new Date().toISOString();
        localStorage.setItem("taskverse_tasks", JSON.stringify(state.tasks));
      }
    },
    // Diğer sekmeden görev silinme emri geldiğinde
    deleteTaskFromSync: (state, action) => {
      const taskId = action.payload;
      const existing = state.tasks.find((t) => t.id === taskId);
      if (existing) {
        existing.status = "iptal_edildi";
        existing.isArchived = true;
        existing.updatedAt = new Date().toISOString();
        localStorage.setItem("taskverse_tasks", JSON.stringify(state.tasks));
      }
    },
    // Görev onaylandığında durumu onaylandı yapıp arşive yollar
    completeTask: (state, action) => {
      const taskId = action.payload;
      const existing = state.tasks.find((t) => t.id === taskId);
      if (existing) {
        existing.status = "onaylandi";
        existing.isArchived = true;
        existing.updatedAt = new Date().toISOString();
        localStorage.setItem("taskverse_tasks", JSON.stringify(state.tasks));
      }
    },
    // Diğer sekmeden görev onaylama emri geldiğinde
    completeTaskFromSync: (state, action) => {
      const taskId = action.payload;
      const existing = state.tasks.find((t) => t.id === taskId);
      if (existing) {
        existing.status = "onaylandi";
        existing.isArchived = true;
        existing.updatedAt = new Date().toISOString();
        localStorage.setItem("taskverse_tasks", JSON.stringify(state.tasks));
      }
    },
    // Görevi arşive kaldırma (isArchived = true yapma)
    archiveTask: (state, action) => {
      const taskId = action.payload;
      const existing = state.tasks.find((t) => t.id === taskId);
      if (existing) {
        existing.isArchived = true;
        existing.updatedAt = new Date().toISOString();
        localStorage.setItem("taskverse_tasks", JSON.stringify(state.tasks));
      }
    },
    archiveTaskFromSync: (state, action) => {
      const taskId = action.payload;
      const existing = state.tasks.find((t) => t.id === taskId);
      if (existing) {
        existing.isArchived = true;
        existing.updatedAt = new Date().toISOString();
        localStorage.setItem("taskverse_tasks", JSON.stringify(state.tasks));
      }
    },
    // Görevin durumu, geri bildirimi veya reddedilme sebebi değiştiğinde
    changeTaskStatus: (state, action) => {
      const { id, status, feedback, rejectionReason } = action.payload;
      const existing = state.tasks.find((t) => t.id === id);
      if (existing) {
        // Tanımlı olmayan (undefined) değerleri es geçmek için kontrol yapıyoruz
        if (status !== undefined) existing.status = status;
        if (feedback !== undefined) existing.feedback = feedback;
        if (rejectionReason !== undefined) existing.rejectionReason = rejectionReason;
        existing.updatedAt = new Date().toISOString();
        localStorage.setItem("taskverse_tasks", JSON.stringify(state.tasks));
      }
    },
    changeTaskStatusFromSync: (state, action) => {
      const { id, status, feedback, rejectionReason } = action.payload;
      const existing = state.tasks.find((t) => t.id === id);
      if (existing) {
        if (status !== undefined) existing.status = status;
        if (feedback !== undefined) existing.feedback = feedback;
        if (rejectionReason !== undefined) existing.rejectionReason = rejectionReason;
        existing.updatedAt = new Date().toISOString();
        localStorage.setItem("taskverse_tasks", JSON.stringify(state.tasks));
      }
    },
    // Arşiv sayfasındaki "Arşivi Temizle" işlemi
    clearArchive: (state, action) => {
      const user = action.payload;
      // Görev arşivlenmiş VE kullanıcının grubuna aitse listeden silinir (filter metodu tutulacakları alır, bu yüzden ters mantık)
      state.tasks = state.tasks.filter((t) => !(t.isArchived && t.groupId === user.groupId));
      localStorage.setItem("taskverse_tasks", JSON.stringify(state.tasks));
    },
    clearArchiveFromSync: (state, action) => {
      const user = action.payload;
      state.tasks = state.tasks.filter((t) => !(t.isArchived && t.groupId === user.groupId));
      localStorage.setItem("taskverse_tasks", JSON.stringify(state.tasks));
    },
  },
});

// Reducer'ları dışa aktar (Slice içinde kullanabilmek için)
export const {
  setTasks,
  addTask,
  addTaskFromSync,
  updateTask,
  updateTaskFromSync,
  deleteTask,
  deleteTaskFromSync,
  completeTask,
  completeTaskFromSync,
  archiveTask,
  archiveTaskFromSync,
  changeTaskStatus,
  changeTaskStatusFromSync,
  clearArchive,
  clearArchiveFromSync,
} = taskSlice.actions;

// --- SEÇİCİLER (SELECTORS) ---
// Bileşenlerin, Redux içindeki veriyi kendi ihtiyaçlarına göre filtreleyerek almasını sağlar

// Arşivde olmayan aktif görevler
export const selectActiveTasks = (state) =>
  state.tasks.tasks.filter((t) => !t.isArchived);

// Sadece arşivlenmiş olan görevler
export const selectArchivedTasks = (state) =>
  state.tasks.tasks.filter((t) => t.isArchived);

// Belirli bir gruba ait görevler
export const selectTasksByGroup = (state, groupId) =>
  state.tasks.tasks.filter((t) => t.groupId === groupId && !t.isArchived);

// Belirli bir kullanıcının 'Verdiği/Atadığı' görevler
export const selectTasksAssignedByUser = (state, userId) =>
  state.tasks.tasks.filter((t) => t.assignedBy === userId && !t.isArchived);

// Belirli bir kullanıcıya 'Gelen/Atanan' görevler
export const selectTasksAssignedToUser = (state, userId) =>
  state.tasks.tasks.filter((t) => t.assignedTo === userId && !t.isArchived);

// Dashboard sayfalarında görünmesi gereken, şu an giriş yapmış kullanıcının görevlerini çeker.
export const selectTasksByCurrentUser = (state) => {
  const user = state.auth.currentUser;
  if (!user) return []; // Giriş yapmamışsa boş dön
  
  // Önce sadece aktifleri filtrele
  const active = state.tasks.tasks.filter((t) => !t.isArchived);
  
  // Sadece kullanıcının kendi grubuna ait olanları seç
  const groupTasks = active.filter((t) => t.groupId === user.groupId);

  let userTasks = [];
  
  if (user.role === "manager") {
    // Yönetici: Bu grubun yöneticisi tarafından (yani kendisi tarafından) atanan görevleri görür
    userTasks = groupTasks.filter((t) => t.assignedByRole === "manager");
  } else if (user.role === "teamLeader") {
    // Takım Lideri: Yöneticinin ona attığı VEYA kendisinin geliştiriciye attığı görevleri görür
    userTasks = groupTasks.filter(
      (t) =>
        (t.assignedTo === user.id && t.assignedToRole === "teamLeader") ||
        (t.assignedBy === user.id && t.assignedToRole === "developer")
    );
  } else if (user.role === "developer") {
    // Geliştirici: Sadece kendine (ID'sine) atanan görevleri görür
    userTasks = groupTasks.filter(
      (t) => t.assignedTo === user.id && t.assignedToRole === "developer"
    );
  }

  // Takım Lideri eğer bir görevi Geliştiriciye devrettiyse, alt görevin güncel durumunu ana görevin kartına bilgi olarak ekle.
  return userTasks.map((t) => {
    if (user.role === "teamLeader" && t.assignedTo === user.id && t.delegatedTaskId) {
      // Alt görevi bul
      const child = state.tasks.tasks.find((c) => c.id === t.delegatedTaskId);
      if (child) {
        return {
          ...t,
          delegatedTaskStatus: child.status, // Geliştiricinin güncellediği durum
          delegatedTaskFeedback: child.feedback, // Geliştiricinin geri bildirimi
          delegatedTaskRejectionReason: child.rejectionReason, // Varsa reddedilme nedeni
        };
      }
    }
    return t; // Eğer alt görev yoksa normal görevi döndür
  });
};

export default taskSlice.reducer;
