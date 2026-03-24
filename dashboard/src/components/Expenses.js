import React, { useState, useEffect } from "react";
import axios from "axios";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { API_URL } from "../config";

ChartJS.register(ArcElement, Tooltip, Legend);

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [formData, setFormData] = useState({ title: "", amount: "", category: "General" });
    const [loading, setLoading] = useState(true);

    const fetchExpenses = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return setLoading(false);
            const { data } = await axios.get(`${API_URL}/api/expenses`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setExpenses(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            await axios.post(`${API_URL}/api/expenses`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFormData({ title: "", amount: "", category: "General" });
            fetchExpenses();
        } catch (error) {
            console.error(error);
        }
    };

    const deleteExpense = async (id) => {
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${API_URL}/api/expenses/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchExpenses();
        } catch (error) {
            console.error(error);
        }
    };

    const categories = ["General", "Market/SIP", "Groceries", "Utilities", "Other"];

    // Prepare data for Pie chart
    const categoryTotals = expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
    }, {});

    const chartData = {
        labels: Object.keys(categoryTotals),
        datasets: [
            {
                data: Object.values(categoryTotals),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
            },
        ],
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading expenses...</div>;

    return (
        <div style={{ padding: '16px', maxWidth: '900px', margin: '0 auto', boxSizing: 'border-box', width: '100%' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Expense Tracker</h2>

            {/* Form + Chart row — wraps to single column on narrow screens */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {/* Form */}
                <div style={{ flex: '1 1 260px', minWidth: 0, padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.06)', boxSizing: 'border-box' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Add New Expense</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input
                            type="text" placeholder="Title (e.g., Netflix, Mutual Fund)" required
                            value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box' }}
                        />
                        <input
                            type="number" placeholder="Amount (₹)" required
                            value={formData.amount} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box' }}
                        />
                        <select
                            value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box' }}
                        >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button type="submit" style={{ padding: '12px', backgroundColor: '#36A2EB', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Add Expense
                        </button>
                    </form>
                </div>

                {/* Chart */}
                <div style={{ flex: '1 1 260px', minWidth: 0, padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Expense Breakdown</h3>
                    {expenses.length > 0 ? (
                        <div style={{ width: '100%', maxWidth: '280px', aspectRatio: '1' }}>
                            <Pie data={chartData} options={{ maintainAspectRatio: true }} />
                        </div>
                    ) : (
                        <p style={{ color: '#888', marginTop: '40px', textAlign: 'center' }}>No expenses to display yet</p>
                    )}
                </div>
            </div>

            {/* Recent Expenses — table-layout fixed so columns never overflow */}
            <div style={{ marginTop: '24px', padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.06)', overflowX: 'hidden' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>Recent Expenses</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' }}>
                    <colgroup>
                        <col style={{ width: '20%' }} />   {/* Date */}
                        <col style={{ width: '24%' }} />   {/* Title */}
                        <col style={{ width: '20%' }} />   {/* Category */}
                        <col style={{ width: '22%' }} />   {/* Amount — wider so ₹99999 fits */}
                        <col style={{ width: '14%' }} />   {/* Delete */}
                    </colgroup>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #eee', color: '#555' }}>
                            <th style={{ padding: '8px 6px', fontSize: '12px' }}>Date</th>
                            <th style={{ padding: '8px 6px', fontSize: '12px' }}>Title</th>
                            <th style={{ padding: '8px 6px', fontSize: '12px' }}>Category</th>
                            <th style={{ padding: '8px 6px', fontSize: '12px' }}>Amount</th>
                            <th style={{ padding: '8px 6px', fontSize: '12px' }}>Del</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map(exp => (
                            <tr key={exp._id} style={{ borderBottom: '1px solid #eee' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <td style={{ padding: '8px 6px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                </td>
                                <td style={{ padding: '8px 6px', fontSize: '12px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={exp.title}>
                                    {exp.title}
                                </td>
                                <td style={{ padding: '8px 6px', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <span style={{ backgroundColor: '#e3f2fd', color: '#1976d2', padding: '2px 6px', borderRadius: '10px', fontSize: '11px' }}>
                                        {exp.category}
                                    </span>
                                </td>
                                <td style={{ padding: '8px 6px', fontSize: '12px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    ₹{exp.amount}
                                </td>
                                <td style={{ padding: '8px 6px' }}>
                                    <button onClick={() => deleteExpense(exp._id)} style={{ color: '#F44336', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', padding: 0 }}>✕</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Expenses;
