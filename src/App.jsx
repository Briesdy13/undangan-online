import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import Invitation from "./pages/Invitation";
import CheckIn from "./pages/CheckIn";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <main className="admin-page" style={{minHeight:"100vh",padding:24}}>
          <section className="panel glass">
            <h1>Aplikasi error</h1>
            <p>{String(this.state.error?.message || this.state.error)}</p>
            <button className="btn" onClick={() => location.reload()}>Reload</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/i/khitan-fathir?kpd=Bapak%20Budi" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/i/:slug" element={<Invitation />} />
        <Route path="/checkin/:slug" element={<CheckIn />} />
        <Route path="*" element={<Navigate to="/i/khitan-fathir?kpd=Bapak%20Budi" replace />} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
export default App;
