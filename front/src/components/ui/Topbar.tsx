
function Topbar() {
  return (
    <header className="w-full h-14 flex items-center justify-between px-6 border-b bg-white fixed top-0 left-0 z-10">
      <span className="font-bold text-xl">My Agent</span>
      <div className="flex items-center">
        <button
          className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center shadow"
          style={{ boxShadow: "0 2px 8px #facc15" }}
        >
          <span role="img" aria-label="sun" className="text-white text-xl">
            🌞
          </span>
        </button>
      </div>
    </header>
  );
}
export default Topbar;
