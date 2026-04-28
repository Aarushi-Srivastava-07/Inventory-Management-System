import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const Dashboard = ({ products, suppliers, transactions, isLoading, error }) => {

  // Filters and Sorting
  const [productFilter, setProductFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [transactionFilter, setTransactionFilter] = useState('');

  const [productSort, setProductSort] = useState({ key: null, direction: 'asc' });
  const [supplierSort, setSupplierSort] = useState({ key: null, direction: 'asc' });
  const [transactionSort, setTransactionSort] = useState({ key: 'Transaction_ID', direction: 'desc' });

  // Metrics
  const totalProducts = products.length;
  const totalSuppliers = suppliers.length;
  const totalValue = products.reduce((sum, product) => {
    return sum + (Number(product.Price) * Number(product.Quantity_In_Stock));
  }, 0);

  // Chart Data: Top 5 by stock quantity
  const topStockProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => Number(b.Quantity_In_Stock) - Number(a.Quantity_In_Stock))
      .slice(0, 5);
  }, [products]);

  const handleExportCSV = () => {
    if (products.length === 0) return;
    const headers = ['Product ID', 'Name', 'Category', 'Price', 'Quantity', 'Supplier ID'];
    const csvRows = products.map(product => {
      return [
        product.Product_ID,
        `"${String(product.Product_Name).replace(/"/g, '""')}"`,
        `"${String(product.Category || '').replace(/"/g, '""')}"`,
        product.Price,
        product.Quantity_In_Stock,
        product.Supplier
      ].join(',');
    });
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'inventory_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(value);
  };

  const sortData = (data, sortConfig) => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (key, currentSort, setSort) => {
    let direction = 'asc';
    if (currentSort.key === key && currentSort.direction === 'asc') direction = 'desc';
    setSort({ key, direction });
  };

  // Filtered/Sorted Data Sets
  const filteredProducts = sortData(products.filter(p => 
    p.Product_Name.toLowerCase().includes(productFilter.toLowerCase()) ||
    (p.Category && p.Category.toLowerCase().includes(productFilter.toLowerCase()))
  ), productSort);

  const filteredSuppliers = sortData(suppliers.filter(s => 
    s.Supplier_Name.toLowerCase().includes(supplierFilter.toLowerCase())
  ), supplierSort);

  const filteredTransactions = sortData(transactions.filter(t => 
    t.Transaction_Type.toLowerCase().includes(transactionFilter.toLowerCase())
  ), transactionSort);

  if (isLoading && products.length === 0) {
    return (
      <div className="dashboard-container glass-card">
        <div className="status-indicator">
          Loading system data...
        </div>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="dashboard-container glass-card" style={{marginTop: '30px'}}>
        <div className="status-indicator" style={{color: '#991b1b'}}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Dashboard Analytics</h2>
        <button onClick={handleExportCSV} className="export-btn" aria-label="Export to CSV">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Export CSV
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card glass-card">
          <span className="metric-title">Total Products</span>
          <h3 className="metric-value">{totalProducts.toLocaleString('en-IN')}</h3>
        </div>
        <div className="metric-card glass-card">
          <span className="metric-title">Unique Suppliers</span>
          <h3 className="metric-value">{totalSuppliers.toLocaleString('en-IN')}</h3>
        </div>
        <div className="metric-card glass-card">
          <span className="metric-title">Total Inventory Value</span>
          <h3 className="metric-value">{formatCurrency(totalValue)}</h3>
        </div>
      </div>

      <div className="chart-section glass-card">
        <h3>Top 5 Inventories</h3>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer>
            <BarChart data={topStockProducts} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
              <XAxis 
                dataKey="Product_Name" 
                tick={{fill: '#4b5563', fontSize: 13, fontWeight: 600}} 
                axisLine={{stroke: 'rgba(0,0,0,0.2)'}}
                tickLine={false}
              />
              <YAxis 
                tick={{fill: '#4b5563', fontSize: 13, fontWeight: 600}} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.3)'}}
                contentStyle={{ borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.9)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
              />
              <Bar 
                dataKey="Quantity_In_Stock" 
                name="Quantity" 
                fill="#111827" 
                radius={[8, 8, 0, 0]} 
                barSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- DATA TABLES --- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        
        {/* Table 1: Product Inventory */}
        <div className="table-section glass-card">
          <h3>Product Inventory</h3>
          <div className="table-controls">
            <input 
              type="text" 
              placeholder="Filter by Name or Category..." 
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="filter-input"
            />
          </div>
          <table className="modern-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('Product_ID', productSort, setProductSort)}>Product_ID ⇅</th>
                <th onClick={() => handleSort('Product_Name', productSort, setProductSort)}>Product_Name ⇅</th>
                <th onClick={() => handleSort('Category', productSort, setProductSort)}>Category ⇅</th>
                <th onClick={() => handleSort('Price', productSort, setProductSort)}>Price ⇅</th>
                <th onClick={() => handleSort('Quantity_In_Stock', productSort, setProductSort)}>Quantity_In_Stock ⇅</th>
                <th onClick={() => handleSort('Supplier', productSort, setProductSort)}>Supplier_ID ⇅</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => (
                <tr key={p.Product_ID}>
                  <td><strong>#{p.Product_ID}</strong></td>
                  <td style={{fontWeight: 700}}>{p.Product_Name}</td>
                  <td>{p.Category !== 'nan' ? <span className="badge">{p.Category}</span> : '-'}</td>
                  <td style={{fontWeight: 600}}>{formatCurrency(p.Price)}</td>
                  <td className={
                    p.Quantity_In_Stock > 50 ? 'qty-high' : p.Quantity_In_Stock > 10 ? 'qty-medium' : 'qty-low'
                  }>{p.Quantity_In_Stock}</td>
                  <td><strong>#{p.Supplier}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table 2: Supplier Directory */}
        <div className="table-section glass-card">
          <h3>Supplier Directory</h3>
          <div className="table-controls">
            <input 
              type="text" 
              placeholder="Filter by Supplier Name..." 
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="filter-input"
            />
          </div>
          <table className="modern-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('Supplier_ID', supplierSort, setSupplierSort)}>Supplier_ID ⇅</th>
                <th onClick={() => handleSort('Supplier_Name', supplierSort, setSupplierSort)}>Supplier_Name ⇅</th>
                <th>Phone</th>
                <th>Street</th>
                <th>City</th>
                <th>State</th>
                <th>Pincode</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map(s => (
                <tr key={s.Supplier_ID}>
                  <td><strong>#{s.Supplier_ID}</strong></td>
                  <td style={{fontWeight: 700}}>{s.Supplier_Name}</td>
                  <td>{s.Phone}</td>
                  <td>{s.Street}</td>
                  <td>{s.City}</td>
                  <td>{s.State}</td>
                  <td>{s.Pincode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table 3: Inventory Transactions */}
        <div className="table-section glass-card">
          <h3>Inventory Transactions</h3>
          <div className="table-controls">
            <input 
              type="text" 
              placeholder="Filter by Type (IN/OUT)..." 
              value={transactionFilter}
              onChange={(e) => setTransactionFilter(e.target.value)}
              className="filter-input"
            />
          </div>
          <table className="modern-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('Transaction_ID', transactionSort, setTransactionSort)}>Transaction_ID ⇅</th>
                <th onClick={() => handleSort('Transaction_Type', transactionSort, setTransactionSort)}>Transaction_Type ⇅</th>
                <th onClick={() => handleSort('Quantity', transactionSort, setTransactionSort)}>Quantity ⇅</th>
                <th onClick={() => handleSort('Transaction_Date', transactionSort, setTransactionSort)}>Transaction_Date ⇅</th>
                <th onClick={() => handleSort('Product', transactionSort, setTransactionSort)}>Product_ID ⇅</th>
                <th onClick={() => handleSort('Total_Value', transactionSort, setTransactionSort)}>Total_Value ⇅</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(t => (
                <tr key={t.Transaction_ID}>
                  <td><strong>#{t.Transaction_ID}</strong></td>
                  <td>
                    <span className={`badge ${t.Transaction_Type === 'IN' ? 'badge-in' : 'badge-out'}`}>
                      {t.Transaction_Type}
                    </span>
                  </td>
                  <td style={{fontWeight: 600}}>{t.Quantity}</td>
                  <td>{t.Transaction_Date}</td>
                  <td><strong>#{t.Product}</strong></td>
                  <td style={{fontWeight: 600}}>{formatCurrency(t.Total_Value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
