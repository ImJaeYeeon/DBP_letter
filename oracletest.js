const oracledb = require("oracledb");
const express = require("express");
const app = express();
const port = 3000;

// 데이터베이스 연결 설정
const dbconfig = {
  user: "LETTER",
  password: "1234",
  connectString: "localhost:1521/xe",
};

app.get("/select", async (req, res) => {
  console.log("11");
  try {
    // 연결 확인을 위한 간단한 쿼리 실행
    const connection = await oracledb.getConnection(dbconfig);
    console.log("22");
    const query = "SELECT 1 FROM DUAL";
    const result = await connection.execute(query);

    if (result.rows[0][0] === 1) {
      console.log("Connected to Oracle Database");
    } else {
      console.log("Oracle Database Connection Failed");
    }

    // 연결 해제
    await connection.close();
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }

  // 응답 전송
  res.send("Database Connection Checked");
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
