import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { TokenProvider } from './context/TokenContext.jsx'
import { DebugProvider } from './context/DebugContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TokenProvider>
      <DebugProvider>
        <App />
      </DebugProvider>
    </TokenProvider>
  </React.StrictMode>,
)
