### **📌 Steps to Set Up MySQL Replication with Table Creation & API Test**  

This guide sets up **MySQL Master-Slave Replication** and verifies it by:
✅ Creating a `users` table on the master  
✅ Running an API to insert and fetch data  
✅ Checking if data is replicated to the slave  

---

## **1️⃣ Configure the Master (`mysql-master`)**
Run the following **inside MySQL master**:  

```sh
docker exec -it mysql-master mysql -u root -p
```
Then inside MySQL:  

```sql
-- Create replication user
CREATE USER 'replica'@'%' IDENTIFIED BY 'replica_password';
GRANT REPLICATION SLAVE ON *.* TO 'replica'@'%';
FLUSH PRIVILEGES;

-- Check Master Log File & Position
SHOW MASTER STATUS;
```

📌 **Note down** `File` and `Position` values.

---

## **2️⃣ Configure the Slave (`mysql-replica`)**
Run the following **inside MySQL replica**:  

```sh
docker exec -it mysql-replica mysql -u root -p
```
Then inside MySQL (**replace `<File>` and `<Position>` with actual values**):  

```sql
STOP SLAVE;

CHANGE MASTER TO 
  MASTER_HOST='mysql-master', 
  MASTER_USER='replica', 
  MASTER_PASSWORD='replica_password', 
  MASTER_LOG_FILE='<File>', 
  MASTER_LOG_POS=<Position>;

START SLAVE;
SHOW SLAVE STATUS \G;
```

✅ **Ensure `Slave_IO_Running: Yes` and `Slave_SQL_Running: Yes`**  

---

## **3️⃣ Create a Table on Master**
Run this **on MySQL master**:  

```sql
USE testdb;
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50)
);
```

---

## **4️⃣ Test API to Insert and Fetch Data**
### **Create a Simple Node.js API**
📌 Save this as `server.js`:  

```javascript
const express = require('express');
const mysql = require('mysql2');
const app = express();
app.use(express.json());

const masterDb = mysql.createConnection({
  host: 'mysql-master',
  user: 'root',
  password: 'root',
  database: 'testdb'
});

const slaveDb = mysql.createConnection({
  host: 'mysql-replica',
  user: 'root',
  password: 'root',
  database: 'testdb'
});

// Insert user (Writes to Master)
app.post('/users', (req, res) => {
  const { name } = req.body;
  masterDb.query('INSERT INTO users (name) VALUES (?)', [name], (err, result) => {
    if (err) return res.status(500).send(err);
    res.send({ id: result.insertId, name });
  });
});

// Fetch users (Reads from Replica)
app.get('/users', (req, res) => {
  slaveDb.query('SELECT * FROM users', (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

app.listen(3000, () => console.log('API running on port 3000'));
```

---

## **5️⃣ Run the API Inside Docker**
Create a `Dockerfile`:  

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

Create `docker-compose.yml`:  

```yaml
version: '3'
services:
  mysql-master:
    image: mysql:latest
    container_name: mysql-master
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: testdb
    ports:
      - "3306:3306"
    networks:
      - mysql_network

  mysql-replica:
    image: mysql:latest
    container_name: mysql-replica
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root
    ports:
      - "3307:3306"
    networks:
      - mysql_network
    depends_on:
      - mysql-master

  api:
    build: .
    container_name: node-api
    ports:
      - "3000:3000"
    depends_on:
      - mysql-master
      - mysql-replica
    networks:
      - mysql_network

networks:
  mysql_network:
    driver: bridge
```

---

## **6️⃣ Start the Services**
Run:  
```sh
docker-compose up -d
```

---

## **7️⃣ Test the API**
### **Insert a User (Writes to Master)**
```sh
curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name": "Alice"}'
```

### **Fetch Users (Reads from Slave)**
```sh
curl -X GET http://localhost:3000/users
```
✅ **If Alice appears in the GET response, replication is working!** 🚀