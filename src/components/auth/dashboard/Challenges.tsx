import React from 'react';
import { Trophy } from 'lucide-react';

// Define types for our challenges
interface Challenge {
  id: string;
  title: string;
  progress: number;
  points: number;
  status: 'active' | 'completed';
}

const ChallengesCard: React.FC = () => {
  // Hardcoded challenges data
  const challenges: Challenge[] = [
    {
      id: '1',
      title: 'No Spend Weekend',
      progress: 65,
      points: 50,
      status: 'active'
    },
    {
      id: '2',
      title: 'Save $200 This Month',
      progress: 40,
      points: 75,
      status: 'active'
    },
    {
      id: '3',
      title: 'Track All Expenses',
      progress: 100,
      points: 30,
      status: 'completed'
    },
    {
      id: '4',
      title: 'Increase Credit Score',
      progress: 25,
      points: 100,
      status: 'active'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 pb-0">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Your Challenges
        </h2>
      </div>
      
      <div className="p-4 space-y-4">
        {challenges.map((challenge) => (
          <div key={challenge.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">{challenge.title}</h4>
              <span className="text-xs text-gray-500">
                {challenge.points} points
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  challenge.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${challenge.progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{challenge.progress}% complete</span>
              <span>{challenge.status === 'completed' ? 'Completed' : 'Active'}</span>
            </div>
          </div>
        ))}
        <button 
          className="w-full py-2 px-4 mt-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
          onClick={() => window.location.href = '/challenges'}
        >
          View All Challenges
        </button>
      </div>
    </div>
  );
};

export default ChallengesCard;
