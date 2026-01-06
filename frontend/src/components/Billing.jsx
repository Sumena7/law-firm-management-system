import { useState, useEffect } from "react";
import api from "../api";
import "../App.css";
import Swal from "sweetalert2";

function Billing() {
  const [list, setList] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [billingType, setBillingType] = useState("case"); 
  
  const [formData, setFormData] = useState({
    case_id: "",
    appointment_id: "",
    amount: "",
    issued_date: new Date().toISOString().split('T')[0], 
    due_date: "",     
    status: "Pending"
  });

  const fetchData = async () => {
    try {
      const [invRes, appRes] = await Promise.all([
        api.get("/invoices"),
        api.get("/appointments")
      ]);
      setList(invRes.data.data || []);
      setAppointments(appRes.data.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setList([]);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      amount: formData.amount,
      issued_date: formData.issued_date,
      due_date: formData.due_date,
      status: formData.status,
      // Ensures the backend doesn't get confused by empty strings
      case_id: billingType === "case" ? (formData.case_id || null) : null,
      appointment_id: billingType === "appointment" ? (formData.appointment_id || null) : null
    };

    try {
      await api.post("/invoices", payload);
      Swal.fire("Success!", "Invoice created & Email sent! 📧", "success");
      
      setFormData({ 
        case_id: "", 
        appointment_id: "", 
        amount: "", 
        issued_date: new Date().toISOString().split('T')[0], 
        due_date: "", 
        status: "Pending" 
      });
      fetchData();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to create invoice", "error");
    }
  };

  const openPaymentModal = async (inv) => {
    const { value: formValues } = await Swal.fire({
      title: `Record Payment: Invoice #${inv.id}`,
      html:
        `<p style="text-align:left; margin-bottom:10px;">Total Due: <strong>Rs. ${inv.amount}</strong></p>` +
        `<input id="swal-paid-by" class="swal2-input" placeholder="Payer Name">` +
        `<input id="swal-amount" type="number" class="swal2-input" placeholder="Amount" value="${inv.amount}">` +
        `<select id="swal-method" class="swal2-input">
          <option value="Cash">Cash</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="eSewa/Khalti">eSewa/Khalti</option>
        </select>` +
        `<input id="swal-date" type="date" class="swal2-input" value="${new Date().toISOString().split('T')[0]}">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Submit Payment',
      preConfirm: () => {
        return {
          paid_by: document.getElementById('swal-paid-by').value,
          amount: document.getElementById('swal-amount').value,
          method: document.getElementById('swal-method').value,
          payment_date: document.getElementById('swal-date').value
        }
      }
    });

    if (formValues) {
      try {
        await api.post(`/invoices/${inv.id}/pay`, formValues);
        Swal.fire("Paid!", "Status updated.", "success");
        fetchData();
      } catch (err) {
        Swal.fire("Error", "Payment failed.", "error");
      }
    }
  };

  return (
    <div className="container">
      <h2>💳 Billing & Financials</h2>
      
      <div className="card shadow-sm" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3>Generate New Invoice</h3>
          <div className="billing-type-toggle">
            <button 
              type="button"
              className={`btn small ${billingType === 'case' ? 'primary' : 'secondary'}`}
              onClick={() => setBillingType('case')}
            >Legal Case</button>
            <button 
              type="button"
              className={`btn small`}
              onClick={() => setBillingType('appointment')}
              style={{ 
                marginLeft: '10px', 
                backgroundColor: billingType === 'appointment' ? '#7c3aed' : '#ccc',
                color: 'white'
              }}
            >Consultation</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label><small>{billingType === 'case' ? 'Case Identification' : 'Select Appointment'}</small></label>
            {billingType === "case" ? (
              <input 
                placeholder="Enter Case ID" 
                value={formData.case_id} 
                onChange={e => setFormData({ ...formData, case_id: e.target.value })} 
                required 
              />
            ) : (
              <select 
                className="form-input" 
                value={formData.appointment_id} 
                onChange={e => setFormData({ ...formData, appointment_id: e.target.value })}
                required
              >
                <option value="">-- Choose Appointment --</option>
                {appointments.map(app => (
                  <option key={app.id} value={app.id}>
                    Appt #{app.id} - {app.client_name || 'Prospect'} ({app.appointment_date ? new Date(app.appointment_date).toLocaleDateString() : 'N/A'})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group">
            <label><small>Amount (Rs.)</small></label>
            <input 
              type="number" 
              value={formData.amount} 
              onChange={e => setFormData({ ...formData, amount: e.target.value })} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label><small>Issued Date</small></label>
            <input type="date" value={formData.issued_date} onChange={e => setFormData({ ...formData, issued_date: e.target.value })} required />
          </div>

          <div className="form-group">
            <label><small>Due Date</small></label>
            <input type="date" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} required />
          </div>

          <div style={{ gridColumn: "span 2" }}>
            <button type="submit" className="btn primary" style={{ width: '100%', backgroundColor: billingType === 'appointment' ? '#7c3aed' : '#2563eb' }}>
              Generate & Email Invoice
            </button>
          </div>
        </form>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Inv #</th>
              <th>Reference</th>
              <th>Total</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map(inv => (
              <tr key={inv.id}>
                <td>#{inv.id}</td>
                <td>
                  {inv.case_id ? (
                    <span className="badge case">Case #{inv.case_id}</span>
                  ) : (
                    <span className="badge appointment" style={{ backgroundColor: '#7c3aed', color: '#fff' }}>
                      Appt #{inv.appointment_id}
                    </span>
                  )}
                </td>
                <td>Rs. {inv.amount}</td>
                <td>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'N/A'}</td>
                <td><span className={`badge ${inv.status?.toLowerCase()}`}>{inv.status}</span></td>
                <td>
                  {inv.status !== 'Paid' && (
                    <button className="btn small success" onClick={() => openPaymentModal(inv)}>Pay</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Billing;