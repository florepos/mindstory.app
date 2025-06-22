import React from 'react'

const PublicGoalsFeed = ({ goals }) => {
  return (
    <div className="space-y-6">
      {goals.map(goal => (
        <div key={goal.id} className="bg-white rounded-lg shadow overflow-hidden">
          {goal.image_url && (
            <img src={goal.image_url} alt={goal.title} className="w-full object-cover" />
          )}
          <div className="p-4">
            <div className="font-semibold mb-1">{goal.title}</div>
            <div className="text-gray-500 text-sm">{goal.description}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default PublicGoalsFeed
