
# Create a database the run source /path/to/survey.sql

CREATE TABLE answers (
id INT AUTO_INCREMENT,
survey_name VARCHAR(20),
question VARCHAR(255),
answer VARCHAR(255),
participant_id INT
)

CREATE TABLE participant (
id INT AUTO_INCREMENT,
time DATETIME DEFAULT CURRENT_TIMESTAMP,
ip VARCHAR(39)
)

