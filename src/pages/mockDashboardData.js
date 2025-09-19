// shape matches your Prisma models: Loan { borrower, payments, ... }
export const mockDashboardData = {
    stats: [
      { label: "Total Loans", value: 12 },
      { label: "Active Loans", value: 5 },
      { label: "Paid Loans", value: 6 },
      { label: "Overdue Loans", value: 1 },
    ],
    loans: [
      {
        id: "cln_xxx1",                   // prisma.loan.id (cuid)
        lenderId: "usr_lender_1",
        borrowerId: "usr_borrower_1",
        amount: 100.0,                    // principal
        totalPayable: 110.0,              // principal + fee(s)
        feeAmount: 10.0,
        dateBorrowed: "2025-08-01T00:00:00.000Z",
        paybackDate: "2025-08-15T00:00:00.000Z",
        status: "FUNDED",                 // LoanStatus
        health: "GOOD",                   // LoanHealth
        agreementText: "...",
        signedBy: "Jane Borrower",
        signedDate: "2025-08-01T00:00:00.000Z",
        createdAt: "2025-08-01T00:00:00.000Z",
        updatedAt: "2025-08-01T00:00:00.000Z",
        borrower: { id: "usr_borrower_1", fullName: "Jane Borrower", email: "jane@example.com", phoneNumber: "555-111-2222" },
        payments: [
          { id: "pay_1", loanId: "cln_xxx1", amount: 20.0, paymentDate: "2025-08-03T00:00:00.000Z", method: "CASHAPP", confirmed: true }
        ]
      },
      {
        id: "cln_xxx2",
        lenderId: "usr_lender_1",
        borrowerId: "usr_borrower_2",
        amount: 50.0,
        totalPayable: 60.0,
        feeAmount: 10.0,
        dateBorrowed: "2025-07-25T00:00:00.000Z",
        paybackDate: "2025-08-01T00:00:00.000Z",
        status: "FUNDED",
        health: "BEHIND",
        borrower: { id: "usr_borrower_2", fullName: "John Smith", email: "john@example.com" },
        payments: []
      },
      // ...more rows
    ],
    reminders: [
      { id: "cln_xxx1", message: "Loan cln_xxx1 — Jane Borrower — due in 4 days", when: "in 4 days" },
      { id: "cln_xxx2", message: "Loan cln_xxx2 — John Smith — overdue by 5 days", when: "5 days overdue" }
    ]
  }
  