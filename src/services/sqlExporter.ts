import { CharacterSheet, Campaign, SessionLog, HomebrewItem } from '../types/dnd';

/**
 * Generates the complete MySQL SQL schema and data export script.
 */
export function generateMySQLDump(
  characters: CharacterSheet[],
  campaigns: Campaign[],
  homebrews: HomebrewItem[]
): string {
  const now = new Date().toISOString();

  let sql = `-- ========================================================
-- D&D 5e Fichas & Campanhas - Exportação do Banco MySQL
-- Gerado em: ${now}
-- Compatível com MySQL 5.7+ / MySQL 8.0+ / MariaDB
-- ========================================================

CREATE DATABASE IF NOT EXISTS \`dnd5e_rpg\` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE \`dnd5e_rpg\`;

-- --------------------------------------------------------
-- Tabela: campanhas
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`campaigns\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`code\` VARCHAR(16) NOT NULL UNIQUE,
  \`name\` VARCHAR(255) NOT NULL,
  \`description\` TEXT,
  \`dm_name\` VARCHAR(100) NOT NULL,
  \`dm_user_id\` VARCHAR(128) NULL,
  \`setting\` VARCHAR(100) DEFAULT 'Reinos Esquecidos',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_code\` (\`code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabela: personagens (fichas D&D 5e)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`characters\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`campaign_id\` VARCHAR(64) NULL,
  \`player_name\` VARCHAR(100) NOT NULL,
  \`character_name\` VARCHAR(100) NOT NULL,
  \`class_and_level\` VARCHAR(100) NOT NULL,
  \`level\` INT NOT NULL DEFAULT 1,
  \`race\` VARCHAR(100) NOT NULL,
  \`background\` VARCHAR(100) DEFAULT '',
  \`alignment\` VARCHAR(50) DEFAULT 'Neutro',
  \`experience_points\` INT DEFAULT 0,
  
  -- Atributos Principais
  \`str_score\` INT NOT NULL DEFAULT 10,
  \`dex_score\` INT NOT NULL DEFAULT 10,
  \`con_score\` INT NOT NULL DEFAULT 10,
  \`int_score\` INT NOT NULL DEFAULT 10,
  \`wis_score\` INT NOT NULL DEFAULT 10,
  \`cha_score\` INT NOT NULL DEFAULT 10,
  
  -- Salvaguardas (Proficiências)
  \`save_str_prof\` TINYINT(1) DEFAULT 0,
  \`save_dex_prof\` TINYINT(1) DEFAULT 0,
  \`save_con_prof\` TINYINT(1) DEFAULT 0,
  \`save_int_prof\` TINYINT(1) DEFAULT 0,
  \`save_wis_prof\` TINYINT(1) DEFAULT 0,
  \`save_cha_prof\` TINYINT(1) DEFAULT 0,
  
  -- Combate e Vida
  \`armor_class\` INT NOT NULL DEFAULT 10,
  \`armor_class_type\` VARCHAR(100) DEFAULT 'Sem Armadura',
  \`initiative\` INT NOT NULL DEFAULT 0,
  \`speed\` INT NOT NULL DEFAULT 9,
  \`max_hp\` INT NOT NULL DEFAULT 10,
  \`current_hp\` INT NOT NULL DEFAULT 10,
  \`temp_hp\` INT NOT NULL DEFAULT 0,
  \`hit_dice_total\` VARCHAR(30) DEFAULT '1d8',
  \`hit_dice_current\` VARCHAR(30) DEFAULT '1d8',
  \`death_successes\` INT DEFAULT 0,
  \`death_failures\` INT DEFAULT 0,
  \`passive_perception\` INT NOT NULL DEFAULT 10,
  
  -- Dados completos serializados (JSON) para perícias, magias, ataques e homebrew
  \`skills_json\` JSON NULL,
  \`attacks_json\` JSON NULL,
  \`spells_json\` JSON NULL,
  \`spell_slots_json\` JSON NULL,
  \`coins_json\` JSON NULL,
  \`personality_traits\` TEXT,
  \`ideals\` TEXT,
  \`bonds\` TEXT,
  \`flaws\` TEXT,
  \`features_and_traits\` TEXT,
  \`proficiencies_and_languages\` TEXT,
  \`equipment\` TEXT,
  \`dm_notes\` TEXT,
  \`homebrews_json\` JSON NULL,
  
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_campaign\` (\`campaign_id\`),
  CONSTRAINT \`fk_char_campaign\` FOREIGN KEY (\`campaign_id\`) REFERENCES \`campaigns\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabela: logs de sessões e eventos
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`session_logs\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`campaign_id\` VARCHAR(64) NOT NULL,
  \`session_number\` INT NOT NULL,
  \`real_date\` DATE NOT NULL,
  \`in_game_date\` VARCHAR(100) NULL,
  \`title\` VARCHAR(255) NOT NULL,
  \`location\` VARCHAR(150) NULL,
  \`summary\` TEXT NOT NULL,
  \`events_json\` JSON NULL,
  \`xp_awarded\` INT DEFAULT 0,
  \`loot_awarded\` TEXT,
  \`author_name\` VARCHAR(100) NOT NULL,
  \`author_role\` ENUM('dm', 'player') NOT NULL DEFAULT 'dm',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_session_camp\` (\`campaign_id\`),
  CONSTRAINT \`fk_session_campaign\` FOREIGN KEY (\`campaign_id\`) REFERENCES \`campaigns\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabela: repositório de homebrews
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`homebrews\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`category\` VARCHAR(50) NOT NULL,
  \`description\` TEXT NOT NULL,
  \`mechanics\` TEXT NULL,
  \`author\` VARCHAR(100) DEFAULT 'Mestre',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
\n`;

  // Insert campaigns
  if (campaigns.length > 0) {
    sql += `-- --------------------------------------------------------\n-- Dados das Campanhas\n-- --------------------------------------------------------\n`;
    for (const c of campaigns) {
      const escape = (s?: string) => (s ? `'${s.replace(/'/g, "\\'")}'` : 'NULL');
      sql += `INSERT INTO \`campaigns\` (\`id\`, \`code\`, \`name\`, \`description\`, \`dm_name\`, \`dm_user_id\`, \`setting\`, \`created_at\`) VALUES (\n  ${escape(c.id)}, ${escape(c.code)}, ${escape(c.name)}, ${escape(c.description)}, ${escape(c.dmName)}, ${escape(c.dmUserId)}, ${escape(c.setting)}, NOW()\n) ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`description\` = VALUES(\`description\`);\n\n`;
    }
  }

  // Insert characters
  if (characters.length > 0) {
    sql += `-- --------------------------------------------------------\n-- Dados dos Personagens / Fichas\n-- --------------------------------------------------------\n`;
    for (const ch of characters) {
      const escape = (s?: string) => (s ? `'${s.replace(/'/g, "\\'")}'` : "''");
      const escapeNull = (s?: string) => (s ? `'${s.replace(/'/g, "\\'")}'` : 'NULL');
      const escapeJson = (obj: any) => `'${JSON.stringify(obj).replace(/'/g, "\\'")}'`;

      sql += `INSERT INTO \`characters\` (\n  \`id\`, \`campaign_id\`, \`player_name\`, \`character_name\`, \`class_and_level\`, \`level\`, \`race\`, \`background\`, \`alignment\`, \`experience_points\`,\n  \`str_score\`, \`dex_score\`, \`con_score\`, \`int_score\`, \`wis_score\`, \`cha_score\`,\n  \`save_str_prof\`, \`save_dex_prof\`, \`save_con_prof\`, \`save_int_prof\`, \`save_wis_prof\`, \`save_cha_prof\`,\n  \`armor_class\`, \`armor_class_type\`, \`initiative\`, \`speed\`, \`max_hp\`, \`current_hp\`, \`temp_hp\`,\n  \`skills_json\`, \`attacks_json\`, \`spells_json\`, \`spell_slots_json\`, \`coins_json\`,\n  \`features_and_traits\`, \`equipment\`, \`dm_notes\`, \`homebrews_json\`\n) VALUES (\n  ${escape(ch.id)}, ${escapeNull(ch.campaignId)}, ${escape(ch.playerName)}, ${escape(ch.characterName)}, ${escape(ch.classAndLevel)}, ${ch.level}, ${escape(ch.race)}, ${escape(ch.background)}, ${escape(ch.alignment)}, ${ch.experiencePoints},\n  ${ch.abilities.str.score}, ${ch.abilities.dex.score}, ${ch.abilities.con.score}, ${ch.abilities.int.score}, ${ch.abilities.wis.score}, ${ch.abilities.cha.score},\n  ${ch.abilities.str.saveProficient ? 1 : 0}, ${ch.abilities.dex.saveProficient ? 1 : 0}, ${ch.abilities.con.saveProficient ? 1 : 0}, ${ch.abilities.int.saveProficient ? 1 : 0}, ${ch.abilities.wis.saveProficient ? 1 : 0}, ${ch.abilities.cha.saveProficient ? 1 : 0},\n  ${ch.armorClass}, ${escape(ch.armorClassType)}, ${ch.initiative}, ${ch.speed}, ${ch.maxHp}, ${ch.currentHp}, ${ch.tempHp},\n  ${escapeJson(ch.skills)}, ${escapeJson(ch.attacks)}, ${escapeJson(ch.spells)}, ${escapeJson(ch.spellSlots)}, ${escapeJson(ch.coins)},\n  ${escape(ch.featuresAndTraits)}, ${escape(ch.equipment)}, ${escapeNull(ch.dmNotes)}, ${escapeJson(ch.homebrews)}\n) ON DUPLICATE KEY UPDATE \`character_name\` = VALUES(\`character_name\`), \`current_hp\` = VALUES(\`current_hp\`), \`max_hp\` = VALUES(\`max_hp\`);\n\n`;
    }
  }

  return sql;
}

