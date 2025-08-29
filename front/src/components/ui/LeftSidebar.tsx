const menus = ["JSON 변환", "42MARU TEST"];
// const menus = ["JSON 변환", "서비스별 정보", "JARVIS", "sql2dsl"];

interface LeftSidebarProps {
  selectedIndex: number;
  onMenuSelect: (idx: number) => void;
}

function LeftSidebar({ selectedIndex, onMenuSelect }: LeftSidebarProps) {
  return (
    <aside className="hidden md:flex fixed top-0 left-0 flex-col w-60 h-screen border-r bg-white pt-14 z-10">
      <nav className="flex flex-col gap-2 px-2 mt-4">
        {menus.map((menu, idx) => (
          <button
            key={menu}
            className={`flex items-center gap-4 py-3 px-5 rounded-xl text-base font-medium transition-all duration-150 cursor-pointer ${
              selectedIndex === idx
                ? "bg-gray-100 text-black shadow"
                : "hover:bg-gray-50 text-gray-700"
            }`}
            onClick={() => onMenuSelect(idx)}
          >
            {menu}
          </button>
        ))}
      </nav>
    </aside>
  );
}
export default LeftSidebar;
