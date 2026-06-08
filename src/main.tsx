import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { useAuthStore } from './store/authStore'
import { useMessageStore } from './store/messageStore'
import { DEFAULT_USER_ID } from './utils/constants'

function Root() {
  const { login, currentUser, isLoading } = useAuthStore()
  const { fetchUnreadCount } = useMessageStore()

  useEffect(() => {
    login()
  }, [login])

  useEffect(() => {
    if (currentUser) {
      fetchUnreadCount(currentUser.id)
      const interval = setInterval(() => {
        fetchUnreadCount(currentUser.id)
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [currentUser, fetchUnreadCount])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">加载中...</p>
        </div>
      </div>
    )
  }

  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
