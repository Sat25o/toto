import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const applyChanges = process.argv.includes("--apply");
const outputDirectory = "/home/ubuntu/liga-prognosticos-backups/jornada-3-reconciliacao";

const normalizeName = value => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]/g, "");

const sourcePredictions = [
  ["Alexandre Santos", ["1", "1", "1", "2", "1", "1", "2"]],
  ["André Filipe costa Serafim", ["1", "1", "1", "2", "1", "1", "1"]],
  ["Bruno Martins", ["1", "1", "1", "X", "1", "1", "X"]],
  ["Bruno Miguel Fernandes da cruz", ["1", "X", "1", "X", "1", "1", "X"]],
  ["Carlos Batista", [null, null, null, null, null, null, null]],
  ["Carlos Livramento", ["1", "1", "1", "1", "1", "1", "1"]],
  ["David Chagas", [null, null, null, null, null, null, null]],
  ["David Gago", [null, null, null, null, null, null, null]],
  ["Diogo Miguel dos Santos Fernandes", [null, null, null, null, null, null, null]],
  ["Diogo Romão", ["1", "1", "1", "1", "1", "1", "2"]],
  ["Dudu", [null, null, null, null, null, null, null]],
  ["Eugénio dos Santos Duarte", ["1", "X", "1", "1", "1", "2", "2"]],
  ["Fábio Alexandre Ragrão Parra dos Santos", ["1", "1", "1", "1", "1", "1", "2"]],
  ["Fábio Pereira", ["1", "1", "X", "X", "1", "1", "2"]],
  ["Gustavo Augusto Roma Batista", [null, null, null, null, null, null, null]],
  ["Henrique", ["1", "X", "1", "2", "1", "1", "2"]],
  ["Jorge Bernardo", [null, null, null, null, null, null, null]],
  ["José Joaquim Mendes Palma Grosso", [null, null, null, null, null, null, null]],
  ["Luís Chagas", ["1", "1", "1", "2", "1", "1", "1"]],
  ["Marco Mendonça", [null, null, null, null, null, null, null]],
  ["Nilton Borges", ["1", "1", "1", "1", "1", "1", "X"]],
  ["Norberto Lourinho", ["1", "1", "2", "1", "1", "1", "2"]],
  ["Nuno Costa", ["1", "1", "1", "1", "1", "1", "2"]],
  ["Nuno Valente", ["1", "1", "2", "1", "1", "X", "X"]],
  ["Paulo Costa", [null, null, null, null, null, null, null]],
  ["Ricardo Jorge dos Santos Sousa", ["1", "1", "X", "1", "1", "1", "2"]],
  ["Ricardo Nascimento", ["1", "1", "1", "1", "1", "1", "2"]],
  ["Ricardo Pereira", ["1", "1", "X", "1", "X", "1", "X"]],
  ["Rúben", [null, null, null, null, null, null, null]],
  ["Rúben Moreira", ["1", "X", "1", "1", "1", "1", "X"]],
  ["Rui Jorge Sousa Silva", [null, null, null, null, null, null, null]],
  ["Tiago Mestre", ["1", "1", "1", "X", "1", "X", "X"]],
  ["António Gouveia", [null, null, null, null, null, null, null]],
  ["Vitinha", ["X", "2", "2", "1", "1", "1", "2"]],
];

const userToTableName = new Map([
  [normalizeName("Carlos Baptista"), normalizeName("Carlos Batista")],
  [normalizeName("David costa"), normalizeName("David Gago")],
  [normalizeName("Fábio Alexandre Bagarrão Parra dos Santos"), normalizeName("Fábio Alexandre Ragrão Parra dos Santos")],
  [normalizeName("Vitinha silva"), normalizeName("Vitinha")],
]);

