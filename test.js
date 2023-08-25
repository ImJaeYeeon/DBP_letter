const oracledb = require("oracledb");

// 데이터베이스 연결 설정
const dbconfig = {
  user: "LETTER",
  password: "1234",
  connectString: "localhost:1521/xe",
};

oracledb.initOracleClient({ libDir: "C:/instantclient_11_2" });

async function run() {
  console.log("111");
  // const connection = await oracledb.getConnection(dbconfig);
  oracledb.getConnection(dbconfig, async function (err, connection) {
    console.log("?");
    console.log(err);
    const query = "SELECT 1 FROM DUAL";
    const result = await connection.execute(query);

    if (result.rows[0][0] === 1) {
      console.log("Connected to Oracle Database");
    } else {
      console.log("Oracle Database Connection Failed");
    }
  });
  console.log("222");
}

run();
