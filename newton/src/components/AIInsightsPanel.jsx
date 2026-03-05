function AIInsightsPanel() {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h1 className="text-xl font-bold text-white mb-6">AI Insights</h1>
      <button
        type="button"
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors mb-8"
      >
        Get AI Insight
      </button>

      <ul className="space-y-3 text-gray-400 text-sm">
        <li className="flex gap-2">
          <span className="text-gray-500">•</span>
          <span>You created 12 tasks this week. This is 23% more than the previous week.</span>
        </li>
        <li className="flex gap-2">
          <span className="text-gray-500">•</span>
          <span>Insight of the week: you created too many tasks on Monday and were not able to finish all of them.</span>
        </li>
        <li className="flex gap-2">
          <span className="text-gray-500">•</span>
          <span>Your task completion rate is 78% — consider adding fewer tasks per day for better results.</span>
        </li>
        <li className="flex gap-2">
          <span className="text-gray-500">•</span>
          <span>Wednesday is your most productive day — you completed 5 tasks compared to 2 on Friday.</span>
        </li>
        <li className="flex gap-2">
          <span className="text-gray-500">•</span>
          <span>You tend to add most tasks in the morning. Try spreading them throughout the day.</span>
        </li>
        <li className="flex gap-2">
          <span className="text-gray-500">•</span>
          <span>3 tasks were left incomplete last week. Consider moving them to a lower-priority day.</span>
        </li>
        <li className="flex gap-2">
          <span className="text-gray-500">•</span>
          <span>Your average task completion time is 45 minutes. Planning shorter tasks may help consistency.</span>
        </li>
        <li className="flex gap-2">
          <span className="text-gray-500">•</span>
          <span>You edited 4 tasks this week — revisiting past tasks shows good adaptability.</span>
        </li>
      </ul>
    </div>
  )
}

export default AIInsightsPanel
