import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const CheckoutForm = ({ products, onSuccess }) => {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  
  const [cart, setCart] = useState([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!selectedProduct || !quantity) return;

    const qtyNum = parseInt(quantity);
    if (qtyNum <= 0) return;

    const prod = products.find(p => p.Product_ID.toString() === selectedProduct.toString());
    if (!prod) return;

    const existingCartItem = cart.find(c => c.product_id === prod.Product_ID);
    const totalQtyRequested = existingCartItem ? existingCartItem.quantity + qtyNum : qtyNum;

    if (totalQtyRequested > prod.Quantity_In_Stock) {
      setIsError(true);
      setMessage(`Cannot add ${qtyNum} more. Only ${prod.Quantity_In_Stock} in stock.`);
      return;
    }

    setIsError(false);
    setMessage(null);
    setLastSale(null); // clear previous receipt

    setCart(prev => {
      const existing = prev.find(item => item.product_id === prod.Product_ID);
      if (existing) {
        return prev.map(item => 
          item.product_id === prod.Product_ID 
            ? { ...item, quantity: item.quantity + qtyNum, subtotal: (item.quantity + qtyNum) * Number(prod.Price) }
            : item
        );
      } else {
        return [...prev, {
          product_id: prod.Product_ID,
          name: prod.Product_Name,
          price: Number(prod.Price),
          quantity: qtyNum,
          subtotal: qtyNum * Number(prod.Price)
        }];
      }
    });

    setQuantity('');
    setSelectedProduct('');
  };

  const handleRemoveFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setIsLoading(true);
    setMessage(null);
    setIsError(false);

    try {
      const itemsPayload = cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }));

      const response = await fetch('http://127.0.0.1:8000/api/checkout/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsPayload })
      });

      const data = await response.json();

      if (response.ok) {
        setIsError(false);
        setMessage(data.message || 'Cart structured bill successfully processed!');
        setLastSale({
          items: cart,
          total: grandTotal,
          date: new Date().toLocaleString()
        });
        setCart([]);
        if (onSuccess) onSuccess(); 
      } else {
        throw new Error(data.error || data.message || 'Failed to process bill.');
      }
    } catch (err) {
      setIsError(true);
      setMessage(err.message || 'An error occurred during billing processing.');
    } finally {
      setIsLoading(false);
    }
  };

  const grandTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(value);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="glass-card checkout-form">
      <h3 style={{marginTop: 0, marginBottom: '25px', color: '#111827', fontSize: '22px', fontWeight: 800}}>Billing System</h3>
      
      {message && (
        <div className={isError ? "msg-error" : "msg-success"} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{message}</span>
          {!isError && lastSale && (
            <button 
              onClick={handlePrint}
              style={{
                background: '#059669', color: '#fff', border: 'none', padding: '6px 12px', 
                borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '13px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              Print Receipt
            </button>
          )}
        </div>
      )}

      {/* Add To Cart Module */}
      <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', marginBottom: '25px', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: '2 1 200px', marginBottom: 0 }}>
          <label htmlFor="product">Select Product</label>
          <select 
            id="product" 
            className="form-control" 
            value={selectedProduct} 
            onChange={(e) => setSelectedProduct(e.target.value)}
          >
            <option value="">-- Choose a product --</option>
            {products.map(p => (
              <option key={p.Product_ID} value={p.Product_ID} disabled={p.Quantity_In_Stock <= 0}>
                {p.Product_Name} (Stock: {p.Quantity_In_Stock}) - {formatCurrency(p.Price)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ flex: '1 1 80px', marginBottom: 0 }}>
          <label htmlFor="quantity">Qty</label>
          <input 
            type="number" 
            id="quantity" 
            className="form-control" 
            value={quantity} 
            onChange={(e) => setQuantity(e.target.value)} 
            min="1" 
          />
        </div>

        <button 
          onClick={handleAddToCart} 
          className="btn-primary" 
          style={{ flex: '1 1 120px', padding: '12px 15px' }}
          disabled={!selectedProduct || !quantity}
        >
          Add to Cart
        </button>
      </div>

      {/* Live Cart Display */}
      {cart.length > 0 && (
        <div className="cart-section glass-card" style={{ padding: '20px', marginBottom: '20px', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.8)'}}>
          <h4 style={{marginTop: 0, marginBottom: '15px', color: '#1f2937'}}>Current Cart</h4>
          <div style={{overflowX: 'auto'}}>
            <table className="modern-table" style={{marginBottom: '20px', minWidth: '400px'}}>
              <thead>
                <tr>
                  <th style={{padding: '10px', background: 'rgba(255, 255, 255, 0.4)'}}>Item</th>
                  <th style={{padding: '10px', background: 'rgba(255, 255, 255, 0.4)'}}>Qty</th>
                  <th style={{padding: '10px', background: 'rgba(255, 255, 255, 0.4)'}}>Subtotal</th>
                  <th style={{padding: '10px', background: 'rgba(255, 255, 255, 0.4)'}}>Action</th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.product_id} style={{background: 'transparent'}}>
                    <td style={{padding: '12px 10px', fontWeight: 600, background: 'transparent'}}>{item.name}</td>
                    <td style={{padding: '12px 10px', background: 'transparent'}}>{item.quantity}</td>
                    <td style={{padding: '12px 10px', fontWeight: 700, background: 'transparent'}}>{formatCurrency(item.subtotal)}</td>
                    <td style={{padding: '12px 10px', background: 'transparent'}}>
                      <button 
                        onClick={() => handleRemoveFromCart(item.product_id)}
                        style={{background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#b91c1c', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontWeight: 700, transition: 'all 0.2s', fontSize: '13px'}}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.25)' }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)' }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px dashed rgba(31,41,55,0.2)', paddingTop: '15px'}}>
            <h4 style={{margin: 0, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Grand Total</h4>
            <h2 style={{margin: 0, color: '#111827', fontSize: '28px'}}>{formatCurrency(grandTotal)}</h2>
          </div>
        </div>
      )}

      {/* Master Checkout */}
      <button 
        onClick={handleCheckout} 
        className="btn-primary" 
        style={{ 
          background: cart.length > 0 ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #111827 0%, #374151 100%)',
          fontSize: '18px',
          padding: '16px'
        }}
        disabled={isLoading || cart.length === 0}
      >
        {isLoading ? 'Processing...' : `Complete Transaction (${cart.length} items)`}
      </button>

      {/* Embedded Print-Friendly Receipt */}
      <div className="receipt-template">
        <h2 style={{ textAlign: 'center', margin: '0 0 5px', fontWeight: 900, fontSize: '24px' }}>Universal Retail Systems</h2>
        {lastSale && (
          <>
            <p style={{ textAlign: 'center', margin: '5px 0' }}>Date: {lastSale.date}</p>
            <div style={{ borderBottom: '1px dashed #000', margin: '15px 0' }}></div>
            <table style={{ width: '100%', fontSize: '14px', marginBottom: '15px', color: '#000', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', paddingBottom: '8px' }}>Item</th>
                  <th style={{ textAlign: 'center', paddingBottom: '8px' }}>Qty</th>
                  <th style={{ textAlign: 'right', paddingBottom: '8px' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {lastSale.items.map(item => (
                  <tr key={item.product_id} style={{ borderBottom: 'none', background: 'none' }}>
                    <td style={{ textAlign: 'left', paddingTop: '5px' }}>{item.name}</td>
                    <td style={{ textAlign: 'center', paddingTop: '5px' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', paddingTop: '5px', fontWeight: 'bold' }}>{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ borderBottom: '1px dashed #000', margin: '15px 0' }}></div>
            <h3 style={{ textAlign: 'right', margin: '10px 0', fontSize: '18px' }}>Total: {formatCurrency(lastSale.total)}</h3>
            <p style={{ textAlign: 'center', marginTop: '30px', fontWeight: 'bold', fontSize: '16px' }}>Thank you for shopping!</p>
          </>
        )}
      </div>

    </div>
  );
};

export default CheckoutForm;
