<?php
declare(strict_types=1);
namespace Phase2Fixture;

/** Test-only SQL adapter. Production source is loaded under a test namespace.
 * SQLite files live only in a freshly created temporary test directory.
 * No application database, credentials or schema is accessed.
 */
final class SqliteMysqli
{
    public \PDO $pdo;
    public int $insert_id = 0;
    public string $error = '';
    private array $locks = [];
    public function __construct(public string $file) {
        $this->pdo = new \PDO('sqlite:' . $file, null, null, [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]);
        $this->pdo->exec('PRAGMA foreign_keys=ON');
        $this->pdo->exec('PRAGMA busy_timeout=2000');
        $this->pdo->sqliteCreateFunction('NOW', static fn(...$args) => date('Y-m-d H:i:s'), -1);
    }
    public function translate(string $sql): string {
        $sql = preg_replace('/\s+FOR UPDATE\s*/i', ' ', $sql);
        $sql = str_ireplace('INSERT IGNORE', 'INSERT OR IGNORE', $sql);
        return str_ireplace('ON DUPLICATE KEY UPDATE deleted = 0',
            'ON CONFLICT(fragment_source_type, knowledge_fragment_id, knowledge_group_id) DO UPDATE SET deleted = 0', $sql);
    }
    public function prepare(string $sql): Statement { return new Statement($this, $sql); }
    public function query(string $sql): Result { $stmt = $this->prepare($sql); $stmt->execute(); return $stmt->get_result(); }
    public function begin_transaction(): bool { return $this->pdo->beginTransaction(); }
    public function commit(): bool { return $this->pdo->commit(); }
    public function rollback(): bool { return $this->pdo->inTransaction() ? $this->pdo->rollBack() : true; }
    public function set_charset(string $charset): bool { return true; }
    public function ping(): bool { return true; }
    public function lock(string $name): int {
        $handle = fopen(dirname($this->file) . '/lock-' . hash('sha256', $name), 'c');
        if (!flock($handle, LOCK_EX | LOCK_NB)) { fclose($handle); return 0; }
        $this->locks[$name] = $handle; return 1;
    }
    public function unlock(string $name): int {
        if (!isset($this->locks[$name])) return 0;
        flock($this->locks[$name], LOCK_UN); fclose($this->locks[$name]); unset($this->locks[$name]); return 1;
    }
}

final class Statement
{
    private array $values = [];
    private array $rows = [];
    private array $outputs = [];
    private int $position = 0;
    public int $affected_rows = 0;
    public string $error = '';
    public function __construct(private SqliteMysqli $db, private string $sql) {}
    public function bind_param(string $types, &...$values): bool { $this->values = &$values; return true; }
    public function bind_result(&...$values): bool { $this->outputs = &$values; return true; }
    public function fetch(): ?bool {
        $row = $this->rows[$this->position++] ?? null;
        if ($row === null) return null;
        foreach (array_values($row) as $i => $value) $this->outputs[$i] = $value;
        return true;
    }
    public function execute(): bool {
        if (stripos($this->sql, 'SELECT DATABASE()') === 0) $this->rows = [['database' => basename($this->db->file)]];
        elseif (stripos($this->sql, 'SELECT GET_LOCK(') === 0) $this->rows = [['acquired' => $this->db->lock($this->values[0])]];
        elseif (stripos($this->sql, 'SELECT RELEASE_LOCK(') === 0) $this->rows = [['released' => $this->db->unlock($this->values[0])]];
        else {
            $stmt = $this->db->pdo->prepare($this->db->translate($this->sql));
            foreach ($this->values as $i => $value) $stmt->bindValue($i + 1, $value,
                $value === null ? \PDO::PARAM_NULL : (is_int($value) ? \PDO::PARAM_INT : \PDO::PARAM_STR));
            $stmt->execute();
            $this->affected_rows = $stmt->rowCount();
            $this->db->insert_id = (int)$this->db->pdo->lastInsertId();
            $this->rows = $stmt->columnCount() ? $stmt->fetchAll(\PDO::FETCH_ASSOC) : [];
        }
        return true;
    }
    public function get_result(): Result { return new Result($this->rows); }
    public function close(): void {}
}

final class Result
{
    private int $index = 0;
    public function __construct(private array $rows) {}
    public function fetch_assoc(): ?array { return $this->rows[$this->index++] ?? null; }
    public function fetch_row(): ?array { $row = $this->fetch_assoc(); return $row === null ? null : array_values($row); }
    public function fetch_all(int $mode = 1): array { return $this->rows; }
    public function free(): void {}
}
