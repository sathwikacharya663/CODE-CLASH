import React from 'react'
import {
  LayoutDashboard,
  Timer,
  Trophy,
  Users,
  FileQuestion,
  Code2,
  Settings,
  LogOut,
  Zap,
} from 'lucide-react'

export default function AdminLayout({
  activeTab,
  onTabChange,
  adminUser,
  onLogout,
  children,
}) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'rounds', label: 'Round Control', icon: Timer },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'questions', label: 'Questions', icon: FileQuestion },
    { id: 'submissions', label: 'Submissions', icon: Code2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="flex h-screen w-screen bg-volt-bg text-volt-text font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-volt-bg-secondary border-r border-volt-border flex flex-col shrink-0 select-none">
        {/* Brand */}
        <div className="h-16 px-5 border-b border-volt-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-volt-bg-tertiary border border-volt-green/40 flex items-center justify-center shadow-[0_0_10px_rgba(57,255,20,0.2)]">
              <Zap className="w-4 h-4 text-volt-green" />
            </div>
            <div>
              <h1 className="font-mono font-bold text-base text-volt-green tracking-wider leading-none">
                CODE CLASH
              </h1>
              <span className="font-mono text-[10px] text-volt-text-muted tracking-widest uppercase">
                Admin Control
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-mono text-xs transition-all duration-150 ${
                  isActive
                    ? 'bg-volt-bg-tertiary text-volt-green border border-volt-green/30 shadow-[0_0_12px_rgba(57,255,20,0.1)] font-semibold'
                    : 'text-volt-text-muted hover:text-volt-text hover:bg-volt-bg/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-volt-green' : 'text-volt-text-muted'}`} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Footer Admin Info */}
        <div className="p-3 border-t border-volt-border bg-volt-bg/40">
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-volt-bg-secondary border border-volt-border">
            <div className="font-mono text-xs truncate">
              <p className="text-volt-text font-semibold truncate">{adminUser?.teamName || 'Admin'}</p>
              <p className="text-[10px] text-volt-text-muted">{adminUser?.teamId || 'ADMIN'}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 rounded text-volt-text-muted hover:text-volt-red hover:bg-volt-bg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-volt-bg">
        {children}
      </main>
    </div>
  )
}
