interface SwipeIndicatorProps {
  currentIndex: number;
  totalScreens: number;
  isAnimating: boolean;
}

export default function SwipeIndicator({ currentIndex, totalScreens, isAnimating }: SwipeIndicatorProps) {
  return (
    <div className="flex items-center justify-center space-x-2 py-2">
      {Array.from({ length: totalScreens }, (_, index) => (
        <div
          key={index}
          className={`transition-all duration-300 rounded-full ${
            index === currentIndex
              ? 'w-6 h-2 bg-[#DD541C]'
              : 'w-2 h-2 bg-white/30'
          } ${
            isAnimating ? 'scale-110' : 'scale-100'
          }`}
        />
      ))}
    </div>
  );
}