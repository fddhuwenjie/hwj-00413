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

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/item/:id" element={<ItemDetail />} />
        <Route path="/publish" element={<Publish />} />
        <Route path="/exchanges" element={<ExchangeList />} />
        <Route path="/exchange/:id" element={<ExchangeDetail />} />
        <Route path="/messages" element={<MessageList />} />
        <Route path="/chat/:exchangeId" element={<Chat />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/review/:exchangeId" element={<Review />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}
