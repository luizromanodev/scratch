import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import Toast from '../UI/Toast'
import './Layout.css'

export default function Layout() {
  return (
    <div className="layout">
      <main className="layout-main">
        <Outlet />
      </main>
      <BottomNav />
      <Toast />
    </div>
  )
}
