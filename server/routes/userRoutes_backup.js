import express from "express";
import { signupUser, loginUser } from "../controllers/userController.js";

const router = express.Router();

router.post("/registracija", signupUser);\nrouter.post("/logiranje", loginUser);

export default router;