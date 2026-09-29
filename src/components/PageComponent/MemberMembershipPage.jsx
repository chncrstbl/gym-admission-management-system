// src/pages/member/MemberMembership.jsx
import { useState, useEffect } from 'react';
import Skeleton from '../Skeletons';
import api from '../../lib/api';
import usePaymentPortal from '../../hooks/PaymentPortal';

const plans = [
    { id: 'daily', name: 'Daily Pass', price: 50, duration: '1 Day', description: 'Full day access to gym facilities, lockers, and free weights.', features: ['Full equipment access', 'Locker use for the day', 'Standard shower access'] },
    { id: 'half_month', name: 'Half Month Plan', price: 500, duration: '15 Days', description: 'Flexible bi-weekly plan ideal for seasonal training.', features: ['Full facility access', 'Unlimited gym entry', 'Locker access', '1 Fitness assessment'] },
    { id: 'monthly', name: 'Monthly Regular', price: 1000, duration: '30 Days', popular: true, description: 'Complete monthly package for consistent athletes and members.', features: ['Unlimited monthly entry', 'Locker & shower facilities', 'Free workout program template', 'Priority equipment access'] }
];

export default function MemberMembership() {
    const openPaymentPortal = usePaymentPortal();
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('monthly');
    const [paymentMethod, setPaymentMethod] = useState('gcash');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [receiptModalData, setReceiptModalData] = useState(null);
    const [error, setError] = useState('');

    // Transaction & Membership History Records
    const [history, setHistory] = useState([]);
    const paymentMethods = [
        { id: 'gcash', label: 'GCash' },
        { id: 'maya', label: 'Maya' },
        { id: 'cash', label: 'Cash Desk' }
    ];

    useEffect(() => {
        const fetchMembershipData = async () => {
            try {
                const [profileResponse, paymentsResponse] = await Promise.all([
                    api.get('/portal/profile'),
                    api.get('/portal/payments')
                ]);
                setMember(profileResponse.data?.data || null);
                setHistory((paymentsResponse.data?.data || []).map((payment) => ({
                    id: payment.id,
                    refNo: payment.ref_no || `PAY-${payment.id}`,
                    date: payment.payment_date,
                    plan: plans.find((plan) => plan.price === Number(payment.amount))?.name || 'Membership Payment',
                    amount: Number(payment.amount),
                    method: payment.payment_method,
                    status: payment.status
                })));
            } catch (err) {
                console.error('Failed to load membership data:', err);
                setError(err.response?.data?.message || 'Membership data could not be loaded.');
            } finally {
                setLoading(false);
            }
        };

        fetchMembershipData();
    }, []);

    const handlePaymentSubmission = async (e) => {
        e.preventDefault();
        setError('');
        setIsProcessingPayment(true);

        try {
            const methodLabel = paymentMethods.find((method) => method.id === paymentMethod)?.label;
            const paymentCompleted = await openPaymentPortal(methodLabel);
            if (!paymentCompleted) {
                setError('The demo payment was not completed. Reopen checkout and try again.');
                return;
            }

            const response = await api.post('/portal/membership/renew', { planId: selectedPlan, paymentMethod });
            const newTransaction = response.data.data;
            const plan = plans.find((item) => item.id === selectedPlan);
            setMember((current) => ({
                ...current,
                status: 'Active',
                role: plan.id === 'half_month' ? 'Half Month' : plan.id === 'daily' ? 'Daily' : 'Monthly',
                end_date: newTransaction.endDate
            }));
            setHistory((current) => [{ ...newTransaction, date: newTransaction.date }, ...current]);
            setIsPaymentModalOpen(false);
            setReceiptModalData(newTransaction);
        } catch (err) {
            setError(err.response?.data?.message || 'Renewal could not be saved.');
        } finally {
            setIsProcessingPayment(false);
        }
    };

    if (loading) {
        return (
            <div role="status" aria-label="Loading membership details" aria-busy="true" className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-between gap-4">
                    <div className="w-full max-w-md space-y-3"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-4 w-full" /></div>
                    <Skeleton className="h-10 w-44 rounded-lg" />
                </div>
                <Skeleton className="h-44 w-full rounded-xl" />
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-72 w-full rounded-xl" />)}
                </div>
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        );
    }

    const currentTierName = member?.role ? `${member.role.replace('_', ' ').toUpperCase()} PLAN` : 'Plan unavailable';
    const status = member?.status || 'Unavailable';
    const startDate = member?.start_date 
        ? new Date(member.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) 
        : 'Unavailable';
    const expirationDate = member?.end_date 
        ? new Date(member.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) 
        : 'Unavailable';

    const expiryTime = member?.end_date ? new Date(member.end_date) : null;
    const daysRemaining = expiryTime && !Number.isNaN(expiryTime.getTime())
        ? Math.max(0, Math.ceil((expiryTime - new Date()) / (1000 * 60 * 60 * 24)))
        : null;

    return (
        <div className="flex-1 bg-[#f4f7fb] text-slate-800 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-6">
                {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#041a5f] tracking-tight">
                            Membership & Billing
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Manage your membership tier, subscription expiration, and payment receipts.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="bg-linear-to-r from-[#01358a] to-[#0078d7] hover:opacity-95 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition active:scale-[0.98] cursor-pointer"
                    >
                        + Renew or Change Plan
                    </button>
                </div>

                {/* Current Active Plan Overview Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
                    <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 pb-6 border-b border-slate-100">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                                    Current Subscription
                                </span>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                                    status.toLowerCase() === 'active' 
                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                                        : 'bg-red-50 text-red-600 border border-red-200'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${status.toLowerCase() === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                                    {status}
                                </span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#041a5f]">
                                {currentTierName}
                            </h2>
                            <p className="text-xs text-slate-400">
                                Member ID: {member?.unique_id ? `#${member.unique_id}` : 'Unavailable'}
                            </p>
                        </div>

                        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 sm:p-5 flex items-center gap-6">
                            <div>
                                <span className="text-[11px] font-semibold text-slate-400 block">Remaining Days</span>
                                <span className="text-2xl font-black text-[#01358a] block">{daysRemaining ?? '--'} Days</span>
                            </div>
                            <div className="h-10 w-px bg-slate-200"></div>
                            <div>
                                <span className="text-[11px] font-semibold text-slate-400 block">Expiration Date</span>
                                <span className="text-sm font-bold text-slate-800 block">{expirationDate}</span>
                            </div>
                        </div>
                    </div>

                    {/* Metadata Sub-Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 block">Start Date</span>
                            <span className="text-xs font-bold text-slate-800 mt-0.5 block">{startDate}</span>
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 block">Payment Status</span>
                            <span className="text-xs font-bold text-slate-600 mt-0.5 block">
                                {history[0]?.status || 'No payment record'}
                            </span>
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 block">Auto-Renew Status</span>
                            <span className="text-xs font-bold text-slate-700 mt-0.5 block">Manual renewal</span>
                        </div>
                    </div>
                </div>

                {/* Available Membership Tiers Grid */}
                <div>
                    <div className="mb-4">
                        <h2 className="text-lg font-extrabold text-[#041a5f]">Available Membership Packages</h2>
                        <p className="text-xs text-slate-400">Choose a package to renew your subscription.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`bg-white rounded-2xl border p-6 flex flex-col justify-between transition-all relative ${
                                    plan.popular 
                                        ? 'border-blue-400 shadow-md ring-2 ring-blue-500/10' 
                                        : 'border-slate-200/80 shadow-xs hover:border-slate-300'
                                }`}
                            >
                                {plan.popular && (
                                    <span className="absolute -top-3 right-6 bg-[#01358a] text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                                        Most Popular
                                    </span>
                                )}

                                <div>
                                    <div className="flex justify-between items-baseline mb-2">
                                        <h3 className="text-base font-extrabold text-[#041a5f]">{plan.name}</h3>
                                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                            {plan.duration}
                                        </span>
                                    </div>

                                    <div className="mb-4">
                                        <span className="text-3xl font-black text-slate-900">₱{plan.price}</span>
                                        <span className="text-xs font-semibold text-slate-400 ml-1">/ cycle</span>
                                    </div>

                                    <p className="text-xs text-slate-500 leading-relaxed mb-5">
                                        {plan.description}
                                    </p>

                                    <ul className="space-y-2 mb-6">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                                                <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button
                                    onClick={() => {
                                        setSelectedPlan(plan.id);
                                        setIsPaymentModalOpen(true);
                                    }}
                                    className={`w-full py-2.5 rounded-xl font-bold text-xs tracking-wide transition cursor-pointer ${
                                        plan.popular
                                            ? 'bg-[#0078d7] hover:bg-blue-600 text-white shadow-sm'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                                    }`}
                                >
                                    Select & Renew
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Membership & Payment History Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                        <div>
                            <h2 className="text-base font-extrabold text-[#041a5f]">Payment & Membership History</h2>
                            <p className="text-xs text-slate-400">Past renewals and payment receipts</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="py-3 px-3">Reference No</th>
                                    <th className="py-3 px-3">Date</th>
                                    <th className="py-3 px-3">Plan Description</th>
                                    <th className="py-3 px-3">Amount</th>
                                    <th className="py-3 px-3">Payment Method</th>
                                    <th className="py-3 px-3">Status</th>
                                    <th className="py-3 px-3 text-right">Receipt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {history.map((item) => (
                                    <tr key={item.id || item.refNo} className="hover:bg-slate-50/70 transition">
                                        <td className="py-3.5 px-3 font-mono font-bold text-[#01358a]">{item.refNo}</td>
                                        <td className="py-3.5 px-3 text-slate-600 font-medium">{new Date(item.date).toLocaleDateString()}</td>
                                        <td className="py-3.5 px-3 font-semibold text-slate-800">{item.plan}</td>
                                        <td className="py-3.5 px-3 font-extrabold text-slate-900">₱{item.amount.toFixed(2)}</td>
                                        <td className="py-3.5 px-3 text-slate-600">{item.method}</td>
                                        <td className="py-3.5 px-3">
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-3 text-right">
                                            <button
                                                onClick={() => setReceiptModalData(item)}
                                                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                                            >
                                                View Receipt
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {history.length === 0 && <tr><td colSpan="7" className="py-6 text-center text-slate-500">No payment history.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Demo payment confirmation; no external payment is collected. */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5">
                            <div>
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Sandbox Payment Gateway</span>
                                <h3 className="text-lg font-extrabold text-[#041a5f]">Renew Membership</h3>
                            </div>
                            <button
                                onClick={() => !isProcessingPayment && setIsPaymentModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handlePaymentSubmission} className="space-y-4">
                            {/* Selected Plan Choice */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                    Select Package Tier
                                </label>
                                <select
                                    value={selectedPlan}
                                    onChange={(e) => setSelectedPlan(e.target.value)}
                                    disabled={isProcessingPayment}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {plans.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} — ₱{p.price} ({p.duration})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Simulated Payment Methods */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                    Payment Method
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {paymentMethods.map((m) => (
                                        <button
                                            type="button"
                                            key={m.id}
                                            onClick={() => setPaymentMethod(m.id)}
                                            className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center ${
                                                paymentMethod === m.id
                                                    ? 'border-blue-600 bg-blue-50/70 text-blue-700'
                                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notice Banner */}
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 leading-relaxed">
                                <span className="font-bold block">Demo payment:</span>
                                No real charge is made. Confirming records a demo payment and updates your membership in the database.
                            </div>

                            {/* Buttons */}
                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    disabled={isProcessingPayment}
                                    onClick={() => setIsPaymentModalOpen(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isProcessingPayment}
                                    className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-[#01358a] to-[#0078d7] text-white font-bold text-xs hover:opacity-90 shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                                >
                                    {isProcessingPayment ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <span>Confirm Payment</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Digital Receipt Modal */}
            {receiptModalData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-100 p-6 animate-in fade-in zoom-in-95 duration-150">
                        {/* Receipt Header */}
                        <div className="text-center pb-4 border-b border-dashed border-slate-200">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-base font-extrabold text-[#041a5f]">Payment Confirmed</h3>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">{receiptModalData.refNo}</p>
                        </div>

                        {/* Receipt Details */}
                        <div className="py-4 space-y-2.5 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Date</span>
                                <span className="font-semibold text-slate-800">{receiptModalData.date}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Billed Plan</span>
                                <span className="font-semibold text-slate-800">{receiptModalData.plan}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Payment Gateway</span>
                                <span className="font-semibold text-slate-800">{receiptModalData.method}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Membership Status</span>
                                <span className="font-bold text-emerald-600">ACTIVE</span>
                            </div>
                            <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                                <span className="font-bold text-slate-800">Total Amount Paid</span>
                                <span className="text-lg font-black text-[#01358a]">₱{receiptModalData.amount.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Close Receipt Button */}
                        <button
                            onClick={() => setReceiptModalData(null)}
                            className="w-full mt-2 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
                        >
                            Done & Close Receipt
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}