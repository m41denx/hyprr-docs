'use client';
import { useState } from 'react';

const sections = [
  {
    title: "Создание пользователя",
    variants: {
      PostgreSQL: "CREATE USER {{user}} WITH PASSWORD '{{password}}';",
      MariaDB: "CREATE USER '{{user}}'@'%' IDENTIFIED BY '{{password}}';",
      MongoDB: `db.createUser({\n  user: "{{user}}",\n  pwd: "{{password}}",\n  roles: [{ role: "root", db: "admin" }]\n})`,
      Redis: "ACL SETUSER {{user}} on >{{password}} ~* +@all",
    }
  },
  {
    title: "Создание базы данных",
    variants: {
      PostgreSQL: "CREATE DATABASE {{dbname}} OWNER {{user}};",
      MariaDB: "CREATE DATABASE {{dbname}};",
      MongoDB: "use {{dbname}}",
      Redis: "# Redis не использует базы как SQL (логические DB 0-15)",
    }
  },
  {
    title: "Выдать все права на БД",
    variants: {
      PostgreSQL: "GRANT ALL PRIVILEGES ON DATABASE {{dbname}} TO {{user}};",
      MariaDB: "GRANT ALL PRIVILEGES ON {{dbname}}.* TO '{{user}}'@'%';\nFLUSH PRIVILEGES;",
      MongoDB: `db.grantRolesToUser("{{user}}", [\n  { role: "dbOwner", db: "{{dbname}}" }\n])`,
      Redis: "ACL SETUSER {{user}} on >{{password}} ~* +@all",
    }
  },
  {
    title: "Забрать все права",
    variants: {
      PostgreSQL: "REVOKE ALL PRIVILEGES ON DATABASE {{dbname}} FROM {{user}};",
      MariaDB: "REVOKE ALL PRIVILEGES ON {{dbname}}.* FROM '{{user}}'@'%';\nFLUSH PRIVILEGES;",
      MongoDB: `db.revokeRolesFromUser("{{user}}", [\n  { role: "dbOwner", db: "{{dbname}}" }\n])`,
      Redis: "ACL SETUSER {{user}} off",
    }
  },
  {
    title: "Удалить пользователя",
    variants: {
      PostgreSQL: "DROP USER {{user}};",
      MariaDB: "DROP USER '{{user}}'@'%';",
      MongoDB: `db.dropUser("{{user}}")`,
      Redis: "ACL DELUSER {{user}}",
    }
  },
  {
    title: "Удалить базу данных",
    variants: {
      PostgreSQL: "DROP DATABASE {{dbname}};",
      MariaDB: "DROP DATABASE {{dbname}};",
      MongoDB: "use {{dbname}}\ndb.dropDatabase()",
      Redis: "# Redis: не применяется",
    }
  },
  {
    title: "Изменить пароль",
    variants: {
      PostgreSQL: "ALTER USER {{user}} WITH PASSWORD '{{newpassword}}';",
      MariaDB: "ALTER USER '{{user}}'@'%' IDENTIFIED BY '{{newpassword}}';",
      MongoDB: `db.changeUserPassword("{{user}}", "{{newpassword}}")`,
      Redis: "ACL SETUSER {{user}} >{{newpassword}}",
    }
  },
];

function sub(tpl, v) {
  return tpl
    .replace(/\{\{dbname\}\}/g, v.dbname || '{{dbname}}')
    .replace(/\{\{user\}\}/g, v.user || '{{user}}')
    .replace(/\{\{password\}\}/g, v.password || '{{password}}')
    .replace(/\{\{newpassword\}\}/g, v.newpassword || '{{newpassword}}');
}

export default function DbTemplate() {
  const [vals, setVals] = useState({ dbname: 'mydb', user: 'myuser', password: 'secret', newpassword: 'newsecret' });
  const [activeTabs, setActiveTabs] = useState({});
  const [copied, setCopied] = useState({});

  const set = (k, v) => setVals(prev => ({ ...prev, [k]: v }));
  const getTab = (i) => activeTabs[i] || 'PostgreSQL';

  const copy = (i, code) => {
    navigator.clipboard.writeText(code);
    setCopied(prev => ({ ...prev, [i]: true }));
    setTimeout(() => setCopied(prev => ({ ...prev, [i]: false })), 1500);
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '14px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 24 }}>
        {[['dbname','mydb'],['user','myuser'],['password','secret'],['newpassword','newsecret']].map(([k, ph]) => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 120 }}>
            <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>{k}</label>
            <input
              value={vals[k]}
              placeholder={ph}
              onChange={e => set(k, e.target.value)}
              style={{ fontSize: 13, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        ))}
      </div>

      {sections.map((s, i) => {
        const activeDb = getTab(i);
        const code = sub(s.variants[activeDb], vals);
        return (
          <div key={i} style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 10 }}>{s.title}</h2>
            <div style={{ display: 'flex', gap: 0, border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', width: 'fit-content', marginBottom: 8 }}>
              {Object.keys(s.variants).map(db => (
                <button
                  key={db}
                  onClick={() => setActiveTabs(prev => ({ ...prev, [i]: db }))}
                  style={{
                    fontSize: 12, padding: '5px 12px',
                    background: activeDb === db ? 'var(--accent)' : 'var(--card)',
                    color: activeDb === db ? 'var(--accent-foreground)' : 'var(--muted-foreground)',
                    border: 'none', borderRight: '1px solid var(--border)', cursor: 'pointer', fontWeight: activeDb === db ? 600 : 400
                  }}
                >
                  {db}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: '12px 14px' }}>
              <pre style={{ margin: 0, fontFamily: 'var(--font-mono, monospace)', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--foreground)' }}>{code}</pre>
              <button
                onClick={() => copy(i, code)}
                style={{ position: 'absolute', top: 8, right: 8, fontSize: 11, padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--card)', cursor: 'pointer', color: 'var(--muted-foreground)' }}
              >
                {copied[i] ? 'copied!' : 'copy'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}