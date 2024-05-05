const { Router } = require("express");

const {
  registerUser,
  loginUser,
  getUser,
  changeAvater,
  editUser,
  getAuthors,
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/:id", getUser);
router.get("/", getAuthors);
router.post("/change-avatar", authMiddleware, changeAvater);
router.patch("/edit-user", authMiddleware, editUser);

module.exports = router;
