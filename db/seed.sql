-- Three postcards so the page is not empty on first start.
--
-- MariaDB runs every .sql file in /docker-entrypoint-initdb.d/ ONCE, when it
-- creates the database -- that is, when the postcard-data volume is empty. On
-- every later start the volume already holds data and this file is skipped.
-- To run it again: docker compose down -v, then docker compose up -d.
--
-- The table is the one the API creates at startup (api/src/store.js), so the
-- API's CREATE TABLE IF NOT EXISTS finds it already there and leaves it alone.

CREATE TABLE IF NOT EXISTS postcards (
  id       CHAR(36)     NOT NULL PRIMARY KEY,
  place    VARCHAR(120) NOT NULL,
  message  TEXT         NOT NULL,
  sentAt   DATETIME     NOT NULL
);

INSERT INTO postcards (id, place, message, sentAt) VALUES
  (UUID(), 'Reykjavík', 'Rained sideways for four days. Would return.',              NOW() - INTERVAL 3 HOUR),
  (UUID(), 'Lisbon',    'Ate a custard tart on every tram stop. No regrets.',         NOW() - INTERVAL 2 HOUR),
  (UUID(), 'Banff',     'The lake really is that colour. Nobody believes the photo.', NOW() - INTERVAL 1 HOUR);
