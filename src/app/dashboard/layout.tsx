import Sidebar from './Sidebar'
import DisclaimerGate from './DisclaimerGate'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto px-10 py-8">
        <DisclaimerGate>{children}</DisclaimerGate>
      </main>
    </div>
  )
}
