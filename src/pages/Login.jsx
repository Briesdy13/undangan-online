import { Link } from "react-router-dom";

function Login() {
  return (
    <main className="page-wrap" style={{ maxWidth: 460 }}>
      <div className="glass" style={{ padding: 28 }}>
        <h1>Login Customer</h1>
        <p style={{ color:"rgba(255,255,255,.68)" }}>Demo login UI. Nanti disambungkan ke Supabase Auth.</p>
        <div className="form-grid">
          <label className="label">Email<input className="input" placeholder="customer@email.com" /></label>
          <label className="label">Password<input className="input" type="password" placeholder="Password" /></label>
          <Link className="btn" to="/dashboard" style={{ textAlign:"center" }}>Masuk Dashboard</Link>
          <Link to="/">Kembali</Link>
        </div>
      </div>
    </main>
  );
}
export default Login;
