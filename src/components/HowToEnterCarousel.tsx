import React from 'react';
import { Video, Upload, CheckCircle, Trophy, Users, Gift } from 'lucide-react';

const STEPS = [
  {
    icon: Video,
    title: 'Record Your Performance',
    description: 'Create a video performance that follows the contest guidelines and showcases your talent'
  },
  {
    icon: Upload,
    title: 'Post to TikTok',
    description: 'Share your video on TikTok using your connected account to enter the competition'
  },
  {
    icon: CheckCircle,
    title: 'Submit Your Entry',
    description: 'Come back to the contest page and tap "Join Competition" to officially enter'
  },
  {
    icon: Trophy,
    title: 'Climb the Leaderboard',
    description: 'Share your video and get more views to rise up in the contest rankings'
  },
  {
    icon: Users,
    title: 'Final Review',
    description: 'Crown will review top-ranked videos to verify eligibility and confirm winners'
  },
  {
    icon: Gift,
    title: 'Win Prizes',
    description: 'Winners receive their prizes after verification is complete'
  }
];

export function HowToEnterCarousel() {
  return (
    <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <div 
              key={index}
              className="flex items-start gap-4 group"
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center transform-gpu group-hover:scale-110 transition-all duration-700">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-xs font-medium text-white/60">
                  {index + 1}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-medium text-white mb-1">{step.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}