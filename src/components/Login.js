import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      // Fetch employee with matching username
      const { data: employees, error: fetchError } = await supabase
        .from('employees')
        .select('*')
        .eq('username', username);

      if (fetchError) {
        setError('Login failed. Please try again.');
        setLoading(false);
        return;
      }

      if (!employees || employees.length === 0) {
        setError('Invalid username or password');
        setLoading(false);
        return;
      }

      const employee = employees[0];

      // For demo purposes, password is stored as plain text
      // In production, you should hash passwords
      if (employee.password === password) {
        // Successful login
        onLogin({
          id: employee.id,
          tenantId: employee.tenant_id,
          username: employee.username,
          firstName: employee.first_name,
          lastName: employee.last_name,
          role: employee.role,
          email: employee.email,
          phone: employee.phone,
          bcode: employee.bcode
        });
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }

    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Company Logo/Name Placeholder */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
            <span className="text-white text-3xl font-bold">EMS</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Employee Management System</h1>
          <p className="text-gray-500 text-sm mt-2">Powered by YourCompany</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="Enter your username"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-center">
            <a href="#" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              Forgot Password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;