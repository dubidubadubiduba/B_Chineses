import { NavLink } from 'react-router-dom';

const ITEMS = [
  { to: '/', label: '홈', icon: '🏠' },
  { to: '/study', label: '학습', icon: '📖' },
  { to: '/test', label: '시험', icon: '🔀' },
  { to: '/search', label: '검색', icon: '🔍' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 mx-auto max-w-[480px] border-t border-gray-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="flex">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2 text-xs ${
                isActive ? 'text-red-600 font-medium' : 'text-gray-500'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
