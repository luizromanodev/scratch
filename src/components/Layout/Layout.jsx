import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import Toast from '../UI/Toast'
import OfflineIndicator from '../UI/OfflineIndicator'
import './Layout.css'

export default function Layout() {
  return (
    <div className="layout">
      <OfflineIndicator />
      <main className="layout-main">
        <Outlet />
      </main>
      <BottomNav />
      <Toast />
    </div>
  )
}
