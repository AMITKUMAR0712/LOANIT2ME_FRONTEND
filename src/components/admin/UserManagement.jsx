import React, { useState, useEffect } from 'react';
import { fetchAdminUsers, updateAdminUser, deleteAdminUser } from '../../lib/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { users } = await fetchAdminUsers();
        setUsers(users);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdate = async (id, data) => {
    try {
      await updateAdminUser(id, data);
      setUsers(users.map((user) => (user.id === id ? { ...user, ...data } : user)));
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAdminUser(id);
      setUsers(users.filter((user) => user.id !== id));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-fern_green-500 border-b border-celadon-300 pb-2">User Management</h2>
      {users.length ? (
        users.map((user) => (
          <div key={user.id} className="bg-white p-6 rounded-xl shadow-md mb-5 border border-celadon-200 hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-start mb-5">
              <div className="flex items-center gap-4">
                <div className="bg-fern_green-300 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl">
                  {user.fullName[0]}
                </div>
                <div>
                  <h3 className="font-semibold text-fern_green-500 text-lg">{user.fullName}</h3>
                  <p className="text-sm text-fern_green-400">{user.email}</p>
                </div>
              </div>
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                user.role === "LENDER" ? "bg-celadon-900 text-fern_green-500 border border-celadon-400" :
                user.role === "BORROWER" ? "bg-mantis-900 text-mantis-400 border border-mantis-400" :
                "bg-fern_green-100 bg-opacity-10 text-fern_green-300 border border-fern_green-200"
              }`}>
                {user.role}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-nyanza-700 p-4 rounded-lg mb-5">
              <div>
                <p className="text-sm text-fern_green-400">Name</p>
                <p className="font-semibold text-text-mantis-100">{user.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-fern_green-400">Email</p>
                <p className="font-semibold text-text-mantis-100">{user.email}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleUpdate(user.id, { role: user.role === 'LENDER' ? 'BORROWER' : 'LENDER' })}
                className="bg-fern_green-300 text-white px-5 py-2 rounded-lg hover:bg-fern_green-400 transition-all duration-200 shadow-sm font-medium"
              >
                Toggle Role
              </button>
              <button
                onClick={() => handleDelete(user.id)}
                className="bg-celadon-800 text-fern_green-500 px-5 py-2 rounded-lg hover:bg-celadon-700 transition-all duration-200 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-fern_green-300 p-4 bg-celadon-900 rounded-lg border border-celadon-400">No users found.</p>
      )}
    </div>
  );
};

export default UserManagement;