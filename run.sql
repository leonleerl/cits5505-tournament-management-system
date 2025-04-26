
DROP TABLE IF EXISTS Score;
DROP TABLE IF EXISTS Match;
DROP TABLE IF EXISTS Player;
DROP TABLE IF EXISTS Stadium;
DROP TABLE IF EXISTS Season;
DROP TABLE IF EXISTS Team;
DROP TABLE IF EXISTS User;

CREATE TABLE User (
    UserId INTEGER PRIMARY KEY AUTOINCREMENT,
    Username TEXT NOT NULL UNIQUE,
    Password TEXT NOT NULL,
    Email TEXT NOT NULL UNIQUE,
    Avatar TEXT,
    IsAdmin BOOLEAN NOT NULL DEFAULT 0
);

CREATE TABLE Team (
    TeamId INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL UNIQUE,
    Description TEXT,
    CreatedYear INTEGER
);

CREATE TABLE Player (
    PlayerId INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Height REAL,
    Weight REAL,
    TeamId INTEGER,
    FOREIGN KEY (TeamId) REFERENCES Team(TeamId)
);

CREATE TABLE Season (
    SeasonId INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Year INTEGER NOT NULL,
    Status INTEGER NOT NULL CHECK (Status IN (0, 1, 2))
);

CREATE TABLE Stadium (
    StadiumId INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Location TEXT NOT NULL
);

CREATE TABLE Match (
    MatchId INTEGER PRIMARY KEY AUTOINCREMENT,
    TeamId1 INTEGER NOT NULL,
    TeamId2 INTEGER NOT NULL,
    Status INTEGER NOT NULL CHECK (Status IN (0, 1, 2)),
    MatchDate DATE NOT NULL,

    SeasonId INTEGER NOT NULL,
    StadiumId INTEGER NOT NULL,
    CreatorId INTEGER NOT NULL,

    FOREIGN KEY (TeamId1) REFERENCES Team(TeamId),
    FOREIGN KEY (TeamId2) REFERENCES Team(TeamId),
    FOREIGN KEY (SeasonId) REFERENCES Season(SeasonId),
    FOREIGN KEY (StadiumId) REFERENCES Stadium(StadiumId),
    FOREIGN KEY (CreatorId) REFERENCES User(UserId)
);

CREATE TABLE Score (
    ScoreId INTEGER PRIMARY KEY AUTOINCREMENT,
    MatchId INTEGER NOT NULL UNIQUE,
    Team1Score INTEGER NOT NULL,
    Team2Score INTEGER NOT NULL,

    FOREIGN KEY (MatchId) REFERENCES Match(MatchId)
);

INSERT INTO User (Username, Password, Email, Avatar, IsAdmin) VALUES
('admin', 'hashedpw1', 'admin@example.com', 'avatar_admin.png', 1),
('user1', 'hashedpw2', 'user1@example.com', 'avatar_user1.png', 0),
('user2', 'hashedpw3', 'user2@example.com', 'avatar_user2.png', 0);

INSERT INTO Team (Name, Description, CreatedYear) VALUES
('Thunder', 'A strong team', 2020),
('Blazers', 'Fast and fierce', 2021),
('Falcons', 'Young and bold', 2022);

INSERT INTO Player (Name, Height, Weight, TeamId) VALUES
('Alice', 175.0, 65.0, 1),
('Bob', 180.0, 80.0, 1),
('Charlie', 178.0, 72.0, 2),
('David', 185.0, 90.0, 2),
('Eve', 168.0, 58.0, 3);

INSERT INTO Season (Name, Year, Status) VALUES
('Spring League', 2023, 2),
('Summer Series', 2024, 1);

INSERT INTO Stadium (Name, Location) VALUES
('Main Arena', 'Downtown'),
('West Field', 'Westside'),
('East Court', 'Eastside');

INSERT INTO Match (TeamId1, TeamId2, Status, MatchDate, SeasonId, StadiumId, CreatorId) VALUES
(1, 2, 1, '2023-06-01', 1, 1, 1),
(2, 3, 2, '2024-07-15', 2, 2, 2),
(1, 3, 0, '2024-08-20', 2, 3, 1);

INSERT INTO Score (MatchId, Team1Score, Team2Score) VALUES
(1, 60, 55),
(2, 72, 78);