import React, { useState, useEffect } from 'react';
import { fetchAdminLenderTerms, updateAdminLenderTerm } from '../../lib/api';
import { Copy } from 'lucide-react';

const LenderTermManagement = () => {
  const [lenderTerms, setLenderTerms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { lenderTerms } = await fetchAdminLenderTerms();
        setLenderTerms(lenderTerms);
      } catch (error) {
        console.error('Error fetching lender terms:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdate = async (id, data) => {
    try {
      await updateAdminLenderTerm(id, data);
      setLenderTerms(lenderTerms.map((term) => (term.id === id ? { ...term, ...data } : term)));
    } catch (error) {
      console.error('Error updating lender term:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-fern_green-500 border-b border-celadon-300 pb-2">Lender Terms Management</h2>
      {lenderTerms.length ? (
        lenderTerms.map((term) => (
          <div key={term.id} className="bg-white p-6 rounded-xl shadow-md mb-5 border border-celadon-200 hover:shadow-lg transition-all duration-300">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
              <div className="bg-nyanza-700 p-3 rounded-lg">
                <p className="text-sm text-fern_green-400 mb-2">Max Loan Amount</p>
                <input
                  type="number"
                  value={term.maxLoanAmount}
                  onChange={(e) => handleUpdate(term.id, { maxLoanAmount: parseFloat(e.target.value) })}
                  className="w-full bg-white border border-celadon-300 rounded-lg px-3 py-2 text-fern_green-500 focus:outline-none focus:ring-2 focus:ring-fern_green-300"
                />
              </div>
              <div className="bg-nyanza-700 p-3 rounded-lg">
                <p className="text-sm text-fern_green-400 mb-2">Loan Multiple</p>
                <input
                  type="number"
                  value={term.loanMultiple}
                  onChange={(e) => handleUpdate(term.id, { loanMultiple: parseFloat(e.target.value) })}
                  className="w-full bg-white border border-celadon-300 rounded-lg px-3 py-2 text-fern_green-500 focus:outline-none focus:ring-2 focus:ring-fern_green-300"
                />
              </div>
              <div className="bg-nyanza-700 p-3 rounded-lg">
                <p className="text-sm text-fern_green-400 mb-2">Max Payback Days</p>
                <input
                  type="number"
                  value={term.maxPaybackDays}
                  onChange={(e) => handleUpdate(term.id, { maxPaybackDays: parseInt(e.target.value) })}
                  className="w-full bg-white border border-celadon-300 rounded-lg px-3 py-2 text-fern_green-500 focus:outline-none focus:ring-2 focus:ring-fern_green-300"
                />
              </div>
              <div className="bg-nyanza-700 p-3 rounded-lg">
                <p className="text-sm text-fern_green-400 mb-2">Multiple Loans</p>
                <input
                  type="checkbox"
                  checked={term.allowMultipleLoans}
                  onChange={(e) => handleUpdate(term.id, { allowMultipleLoans: e.target.checked })}
                  className="w-5 h-5 text-fern_green-500 border-celadon-300 rounded focus:ring-fern_green-300"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-4">
              <div className="bg-nyanza-700 p-3 rounded-lg">
                <p className="text-sm text-fern_green-400 mb-2">Fee (&lt;7 days)</p>
                <input
                  type="number"
                  value={term.feePer10Short}
                  onChange={(e) => handleUpdate(term.id, { feePer10Short: parseFloat(e.target.value) })}
                  className="w-full bg-white border border-celadon-300 rounded-lg px-3 py-2 text-fern_green-500 focus:outline-none focus:ring-2 focus:ring-fern_green-300"
                />
              </div>
              <div className="bg-nyanza-700 p-3 rounded-lg">
                <p className="text-sm text-fern_green-400 mb-2">Fee (&gt;7 days)</p>
                <input
                  type="number"
                  value={term.feePer10Long}
                  onChange={(e) => handleUpdate(term.id, { feePer10Long: parseFloat(e.target.value) })}
                  className="w-full bg-white border border-celadon-300 rounded-lg px-3 py-2 text-fern_green-500 focus:outline-none focus:ring-2 focus:ring-fern_green-300"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-md text-fern_green-400">
                Invite Token:{' '}
                {term.inviteToken ? (
                  <span
                    className="font-medium text-sm cursor-pointer hover:underline"
                    onClick={() => navigator.clipboard.writeText(`${import.meta.env.VITE_FRONTEND_URL}/signup/${term.inviteToken}`)}
                  >
                    <div className="cursor-pointer p-2 border rounded bg-fern_green-300 text-white hover:bg-fern_green-400 transition-all duration-200 inline-flex items-center">
                      <Copy className="w-4 h-4 mr-1" />
                      Copy Invite Link
                    </div>
                  </span>
                ) : (
                  'No invite token available'
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-fern_green-300 p-4 bg-celadon-900 rounded-lg border border-celadon-400">No lender terms found.</p>
      )}
    </div>
  );
};

export default LenderTermManagement;