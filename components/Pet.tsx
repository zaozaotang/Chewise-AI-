import React from 'react';
import { PetState } from '../types';
import { Leaf, Sprout, Flower } from 'lucide-react';

interface PetProps {
  pet: PetState;
}

const Pet: React.FC<PetProps> = ({ pet }) => {
  // Simple visual progression based on level
  const renderAvatar = () => {
    if (pet.level < 3) {
      return <Sprout className="w-24 h-24 text-sage-500 animate-bounce" style={{ animationDuration: '3s' }} />;
    } else if (pet.level < 7) {
      return <Leaf className="w-28 h-28 text-sage-600 animate-pulse-slow" />;
    } else {
      return <Flower className="w-32 h-32 text-pink-400 animate-pulse-slow" />;
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-sage-100 flex flex-col items-center w-full max-w-sm mx-auto">
      <div className="mb-4">
        {renderAvatar()}
      </div>
      <h3 className="text-xl font-medium text-sage-800">{pet.name}</h3>
      <p className="text-sm text-sage-500 mb-3">等级 {pet.level}</p>
      
      {/* XP Bar */}
      <div className="w-full h-3 bg-sage-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-sage-500 transition-all duration-1000"
          style={{ width: `${(pet.exp % 100)}%` }}
        />
      </div>
      <p className="text-xs text-sage-400 mt-2">慢慢吃，帮助 {pet.name} 长大！</p>
    </div>
  );
};

export default Pet;