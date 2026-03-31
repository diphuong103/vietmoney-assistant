import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import BottomNav from './BottomNav'

export default function ClientLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
