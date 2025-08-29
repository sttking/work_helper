import Topbar from "./components/ui/Topbar";
import LeftSidebar from "./components/ui/LeftSidebar";
import MainPage from "./pages/MainPage";
// import MainPage2 from "./pages/MainPage2";
// import MainPage3 from "./pages/Mainpage3";
// import MainPage4 from "./pages/MainPage4";
import MainPage5 from "./pages/MainPage5";
import { useState } from "react";

function App() {
  const [selectedMenu, setSelectedMenu] = useState(0);
  return (
    <div className="flex w-full min-h-screen bg-gray-50 text-primary">
      <LeftSidebar
        selectedIndex={selectedMenu}
        onMenuSelect={setSelectedMenu}
      />
      <div className="flex-1 flex flex-col min-h-screen md:ml-60">
        {" "}
        {/* This is the culprit */}
        <Topbar />
        <main className="pt-14">
          {selectedMenu === 0 ? <MainPage /> : <MainPage5 />}
        </main>
      </div>
    </div>
  );
}

export default App;
