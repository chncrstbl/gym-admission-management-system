// src/pages/member/MemberProgress.jsx
import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function MemberProgress() {
    const [progressData, setProgressData] = useState({ measurements: [], goals: [], monthlyVisits: 0 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalMode, setModalMode] = useState(null);
    const [error, setError] = useState('');
    const [measurementForm, setMeasurementForm] = useState({ weight: '', bodyFat: '', muscleMass: '', notes: '' });
    const [goalForm, setGoalForm] = useState({ metric: 'weight', target: '' });

    useEffect(() => {
        const fetchProgressData = async () => {
            try {
                const response = await api.get('/portal/progress');
                setProgressData(response.data?.data || { measurements: [], goals: [], monthlyVisits: 0 });
            } catch (err) {
                console.error('Failed to load member progress:', err);
                setError(err.response?.data?.message || 'Fitness progress could not be loaded.');
            } finally {
                setLoading(false);
            }
        };

        fetchProgressData();
    }, []);

    const measurementHistory = progressData.measurements || [];
    const progressAvailability = progressData.availability || { measurements: true, goals: true, attendance: true };
    const latest = measurementHistory[0];
    const previous = measurementHistory[1];
    const currentStats = {
        weight: latest?.weight_kg == null ? null : Number(latest.weight_kg),
        weightChange: latest?.weight_kg != null && previous?.weight_kg != null ? Number(latest.weight_kg) - Number(previous.weight_kg) : null,
        bodyFat: latest?.body_fat_percent == null ? null : Number(latest.body_fat_percent),
        bodyFatChange: latest?.body_fat_percent != null && previous?.body_fat_percent != null ? Number(latest.body_fat_percent) - Number(previous.body_fat_percent) : null,
        muscleMass: latest?.muscle_mass_kg == null ? null : Number(latest.muscle_mass_kg),
        muscleMassChange: latest?.muscle_mass_kg != null && previous?.muscle_mass_kg != null ? Number(latest.muscle_mass_kg) - Number(previous.muscle_mass_kg) : null
    };
    const oldest = measurementHistory[measurementHistory.length - 1];
    const goalMetadata = {
        weight: { title: 'Target Weight', current: currentStats.weight, start: oldest?.weight_kg, unit: 'kg', color: 'bg-blue-500' },
        body_fat: { title: 'Body Fat', current: currentStats.bodyFat, start: oldest?.body_fat_percent, unit: '%', color: 'bg-indigo-500' },
        muscle_mass: { title: 'Muscle Mass', current: currentStats.muscleMass, start: oldest?.muscle_mass_kg, unit: 'kg', color: 'bg-emerald-500' },
        monthly_visits: { title: 'Monthly Gym Sessions', current: progressAvailability.attendance ? Number(progressData.monthlyVisits || 0) : null, start: 0, unit: 'sessions', color: 'bg-emerald-500' }
    };
    const goals = (progressData.goals || []).map((goal) => ({ ...goal, ...goalMetadata[goal.metric], target: Number(goal.target_value) }));
    const getChangeClass = (change, metric) => {
        if (change == null || change === 0) return 'text-slate-400';
        const isImprovement = metric === 'muscleMass' ? change > 0 : change < 0;
        return isImprovement ? 'text-emerald-600' : 'text-amber-600';
    };

    const reloadProgress = async () => {
        const response = await api.get('/portal/progress');
        setProgressData(response.data?.data || { measurements: [], goals: [], monthlyVisits: 0 });
    };

    const handleSaveMeasurement = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        try {
            await api.post('/portal/progress/measurements', {
                weight: measurementForm.weight || null,
                bodyFat: measurementForm.bodyFat || null,
                muscleMass: measurementForm.muscleMass || null,
                notes: measurementForm.notes
            });
            await reloadProgress();
            setMeasurementForm({ weight: '', bodyFat: '', muscleMass: '', notes: '' });
            setModalMode(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Measurement could not be saved.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveGoal = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        try {
            await api.put('/portal/progress/goals', goalForm);
            await reloadProgress();
            setModalMode(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Goal could not be saved.');
        } finally {
            setSaving(false);
        }
    };

    // Helper to calculate progress bar percentage
    const getProgressPercent = (current, start, target) => {
        if (current == null || target == null) return 0;
        if (start == null || Number(start) === Number(target)) return Number(current) >= Number(target) ? 100 : 0;
        current = Number(current);
        start = Number(start);
        target = Number(target);
        if (start > target) {
            // Losing metric (e.g., weight)
            const totalToLose = start - target;
            const lost = start - current;
            return Math.min(Math.max((lost / totalToLose) * 100, 0), 100);
        } else {
            // Gaining metric (e.g., sessions)
            const totalToGain = target - start;
            const gained = current - start;
            return Math.min(Math.max((gained / totalToGain) * 100, 0), 100);
        }
    };

    if (loading) return <div className="p-8 text-sm text-slate-500">Loading fitness progress...</div>;

    return (
        <>
            <div className="max-w-6xl mx-auto space-y-6">
                {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
                {Object.values(progressAvailability).some((available) => !available) && (
                    <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        Some fitness data tables are not installed. Apply backend/member-portal-schema.sql to enable measurements, goals, and attendance progress.
                    </div>
                )}

                {/* Header Description */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-extrabold text-[#041a5f]">
                            Track Your Fitness Journey
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500">
                            Monitor your weight, body composition, and workout milestones over time.
                        </p>
                    </div>
                    <button
                        onClick={() => setModalMode('measurement')}
                        disabled={!progressAvailability.measurements}
                        className="bg-linear-to-r from-[#01358a] to-[#0078d7] hover:opacity-95 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        + Add New Measurement
                    </button>
                </div>

                {/* Key Metrics Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Weight */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider">Current Weight</span>
                            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                            </svg>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-black text-[#041a5f]">{currentStats.weight ?? '--'} kg</div>
                            <span className={`text-xs font-bold ${getChangeClass(currentStats.weightChange, 'weight')}`}>
                                {currentStats.weightChange == null ? 'No previous entry' : `${currentStats.weightChange > 0 ? '+' : ''}${currentStats.weightChange.toFixed(1)} kg`}
                            </span>
                        </div>
                        <div className="text-[10px] font-medium text-slate-400 mt-1">Change since previous record</div>
                    </div>

                    {/* Body Fat */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider">Body Fat</span>
                            <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-black text-[#041a5f]">{currentStats.bodyFat ?? '--'}%</div>
                            <span className={`text-xs font-bold ${getChangeClass(currentStats.bodyFatChange, 'bodyFat')}`}>
                                {currentStats.bodyFatChange == null ? 'No previous entry' : `${currentStats.bodyFatChange > 0 ? '+' : ''}${currentStats.bodyFatChange.toFixed(1)}%`}
                            </span>
                        </div>
                        <div className="text-[10px] font-medium text-slate-400 mt-1">Change since previous record</div>
                    </div>

                    {/* Muscle Mass */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider">Muscle Mass</span>
                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-black text-[#041a5f]">{currentStats.muscleMass ?? '--'} kg</div>
                            <span className={`text-xs font-bold ${getChangeClass(currentStats.muscleMassChange, 'muscleMass')}`}>
                                {currentStats.muscleMassChange == null ? 'No previous entry' : `${currentStats.muscleMassChange > 0 ? '+' : ''}${currentStats.muscleMassChange.toFixed(1)} kg`}
                            </span>
                        </div>
                        <div className="text-[10px] font-medium text-slate-400 mt-1">Change since previous record</div>
                    </div>

                    {/* Measurement History Count */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider">Measurements</span>
                            <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                            </svg>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-black text-[#041a5f]">{measurementHistory.length}</div>
                        </div>
                        <div className="text-[10px] font-medium text-slate-400 mt-1">Records saved</div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Progress History Table (2/3 width) */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                            <div>
                                <h3 className="text-base font-extrabold text-[#041a5f]">Body Composition Log</h3>
                                <p className="text-xs text-slate-400">History of your physical measurements</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="py-3 px-3">Date</th>
                                        <th className="py-3 px-3">Weight</th>
                                        <th className="py-3 px-3">Body Fat</th>
                                        <th className="py-3 px-3">Muscle Mass</th>
                                        <th className="py-3 px-3">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {measurementHistory.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-slate-50/70 transition">
                                            <td className="py-3.5 px-3 font-semibold text-slate-800">{new Date(entry.measured_at).toLocaleDateString()}</td>
                                            <td className="py-3.5 px-3 font-extrabold text-[#01358a]">{entry.weight_kg ?? '--'} kg</td>
                                            <td className="py-3.5 px-3 font-bold text-slate-700">{entry.body_fat_percent ?? '--'}%</td>
                                            <td className="py-3.5 px-3 font-bold text-slate-700">{entry.muscle_mass_kg ?? '--'} kg</td>
                                            <td className="py-3.5 px-3 text-slate-500 italic truncate max-w-37.5">{entry.notes || '—'}</td>
                                        </tr>
                                    ))}
                                    {measurementHistory.length === 0 && <tr><td colSpan="5" className="py-6 text-center text-slate-500">No measurements recorded.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Active Goals Tracker (1/3 width) */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col">
                        <div className="pb-4 border-b border-slate-100 mb-5">
                            <h3 className="text-base font-extrabold text-[#041a5f]">Active Goals</h3>
                            <p className="text-xs text-slate-400">Track your current targets</p>
                        </div>

                        <div className="space-y-6 flex-1">
                            {goals.map(goal => {
                                const percent = getProgressPercent(goal.current, goal.start, goal.target);
                                
                                return (
                                    <div key={goal.id}>
                                        <div className="flex justify-between items-end mb-1.5">
                                            <span className="text-xs font-bold text-slate-700">{goal.title}</span>
                                            <span className="text-[10px] font-bold text-slate-400">
                                                {goal.current ?? '--'} / {goal.target} {goal.unit}
                                            </span>
                                        </div>
                                        {/* Progress Bar Background */}
                                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                            {/* Progress Bar Fill */}
                                            <div 
                                                className={`h-2.5 rounded-full ${goal.color} transition-all duration-1000 ease-out`} 
                                                style={{ width: `${percent}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between items-center mt-1.5">
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                                {Math.round(percent)}% Completed
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            {goals.length === 0 && <p className="text-sm text-slate-500">No goals set yet.</p>}
                        </div>

                        <button
                            onClick={() => setModalMode('goal')}
                            disabled={!progressAvailability.goals}
                            className="w-full mt-6 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Set or Update Goal
                        </button>
                    </div>

                </div>
            </div>

            {modalMode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <form onSubmit={modalMode === 'measurement' ? handleSaveMeasurement : handleSaveGoal} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">{modalMode === 'measurement' ? 'Add Measurement' : 'Set Fitness Goal'}</h2>
                            <button type="button" onClick={() => setModalMode(null)} className="text-slate-500" aria-label="Close">×</button>
                        </div>
                        {modalMode === 'measurement' ? (
                            <>
                                <label className="block text-sm text-slate-700">Weight (kg)<input type="number" min="0.1" step="0.1" value={measurementForm.weight} onChange={(event) => setMeasurementForm({ ...measurementForm, weight: event.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2" /></label>
                                <label className="block text-sm text-slate-700">Body fat (%)<input type="number" min="0.1" step="0.1" value={measurementForm.bodyFat} onChange={(event) => setMeasurementForm({ ...measurementForm, bodyFat: event.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2" /></label>
                                <label className="block text-sm text-slate-700">Muscle mass (kg)<input type="number" min="0.1" step="0.1" value={measurementForm.muscleMass} onChange={(event) => setMeasurementForm({ ...measurementForm, muscleMass: event.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2" /></label>
                                <label className="block text-sm text-slate-700">Notes<textarea value={measurementForm.notes} onChange={(event) => setMeasurementForm({ ...measurementForm, notes: event.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2" /></label>
                            </>
                        ) : (
                            <>
                                <label className="block text-sm text-slate-700">Metric<select value={goalForm.metric} onChange={(event) => setGoalForm({ ...goalForm, metric: event.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2">
                                    <option value="weight">Weight</option><option value="body_fat">Body fat</option><option value="muscle_mass">Muscle mass</option><option value="monthly_visits">Monthly visits</option>
                                </select></label>
                                <label className="block text-sm text-slate-700">Target<input type="number" min="0.1" step="0.1" required value={goalForm.target} onChange={(event) => setGoalForm({ ...goalForm, target: event.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2" /></label>
                            </>
                        )}
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setModalMode(null)} className="rounded border px-4 py-2 text-sm">Cancel</button>
                            <button type="submit" disabled={saving} className="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
                        </div>
                    </form>
                </div>
            )}
            </>
    );
}