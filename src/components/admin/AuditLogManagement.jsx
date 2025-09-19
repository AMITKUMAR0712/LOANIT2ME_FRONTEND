import React, { useState, useEffect } from 'react';
import { fetchAdminAuditLogs } from '../../lib/api';

const AuditLogManagement = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { auditLogs } = await fetchAdminAuditLogs();
        setAuditLogs(auditLogs);
      } catch (error) {
        console.error('Error fetching audit logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-fern_green-500 border-b border-celadon-300 pb-2">Audit Logs</h2>
      {auditLogs.length ? (
        auditLogs.map((log) => (
          <div key={log.id} className="bg-white p-6 rounded-xl shadow-md mb-5 border border-celadon-200 hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="font-semibold text-fern_green-500 text-lg">Action: {log.action}</h3>
                <p className="text-sm text-fern_green-400">By: {log.user.fullName}</p>
              </div>
              <span className="text-xs text-fern_green-300 bg-celadon-900 px-3 py-1 rounded-full">
                {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-nyanza-700 p-4 rounded-lg">
              <div>
                <p className="text-sm text-fern_green-400">User</p>
                <p className="font-semibold text-text-mantis-100">{log.user.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-fern_green-400">Action</p>
                <p className="font-semibold text-text-mantis-100">{log.action}</p>
              </div>
              <div>
                <p className="text-sm text-fern_green-400">Details</p>
                <p className="font-semibold text-text-mantis-100">{log.details || 'N/A'}</p>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-fern_green-300 p-4 bg-celadon-900 rounded-lg border border-celadon-400">No audit logs found.</p>
      )}
    </div>
  );
};

export default AuditLogManagement;