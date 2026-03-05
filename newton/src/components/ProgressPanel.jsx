function ProgressPanel({ activities }) {
  const byDate = {}
  activities.forEach((a) => {
    const key = a.date
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(a)
  })
  const dates = Object.keys(byDate).sort((a, b) => new Date(b) - new Date(a))

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const formatTime = (timeStr) => {
    const [h, m] = timeStr.split(':')
    const hour = parseInt(h, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const h12 = hour % 12 || 12
    return `${h12}:${m} ${ampm}`
  }

  const getIcon = (type) => {
    if (type === 'created') {
      return (
        <span className="text-amber-400 mr-2">*</span>
      )
    }
    if (type === 'edited') {
      return (
        <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      )
    }
    if (type === 'deleted') {
      return (
        <svg className="w-4 h-4 text-red-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )
    }
    if (type === 'completed') {
      return (
        <svg className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
    return null
  }

  const getDescription = (a) => {
    const name = <span className="bg-gray-700/50 px-1 rounded text-gray-200">{a.taskName}</span>
    if (a.type === 'created') return <>{name} was created</>
    if (a.type === 'edited') return <>{name} was edited</>
    if (a.type === 'deleted') return <>{name} was deleted</>
    if (a.type === 'completed') return <>{name} was marked as done</>
    return a.description
  }

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setMonth(startOfMonth.getMonth())
  const rangeStart = startOfMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const rangeEnd = 'Today'

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h1 className="text-xl font-bold text-white mb-1">Progress</h1>
      <div className="flex items-center gap-2 text-gray-500 text-sm mb-6">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>{rangeStart} — {rangeEnd}</span>
      </div>

      {dates.length === 0 ? (
        <p className="text-gray-500 text-sm">No activity yet.</p>
      ) : (
        dates.map((dateKey) => (
          <div key={dateKey} className="mb-6">
            <h2 className="text-gray-400 font-medium mb-2">{formatDate(dateKey)}</h2>
            <hr className="border-gray-800 mb-3" />
            <ul className="space-y-2">
              {byDate[dateKey]
                .sort((a, b) => (b.time > a.time ? 1 : -1))
                .map((a) => (
                  <li key={a.id} className="flex items-center text-sm text-gray-400">
                    {getIcon(a.type)}
                    <span className="mr-2">{formatTime(a.time)}</span>
                    {getDescription(a)}
                  </li>
                ))}
            </ul>
          </div>
        ))
      )}
    </div>
  )
}

export default ProgressPanel
