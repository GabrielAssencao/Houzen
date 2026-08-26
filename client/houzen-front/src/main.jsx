import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app.jsx'
import { NotificationProvider } from './components/NotificationCenter.jsx'
import 'bootstrap/dist/css/bootstrap.min.css' // Importação do Bootstrap Global
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </React.StrictMode>,
)
