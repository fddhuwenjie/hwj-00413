import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import ItemDetail from "@/pages/ItemDetail";
import Publish from "@/pages/Publish";
import ExchangeList from "@/pages/ExchangeList";
import ExchangeDetail from "@/pages/ExchangeDetail";
import MessageList from "@/pages/MessageList";
import Chat from "@/pages/Chat";
import Profile from "@/pages/Profile";
import Review from "@/pages/Review";
import Dashboard from "@/pages/Dashboard";
import ReportList from "@/pages/ReportList";
import Favorites from "@/pages/Favorites";
import WantedList from "@/pages/WantedList";
import ArrivalNotices from "@/pages/ArrivalNotices";
import ExchangeAgreement from "@/pages/ExchangeAgreement";
import LogisticsTracking from "@/pages/LogisticsTracking";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/item/:id" element={<ItemDetail />} />
        <Route path="/publish" element={<Publish />} />
        <Route path="/exchanges" element={<ExchangeList />} />
        <Route path="/exchange/:id" element={<ExchangeDetail />} />
        <Route path="/exchange/:exchangeId/agreement" element={<ExchangeAgreement />} />
        <Route path="/exchange/:exchangeId/logistics" element={<LogisticsTracking />} />
        <Route path="/messages" element={<MessageList />} />
        <Route path="/chat/:exchangeId" element={<Chat />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/wanted" element={<WantedList />} />
        <Route path="/notices" element={<ArrivalNotices />} />
        <Route path="/review/:exchangeId" element={<Review />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reports" element={<ReportList />} />
      </Routes>
    </Router>
  );
}
