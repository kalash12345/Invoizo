@@ .. @@
   const loadSuppliers = () => {
     const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
-    const purchaseBills = JSON.parse(localStorage.getItem('purchaseBills') || '[]')
-      .filter(bill => isWithinDateRange(bill.date, fromDate, toDate));
+    const purchaseBills = JSON.parse(localStorage.getItem('purchaseBills') || '[]');
+    const bookEntries = JSON.parse(localStorage.getItem('bookEntries') || '[]');

    const supplierBalances = suppliers.map(supplier => {
-      const supplierBills = purchaseBills.filter(bill => bill.supplierCode === supplier.id);
-      const totalAmount = supplierBills.reduce((sum, bill) => sum + parseFloat(bill.total || 0), 0);
+      // Purchases increase payables (credit)
+      const supplierBills = purchaseBills
        .filter(bill => bill.supplierCode === supplier.id && isWithinDateRange(bill.date, fromDate, toDate))
        .reduce((sum, bill) => sum + parseFloat(bill.total || 0), 0);
      
      // Payments decrease payables (debit)
      const supplierPayments = bookEntries
        .filter(entry => 
          entry.supplierCode === supplier.id && 
          isWithinDateRange(entry.date, fromDate, toDate)
        )
        .reduce((sum, entry) => sum + (parseFloat(entry.debit) || 0), 0);

      const balance = supplierBills - supplierPayments;

      return {
        ...supplier,
        totalBilled: supplierBills,
        totalPaid: supplierPayments,
        balance: balance
      };
    });

    setSuppliers(supplierBalances);
  };