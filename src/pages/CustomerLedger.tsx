@@ .. @@
   const loadCustomers = () => {
     const customers = JSON.parse(localStorage.getItem('customers') || '[]');
-    const salesBills = JSON.parse(localStorage.getItem('salesBills') || '[]')
-      .filter(bill => isWithinDateRange(bill.date, fromDate, toDate));
+    const salesBills = JSON.parse(localStorage.getItem('salesBills') || '[]');
+    const bookEntries = JSON.parse(localStorage.getItem('bookEntries') || '[]');

    const customerBalances = customers.map(customer => {
-      const customerBills = salesBills.filter(bill => bill.custCode === customer.id);
-      const totalAmount = customerBills.reduce((sum, bill) => sum + parseFloat(bill.total || 0), 0);
+      // Sales increase receivables (debit)
+      const customerBills = salesBills
        .filter(bill => bill.custCode === customer.id && isWithinDateRange(bill.date, fromDate, toDate))
        .reduce((sum, bill) => sum + parseFloat(bill.total || 0), 0);
      
      // Payments decrease receivables (credit)
      const customerPayments = bookEntries
        .filter(entry => 
          entry.custCode === customer.id && 
          isWithinDateRange(entry.date, fromDate, toDate)
        )
        .reduce((sum, entry) => sum + (parseFloat(entry.credit) || 0), 0);

      const balance = customerBills - customerPayments;

      return {
        ...customer,
        totalBilled: customerBills,
        totalPaid: customerPayments,
        balance: balance
      };
    });

    setCustomers(customerBalances);
  };