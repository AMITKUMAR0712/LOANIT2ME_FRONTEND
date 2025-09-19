import React, { useState, useEffect } from 'react';
import { fetchAdminRelationships, updateAdminRelationship } from '../../lib/api';

const RelationshipManagement = () => {
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { relationships } = await fetchAdminRelationships();
        setRelationships(relationships);
      } catch (error) {
        console.error('Error fetching relationships:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateAdminRelationship(id, { status });
      setRelationships(relationships.map((rel) => (rel.id === id ? { ...rel, status } : rel)));
    } catch (error) {
      console.error('Error updating relationship:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-fern_green-500 border-b border-celadon-300 pb-2">Relationship Management</h2>
      {relationships.length ? (
        relationships.map((rel) => (
          <div key={rel.id} className="bg-white p-6 rounded-xl shadow-md mb-5 border border-celadon-200 hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="font-semibold text-fern_green-500 text-lg">Relationship: {rel.lender.fullName} ⟷ {rel.borrower.fullName}</h3>
                <p className="text-sm text-fern_green-400">Lender: {rel.lender.email} | Borrower: {rel.borrower.email}</p>
              </div>
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                rel.status === 'CONFIRMED' ? "bg-celadon-900 text-fern_green-500 border border-celadon-400" :
                rel.status === 'PENDING' ? "bg-mantis-900 text-mantis-400 border border-mantis-400" :
                "bg-fern_green-100 bg-opacity-10 text-fern_green-300 border border-fern_green-200"
              }`}>
                {rel.status}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-nyanza-700 p-4 rounded-lg mb-5">
              <div>
                <p className="text-sm text-fern_green-400">Lender</p>
                <p className="font-semibold text-text-mantis-100">{rel.lender.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-fern_green-400">Borrower</p>
                <p className="font-semibold text-text-mantis-100">{rel.borrower.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-fern_green-400">Status</p>
                <p className="font-semibold text-text-mantis-100">{rel.status}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <select
                onChange={(e) => handleUpdateStatus(rel.id, e.target.value)}
                value={rel.status}
                className="bg-celadon-800 text-fern_green-500 px-5 py-2 rounded-lg hover:bg-celadon-700 transition-all duration-200 font-medium border-none outline-none"
              >
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>
          </div>
        ))
      ) : (
        <p className="text-fern_green-300 p-4 bg-celadon-900 rounded-lg border border-celadon-400">No relationships found.</p>
      )}
    </div>
  );
};

export default RelationshipManagement;