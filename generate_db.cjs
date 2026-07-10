const fs = require('fs');

const firstNames = ['Ahmet', 'Ayşe', 'Mustafa', 'Fatma', 'Mehmet', 'Zeynep', 'Ali', 'Elif', 'Hasan', 'Merve', 'Kaan', 'Ece', 'Burak', 'Cansu', 'Emre', 'Gizem', 'Can', 'Sinem', 'Tuğba', 'Kerem', 'Deniz', 'Barış'];
const lastNames = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Koç', 'Kurt', 'Öztürk', 'Aksoy', 'Polat', 'Güneş', 'Karaca', 'Bulut'];

function getRandomName() {
  const f = firstNames[Math.floor(Math.random() * firstNames.length)];
  const l = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${f} ${l}`;
}

const db = {
  groups: [],
  users: []
};

for (let g = 1; g <= 10; g++) {
  const managerId = `M${g.toString().padStart(2, '0')}`;
  const teamLeaderIds = [
    `TL${g.toString().padStart(2, '0')}01`,
    `TL${g.toString().padStart(2, '0')}02`,
    `TL${g.toString().padStart(2, '0')}03`
  ];
  const developerIds = [];
  for (let d = 1; d <= 10; d++) {
    developerIds.push(`DEV${g.toString().padStart(2, '0')}${d.toString().padStart(2, '0')}`);
  }

  db.groups.push({
    id: g,
    name: `Grup ${g}`,
    managerId,
    teamLeaderIds,
    developerIds
  });

  // Add Manager
  db.users.push({
    id: managerId,
    fullName: `Yönetici ${g} (${getRandomName()})`,
    username: `manager${g}`,
    password: `1234`,
    role: `manager`,
    groupId: g
  });

  // Add Team Leaders
  teamLeaderIds.forEach((tlId, index) => {
    db.users.push({
      id: tlId,
      fullName: `Takım Lideri ${g}-${index+1} (${getRandomName()})`,
      username: `teamlead${g}_${index+1}`,
      password: `1234`,
      role: `teamLeader`,
      groupId: g,
      managerId
    });
  });

  // Add Developers
  developerIds.forEach((devId, index) => {
    let tlIndex = 0;
    if (index >= 3 && index < 6) tlIndex = 1;
    if (index >= 6) tlIndex = 2;

    db.users.push({
      id: devId,
      fullName: `Geliştirici ${g}-${index+1} (${getRandomName()})`,
      username: `developer${g}_${index+1}`,
      password: `1234`,
      role: `developer`,
      groupId: g,
      managerId,
      teamLeaderId: teamLeaderIds[tlIndex]
    });
  });
}

fs.writeFileSync('src/data/taskverse-db-turkce-isimli.json', JSON.stringify(db, null, 2));
