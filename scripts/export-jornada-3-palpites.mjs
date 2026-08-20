import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const roundNumber = 3;
const outputPath = path.resolve("/home/ubuntu/liga-prognosticos-backups/JORNADA_3_PALPITES.md");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não está disponível.");
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const [rows] = await connection.execute(
    `SELECT
      r.roundNumber AS jornada,
      u.name AS apostador,
      m.matchOrder AS ordem_jogo,
      m.homeTeam AS equipa_casa,
      m.awayTeam AS equipa_fora,
      m.isBackup AS jogo_suplente,
      p.prediction AS palpite
    FROM predictions p
    INNER JOIN matches m ON m.id = p.matchId
    INNER JOIN users u ON u.id = p.userId
    INNER JOIN rounds r ON r.id = m.roundId
    WHERE r.roundNumber = ?
    ORDER BY m.matchOrder ASC, u.name ASC`,
    [roundNumber],
  );

  const matches = new Map();
  const participants = new Map();

  for (const row of rows) {
    if (!matches.has(row.ordem_jogo)) {
      matches.set(row.ordem_jogo, {
        order: Number(row.ordem_jogo),
        label: `${row.equipa_casa} vs ${row.equipa_fora}${Number(row.jogo_suplente) ? " (suplente)" : ""}`,
      });
    }
    if (!participants.has(row.apostador)) participants.set(row.apostador, new Map());
    participants.get(row.apostador).set(Number(row.ordem_jogo), row.palpite);
  }

  const orderedMatches = [...matches.values()].sort((a, b) => a.order - b.order);
  const header = ["Apostador", ...orderedMatches.map(match => `J${match.order}`), "Registados"];
  const separator = header.map(() => "---");
  const tableRows = [...participants.entries()]
    .sort(([first], [second]) => first.localeCompare(second, "pt-PT"))
    .map(([name, predictions]) => {
      const registered = orderedMatches.filter(match => predictions.has(match.order)).length;
      return [name, ...orderedMatches.map(match => predictions.get(match.order) ?? "—"), `${registered}/${orderedMatches.length}`];
    });

  const markdown = [
    "# Jornada 3 — Palpites registados",
    "",
    `Exportado da base de dados em ${new Date().toLocaleString("pt-PT", { dateStyle: "full", timeStyle: "short" })}.`,
    "",
    "## Jogos",
    "",
    ...orderedMatches.map(match => `- **J${match.order}:** ${match.label}`),
    "",
    `## Palpites (${participants.size} apostadores com pelo menos um palpite)`,
    "",
    `| ${header.join(" | ")} |`,
    `| ${separator.join(" | ")} |`,
    ...tableRows.map(row => `| ${row.join(" | ")} |`),
    "",
    "> J7 é o jogo suplente. Um traço (—) significa que não existe palpite registado para esse jogo.",
    "",
  ].join("\n");

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, markdown, "utf8");
  console.log(JSON.stringify({ outputPath, players: participants.size, matches: orderedMatches.length, predictions: rows.length }));
} finally {
  await connection.end();
}
