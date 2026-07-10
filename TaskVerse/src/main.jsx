import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './app/store'
import './index.css'
import App from './App.jsx'

// React uygulamasının kök (root) dizinini HTML içindeki 'root' id'li elemente bağlıyoruz.
createRoot(document.getElementById('root')).render(
  // StrictMode, geliştirme aşamasında potansiyel hataları tespit etmek için kullanılır.
  <StrictMode>
    {/* Redux store'umuzu uygulamanın her yerinden erişilebilir hale getiriyoruz. */}
    <Provider store={store}>
      {/* Ana uygulama bileşenini ekrana çizdiriyoruz. */}
      <App />
    </Provider>
  </StrictMode>,
)
