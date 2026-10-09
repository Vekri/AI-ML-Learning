export const retailStatements = [
  "DROP TABLE IF EXISTS sales",
  "DROP TABLE IF EXISTS products",
  "DROP TABLE IF EXISTS stores",
  "CREATE TABLE stores (store_id INT, city STRING, region STRING, format STRING)",
  "CREATE TABLE products (sku STRING, name STRING, category STRING, unit_cost NUMBER)",
  "CREATE TABLE sales (sale_id INT, store_id INT, sku STRING, sale_date STRING, units INT, revenue NUMBER)",
  "INSERT INTO stores VALUES (12,'Austin','South','super'),(7,'Chicago','Midwest','urban'),(3,'Denver','West','super')",
  "INSERT INTO products VALUES ('MLK','Milk','dairy',2.1),('BRD','Bread','bakery',0.9),('SOD','Soda','beverage',0.7)",
  "INSERT INTO sales VALUES (1,12,'MLK','2026-03-01',20,70),(2,12,'BRD','2026-03-01',10,25),(3,12,'MLK','2026-03-02',30,105),(4,7,'MLK','2026-03-01',8,28),(5,7,'SOD','2026-03-02',40,60),(6,3,'BRD','2026-03-01',15,37.5),(7,3,'SOD','2026-03-02',12,18)",
];
