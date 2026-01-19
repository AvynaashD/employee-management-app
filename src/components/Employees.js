import React, { useState, useEffect } from 'react';
import { Search, Plus, X, User } from 'lucide-react';
import { supabase } from '../supabaseClient';

const Employees = ({ user }) => {
  const [employees, setEmployees] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [roles, setRoles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  const [newEmployee, setNewEmployee] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    role: '',
    bcode: [],
    ptoBalance: 15,
    password: ''
  });

  const [editedEmployee, setEditedEmployee] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
  fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [user.tenantId]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchEmployees(),
      fetchBusinesses(),
      fetchRoles()
    ]);
    setLoading(false);
  };

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('tenant_id', user.tenantId)
      .order('id', { ascending: true });

    if (!error && data) {
      setEmployees(data);
    }
  };

  const fetchBusinesses = async () => {
    const { data, error } = await supabase
      .from('business_details')
      .select('*')
      .eq('tenant_id', user.tenantId);

    if (!error && data) {
      setBusinesses(data);
    }
  };

  const fetchRoles = async () => {
    const { data, error } = await supabase
      .from('roles_master')
      .select('*');

    if (!error && data) {
      setRoles(data);
    }
  };

  const generateUsername = async (firstName, lastName) => {
    const baseUsername = `${firstName}_${lastName}`;
    
    const { data } = await supabase
      .from('employees')
      .select('username')
      .eq('tenant_id', user.tenantId)
      .like('username', `${baseUsername}%`);

    if (!data || data.length === 0) {
      return baseUsername;
    }

    const existingUsernames = data.map(e => e.username);
    let counter = 1;
    let username = baseUsername;

    while (existingUsernames.includes(username)) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    return username;
  };

  const handleFirstLastNameChange = async (field, value) => {
    const updated = { ...newEmployee, [field]: value };
    
    if (updated.firstName && updated.lastName) {
      const username = await generateUsername(updated.firstName, updated.lastName);
      updated.username = username;
    }
    
    setNewEmployee(updated);
    setHasUnsavedChanges(true);
  };

  const validateEmail = (email) => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    return /^\d{10}$/.test(phone);
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.firstName || !newEmployee.lastName) {
      alert('First name and last name are required');
      return;
    }

    if (!validatePhone(newEmployee.phone)) {
      alert('Phone number must be exactly 10 digits');
      return;
    }

    if (newEmployee.email && !validateEmail(newEmployee.email)) {
      alert('Please enter a valid email address');
      return;
    }

    if (!newEmployee.role) {
      alert('Please select a role');
      return;
    }

    if (newEmployee.bcode.length === 0) {
      alert('Please select at least one Business Code');
      return;
    }

    const { error } = await supabase
      .from('employees')
      .insert([{
        tenant_id: user.tenantId,
        first_name: newEmployee.firstName,
        last_name: newEmployee.lastName,
        username: newEmployee.username,
        email: newEmployee.email || null,
        phone: newEmployee.phone,
        password: newEmployee.username,
        role: newEmployee.role,
        bcode: newEmployee.bcode,
        pto_balance: 15
      }]);

    if (error) {
      alert('Error adding employee: ' + error.message);
    } else {
      await fetchEmployees();
      setShowAddModal(false);
      resetNewEmployee();
      setHasUnsavedChanges(false);
    }
  };

  const handleUpdateEmployee = async () => {
    if (!validatePhone(editedEmployee.phone)) {
      alert('Phone number must be exactly 10 digits');
      return;
    }

    if (editedEmployee.email && !validateEmail(editedEmployee.email)) {
      alert('Please enter a valid email address');
      return;
    }

    if (editedEmployee.bcode.length === 0) {
      alert('Please select at least one Business Code');
      return;
    }

    let username = editedEmployee.username;
    if (editedEmployee.first_name !== selectedEmployee.first_name || 
        editedEmployee.last_name !== selectedEmployee.last_name) {
      username = await generateUsername(editedEmployee.first_name, editedEmployee.last_name);
    }

    const { error } = await supabase
      .from('employees')
      .update({
        first_name: editedEmployee.first_name,
        last_name: editedEmployee.last_name,
        username: username,
        email: editedEmployee.email || null,
        phone: editedEmployee.phone,
        role: editedEmployee.role,
        bcode: editedEmployee.bcode
      })
      .eq('id', editedEmployee.id);

    if (error) {
      alert('Error updating employee: ' + error.message);
    } else {
      await fetchEmployees();
      setIsEditing(false);
      setSelectedEmployee({ ...editedEmployee, username });
    }
  };

  const resetNewEmployee = () => {
    setNewEmployee({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      phone: '',
      role: '',
      bcode: [],
      ptoBalance: 15,
      password: ''
    });
  };

  const handleModalBackdropClick = () => {
    if (hasUnsavedChanges) {
      setShowExitConfirm(true);
    } else {
      setShowAddModal(false);
      resetNewEmployee();
    }
  };

  const handleExitWithoutSaving = () => {
    setShowExitConfirm(false);
    setShowAddModal(false);
    resetNewEmployee();
    setHasUnsavedChanges(false);
  };

  const toggleBcode = (code, isNewEmployee = true) => {
    const employee = isNewEmployee ? newEmployee : editedEmployee;
    const setter = isNewEmployee ? setNewEmployee : setEditedEmployee;
    
    const currentBcodes = employee.bcode || [];
    const newBcodes = currentBcodes.includes(code)
      ? currentBcodes.filter(b => b !== code)
      : [...currentBcodes, code];
    
    setter({ ...employee, bcode: newBcodes });
    if (isNewEmployee) setHasUnsavedChanges(true);
  };

  const filteredEmployees = employees.filter(emp => {
    const query = searchQuery.toLowerCase();
    return (
      emp.first_name?.toLowerCase().includes(query) ||
      emp.last_name?.toLowerCase().includes(query) ||
      emp.username?.toLowerCase().includes(query) ||
      emp.email?.toLowerCase().includes(query) ||
      emp.phone?.includes(query)
    );
  });

  const isAdmin = (employee) => employee.username === `Admin_${user.tenantId}`;

  return (
    <div className="p-8">
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Employees</h1>
          <button
            onClick={() => {
              if (businesses.length === 0) {
                alert('Please add at least one business before adding employees');
                return;
              }
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-emerald-700 transition shadow-lg font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Employee
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, username, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading employees...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">First Name</th>
                  <th className="px-6 py-4 text-left font-semibold">Last Name</th>
                  <th className="px-6 py-4 text-left font-semibold">Username</th>
                  <th className="px-6 py-4 text-left font-semibold">BCode</th>
                  <th className="px-6 py-4 text-left font-semibold">Email</th>
                  <th className="px-6 py-4 text-left font-semibold">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployees.map((emp, index) => (
                  <tr
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp)}
                    className={`cursor-pointer transition ${
                      index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    } hover:bg-indigo-50`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-800">{emp.first_name}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">{emp.last_name}</td>
                    <td className="px-6 py-4 text-gray-600">{emp.username}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {emp.bcode?.join(', ') || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{emp.email || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{emp.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredEmployees.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No employees found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showAddModal && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={handleModalBackdropClick}
          />
          
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-2xl font-bold">Add Employee</h3>
              <button
                onClick={handleModalBackdropClick}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={newEmployee.firstName}
                    onChange={(e) => handleFirstLastNameChange('firstName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Enter first name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={newEmployee.lastName}
                    onChange={(e) => handleFirstLastNameChange('lastName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={newEmployee.username}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  placeholder="Auto-generated"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => {
                    setNewEmployee({ ...newEmployee, email: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Enter email (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={newEmployee.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setNewEmployee({ ...newEmployee, phone: value });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="10 digit phone number"
                  maxLength="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  value={newEmployee.role}
                  onChange={(e) => {
                    setNewEmployee({ ...newEmployee, role: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.role_name}>{role.role_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BCode * (Multiple selection)
                </label>
                <div className="border border-gray-300 rounded-lg p-4 space-y-2 max-h-40 overflow-y-auto">
                  {businesses.map(business => (
                    <label key={business.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={newEmployee.bcode?.includes(business.bcode)}
                        onChange={() => toggleBcode(business.bcode, true)}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="text-gray-700">{business.bcode} - {business.business_name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PTO Balance
                </label>
                <input
                  type="number"
                  value={newEmployee.ptoBalance}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleAddEmployee}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition shadow-lg"
                >
                  Add
                </button>
                <button
                  onClick={handleModalBackdropClick}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {showExitConfirm && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-60 z-50" />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 p-6 max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Unsaved Changes</h3>
            <p className="text-gray-600 mb-6">Do you want to proceed without saving?</p>
            <div className="flex gap-4">
              <button
                onClick={handleExitWithoutSaving}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition"
              >
                Yes
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                No
              </button>
            </div>
          </div>
        </>
      )}

      {selectedEmployee && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => {
              setSelectedEmployee(null);
              setIsEditing(false);
              setEditedEmployee(null);
            }}
          />

          <div className="fixed right-0 top-0 h-full w-full md:w-[600px] bg-white shadow-2xl z-50 overflow-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    {selectedEmployee.profile_picture ? (
                      <img
                        src={selectedEmployee.profile_picture}
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">
                      {selectedEmployee.first_name} {selectedEmployee.last_name}
                    </h3>
                    <p className="text-blue-100 text-sm">{selectedEmployee.username}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedEmployee(null);
                    setIsEditing(false);
                    setEditedEmployee(null);
                  }}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {!isAdmin(selectedEmployee) && !isEditing && (
                <button
                  onClick={() => {
                    setEditedEmployee({ ...selectedEmployee });
                    setIsEditing(true);
                  }}
                  className="w-full bg-white text-indigo-600 py-2 rounded-lg font-semibold hover:bg-blue-50 transition"
                >
                  Edit Details
                </button>
              )}

              {isEditing && (
                <div className="flex gap-3">
                  <button
                    onClick={handleUpdateEmployee}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedEmployee(null);
                    }}
                    className="flex-1 bg-white text-indigo-600 py-2 rounded-lg font-semibold hover:bg-blue-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-3">
                  {selectedEmployee.profile_picture ? (
                    <img
                      src={selectedEmployee.profile_picture}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Profile picture will be captured from punching app
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Employee Details</h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      First Name
                    </label>
                    {isEditing && !isAdmin(selectedEmployee) ? (
                      <input
                        type="text"
                        value={editedEmployee.first_name}
                        onChange={(e) =>
                          setEditedEmployee({ ...editedEmployee, first_name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    ) : (
                      <p className="font-semibold text-gray-800">{selectedEmployee.first_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Last Name
                    </label>
                    {isEditing && !isAdmin(selectedEmployee) ? (
                      <input
                        type="text"
                        value={editedEmployee.last_name}
                        onChange={(e) =>
                          setEditedEmployee({ ...editedEmployee, last_name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    ) : (
                      <p className="font-semibold text-gray-800">{selectedEmployee.last_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Username
                    </label>
                    <p className="font-semibold text-gray-800 bg-gray-100 px-3 py-2 rounded-lg">
                      {selectedEmployee.username}
                      {isEditing && !isAdmin(selectedEmployee) && (
                        <span className="text-xs text-gray-500 ml-2">
                          (Will update based on name)
                        </span>
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Email Address
                    </label>
                    {isEditing && !isAdmin(selectedEmployee) ? (
                      <input
                        type="email"
                        value={editedEmployee.email || ''}
                        onChange={(e) =>
                          setEditedEmployee({ ...editedEmployee, email: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    ) : (
                      <p className="font-semibold text-gray-800">
                        {selectedEmployee.email || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Phone Number
                    </label>
                    {isEditing && !isAdmin(selectedEmployee) ? (
                      <input
                        type="tel"
                        value={editedEmployee.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setEditedEmployee({ ...editedEmployee, phone: value });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        maxLength="10"
                      />
                    ) : (
                      <p className="font-semibold text-gray-800">{selectedEmployee.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Role</label>
                    {isEditing && !isAdmin(selectedEmployee) ? (
                      <select
                        value={editedEmployee.role}
                        onChange={(e) =>
                          setEditedEmployee({ ...editedEmployee, role: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        {roles.map((role) => (
                          <option key={role.id} value={role.role_name}>
                            {role.role_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="font-semibold text-gray-800">{selectedEmployee.role}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Business Codes
                    </label>
                    {isEditing && !isAdmin(selectedEmployee) ? (
                      <div className="border border-gray-300 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                        {businesses.map((business) => (
                          <label
                            key={business.id}
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={editedEmployee.bcode?.includes(business.bcode)}
                              onChange={() => toggleBcode(business.bcode, false)}
                              className="w-4 h-4 text-indigo-600"
                            />
                            <span className="text-gray-700">
                              {business.bcode} - {business.business_name}
</span>
</label>
))}
</div>
) : (
<div className="flex flex-wrap gap-2">
{selectedEmployee.bcode && selectedEmployee.bcode.length > 0 ? (
selectedEmployee.bcode.map((code) => (
<span
                           key={code}
                           className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                         >
{code}
</span>
))
) : (
<p className="text-gray-500">No business codes assigned</p>
)}
</div>
)}
{isAdmin(selectedEmployee) && (
<p className="text-xs text-gray-500 mt-1">
Admin has access to all business codes
</p>
)}
</div>
<div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  PTO Balance
                </label>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-green-600">
                      {selectedEmployee.pto_balance || 15}
                    </div>
                    <div className="text-gray-600">days remaining</div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">PTO balance cannot be edited manually</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )}
</div>
);
};
export default Employees;