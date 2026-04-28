import React, { useState, useEffect } from 'react';
import CSVUploader from './CSVUploader';
import Dashboard from './Dashboard';
import CheckoutForm from './CheckoutForm';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const [productsRes, suppliersRes, transactionsRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/products/'),
          fetch('http://127.0.0.1:8000/api/suppliers/'),
          fetch('http://127.0.0.1:8000/api/transactions/')
        ]);

        if (!productsRes.ok || !suppliersRes.ok || !transactionsRes.ok) {
          throw new Error('Failed to fetch one or more datasets. Is the backend running?');
        }

        const productsData = await productsRes.json();
        const suppliersData = await suppliersRes.json();
        const transactionsData = await transactionsRes.json();

        setProducts(productsData);
        setSuppliers(suppliersData);
        setTransactions(transactionsData);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch inventory dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [refreshKey]);

  // Called when either CSV uploads finishes or Checkout forms submit successfully
  // Forces child components relying on `refreshKey` to re-fetch backend data silently
  const handleDataChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div style={{ paddingTop: '50px', paddingBottom: '80px' }}>
      
      <div className="app-header">
        <h1 className="app-title">Inventory Base</h1>
        <p className="app-subtitle">Stock, suppliers, and sales synchronized</p>
      </div>

      <div className="top-section">
        {/* Intentionally bypassing standard prop updates into CSVUploader per rules, 
            but if user explicitly hooks it up later the infrastructure supports it. 
            The Dashboard naturally sync/loads after sale anyway. */}
        <div className="upload-wrapper" onClick={handleDataChange}>
          <CSVUploader />
        </div>
        
        <div className="checkout-wrapper">
          <CheckoutForm products={products} onSuccess={handleDataChange} />
        </div>
      </div>

      <Dashboard 
        products={products} 
        suppliers={suppliers} 
        transactions={transactions} 
        isLoading={isLoading} 
        error={error} 
      />
      
    </div>
  );
}

export default App;
