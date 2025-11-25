import React from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const Reports: React.FC = () => {
  const { state } = useApp();

  // Prepare Data for Monthly Bar Chart
  const monthlyData: any[] = [];
  const monthMap = new Map();

  state.transactions.forEach(tx => {
     const month = tx.date.substring(0, 7); // YYYY-MM
     if (!monthMap.has(month)) {
        monthMap.set(month, { name: month, income: 0, expense: 0 });
     }
     const entry = monthMap.get(month);
     if (tx.type === 'INCOME') entry.income += tx.amount;
     if (tx.type === 'EXPENSE') entry.expense += tx.amount;
  });

  Array.from(monthMap.values())
      .sort((a,b) => a.name.localeCompare(b.name))
      .forEach(v => monthlyData.push(v));

  // Category Pie Chart
  const catMap = new Map();
  state.transactions.filter(t => t.type === 'EXPENSE').forEach(tx => {
     catMap.set(tx.category, (catMap.get(tx.category) || 0) + tx.amount);
  });
  
  const pieData = Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Reports & Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Monthly Trends */}
         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 h-80">
            <h3 className="font-bold mb-4">Monthly Income vs Expense</h3>
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={monthlyData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                  <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" />
               </BarChart>
            </ResponsiveContainer>
         </div>

         {/* Expense Breakdown */}
         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 h-80">
            <h3 className="font-bold mb-4">Expense by Category</h3>
            <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
               </PieChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
};