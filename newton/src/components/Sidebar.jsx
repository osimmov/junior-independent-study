function Sidebar({ activePanel, onSelect }) {
  return (
    <aside className="w-14 flex flex-col items-center py-4 border-r border-gray-800" style={{ backgroundColor: '#1A1A1A' }}>
      {/* Horizon*/}
      <button
        type="button"
        onClick={() => onSelect('horizon')}
        className="relative w-full flex justify-center py-4 hover:bg-white/5 transition-colors"
        aria-label="Horizon"
      >
        {activePanel === 'horizon' && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gray-300 rounded-full" />
        )}
        <svg className={`w-6 h-6 ${activePanel === 'horizon' ? 'text-gray-300' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="14" width="12" height="3" strokeWidth="1.5" rx="0.5" />
          <rect x="8" y="9" width="8" height="3" strokeWidth="1.5" rx="0.5" />
          <rect x="10" y="4" width="4" height="3" strokeWidth="1.5" rx="0.5" />
        </svg>
      </button>

      {/* Progress*/}
      <button
        type="button"
        onClick={() => onSelect('progress')}
        className="relative w-full flex justify-center py-4 hover:bg-white/5 transition-colors"
        aria-label="Progress"
      >
        {activePanel === 'progress' && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gray-300 rounded-full" />
        )}
        <svg className={`w-6 h-6 ${activePanel === 'progress' ? 'text-gray-300' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="5" y="14" width="3" height="6" strokeWidth="1.5" rx="0.5" />
          <rect x="10.5" y="10" width="3" height="10" strokeWidth="1.5" rx="0.5" />
          <rect x="16" y="6" width="3" height="14" strokeWidth="1.5" rx="0.5" />
        </svg>
      </button>

      {/* AI Insights*/}
      <button
        type="button"
        onClick={() => onSelect('insights')}
        className="relative w-full flex justify-center py-4 hover:bg-white/5 transition-colors"
        aria-label="AI Insights"
      >
        {activePanel === 'insights' && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gray-300 rounded-full" />
        )}
        <svg className={`w-6 h-6 ${activePanel === 'insights' ? 'text-gray-300' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </button>
    </aside>
  )
}

export default Sidebar
