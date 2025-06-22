import React from 'react'

const PublicGoalsSlider = ({ goals }) => {
  return (
    <div className="overflow-x-auto flex space-x-4 py-4">
      {goals.map(goal => (
        <div key={goal.id} className="min-w-[16rem] bg-white rounded-lg shadow-md p-4">
          <div className="text-xl font-semibold mb-2">{goal.title}</div>
          <p className="text-gray-500 text-sm">{goal.description}</p>
        </div>
      ))}
    </div>
  )
}

export default PublicGoalsSlider
