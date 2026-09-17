import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import {
  INITIAL_EMPLOYEES,
  INITIAL_PROJECT_PLANS,
  INITIAL_CANDIDATES,
  INITIAL_ORG_TREE,
  INITIAL_PERMISSION_MATRIX,
} from '../src/data/initialData';
import { cleanForFirestore } from '../src/utils/firestoreSanitizer';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function syncAll() {
  console.log('Starting sync to Firestore database:', config.firestoreDatabaseId);
  const nowIso = new Date().toISOString();

  // 1. Sync metadata
  await setDoc(
    doc(db, 'app_datasets', 'metadata'),
    cleanForFirestore({
      lastSyncedAt: nowIso,
      employeesCount: INITIAL_EMPLOYEES.length,
      projectPlansCount: INITIAL_PROJECT_PLANS.length,
      candidatesCount: INITIAL_CANDIDATES.length,
      syncedBy: 'system_migration',
    }),
    { merge: true }
  );
  console.log('Metadata updated.');

  // 2. Sync main_records (employees, projectPlans, candidates)
  await setDoc(
    doc(db, 'app_datasets', 'main_records'),
    cleanForFirestore({
      employees: INITIAL_EMPLOYEES,
      projectPlans: INITIAL_PROJECT_PLANS,
      candidates: INITIAL_CANDIDATES,
      updatedAt: nowIso,
      updatedBySession: 'system_clean_migration_' + Date.now(),
    }),
    { merge: true }
  );
  console.log(`main_records updated: ${INITIAL_EMPLOYEES.length} employees, ${INITIAL_PROJECT_PLANS.length} project plans (${INITIAL_PROJECT_PLANS.filter(p => p.region === '台中市').length} in Taichung), ${INITIAL_CANDIDATES.length} candidates.`);

  // 3. Sync org_and_permissions
  await setDoc(
    doc(db, 'app_datasets', 'org_and_permissions'),
    cleanForFirestore({
      orgTree: INITIAL_ORG_TREE,
      permissionMatrix: INITIAL_PERMISSION_MATRIX,
      updatedAt: nowIso,
      updatedBySession: 'system_clean_migration_' + Date.now(),
    }),
    { merge: true }
  );
  console.log('org_and_permissions updated.');

  console.log('ALL FIRESTORE COLLECTIONS SYNCED SUCCESSFULLY!');
}

syncAll()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Sync failed:', err);
    process.exit(1);
  });
