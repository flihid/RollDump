import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('access_token');
  return token ? <>{children}</> : <Navigate to="/login" />;
};

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Dashboard Rolldump</h1>
        <p className="text-lg text-gray-600 mb-2">Halo, <span className="font-semibold text-primary-600">{user.username}</span>!</p>
        <p className="text-gray-500 mb-8">Selamat datang di koleksi film Anda.</p>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-md font-medium"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
