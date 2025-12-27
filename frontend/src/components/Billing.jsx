import { useState, useEffect } from "react";
import api from "../api";
import "../App.css";

function Billing() {
  const [list, setList] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [message, setMessage] = useState("");
  
  const [formData, setFormData] = useState({
    case_id: "",
    amount: "",
    issued_date: "", 
    due_date: "",    
    status: "Pending"
  });

  const [paymentData, setPaymentData] = useState({
    paid_by: "",
    amount: "",
    method: "Cash",
    payment_date: new Date().toISOString().split('T')[0] 
  });

  const fetchData = async () => {
    try {
      const res = await api.get("/invoices");
      setList(res.data.data || []);
    } catch (err) {
      setList([]);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/invoices", formData);
      setMessage("Invoice created & Email sent! 📧");
      setFormData({ case_id: "", amount: "", issued_date: "", due_date: "", status: "Pending" });
      fetchData();
    } catch (err) {
      setMessage("Error: " + err.response?.data?.message);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/invoices/${selectedInvoice.id}/pay`, paymentData);
      setMessage("Payment recorded! Invoice status updated. ✅");
      setSelectedInvoice(null);
      fetchData();
    } catch (err) {
      alert("Payment failed");
    }
  };

  return (
    <div className="container">
      <h2>💳 Billing & Financials</h2>
      {message && <p className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</p>}

      <div className="card">
        <h3>Create New Invoice</h3>
        <form onSubmit={handleSubmit} className="form-grid">
          <input 
            placeholder="Case ID" 
            value={formData.case_id} 
            onChange={e => setFormData({ ...formData, case_id: e.target.value })} 
            required 
          />
          <input 
            placeholder="Amount (Rs.)" 
            type="number" 
            value={formData.amount} 
            onChange={e => setFormData({ ...formData, amount: e.target.value })} 
            required 
          />
          
          <div className="input-group">
            <label><small>Issued Date</small></label>
            <input 
              type="date" 
              value={formData.issued_date} 
              onChange={e => setFormData({ ...formData, issued_date: e.target.value })} 
              required 
            />
          </div>

          <div className="input-group">
            <label><small>Due Date</small></label>
            <input 
              type="date" 
              value={formData.due_date} 
              onChange={e => setFormData({ ...formData, due_date: e.target.value })} 
              required 
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn primary">Generate & Email Invoice</button>
          </div>
        </form>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Inv #</th>
              <th>Case</th>
              <th>Total (Rs.)</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map(inv => (
              <tr key={inv.id}>
                <td><code>#{inv.id}</code></td>
                <td>Case #{inv.case_id}</td>
                <td><strong>Rs. {inv.amount}</strong></td>
                <td>{inv.due_date}</td>
                <td><span className={`badge ${inv.status.toLowerCase().replace(' ', '-')}`}>{inv.status}</span></td>
                <td>
                  <button className="btn small primary" onClick={() => setSelectedInvoice(inv)}>Record Payment</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedInvoice && (
        <div className="modal-overlay">
          <div className="card modal-content">
            <h3>Record Payment: Invoice #{selectedInvoice.id}</h3>
            <p style={{marginBottom: '15px'}}>Total Due: <strong>Rs. {selectedInvoice.amount}</strong></p>
            <form onSubmit={handlePayment} className="form-grid">
              <input placeholder="Payer Name" value={paymentData.paid_by} onChange={e => setPaymentData({...paymentData, paid_by: e.target.value})} required />
              <input placeholder="Amount (Rs.)" type="number" value={paymentData.amount} onChange={e => setPaymentData({...paymentData, amount: e.target.value})} required />
              
              <select value={paymentData.method} onChange={e => setPaymentData({...paymentData, method: e.target.value})}>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="eSewa/Khalti">eSewa/Khalti</option>
                <option value="Check">Check</option>
              </select>

              <div className="input-group">
                <label><small>Payment Date</small></label>
                <input 
                  type="date" 
                  value={paymentData.payment_date} 
                  onChange={e => setPaymentData({...paymentData, payment_date: e.target.value})} 
                  required 
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn success">Submit Rs. {paymentData.amount}</button>
                <button type="button" className="btn" onClick={() => setSelectedInvoice(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Billing;