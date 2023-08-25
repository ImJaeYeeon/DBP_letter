const express = require("express");
const bodyParser = require("body-parser");
const oracledb = require("oracledb");
const app = express();
const path = require("path");
const PORT = 3000;
oracledb.initOracleClient({ libDir: "C:/instantclient_11_2" });

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/login", (req, res) => {
  const errorMessage = req.query.error === "1" ? "로그인에 실패했습니다." : "";
  res.sendFile(path.join(__dirname, "login.html"));
});

app.post("/login", async (req, res) => {
  const { user_id, password } = req.body;

  try {
    const connection = await oracledb.getConnection({
      user: "LETTER",
      password: "1234",
      connectString: "localhost:1521/xe",
    });

    const result = await connection.execute(
      `SELECT user_id FROM joinuser WHERE user_id = :user_id AND password = :password`,
      [user_id, password]
    );

    await connection.close();

    if (result.rows.length > 0) {
      // 로그인 성공
      res.json({ success: true });
    } else {
      // 로그인 실패
      res.json({
        success: false,
        message: "아이디 또는 비밀번호가 일치하지 않습니다.",
      });
    }
  } catch (err) {
    console.error("Error during login:", err);
    res
      .status(500)
      .json({ success: false, message: "서버 오류가 발생했습니다." });
  }
});

app.get("/join", (req, res) => {
  res.sendFile(path.join(__dirname, "join.html"));
});

app.post("/join", async (req, res) => {
  const { user_name, user_id, password } = req.body;

  try {
    const connection = await oracledb.getConnection();
    await connection.execute(
      `INSERT INTO joinuser (user_name, user_id, password) VALUES (:user_name, :user_id, :password)`,
      [user_name, user_id, password]
    );

    await connection.close();

    // 회원가입 성공 시 로그인 페이지로 이동
    res.send(
      '<script>alert("회원가입이 완료되었습니다."); window.location.href = "/login";</script>'
    );
  } catch (err) {
    console.error("Error during user registration:", err);
    res.send(
      '<script>alert("회원가입에 실패했습니다."); window.location.href = "/join";</script>'
    );
  }
});

const loggedInUserId = "dlawodus"; // 로그인 된 사용자의 아이디로 변경해주세요

// EJS 템플릿 엔진 설정
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// 임시 메모리에 편지 데이터를 저장할 객체 생성
const letters = {};

app.get("/letter/:letter_id", async (req, res) => {
  const { letter_id } = req.params;
  const letter = letters[letter_id];
  try {
    const connection = await oracledb.getConnection({
      user: "LETTER",
      password: "1234",
      connectString: "localhost:1521/xe",
    });

    const result = await connection.execute(
      `SELECT dear_name FROM letter WHERE letter_id = :letter_id`,
      [letter_id]
    );

    await connection.close();

    if (result.rows.length > 0) {
      const dear_name = result.rows[0][0];
      res.render("letter", { dear_name });
    } else {
      res.status(404).send("편지를 찾을 수 없습니다.");
    }
  } catch (err) {
    console.error("Error retrieving letter:", err);
    res.status(500).send("서버 오류가 발생했습니다.");
  }
});

// 시퀀스로부터 letter_id 생성하는 로직 추가
app.post("/create-letter", async (req, res) => {
  const { dear_name, user_id } = req.body;

  // 로그인 사용자의 아이디와 일치하는지 확인
  if (loggedInUserId === user_id) {
    try {
      const connection = await oracledb.getConnection({
        user: "LETTER",
        password: "1234",
        connectString: "localhost:1521/xe",
      });

      // 시퀀스로부터 letter_id 생성
      const result = await connection.execute(
        `INSERT INTO letter (letter_id, dear_name, user_id) VALUES (sequence1.nextval, :dear_name, :user_id) RETURNING letter_id INTO :out`,
        {
          dear_name,
          user_id,
          out: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
        }
      );

      await connection.commit();
      await connection.close();

      const generatedLetterId = result.outBinds.out;

      // 생성된 URL 반환
      const letterUrl = `/letter/${generatedLetterId}`;
      res.json({ url: letterUrl });
    } catch (err) {
      console.error("Error creating letter:", err);
      res.status(500).send("편지 생성 중 오류가 발생했습니다.");
    }
  } else {
    res.status(403).send("유효한 사용자 아이디가 아닙니다.");
  }
});

// 시퀀스로부터 message_id 생성하는 로직 추가
app.get("/create-message", async (req, res) => {
  const { dear_name, writer_name } = req.query;

  try {
    const connection = await oracledb.getConnection({
      user: "LETTER",
      password: "1234",
      connectString: "localhost:1521/xe",
    });

    // 조인을 사용하여 dear_name을 가져옴
    const query = `
      SELECT l.dear_name
      FROM letter l
      WHERE l.dear_name = :dear_name
    `;

    const result = await connection.execute(query, [dear_name]);

    if (result.rows.length === 0) {
      res.status(404).send("편지를 찾을 수 없습니다.");
      return;
    }

    await connection.close();

    res.render("message", { dear_name, writer_name });
  } catch (err) {
    console.error("Error retrieving dear_name:", err);
    res.status(500).send("서버 오류가 발생했습니다.");
  }
});

app.get("/create-message", async (req, res) => {
  const { dear_name, writer_name } = req.query;

  try {
    const connection = await oracledb.getConnection({
      user: "LETTER",
      password: "1234",
      connectString: "localhost:1521/xe",
    });

    // 조인을 사용하여 dear_name을 가져옴
    const query = `
      SELECT l.dear_name
      FROM letter l
      WHERE l.dear_name = :dear_name
    `;

    const result = await connection.execute(query, [dear_name]);

    if (result.rows.length === 0) {
      res.status(404).send("편지를 찾을 수 없습니다.");
      return;
    }

    await connection.close();

    res.render("message", { dear_name, writer_name });
  } catch (err) {
    console.error("Error retrieving dear_name:", err);
    res.status(500).send("서버 오류가 발생했습니다.");
  }
});

// 정적 파일 (index.html, login.html, join.html) 서비스 설정
app.use(express.static(__dirname));

// 404 핸들러
app.use((req, res, next) => {
  res.status(404).send("페이지를 찾을 수 없습니다");
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).send("서버 오류가 발생했습니다.");
});

app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
