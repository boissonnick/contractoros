/**
 * Verify Reports Demo Data
 * Quick script to check data seeded for reports
 */

import { getDb } from './db';

const DEMO_ORG_ID = 'u8hwVPLEv4YL9D71ymBwCOrmKta2';

async function verifyReportData() {
  const db = getDb();

  console.log('=== LABOR COST REPORT DATA ===\n');

  // Time entries with labor cost
  const timeSnap = await db.collection('organizations').doc(DEMO_ORG_ID).collection('timeEntries')
    .where('laborCost', '>', 0)
    .get();

  interface UserData { name: string; hours: number; cost: number }
  interface ProjectData { name: string; hours: number; cost: number }

  const byUser: Record<string, UserData> = {};
  const byProject: Record<string, ProjectData> = {};

  timeSnap.docs.forEach(doc => {
    const d = doc.data();
    if (!d.laborCost) return;

    // By user
    if (!byUser[d.userId]) byUser[d.userId] = { name: d.userName, hours: 0, cost: 0 };
    byUser[d.userId].hours += (d.totalMinutes || 0) / 60;
    byUser[d.userId].cost += d.laborCost;

    // By project
    if (d.projectId) {
      if (!byProject[d.projectId]) byProject[d.projectId] = { name: d.projectName, hours: 0, cost: 0 };
      byProject[d.projectId].hours += (d.totalMinutes || 0) / 60;
      byProject[d.projectId].cost += d.laborCost;
    }
  });

  console.log('Labor by Employee:');
  Object.values(byUser).sort((a, b) => b.cost - a.cost).forEach(u => {
    console.log(`  - ${u.name}: ${Math.round(u.hours)} hrs, $${Math.round(u.cost).toLocaleString()}`);
  });

  console.log('\nLabor by Project (Top 6):');
  Object.values(byProject).sort((a, b) => b.cost - a.cost).slice(0, 6).forEach(p => {
    console.log(`  - ${p.name}: ${Math.round(p.hours)} hrs, $${Math.round(p.cost).toLocaleString()}`);
  });

  console.log('\n=== PROJECT P&L DATA ===\n');

  const projSnap = await db.collection('projects').where('orgId', '==', DEMO_ORG_ID).get();
  console.log('Projects with Budget Data:');
  projSnap.docs.slice(0, 9).forEach(doc => {
    const d = doc.data();
    const spent = d.totalSpent || d.currentSpend || 0;
    const variance = (d.budget || 0) - spent;
    console.log(`  - ${d.name}`);
    console.log(`      Budget: $${(d.budget || 0).toLocaleString()} | Spent: $${spent.toLocaleString()} | Variance: ${variance >= 0 ? '+' : ''}$${variance.toLocaleString()}`);
  });

  console.log('\n=== PRODUCTIVITY DATA ===\n');

  const taskSnap = await db.collection('tasks').where('orgId', '==', DEMO_ORG_ID).get();

  interface TaskUserData { name: string; total: number; completed: number }
  const tasksByUser: Record<string, TaskUserData> = {};

  taskSnap.docs.forEach(doc => {
    const d = doc.data();
    if (d.assignedTo && d.assignedTo.length > 0) {
      const userId = d.assignedTo[0];
      const userName = d.assignedToNames?.[0] || 'Unknown';
      if (!tasksByUser[userId]) tasksByUser[userId] = { name: userName, total: 0, completed: 0 };
      tasksByUser[userId].total++;
      if (d.status === 'completed') tasksByUser[userId].completed++;
    }
  });

  console.log('Task Completion by Team Member:');
  Object.values(tasksByUser).sort((a, b) => b.total - a.total).slice(0, 6).forEach(u => {
    const rate = u.total > 0 ? Math.round(u.completed / u.total * 100) : 0;
    console.log(`  - ${u.name}: ${u.completed}/${u.total} tasks (${rate}%)`);
  });

  console.log('\n=== EXPENSE DATA ===\n');

  const expSnap = await db.collection('organizations').doc(DEMO_ORG_ID).collection('expenses').get();

  const expByCategory: Record<string, { count: number; total: number }> = {};
  expSnap.docs.forEach(doc => {
    const d = doc.data();
    if (!expByCategory[d.category]) expByCategory[d.category] = { count: 0, total: 0 };
    expByCategory[d.category].count++;
    expByCategory[d.category].total += d.amount || 0;
  });

  console.log('Expenses by Category:');
  Object.entries(expByCategory).sort((a, b) => b[1].total - a[1].total).forEach(([cat, data]) => {
    console.log(`  - ${cat}: ${data.count} entries, $${Math.round(data.total).toLocaleString()}`);
  });

  console.log('\n=== SUMMARY ===\n');
  console.log(`Time Entries with Labor Cost: ${timeSnap.size}`);
  console.log(`Total Labor Hours: ${Math.round(Object.values(byUser).reduce((s, u) => s + u.hours, 0))}`);
  console.log(`Total Labor Cost: $${Math.round(Object.values(byUser).reduce((s, u) => s + u.cost, 0)).toLocaleString()}`);
  console.log(`Projects: ${projSnap.size}`);
  console.log(`Tasks: ${taskSnap.size}`);
  console.log(`Expenses: ${expSnap.size}`);
}

verifyReportData()
  .then(() => {
    console.log('\n--- Verification Complete ---');
    process.exit(0);
  })
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  });