function toMarkdownTable(rows) {
  return [
    "| Participante | Jogo 1 | Jogo 2 | Jogo 3 | Jogo 4 | Jogo 5 | Jogo 6 | Jogo 7 |",
    "|---|---:|---:|---:|---:|---:|---:|---:|",
    ...rows.map(row => `| ${row.name} | ${row.predictions.map(value => value ?? "—").join(" | ")} |`),
  ].join("\n");
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não está disponível.");
  await fs.mkdir(outputDirectory, { recursive: true });
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    const [roundRows] = await connection.query("SELECT id, roundNumber FROM rounds WHERE roundNumber = 3 LIMIT 1");
    const round = roundRows[0];
    if (!round) throw new Error("A Jornada 3 não foi encontrada.");

    const [matches] = await connection.query("SELECT id, matchOrder, homeTeam, awayTeam FROM matches WHERE roundId = ? ORDER BY matchOrder", [round.id]);
    if (matches.length !== 7) throw new Error(`A Jornada 3 tem ${matches.length} jogos; eram esperados 7.`);

    const [users] = await connection.query("SELECT id, name FROM users WHERE isActive = TRUE ORDER BY name");
    const sourceByName = new Map(sourcePredictions.map(([name, values]) => [normalizeName(name), { name, values }]));
    const sourceForUser = user => sourceByName.get(userToTableName.get(normalizeName(user.name)) ?? normalizeName(user.name));
    const matchedSourceNames = new Set(users.map(sourceForUser).filter(Boolean).map(source => normalizeName(source.name)));
    const missingUsers = sourcePredictions.map(([name]) => name).filter(name => !matchedSourceNames.has(normalizeName(name)));
    const unexpectedUsers = users.filter(user => !sourceForUser(user)).map(user => user.name);
    if (missingUsers.length || unexpectedUsers.length) {
      throw new Error(`A tabela não coincide com os utilizadores ativos. Em falta na app: ${missingUsers.join(", ") || "nenhum"}. Sem linha na tabela: ${unexpectedUsers.join(", ") || "nenhum"}.`);
    }

    const [currentRows] = await connection.query(
      "SELECT p.userId, p.matchId, p.prediction FROM predictions p INNER JOIN matches m ON m.id = p.matchId WHERE m.roundId = ?",
      [round.id],
    );
    const currentByKey = new Map(currentRows.map(row => [`${row.userId}:${row.matchId}`, row.prediction]));
    await fs.writeFile(path.join(outputDirectory, "antes-da-reconciliacao.json"), JSON.stringify(currentRows, null, 2));

    const changes = [];
    for (const user of users) {
      const source = sourceForUser(user);
      for (let index = 0; index < matches.length; index += 1) {
        const match = matches[index];
        const desired = source.values[index];
        if (!desired) continue;
        const current = currentByKey.get(`${user.id}:${match.id}`) ?? null;
        if (current === desired) continue;
        changes.push({ userId: user.id, name: user.name, matchId: match.id, matchOrder: match.matchOrder, current, desired });
      }
    }

    if (applyChanges) {
      await connection.beginTransaction();
      try {
        for (const change of changes) {
          if (change.current) {
            await connection.query("UPDATE predictions SET prediction = ?, isCorrect = 'pending', updatedAt = NOW() WHERE userId = ? AND matchId = ?", [change.desired, change.userId, change.matchId]);
          } else {
            await connection.query("INSERT INTO predictions (matchId, userId, prediction, isCorrect, createdAt, updatedAt) VALUES (?, ?, ?, 'pending', NOW(), NOW())", [change.matchId, change.userId, change.desired]);
          }
        }
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }

    const [afterRows] = await connection.query(
      "SELECT u.name, m.matchOrder, p.prediction FROM users u CROSS JOIN matches m LEFT JOIN predictions p ON p.userId = u.id AND p.matchId = m.id WHERE u.isActive = TRUE AND m.roundId = ? ORDER BY u.name, m.matchOrder",
      [round.id],
    );
    const byUser = new Map(users.map(user => [user.name, Array(7).fill(null)]));
    for (const row of afterRows) byUser.get(row.name)[Number(row.matchOrder) - 1] = row.prediction ?? null;
    const summaryRows = users.map(user => ({ name: user.name, predictions: byUser.get(user.name) }));
    const additions = changes.filter(change => change.current === null).length;
    const corrections = changes.filter(change => change.current !== null).length;
    const report = [
      "# Jornada 3 — Reconciliação de Palpites",
      "",
      `Modo: **${applyChanges ? "aplicado" : "simulação"}**.`,
      `Alterações previstas/aplicadas: **${changes.length}** (${additions} novos palpites e ${corrections} correções).`,
      "",
      "## Jogos",
      "",
      ...matches.map(match => `- Jogo ${match.matchOrder}: ${match.homeTeam} vs ${match.awayTeam}`),
      "",
      "## Palpites após reconciliação",
      "",
      toMarkdownTable(summaryRows),
      "",
      "## Alterações",
      "",
      changes.length ? "| Participante | Jogo | Registado antes | Aplicado |\n|---|---:|---:|---:|\n" + changes.map(change => `| ${change.name} | ${change.matchOrder} | ${change.current ?? "—"} | ${change.desired} |`).join("\n") : "Não foram necessárias alterações.",
      "",
      "> Células vazias na tabela fornecida não removeram palpites já existentes na aplicação; apenas foram adicionados ou corrigidos os valores explicitamente indicados.",
    ].join("\n");
    await fs.writeFile(path.join(outputDirectory, "JORNADA_3_PALPITES_RECONCILIADOS.md"), report);
    console.log(JSON.stringify({ applied: applyChanges, changes: changes.length, additions, corrections, reportPath: path.join(outputDirectory, "JORNADA_3_PALPITES_RECONCILIADOS.md") }));
  } finally {
    await connection.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error.message);
    process.exit(1);
  });