/**
 * Returns a complete PHP API script file structure.
 */
export function getPhpBackendFiles(): { name: string; content: string }[] {
  return [
    {
      name: 'config.php',
      content: `<?php
/**
 * Configuração de Banco de Dados MySQL para D&D 5e
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$db_host = getenv('DB_HOST') ?: 'localhost';
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASS') ?: '';
$db_name = getenv('DB_NAME') ?: 'dnd5e_rpg';

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Falha na conexão com o banco MySQL: ' . $e->getMessage()]);
    exit;
}
`,
    },
    {
      name: 'api/characters.php',
      content: `<?php
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM characters WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $char = $stmt->fetch();
            echo json_encode($char ?: ['error' => 'Ficha não encontrada']);
        } elseif (isset($_GET['campaign_id'])) {
            $stmt = $pdo->prepare("SELECT * FROM characters WHERE campaign_id = ?");
            $stmt->execute([$_GET['campaign_id']]);
            echo json_encode($stmt->fetchAll());
        } else {
            $stmt = $pdo->query("SELECT * FROM characters ORDER BY updated_at DESC");
            echo json_encode($stmt->fetchAll());
        }
        break;

    case 'POST':
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Dados inválidos']);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO characters (
            id, campaign_id, player_name, character_name, class_and_level, level, race, background, alignment,
            str_score, dex_score, con_score, int_score, wis_score, cha_score,
            armor_class, initiative, speed, max_hp, current_hp, temp_hp,
            skills_json, attacks_json, spells_json, spell_slots_json, coins_json,
            features_and_traits, equipment, dm_notes, homebrews_json
        ) VALUES (
            :id, :campaign_id, :player_name, :character_name, :class_and_level, :level, :race, :background, :alignment,
            :str_score, :dex_score, :con_score, :int_score, :wis_score, :cha_score,
            :armor_class, :initiative, :speed, :max_hp, :current_hp, :temp_hp,
            :skills_json, :attacks_json, :spells_json, :spell_slots_json, :coins_json,
            :features_and_traits, :equipment, :dm_notes, :homebrews_json
        ) ON DUPLICATE KEY UPDATE
            campaign_id = VALUES(campaign_id),
            player_name = VALUES(player_name),
            character_name = VALUES(character_name),
            class_and_level = VALUES(class_and_level),
            level = VALUES(level),
            race = VALUES(race),
            str_score = VALUES(str_score),
            dex_score = VALUES(dex_score),
            con_score = VALUES(con_score),
            int_score = VALUES(int_score),
            wis_score = VALUES(wis_score),
            cha_score = VALUES(cha_score),
            armor_class = VALUES(armor_class),
            max_hp = VALUES(max_hp),
            current_hp = VALUES(current_hp),
            temp_hp = VALUES(temp_hp),
            skills_json = VALUES(skills_json),
            attacks_json = VALUES(attacks_json),
            spells_json = VALUES(spells_json),
            spell_slots_json = VALUES(spell_slots_json),
            coins_json = VALUES(coins_json),
            dm_notes = VALUES(dm_notes),
            homebrews_json = VALUES(homebrews_json)");

        $stmt->execute([
            ':id' => $data['id'],
            ':campaign_id' => $data['campaignId'] ?? null,
            ':player_name' => $data['playerName'] ?? 'Jogador',
            ':character_name' => $data['characterName'] ?? 'Personagem',
            ':class_and_level' => $data['classAndLevel'] ?? 'Guerreiro 1',
            ':level' => (int)($data['level'] ?? 1),
            ':race' => $data['race'] ?? 'Humano',
            ':background' => $data['background'] ?? '',
            ':alignment' => $data['alignment'] ?? 'Neutro',
            ':str_score' => (int)($data['abilities']['str']['score'] ?? 10),
            ':dex_score' => (int)($data['abilities']['dex']['score'] ?? 10),
            ':con_score' => (int)($data['abilities']['con']['score'] ?? 10),
            ':int_score' => (int)($data['abilities']['int']['score'] ?? 10),
            ':wis_score' => (int)($data['abilities']['wis']['score'] ?? 10),
            ':cha_score' => (int)($data['abilities']['cha']['score'] ?? 10),
            ':armor_class' => (int)($data['armorClass'] ?? 10),
            ':initiative' => (int)($data['initiative'] ?? 0),
            ':speed' => (int)($data['speed'] ?? 9),
            ':max_hp' => (int)($data['maxHp'] ?? 10),
            ':current_hp' => (int)($data['currentHp'] ?? 10),
            ':temp_hp' => (int)($data['tempHp'] ?? 0),
            ':skills_json' => json_encode($data['skills'] ?? []),
            ':attacks_json' => json_encode($data['attacks'] ?? []),
            ':spells_json' => json_encode($data['spells'] ?? []),
            ':spell_slots_json' => json_encode($data['spellSlots'] ?? []),
            ':coins_json' => json_encode($data['coins'] ?? []),
            ':features_and_traits' => $data['featuresAndTraits'] ?? '',
            ':equipment' => $data['equipment'] ?? '',
            ':dm_notes' => $data['dmNotes'] ?? '',
            ':homebrews_json' => json_encode($data['homebrews'] ?? []),
        ]);

        echo json_encode(['success' => true, 'id' => $data['id']]);
        break;

    case 'DELETE':
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("DELETE FROM characters WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            echo json_encode(['success' => true]);
        }
        break;
}
`,
    },
    {
      name: 'api/campaigns.php',
      content: `<?php
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['code'])) {
            $code = strtoupper(str_replace(['-', ' '], '', $_GET['code']));
            // Format to XXXX-XXXX
            if (strlen($code) === 8) {
                $formattedCode = substr($code, 0, 4) . '-' . substr($code, 4);
                $stmt = $pdo->prepare("SELECT * FROM campaigns WHERE code = ? OR code = ?");
                $stmt->execute([$formattedCode, $code]);
            } else {
                $stmt = $pdo->prepare("SELECT * FROM campaigns WHERE code = ?");
                $stmt->execute([$_GET['code']]);
            }
            $camp = $stmt->fetch();
            echo json_encode($camp ?: ['error' => 'Campanha com código único de 8 dígitos não encontrada']);
        } else {
            $stmt = $pdo->query("SELECT * FROM campaigns ORDER BY created_at DESC");
            echo json_encode($stmt->fetchAll());
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['name']) || !isset($data['dmName'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Nome da campanha e do Mestre são obrigatórios']);
            exit;
        }

        // Gera código de 8 caracteres alfanuméricos
        $chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        $randStr = '';
        for ($i = 0; $i < 8; $i++) {
            $randStr .= $chars[rand(0, strlen($chars) - 1)];
        }
        $code = substr($randStr, 0, 4) . '-' . substr($randStr, 4);
        $id = 'camp_' . uniqid();

        $stmt = $pdo->prepare("INSERT INTO campaigns (id, code, name, description, dm_name, dm_user_id, setting) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id,
            $code,
            $data['name'],
            $data['description'] ?? '',
            $data['dmName'],
            $data['dmUserId'] ?? null,
            $data['setting'] ?? 'D&D 5e'
        ]);

        echo json_encode([
            'success' => true,
            'campaign' => [
                'id' => $id,
                'code' => $code,
                'name' => $data['name'],
                'dmName' => $data['dmName']
            ]
        ]);
        break;
}
`,
    },
    {
      name: 'api/sessions.php',
      content: `<?php
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['campaign_id'])) {
            $stmt = $pdo->prepare("SELECT * FROM session_logs WHERE campaign_id = ? ORDER BY session_number DESC, created_at DESC");
            $stmt->execute([$_GET['campaign_id']]);
            echo json_encode($stmt->fetchAll());
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['campaignId']) || !isset($data['title'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Campos obrigatórios ausentes']);
            exit;
        }

        $id = $data['id'] ?? ('sess_' . uniqid());
        $stmt = $pdo->prepare("INSERT INTO session_logs (
            id, campaign_id, session_number, real_date, in_game_date, title, location, summary, events_json, xp_awarded, loot_awarded, author_name, author_role
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $stmt->execute([
            $id,
            $data['campaignId'],
            (int)($data['sessionNumber'] ?? 1),
            $data['realDate'] ?? date('Y-m-d'),
            $data['inGameDate'] ?? '',
            $data['title'],
            $data['location'] ?? '',
            $data['summary'] ?? '',
            json_encode($data['events'] ?? []),
            (int)($data['xpAwarded'] ?? 0),
            $data['lootAwarded'] ?? '',
            $data['authorName'] ?? 'Mestre',
            $data['authorRole'] ?? 'dm',
        ]);

        echo json_encode(['success' => true, 'id' => $id]);
        break;
}
`,
    },
  ];
}
