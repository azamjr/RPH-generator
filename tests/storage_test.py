"""Exercises actual route SQL against SQLite: ownership, revision conflicts, quotas.
D1 uses SQLite. This tests SQL semantics locally, not the deployed identity gateway.
"""
import sqlite3,re,pathlib,unittest
class StorageTests(unittest.TestCase):
 def setUp(self):
  self.db=sqlite3.connect(':memory:')
  self.db.executescript(pathlib.Path('drizzle/0000_uneven_terror.sql').read_text())
  self.source=pathlib.Path('app/api/workspace/route.ts').read_text()
 def sql(self,prefix):
  candidates=re.findall(r"'([^'\n]*(?:INSERT|UPDATE|SELECT|DELETE)[^'\n]*)'",self.source)
  return next(s for s in candidates if s.startswith(prefix))
 def test_owner_scope_and_stale_revision(self):
  create=self.sql('INSERT OR IGNORE INTO records')
  self.db.execute(create,('alice','lesson','lesson','{}',1,'now','alice'))
  update=self.sql('UPDATE records')
  self.assertEqual(self.db.execute(update,('{"x":1}','later','bob','lesson','lesson',1)).rowcount,0)
  self.assertEqual(self.db.execute(update,('{"x":1}','later','alice','lesson','lesson',1)).rowcount,1)
  self.assertEqual(self.db.execute(update,('{"x":2}','later','alice','lesson','lesson',1)).rowcount,0)
  self.assertEqual(self.db.execute('select revision from records').fetchone()[0],2)
 def test_storage_limit_is_atomic(self):
  sql=self.sql('INSERT OR IGNORE INTO records')
  for i in range(100):self.assertEqual(self.db.execute(sql,('alice',str(i),'lesson','{}',1,'now','alice')).rowcount,1)
  self.assertEqual(self.db.execute(sql,('alice','overflow','lesson','{}',1,'now','alice')).rowcount,0)
  self.assertEqual(self.db.execute(sql,('bob','first','lesson','{}',1,'now','bob')).rowcount,1)
 def test_quota_never_exceeds_limit(self):
  source=pathlib.Path('app/api/generate/route.ts').read_text()
  sql=re.search(r"prepare\('(INSERT INTO usage[^']+)'\)",source)[1]
  for i in range(5):self.assertIsNotNone(self.db.execute(sql,('alice:day',5)).fetchone())
  self.assertIsNone(self.db.execute(sql,('alice:day',5)).fetchone())
  self.assertEqual(self.db.execute('select count from usage').fetchone()[0],5)
if __name__=='__main__':unittest.main()
