import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = 4000;
const pool = mysql.createPool({
  host: "localhost",
  user: "sbsst",
  password: "sbs123414",
  database: "team",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

app.get("/test1", async (req, res) => {
  const [rows] = await pool.query(
    `
  SELECT *
  FROM user 
  `
  );

  res.json(rows);
});

app.get("/test2", async (req, res) => {
  const [rows] = await pool.query(
    `
    SELECT * FROM product
  `
  );

  res.json(rows);
});

app.get("/KGDP", async (req, res) => {
  const [rows] = await pool.query(
    `
    SELECT *
    FROM product
    WHERE category LIKE 'K%'
    `
  );
  res.json(rows);
});

app.post("/test1/doLogin", async (req, res) => {
  const {
    body: { id, pw },
  } = req;

  const [[userRow]] = await pool.query(
    `
  SELECT *
  FROM user
  WHERE id = ?
  AND
  pw = ?
  `,
    [id, pw]
  );
  console.log(userRow);
  if (userRow) {
    return res.send(true);
  }
  res.send(false);
});

app.post("/test1", async (req, res) => {
  const {
    body: { id, pw, name },
  } = req;

  // console.log(id, pw, name);
  // const { text } = req.body;

  const [row] = await pool.query(
    `
    INSERT INTO user
    SET id = ?,
    pw = ?,
    name = ?
    `,
    [id, pw, name]
  );

  const [rows] = await pool.query(`
    SELECT *
    FROM user
    `);

  res.json(rows);
});
app.post("/prdlist", async (req, res) => {
  const {
    body: { prdno },
  } = req;
  // console.log("prdno", prdno);
  var like = "%" + prdno + "%";
  console.log("like", like);

  const [prdRow] = await pool.query(
    `
    SELECT *
    FROM product 
    WHERE category LIKE ?;
  `,
    [like]
  );
  // console.log("prdRow", prdRow);

  res.json(prdRow);
  console.log(prdRow);
  // res.send([prdRow]);
});

app.post("/product", async (req, res) => {
  const {
    body: { prdId },
  } = req;
  console.log("prdId", prdId);

  const [[prdRow]] = await pool.query(
    `
  SELECT *
  FROM product
  WHERE prdId = ?
  `,
    [prdId]
  );
  // console.log("prdRow", prdRow);

  res.json(prdRow);
  // res.send([prdRow]);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// ?????? ???????????? ????????? ??????

app.get("/notices", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM Notice ORDER BY id DESC");

  res.json(rows);
});

app.post("/notices", async (req, res) => {
  const {
    body: { text },
  } = req;
  await pool.query(
    `
  INSERT INTO Notice
  SET reg_date = NOW(),
  perform_date = '2022-05-18 07:00:00',
  checked = 0,
  text = ?;
  `,
    [text]
  );
  const [newRows] = await pool.query(`
  SELECT *
  FROM Notice
  ORDER BY id
  DESC
  `);
  res.json(newRows);
});

app.get("/notices/:id/", async (req, res) => {
  //const id = req.params.id;
  const { id } = req.params;

  const [rows] = await pool.query(
    `
  SELECT *
  FROM Notice
  WHERE id = ?
  `,
    [id]
  );
  if (rows.length === 0) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }

  res.json(rows[0]);
});

app.patch("/notices/:id", async (req, res) => {
  const { id } = req.params;
  const { perform_date, text } = req.body;

  const [rows] = await pool.query(
    `
    SELECT *
    FROM Notice
    WHERE id = ?
    `,
    [id]
  );

  if (rows.length === 0) {
    res.status(404).json({
      msg: "not found",
    });
  }

  if (!perform_date) {
    res.status(400).json({
      msg: "perform_date required",
    });
    return;
  }

  if (!text) {
    res.status(400).json({
      msg: "text required",
    });
    return;
  }

  const [rs] = await pool.query(
    `
    UPDATE Notice
    SET perform_date = ?,
    text = ?,
    WHERE id = ?
    `,
    [perform_date, text, id]
  );

  const [updatednotices] = await pool.query(
    `
    SELECT *
    FROM Notice
    ORDER BY id DESC
    `
  );
  res.json(updatednotices);
});

app.patch("/notices/check/:id", async (req, res) => {
  const { id } = req.params;
  //id??? Notice??? ?????? ?????? ?????? ?????????
  //SELECT * FROM?????? id?????? ????????? ??? id??? ?????? ?????? ????????????????
  //if (!rows) ??? 404????????? ???????????? msg: "not found" ??????.
  //??????, check ??????????????? ???????????? ?????? ???????????? ???.
  const [[rows]] = await pool.query(
    `
    SELECT *
  FROM Notice WHERE id = ?
  `,
    [id]
  );
  if (!rows) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }
  //????????? ?????????? ??? ?????? mySQL ??????
  await pool.query(
    `
  UPDATE Notice
  SET checked = ?
  WHERE id = ?
  `,
    //check?????? ????????? ??????????
    //????????? ?????? ???????????? ????????? (0?????? 1, 1?????? 0)??? ???????????????.
    [!rows.checked, id]
  );
  //?????? ?????? ???, ?????? ?????? ????????? ????????? ???????????? ?????? ?????? ???.
  const [updatedNotice] = await pool.query(
    `
      SELECT * FROM Notice ORDER BY id DESC`,
    [id]
  );
  //???????????????
  res.json(updatedNotice);
  //res.send(id);
});

app.delete("/notices/:id", async (req, res) => {
  const { id } = req.params;

  const [[NoticeRow]] = await pool.query(
    `
    SELECT *
    FROM Notice
    WHERE id = ?`,
    [id]
  );

  if (NoticeRow === undefined) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }

  const [rs] = await pool.query(
    `DELETE FROM Notice
    WHERE id = ?`,
    [id]
  );
  res.json({
    msg: `${id}??? ??????????????? ?????????????????????.`,
  });
});
