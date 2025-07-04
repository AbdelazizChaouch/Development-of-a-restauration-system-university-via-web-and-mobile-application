-- Table for storing university card transaction logs
CREATE TABLE IF NOT EXISTS university_card_logs (
  id VARCHAR(36) PRIMARY KEY,
  card_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  previous_balance DECIMAL(10, 2) NOT NULL,
  new_balance DECIMAL(10, 2) NOT NULL,
  details JSON NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (card_id) REFERENCES university_cards(card_id)
);

-- Index for faster queries
CREATE INDEX idx_university_card_logs_card_id ON university_card_logs(card_id);
CREATE INDEX idx_university_card_logs_action ON university_card_logs(action);
CREATE INDEX idx_university_card_logs_created_at ON university_card_logs(created_at); 